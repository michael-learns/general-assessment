import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  // Dev mode
  if (!config.public.convexUrl || sessionId.startsWith('dev_')) {
    return null
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  try {
    const [session, assessment] = await Promise.all([
      convex.query(api.sessions.get, { id: sessionId as Id<'sessions'> }),
      convex.query(api.assessments.getBySession, { sessionId: sessionId as Id<'sessions'> })
    ])
    return { session, assessment }
  } catch (err) {
    console.error('[assessment GET] Failed:', err)
    throw createError({ statusCode: 500, message: 'Failed to fetch assessment' })
  }
})
