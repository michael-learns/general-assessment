// Run bunx convex dev after changes to regenerate types.
// IMPORTANT: After editing this file, run: bunx convex dev
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  sessions: defineTable({
    companyName: v.string(),
    industry: v.string(),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
    status: v.union(v.literal('in_progress'), v.literal('completed')),
    currentSection: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    product: v.optional(v.string()),
    contactName: v.optional(v.string()),
    sourceRef: v.optional(v.string()),
    // New registration fields
    address: v.optional(v.string()),
    tin: v.optional(v.string()),
    numberOfEmployees: v.optional(v.number()),
    authorizedSignatory: v.optional(v.string()),
    signatoryPosition: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactPosition: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    // Scoping form data
    scopingData: v.optional(v.any()),
    scopingCompleted: v.optional(v.boolean()),
  }).index('by_user', ['userId']),

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
      customerRequirements: v.array(v.string()),
      sampleComputations: v.optional(v.array(v.string()))
    })),
    overallFitScore: v.number(),
    summary: v.string(),
    recommendations: v.string(),
    consultantNotes: v.optional(v.object({
      lookOutFor: v.array(v.string()),
      systemSetup: v.array(v.string()),
      followUpQuestions: v.optional(v.array(v.string())),
      codealiveGrounding: v.optional(v.array(v.string()))
    })),
    webhookSent: v.boolean(),
    createdAt: v.number(),
    product: v.optional(v.string())
  }).index('by_session', ['sessionId'])
})
