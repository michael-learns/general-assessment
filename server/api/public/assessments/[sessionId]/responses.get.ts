import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  if (!config.public.convexUrl) {
    throw createError({ statusCode: 503, message: 'Service unavailable' })
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  try {
    const messages = await convex.query(api.messages.list, {
      sessionId: sessionId as Id<'sessions'>
    })

    return {
      sessionId,
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    }
  } catch (err) {
    console.error('[public responses GET] Convex error:', err)
    throw createError({ statusCode: 500, message: 'Failed to fetch messages' })
  }
})
