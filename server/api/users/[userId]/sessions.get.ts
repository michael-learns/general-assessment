import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userId = getRouterParam(event, 'userId')!

  if (!config.public.convexUrl) {
    return []
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)
  try {
    return await convex.query(api.sessions.listByUser, { userId })
  } catch (err) {
    console.error('[user sessions GET] Failed:', err)
    return []
  }
})
