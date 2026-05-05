import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { getConfig } from '#lib/assessments/index'
import { attachActualSampleComputations, extractActualSampleComputations, type TranscriptMessage } from '#lib/sampleComputations'
import { buildClientResponses } from '#lib/clientResponses'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  if (!config.public.convexUrl) {
    throw createError({ statusCode: 503, message: 'Service unavailable' })
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  let session: Record<string, unknown> | null
  let assessment: Record<string, unknown> | null
  let messages: TranscriptMessage[]

  try {
    ;[session, assessment, messages] = await Promise.all([
      convex.query(api.sessions.get, { id: sessionId as Id<'sessions'> }) as Promise<Record<string, unknown> | null>,
      convex.query(api.assessments.getBySession, { sessionId: sessionId as Id<'sessions'> }) as Promise<Record<string, unknown> | null>,
      convex.query(api.messages.list, { sessionId: sessionId as Id<'sessions'> }) as Promise<TranscriptMessage[]>
    ])
  } catch (err) {
    console.error('[public assessments GET] Convex error:', err)
    throw createError({ statusCode: 500, message: 'Failed to fetch assessment' })
  }

  if (!session || !assessment || session.status !== 'completed') {
    throw createError({ statusCode: 404, message: 'Assessment not found or not yet completed' })
  }

  const productSlug = (session.product as string | undefined) ?? 'payroll'
  const assessmentConfig = getConfig(productSlug)
  let sections = assessment.sections

  if (productSlug === 'payroll') {
    try {
      sections = attachActualSampleComputations(
        {
          sections: Array.isArray(assessment.sections) ? assessment.sections : [],
          overallFitScore: Number(assessment.overallFitScore ?? 0),
          summary: String(assessment.summary ?? ''),
          recommendations: String(assessment.recommendations ?? ''),
          consultantNotes: sanitizeConsultantNotes(assessment.consultantNotes)
        },
        extractActualSampleComputations(messages)
      ).sections
    } catch (err) {
      console.error('[public assessments GET] Failed to attach actual sample computations:', err)
    }
  }

  return {
    product: {
      slug: productSlug,
      name: assessmentConfig?.productName ?? productSlug
    },
    client: {
      companyName: session.companyName,
      industry: session.industry,
      email: session.email ?? undefined
    },
    session: {
      id: sessionId,
      status: session.status,
      startedAt: session.createdAt ? new Date(session.createdAt as number).toISOString() : undefined,
      completedAt: session.completedAt ? new Date(session.completedAt as number).toISOString() : undefined
    },
    assessment: {
      overallFitScore: assessment.overallFitScore,
      summary: assessment.summary,
      recommendations: assessment.recommendations,
      consultantNotes: sanitizeConsultantNotes(assessment.consultantNotes),
      sections
    },
    clientResponses: buildClientResponses(messages)
  }
})

function sanitizeConsultantNotes(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const notes = value as Record<string, unknown>

  return {
    lookOutFor: Array.isArray(notes.lookOutFor) ? notes.lookOutFor.filter(item => typeof item === 'string') : [],
    systemSetup: Array.isArray(notes.systemSetup) ? notes.systemSetup.filter(item => typeof item === 'string') : []
  }
}
