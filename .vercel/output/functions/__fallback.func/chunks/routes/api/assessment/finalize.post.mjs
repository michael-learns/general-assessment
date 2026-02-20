import { d as defineEventHandler, r as readBody, c as createError, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import { ConvexHttpClient } from 'convex/browser';
import { a as api } from '../../../_/api.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@iconify/utils';
import 'consola';

function parseAssessmentBlock(content) {
  const match = content.match(/```assessment\r?\n([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!Array.isArray(parsed.sections) || typeof parsed.overallFitScore !== "number" || typeof parsed.summary !== "string" || typeof parsed.recommendations !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
const STATUS_WEIGHTS = {
  supported: 100,
  partial: 50,
  gap: 0
};
function calculateFitScore(sections) {
  if (sections.length === 0) return 0;
  const total = sections.reduce((sum, s) => sum + STATUS_WEIGHTS[s.status], 0);
  return Math.round(total / sections.length);
}

const finalize_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  if (!body.sessionId || !body.lastAssistantMessage) {
    throw createError({ statusCode: 400, message: "sessionId and lastAssistantMessage are required" });
  }
  const assessment = parseAssessmentBlock(body.lastAssistantMessage);
  if (!assessment) {
    throw createError({ statusCode: 422, message: "No valid assessment block found in message" });
  }
  const fitScore = calculateFitScore(assessment.sections);
  const isDevSession = body.sessionId.startsWith("dev_");
  if (!config.public.convexUrl || isDevSession) {
    return {
      assessmentId: `dev_assessment_${Date.now()}`,
      assessment: { ...assessment, overallFitScore: fitScore }
    };
  }
  const convex = new ConvexHttpClient(config.public.convexUrl);
  let assessmentId;
  try {
    assessmentId = await convex.mutation(api.assessments.save, {
      sessionId: body.sessionId,
      sections: assessment.sections,
      overallFitScore: fitScore,
      summary: assessment.summary,
      recommendations: assessment.recommendations
    });
  } catch (err) {
    console.error("[finalize.post] Failed to save assessment:", err);
    throw createError({ statusCode: 500, message: "Failed to save assessment" });
  }
  try {
    await convex.mutation(api.sessions.complete, { id: body.sessionId });
  } catch (err) {
    console.error("[finalize.post] Failed to complete session:", err);
  }
  if (config.assessmentWebhookUrl) {
    $fetch(config.assessmentWebhookUrl, {
      method: "POST",
      body: {
        assessmentId,
        sessionId: body.sessionId,
        companyName: body.companyName,
        industry: body.industry,
        overallFitScore: fitScore,
        summary: assessment.summary,
        sections: assessment.sections,
        recommendations: assessment.recommendations,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    }).then(async () => {
      try {
        await convex.mutation(api.assessments.markWebhookSent, { id: assessmentId });
      } catch (err) {
        console.error("[finalize.post] Failed to mark webhook sent:", err);
      }
    }).catch((err) => {
      console.error("[finalize.post] Webhook delivery failed:", err);
    });
  }
  return {
    assessmentId,
    assessment: { ...assessment, overallFitScore: fitScore }
  };
});

export { finalize_post as default };
//# sourceMappingURL=finalize.post.mjs.map
