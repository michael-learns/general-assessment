import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
  args: {
    companyName: v.string(),
    industry: v.string(),
    email: v.optional(v.string())
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

export const complete = mutation({
  args: { id: v.id('sessions') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: 'completed',
      completedAt: Date.now()
    })
  }
})
