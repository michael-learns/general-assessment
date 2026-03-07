import { GoogleGenerativeAI, type Tool, SchemaType } from '@google/generative-ai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { buildSystemPrompt } from '#lib/systemPrompt'
import { getConfig } from '#lib/assessments/index'
import { callCodealive } from '../utils/callCodealive'

type ChatMessage = { role: 'user' | 'model'; content: string }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    sessionId: string
    companyName: string
    industry: string
    product?: string
    // Client sends role as 'user' | 'model' (Gemini convention)
    messages: ChatMessage[]
    userMessage: string
  }>(event)

  if (!body.sessionId || !body.userMessage?.trim()) {
    throw createError({ statusCode: 400, message: 'sessionId and userMessage are required' })
  }

  const productSlug = body.product || 'payroll'
  const assessmentConfig = getConfig(productSlug)
  if (!assessmentConfig) {
    throw createError({ statusCode: 400, message: `Unknown product: ${productSlug}` })
  }

  const CODEALIVE_TOOLS: Tool[] = [
    {
      functionDeclarations: [
        {
          name: 'codealive_search',
          description: assessmentConfig.codeAliveSearchDescription,
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              query: {
                type: SchemaType.STRING,
                description: 'The feature or policy to search for, e.g. "split pay rates", "overtime calculation", "leave accrual"'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'codealive_consultant',
          description: assessmentConfig.codeAliveConsultantDescription,
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              question: {
                type: SchemaType.STRING,
                description: 'The specific question about system capability'
              }
            },
            required: ['question']
          }
        }
      ]
    }
  ]

  const isDevSession = body.sessionId.startsWith('dev_')
  const convex = config.public.convexUrl && !isDevSession
    ? new ConvexHttpClient(config.public.convexUrl)
    : null

  // Save user message
  if (convex) {
    try {
      await convex.mutation(api.messages.add, {
        sessionId: body.sessionId as Id<'sessions'>,
        role: 'user',
        content: body.userMessage
      })
    } catch (err) {
      console.error('[chat.post] Failed to save user message:', err)
    }
  }

  // SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  // Fetch session for scoping context
  let sessionScopingData: Record<string, any> | undefined
  let sessionRegistrationData: {
    numberOfEmployees?: number
    address?: string
    authorizedSignatory?: string
    contactPerson?: string
    contactPhone?: string
  } | undefined

  if (convex) {
    try {
      const session = await convex.query(api.sessions.get, {
        id: body.sessionId as Id<'sessions'>
      })
      if (session) {
        sessionScopingData = session.scopingData
        sessionRegistrationData = {
          numberOfEmployees: session.numberOfEmployees,
          address: session.address,
          authorizedSignatory: session.authorizedSignatory,
          contactPerson: session.contactPerson,
          contactPhone: session.contactPhone
        }
      }
    } catch (err) {
      console.error('[chat.post] Failed to fetch session for scoping context:', err)
      // Non-fatal: continue without scoping context
    }
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey)
  const model = genAI.getGenerativeModel({
    model: config.geminiModel || 'gemini-2.5-flash-preview-04-17',
    systemInstruction: buildSystemPrompt(
      assessmentConfig,
      body.companyName || 'the customer',
      body.industry || 'their industry',
      sessionScopingData,
      sessionRegistrationData
    ),
    tools: CODEALIVE_TOOLS
  })

  const history = (body.messages || []).map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }))

  const chat = model.startChat({ history })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const codealiveQueries: string[] = []
      let fullResponse = ''

      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Process one stream, handling any function calls, accumulating text
      async function processStream(streamResult: ReturnType<typeof chat.sendMessageStream>) {
        const pendingCalls: Array<{ name: string; args: Record<string, string> }> = []

        for await (const chunk of (await streamResult).stream) {
          const calls = chunk.functionCalls()
          if (calls && calls.length > 0) {
            for (const call of calls) {
              pendingCalls.push({ name: call.name, args: call.args as Record<string, string> })
            }
          }
          const text = chunk.text()
          if (text) {
            fullResponse += text
            send({ type: 'text', content: text })
          }
        }

        if (pendingCalls.length > 0) {
          const functionResponses = []
          for (const call of pendingCalls) {
            const query = call.args.query || call.args.question || ''
            codealiveQueries.push(`${call.name}: ${query}`)
            send({ type: 'tool_call', tool: call.name, query })

            const caTool = call.name === 'codealive_search' ? 'codebase_search' as const : 'codebase_consultant' as const
            const toolResult = await callCodealive(config.codeAliveApiKey, caTool, call.args)

            functionResponses.push({
              functionResponse: { name: call.name, response: { result: toolResult } }
            })
          }
          // Recurse to handle potential chained function calls
          await processStream(chat.sendMessageStream(functionResponses))
        }
      }

      try {
        await processStream(chat.sendMessageStream(body.userMessage))

        // Save assistant message
        if (convex && fullResponse) {
          try {
            await convex.mutation(api.messages.add, {
              sessionId: body.sessionId as Id<'sessions'>,
              role: 'assistant',
              content: fullResponse,
              codealiveQueries: codealiveQueries.length > 0 ? codealiveQueries : undefined
            })
          } catch (err) {
            console.error('[chat.post] Failed to save assistant message:', err)
          }
        }

        send({ type: 'done', codealiveQueries })
      } catch (err) {
        console.error('[chat.post] Stream error:', err)
        send({ type: 'error', message: 'AI service unavailable. Please try again.' })
      } finally {
        controller.close()
      }
    }
  })

  return sendStream(event, stream)
})
