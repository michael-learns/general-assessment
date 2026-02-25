import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  if (!config.public.convexUrl || sessionId.startsWith('dev_')) {
    return []
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)
  try {
    const messages = await convex.query(api.messages.list, {
      sessionId: sessionId as Id<'sessions'>
    })
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      content: m.content,
      timestamp: m.timestamp
    }))
  } catch (err) {
    console.error('[messages GET] Failed:', err)
    return []
  }
})
