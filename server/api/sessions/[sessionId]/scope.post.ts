import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!
  const body = await readBody<{ scopingData: Record<string, unknown> }>(event)

  if (!body.scopingData) {
    throw createError({ statusCode: 400, message: 'scopingData is required' })
  }

  if (!config.public.convexUrl || sessionId.startsWith('dev_')) {
    return { ok: true }
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)
  try {
    await convex.mutation(api.sessions.updateScoping, {
      id: sessionId as Id<'sessions'>,
      scopingData: body.scopingData
    })
    return { ok: true }
  } catch (err) {
    console.error('[scope.post] Failed:', err)
    throw createError({ statusCode: 500, message: 'Failed to save scoping data' })
  }
})
