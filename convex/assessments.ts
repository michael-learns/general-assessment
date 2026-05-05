import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const save = mutation({
  args: {
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
    product: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('assessments', {
      ...args,
      webhookSent: false,
      createdAt: Date.now()
    })
  }
})

export const markWebhookSent = mutation({
  args: { id: v.id('assessments') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { webhookSent: true })
  }
})

export const getBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('assessments')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .first()
  }
})
