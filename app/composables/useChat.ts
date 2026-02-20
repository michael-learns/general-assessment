export interface Message {
  role: 'user' | 'model'
  content: string
  timestamp: number
}

export function useChat(sessionId: string, companyName: string, industry: string) {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const isCheckingFeature = ref(false)
  const streamingContent = ref('')
  const error = ref('')

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || isStreaming.value) return

    messages.value.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    })

    isStreaming.value = true
    streamingContent.value = ''
    error.value = ''

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          companyName,
          industry,
          // Send all messages except the one just added (it's sent as userMessage)
          messages: messages.value.slice(0, -1),
          userMessage
        })
      })

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'text') {
              streamingContent.value += data.content
            } else if (data.type === 'tool_call') {
              isCheckingFeature.value = true
            } else if (data.type === 'done') {
              isCheckingFeature.value = false
              if (streamingContent.value) {
                messages.value.push({
                  role: 'model',
                  content: streamingContent.value,
                  timestamp: Date.now()
                })
                streamingContent.value = ''
              }
            } else if (data.type === 'error') {
              error.value = data.message
            }
          } catch {
            // Malformed SSE line — skip
          }
        }
      }
    } catch (err) {
      error.value = 'Connection error. Please try again.'
      console.error('[useChat] fetch error:', err)
    } finally {
      isStreaming.value = false
      isCheckingFeature.value = false
      streamingContent.value = ''
    }
  }

  return {
    messages: readonly(messages),
    isStreaming: readonly(isStreaming),
    isCheckingFeature: readonly(isCheckingFeature),
    streamingContent: readonly(streamingContent),
    error,
    sendMessage
  }
}
