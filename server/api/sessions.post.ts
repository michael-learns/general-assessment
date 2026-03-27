import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    companyName: string
    industry: string
    email?: string
    userId?: string
    product?: string
    contactName?: string
    sourceRef?: string
    // New registration fields
    address?: string
    tin?: string
    numberOfEmployees?: number
    authorizedSignatory?: string
    signatoryPosition?: string
    contactPerson?: string
    contactPosition?: string
    contactPhone?: string
  }>(event)

  if (!body.companyName?.trim() || !body.industry?.trim()) {
    throw createError({ statusCode: 400, message: 'companyName and industry are required' })
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
      email: body.email?.trim() || undefined,
      userId: body.userId?.trim() || undefined,
      product: body.product || 'payroll',
      contactName: body.contactName?.trim() || undefined,
      sourceRef: body.sourceRef?.trim() || undefined,
      address: body.address?.trim() || undefined,
      tin: body.tin?.trim() || undefined,
      numberOfEmployees: body.numberOfEmployees || undefined,
      authorizedSignatory: body.authorizedSignatory?.trim() || undefined,
      signatoryPosition: body.signatoryPosition?.trim() || undefined,
      contactPerson: body.contactPerson?.trim() || undefined,
      contactPosition: body.contactPosition?.trim() || undefined,
      contactPhone: body.contactPhone?.trim() || undefined,
    })
    return { sessionId }
  } catch (error: any) {
    const msg = error?.message || error?.data || String(error)
    console.error('[sessions.post] Convex mutation failed:', msg)
    throw createError({ statusCode: 500, message: `Failed to create session: ${msg}` })
  }
})
