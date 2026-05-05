import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { attachActualSampleComputations, extractActualSampleComputations, type TranscriptMessage } from '#lib/sampleComputations'
import { buildClientResponses } from '#lib/clientResponses'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = getRouterParam(event, 'sessionId')!

  // Dev mode
  if (!config.public.convexUrl || sessionId.startsWith('dev_')) {
    return null
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  try {
    const [session, assessment, messages] = await Promise.all([
      convex.query(api.sessions.get, { id: sessionId as Id<'sessions'> }),
      convex.query(api.assessments.getBySession, { sessionId: sessionId as Id<'sessions'> }),
      convex.query(api.messages.list, { sessionId: sessionId as Id<'sessions'> }) as Promise<TranscriptMessage[]>
    ])

    let assessmentForReport = sanitizeAssessment(assessment)
    if (((session?.product as string | undefined) ?? 'payroll') === 'payroll' && assessmentForReport) {
      assessmentForReport = sanitizeAssessment(
        attachActualSampleComputations(
          assessmentForReport as any,
          extractActualSampleComputations(messages)
        ) as any
      )
    }

    return {
      session,
      assessment: assessmentForReport,
      clientResponses: buildClientResponses(messages)
    }
  } catch (err) {
    console.error('[assessment GET] Failed:', err)
    throw createError({ statusCode: 500, message: 'Failed to fetch assessment' })
  }
})

function sanitizeAssessment<T extends Record<string, unknown> | null>(assessment: T) {
  if (!assessment) return assessment

  return {
    ...assessment,
    consultantNotes: sanitizeConsultantNotes(assessment.consultantNotes)
  }
}

function sanitizeConsultantNotes(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const notes = value as Record<string, unknown>

  return {
    lookOutFor: Array.isArray(notes.lookOutFor) ? notes.lookOutFor.filter(item => typeof item === 'string') : [],
    systemSetup: Array.isArray(notes.systemSetup) ? notes.systemSetup.filter(item => typeof item === 'string') : []
  }
}
