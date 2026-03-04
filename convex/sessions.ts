import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    companyName: v.string(),
    industry: v.string(),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
    product: v.optional(v.string()),
    contactName: v.optional(v.string()),
    sourceRef: v.optional(v.string()),
    address: v.optional(v.string()),
    tin: v.optional(v.string()),
    numberOfEmployees: v.optional(v.number()),
    authorizedSignatory: v.optional(v.string()),
    signatoryPosition: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    contactPosition: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('sessions', {
      ...args,
      status: 'in_progress',
      currentSection: 'Company Overview',
      createdAt: Date.now()
    })
  }
})

export const get = query({
  args: { id: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  }
})

export const updateSection = mutation({
  args: { id: v.id('sessions'), section: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { currentSection: args.section })
  }
})

export const listByUser = query({
  args: {
    userId: v.string(),
    product: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('sessions')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .order('desc')
      .collect()
    if (args.product) {
      return results.filter(s => (s.product ?? 'payroll') === args.product)
    }
    return results
  }
})

export const complete = mutation({
  args: { id: v.id('sessions') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: 'completed',
      completedAt: Date.now()
    })
  }
})

export const updateScoping = mutation({
  args: {
    id: v.id('sessions'),
    scopingData: v.any()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      scopingData: args.scopingData,
      scopingCompleted: true
    })
  }
})
