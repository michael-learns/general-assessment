import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  sessions: defineTable({
    companyName: v.string(),
    industry: v.string(),
    email: v.optional(v.string()),
    status: v.union(v.literal('in_progress'), v.literal('completed')),
    currentSection: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number())
  }),

  messages: defineTable({
    sessionId: v.id('sessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
    codealiveQueries: v.optional(v.array(v.string()))
  }).index('by_session', ['sessionId']),

  assessments: defineTable({
    sessionId: v.id('sessions'),
    sections: v.array(v.object({
      name: v.string(),
      status: v.union(
        v.literal('supported'),
        v.literal('partial'),
        v.literal('gap')
      ),
      findings: v.string(),
      customerRequirements: v.array(v.string())
    })),
    overallFitScore: v.number(),
    summary: v.string(),
    recommendations: v.string(),
    webhookSent: v.boolean(),
    createdAt: v.number()
  }).index('by_session', ['sessionId'])
})
