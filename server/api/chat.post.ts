import {
  GoogleGenAI,
  ThinkingLevel,
  createModelContent,
  createPartFromFunctionResponse,
  createUserContent,
  type Content,
  type FunctionCall,
  type Part,
  type Tool
} from '@google/genai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { buildSystemPrompt } from '#lib/systemPrompt'
import { getConfig } from '#lib/assessments/index'
import { callCodealive } from '../utils/callCodealive'

type ChatMessage = { role: 'user' | 'model'; content: string }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const geminiModel = config.geminiModel || 'gemini-3-flash-preview'
  const body = await readBody<{
    sessionId: string
    companyName: string
    industry: string
    product?: string
    // Client sends role as 'user' | 'model' (Gemini convention)
    messages: ChatMessage[]
    userMessage: string
    isInitialGreeting?: boolean
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
          parametersJsonSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The feature or policy to search for, e.g. "split pay rates", "overtime calculation", "leave accrual"'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'codealive_consultant',
          description: assessmentConfig.codeAliveConsultantDescription,
          parametersJsonSchema: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
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
  if (convex && !body.isInitialGreeting) {
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

  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })
  const history: Content[] = (body.messages || []).map(m => (
    m.role === 'user'
      ? createUserContent(m.content)
      : createModelContent(m.content)
  ))

  const chat = ai.chats.create({
    model: geminiModel,
    history,
    config: {
      systemInstruction: buildSystemPrompt(
        assessmentConfig,
        body.companyName || 'the customer',
        body.industry || 'their industry',
        sessionScopingData,
        sessionRegistrationData
      ),
      tools: CODEALIVE_TOOLS,
      ...(geminiModel.startsWith('gemini-3')
        ? {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW
            }
          }
        : {})
    }
  })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const codealiveQueries: string[] = []
      let fullResponse = ''

      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Process one stream, handling any function calls, accumulating text
      async function processStream(message: string | Part[]) {
        const pendingCalls: FunctionCall[] = []

        const stream = await chat.sendMessageStream({ message })

        for await (const chunk of stream) {
          const calls = chunk.functionCalls
          if (calls && calls.length > 0) {
            pendingCalls.push(...calls)
          }

          const text = chunk.text
          if (text) {
            fullResponse += text
            send({ type: 'text', content: text })
          }
        }

        if (pendingCalls.length > 0) {
          const functionResponses = pendingCalls.map((call, index) => {
            const args = (call.args || {}) as Record<string, string>
            const query = args.query || args.question || ''
            codealiveQueries.push(`${call.name}: ${query}`)
            send({ type: 'tool_call', tool: call.name, query })

            const caTool = call.name === 'codealive_search' ? 'codebase_search' as const : 'codebase_consultant' as const
            return callCodealive(config.codeAliveApiKey, caTool, args).then((toolResult) => (
              createPartFromFunctionResponse(
                call.id || `${call.name}-${index}`,
                call.name || 'unknown_tool',
                { result: toolResult }
              )
            ))
          })

          const functionResponseMessage = createUserContent(await Promise.all(functionResponses))
          await processStream(functionResponseMessage.parts || [])
        }
      }

      try {
        await processStream(body.userMessage)

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
