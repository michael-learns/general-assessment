import { ConvexHttpClient } from 'convex/browser'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { parseAssessmentBlock, calculateFitScore } from '#lib/assessmentScorer'
import { getConfig } from '#lib/assessments/index'
import { attachActualSampleComputations, extractActualSampleComputations, type TranscriptMessage } from '#lib/sampleComputations'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    sessionId: string
    lastAssistantMessage: string
    companyName?: string
    industry?: string
    email?: string
    contactName?: string
    sourceRef?: string
    product?: string
  }>(event)

  if (!body.sessionId || !body.lastAssistantMessage) {
    throw createError({ statusCode: 400, message: 'sessionId and lastAssistantMessage are required' })
  }

  const assessment = parseAssessmentBlock(body.lastAssistantMessage)
  if (!assessment) {
    throw createError({ statusCode: 422, message: 'No valid assessment block found in message' })
  }

  // Use calculateFitScore for a deterministic score (overrides AI-produced score)
  const fitScore = calculateFitScore(assessment.sections)

  const productSlug = body.product || 'payroll'
  const assessmentConfig = getConfig(productSlug)

  const isDevSession = body.sessionId.startsWith('dev_')

  // Dev mode: return mock response
  if (!config.public.convexUrl || isDevSession) {
    return {
      assessmentId: `dev_assessment_${Date.now()}`,
      assessment: { ...assessment, overallFitScore: fitScore }
    }
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)
  let assessmentForReport = assessment

  if (productSlug === 'payroll') {
    try {
      const messages = await convex.query(api.messages.list, {
        sessionId: body.sessionId as Id<'sessions'>
      }) as TranscriptMessage[]

      assessmentForReport = attachActualSampleComputations(
        assessment,
        extractActualSampleComputations(messages)
      )
    } catch (err) {
      console.error('[finalize.post] Failed to attach actual sample computations:', err)
    }
  }

  // Save assessment to Convex
  let assessmentId: Id<'assessments'>
  try {
    assessmentId = await convex.mutation(api.assessments.save, {
      sessionId: body.sessionId as Id<'sessions'>,
      sections: assessmentForReport.sections,
      overallFitScore: fitScore,
      summary: assessmentForReport.summary,
      recommendations: assessmentForReport.recommendations,
      consultantNotes: sanitizeConsultantNotes(assessmentForReport.consultantNotes),
      product: productSlug
    })
  } catch (err) {
    console.error('[finalize.post] Failed to save assessment:', err)
    throw createError({ statusCode: 500, message: 'Failed to save assessment' })
  }

  // Fetch session for webhook payload
  let session: Record<string, unknown> | null = null
  try {
    session = await convex.query(api.sessions.get, { id: body.sessionId as Id<'sessions'> }) as Record<string, unknown> | null
  } catch {
    // Non-fatal — continue without session data
  }

  // Mark session complete
  try {
    await convex.mutation(api.sessions.complete, { id: body.sessionId as Id<'sessions'> })
  } catch (err) {
    console.error('[finalize.post] Failed to complete session:', err)
    // Non-fatal — assessment is saved, continue
  }

  // Resolve webhook URL: per-product config first, then env var
  const webhookUrl = assessmentConfig?.webhookUrl || config.assessmentWebhookUrl

  // Fire webhook (fire and forget — do not await)
  if (webhookUrl) {
    const now = new Date().toISOString()
    const reqUrl = getRequestURL(event)
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`
    const reportUrl = `${baseUrl}/report/${productSlug}/${body.sessionId}`

    const webhookPayload = {
      schemaVersion: '2',
      event: 'assessment.completed',
      timestamp: now,
      product: {
        slug: productSlug,
        name: assessmentConfig?.productName ?? productSlug
      },
      client: {
        companyName: body.companyName ?? (session?.companyName as string | undefined),
        industry: body.industry ?? (session?.industry as string | undefined),
        contactName: body.contactName ?? (session?.contactName as string | undefined),
        email: body.email ?? (session?.email as string | undefined)
      },
      session: {
        id: body.sessionId,
        sourceRef: body.sourceRef ?? (session?.sourceRef as string | undefined),
        startedAt: session?.createdAt ? new Date(session.createdAt as number).toISOString() : undefined,
        completedAt: now
      },
      assessment: {
        id: assessmentId,
        overallFitScore: fitScore,
        summary: assessmentForReport.summary,
        recommendations: assessmentForReport.recommendations,
        consultantNotes: sanitizeConsultantNotes(assessmentForReport.consultantNotes),
        sections: assessmentForReport.sections
      },
      links: {
        report: reportUrl
      }
    }

    $fetch(webhookUrl, {
      method: 'POST',
      body: webhookPayload
    }).then(async () => {
      try {
        await convex.mutation(api.assessments.markWebhookSent, { id: assessmentId })
      } catch (err) {
        console.error('[finalize.post] Failed to mark webhook sent:', err)
      }
    }).catch((err) => {
      console.error('[finalize.post] Webhook delivery failed:', err)
      // webhookSent remains false in DB — team can query and retry manually
    })
  }

  return {
    assessmentId,
    assessment: {
      ...assessmentForReport,
      overallFitScore: fitScore,
      consultantNotes: sanitizeConsultantNotes(assessmentForReport.consultantNotes)
    }
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
