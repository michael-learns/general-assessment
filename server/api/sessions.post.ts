import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import { normalizeEmail, verifyPayload } from '../utils/emailVerificationToken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    companyName: string
    industry: string
    email?: string
    emailVerificationToken?: string
    userId?: string
    product?: string
    contactName?: string
    sourceRef?: string
  }>(event)

  if (!body.companyName?.trim() || !body.industry?.trim()) {
    throw createError({ statusCode: 400, message: 'companyName and industry are required' })
  }

  const email = body.email?.trim()
  if (email) {
    const token = body.emailVerificationToken?.trim()
    const payload = token ? verifyPayload(token, config) : null
    if (!payload || payload.kind !== 'email_otp_verified' || payload.email !== normalizeEmail(email)) {
      throw createError({ statusCode: 400, message: 'Please verify your email with the one-time code first.' })
    }
  }

  // Dev fallback: return mock session ID when Convex is not yet configured.
  // NOTE: Mock IDs are NOT valid Convex document IDs — downstream Convex calls
  // (chat, assessment) will fail with mock IDs. This only unblocks UI development.
  if (!config.public.convexUrl) {
    const mockId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    return { sessionId: mockId }
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  try {
    const sessionId = await convex.mutation(api.sessions.create, {
      companyName: body.companyName.trim(),
      industry: body.industry.trim(),
      email,
      userId: body.userId?.trim(),
      product: body.product || 'payroll',
      contactName: body.contactName?.trim(),
      sourceRef: body.sourceRef?.trim()
    })
    return { sessionId }
  } catch (error) {
    console.error('[sessions.post] Convex mutation failed:', error)
    throw createError({ statusCode: 500, message: 'Failed to create session' })
  }
})
