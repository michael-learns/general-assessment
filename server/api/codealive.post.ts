export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ tool: string; params: Record<string, string> }>(event)

  if (!body.tool || !body.params) {
    throw createError({ statusCode: 400, message: 'Missing tool or params' })
  }

  const allowedTools = ['get_data_sources', 'codebase_search', 'codebase_consultant']
  if (!allowedTools.includes(body.tool)) {
    throw createError({ statusCode: 400, message: 'Invalid tool name' })
  }

  const response = await $fetch<unknown>('https://mcp.codealive.ai/api', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.codeAliveApiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      tool: body.tool,
      params: body.params
    }
  })

  return response
})
