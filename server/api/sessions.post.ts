import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    companyName: string
    industry: string
    email?: string
  }>(event)

  if (!body.companyName?.trim() || !body.industry?.trim()) {
    throw createError({ statusCode: 400, message: 'companyName and industry are required' })
  }

  const convex = new ConvexHttpClient(config.public.convexUrl || 'https://placeholder.convex.cloud')

  try {
    const sessionId = await convex.mutation(api.sessions.create, {
      companyName: body.companyName.trim(),
      industry: body.industry.trim(),
      email: body.email?.trim()
    })
    return { sessionId }
  } catch (error) {
    // If Convex is not yet configured, return a mock session ID for development
    if (!config.public.convexUrl) {
      const mockId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      return { sessionId: mockId }
    }
    throw createError({ statusCode: 500, message: 'Failed to create session' })
  }
})
