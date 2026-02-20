import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { parseAssessmentBlock, calculateFitScore } from '../../../lib/assessmentScorer'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{
    sessionId: string
    lastAssistantMessage: string
    companyName?: string
    industry?: string
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

  const isDevSession = body.sessionId.startsWith('dev_')

  // Dev mode: return mock response
  if (!config.public.convexUrl || isDevSession) {
    return {
      assessmentId: `dev_assessment_${Date.now()}`,
      assessment: { ...assessment, overallFitScore: fitScore }
    }
  }

  const convex = new ConvexHttpClient(config.public.convexUrl)

  // Save assessment to Convex
  let assessmentId: Id<'assessments'>
  try {
    assessmentId = await convex.mutation(api.assessments.save, {
      sessionId: body.sessionId as Id<'sessions'>,
      sections: assessment.sections,
      overallFitScore: fitScore,
      summary: assessment.summary,
      recommendations: assessment.recommendations
    })
  } catch (err) {
    console.error('[finalize.post] Failed to save assessment:', err)
    throw createError({ statusCode: 500, message: 'Failed to save assessment' })
  }

  // Mark session complete
  try {
    await convex.mutation(api.sessions.complete, { id: body.sessionId as Id<'sessions'> })
  } catch (err) {
    console.error('[finalize.post] Failed to complete session:', err)
    // Non-fatal — assessment is saved, continue
  }

  // Fire webhook (fire and forget — do not await)
  if (config.assessmentWebhookUrl) {
    $fetch(config.assessmentWebhookUrl, {
      method: 'POST',
      body: {
        assessmentId,
        sessionId: body.sessionId,
        companyName: body.companyName,
        industry: body.industry,
        overallFitScore: fitScore,
        summary: assessment.summary,
        sections: assessment.sections,
        recommendations: assessment.recommendations,
        timestamp: new Date().toISOString()
      }
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
    assessment: { ...assessment, overallFitScore: fitScore }
  }
})
