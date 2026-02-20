import { callCodealive } from '../utils/callCodealive'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ tool: string; params: Record<string, string> }>(event)

  if (!body.tool || !body.params) {
    throw createError({ statusCode: 400, message: 'Missing tool or params' })
  }

  const allowedTools = ['codebase_search', 'codebase_consultant'] as const
  type AllowedTool = typeof allowedTools[number]

  if (!(allowedTools as readonly string[]).includes(body.tool)) {
    throw createError({ statusCode: 400, message: 'Invalid tool name' })
  }

  const result = await callCodealive(config.codeAliveApiKey, body.tool as AllowedTool, body.params)

  if (result === 'Feature lookup unavailable') {
    throw createError({ statusCode: 502, message: 'Codealive API unavailable' })
  }

  return result
})
