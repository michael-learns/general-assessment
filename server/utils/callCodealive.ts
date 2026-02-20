export async function callCodealive(
  apiKey: string,
  tool: 'codebase_search' | 'codebase_consultant',
  params: Record<string, string>
): Promise<string> {
  try {
    const result = await $fetch<unknown>('https://mcp.codealive.ai/api', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: { tool, params }
    })
    return typeof result === 'string' ? result : JSON.stringify(result)
  } catch (err) {
    console.error('[callCodealive] Failed:', err)
    return 'Feature lookup unavailable'
  }
}
