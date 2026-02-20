import { GoogleGenerativeAI, SchemaType, type Tool } from '@google/generative-ai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'
import { buildSystemPrompt } from '../../lib/systemPrompt'

const CODEALIVE_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'codealive_search',
        description: 'Search the payroll system codebase to check if a specific feature, policy type, or functionality is supported.',
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
        description: 'Get an in-depth analysis of whether a complex HR/payroll policy is supported by the payroll system.',
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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    sessionId: string
    companyName: string
    industry: string
    messages: { role: 'user' | 'model'; content: string }[]
    userMessage: string
  }>(event)

  if (!body.sessionId || !body.userMessage?.trim()) {
    throw createError({ statusCode: 400, message: 'sessionId and userMessage are required' })
  }

  // Save user message to Convex (skip in dev mode)
  if (config.public.convexUrl && !body.sessionId.startsWith('dev_')) {
    const convex = new ConvexHttpClient(config.public.convexUrl)
    try {
      await convex.mutation(api.messages.add, {
        sessionId: body.sessionId as any,
        role: 'user',
        content: body.userMessage
      })
    } catch (err) {
      console.error('[chat.post] Failed to save user message:', err)
    }
  }

  // Set SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')

  const genAI = new GoogleGenerativeAI(config.geminiApiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17',
    systemInstruction: buildSystemPrompt(body.companyName || 'the customer', body.industry || 'their industry'),
    tools: CODEALIVE_TOOLS
  })

  // Build conversation history for Gemini
  const history = (body.messages || []).map(m => ({
    role: m.role as 'user' | 'model',
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

      try {
        // First round: get initial response (may include function calls)
        const result = await chat.sendMessageStream(body.userMessage)

        let pendingFunctionCalls: Array<{ name: string; args: Record<string, string> }> = []

        for await (const chunk of result.stream) {
          const calls = chunk.functionCalls()
          if (calls && calls.length > 0) {
            for (const call of calls) {
              pendingFunctionCalls.push({
                name: call.name,
                args: call.args as Record<string, string>
              })
            }
          }

          const text = chunk.text()
          if (text) {
            fullResponse += text
            send({ type: 'text', content: text })
          }
        }

        // Handle function calls by executing them and continuing the chat
        if (pendingFunctionCalls.length > 0) {
          const functionResponses = []

          for (const call of pendingFunctionCalls) {
            const query = call.args.query || call.args.question || ''
            codealiveQueries.push(`${call.name}: ${query}`)
            send({ type: 'tool_call', tool: call.name, query })

            let toolResult = 'Feature lookup unavailable'
            try {
              // Map our tool names to Codealive API tool names
              const caTool = call.name === 'codealive_search' ? 'codebase_search' : 'codebase_consultant'
              const caResult = await $fetch<{ result?: string; content?: string }>(`/api/codealive`, {
                method: 'POST',
                body: { tool: caTool, params: call.args }
              })
              toolResult = typeof caResult === 'string' ? caResult : JSON.stringify(caResult)
            } catch (err) {
              console.error('[chat.post] Codealive call failed:', err)
            }

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult }
              }
            })
          }

          // Continue chat with function responses to get final text
          const continueResult = await chat.sendMessageStream(functionResponses)

          for await (const chunk of continueResult.stream) {
            const text = chunk.text()
            if (text) {
              fullResponse += text
              send({ type: 'text', content: text })
            }
          }
        }

        // Save assistant message to Convex
        if (config.public.convexUrl && !body.sessionId.startsWith('dev_') && fullResponse) {
          const convex = new ConvexHttpClient(config.public.convexUrl)
          try {
            await convex.mutation(api.messages.add, {
              sessionId: body.sessionId as any,
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
