import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const add = mutation({
  args: {
    sessionId: v.id('sessions'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    codealiveQueries: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      ...args,
      timestamp: Date.now()
    })
  }
})

export const list = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_session', q => q.eq('sessionId', args.sessionId))
      .order('asc')
      .collect()
  }
})
