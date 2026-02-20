import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  if (!config.public.convexUrl || sessionId.startsWith('dev_')) {
    return null
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)
  try {
    return await convex.query(api.sessions.get, { id: sessionId as Id<'sessions'> })
  } catch (err) {
    console.error('[sessions GET] Failed:', err)
    return null
  }
})
