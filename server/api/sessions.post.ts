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
    contactPerson?: string
    userName?: string
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
      contactPerson: body.contactPerson?.trim() || undefined,
      userName: body.userName?.trim() || undefined,
    })
    // Sync contact to Loops.so (always attempt so we can see it in Vercel External APIs)
    const nameParts = (body.userName || body.contactPerson || body.contactName || '').trim().split(' ')
    const firstName = nameParts[0] || undefined
    const lastName = nameParts.slice(1).join(' ') || undefined
    const loopsEmail = body.email?.trim() || 'noemail@test.com'
    console.log('[loops] attempting upsert for:', loopsEmail, '| key present:', !!config.loopsApiKey)
    try {
      const loopsRes = await $fetch<any>('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.loopsApiKey || 'missing'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loopsEmail,
          firstName,
          lastName,
          source: 'assessment-form',
        }),
      })
      console.log('[loops] success:', JSON.stringify(loopsRes))
    } catch (err: any) {
      console.error('[loops] failed:', err?.message || err)
    }

    return { sessionId }
  } catch (error: any) {
    const msg = error?.message || error?.data || String(error)
    console.error('[sessions.post] Convex mutation failed:', msg)
    throw createError({ statusCode: 500, message: `Failed to create session: ${msg}` })
  }
})
