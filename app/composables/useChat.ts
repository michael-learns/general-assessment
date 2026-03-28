export interface Message {
  role: 'user' | 'model'
  content: string
  timestamp: number
}

export function useChat(sessionId: string, companyNameRef: Ref<string>, industryRef: Ref<string>, product?: string) {
  const messages = ref<Message[]>([])
  const isStreaming = ref(false)
  const isCheckingFeature = ref(false)
  const streamingContent = ref('')
  const error = ref('')
  const saveStatus = ref<'saved' | 'saving' | 'idle'>('idle')

  function loadMessages(initial: Message[]) {
    messages.value = [...initial]
    if (initial.length > 0) {
      saveStatus.value = 'saved'
    }
  }

  async function streamResponse(response: Response) {
    if (!response.body) throw new Error('No response body')

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
            saveStatus.value = 'saved'
          } else if (data.type === 'error') {
            error.value = data.message
            saveStatus.value = 'idle'
          }
        } catch {
          // Malformed SSE line — skip
        }
      }
    }
  }

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
    saveStatus.value = 'saving'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          companyName: companyNameRef.value,
          industry: industryRef.value,
          product: product || 'payroll',
          // Send all messages except the one just added (it's sent as userMessage)
          messages: messages.value.slice(0, -1),
          userMessage
        })
      })

      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`)
      await streamResponse(response)
    } catch (err) {
      error.value = 'Connection error. Please try again.'
      saveStatus.value = 'idle'
      console.error('[useChat] fetch error:', err)
    } finally {
      isStreaming.value = false
      isCheckingFeature.value = false
      streamingContent.value = ''
    }
  }

  async function sendGreeting() {
    if (isStreaming.value) return

    isStreaming.value = true
    streamingContent.value = ''
    error.value = ''
    saveStatus.value = 'saving'

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          companyName: companyNameRef.value,
          industry: industryRef.value,
          product: product || 'payroll',
          messages: [],
          userMessage: '__START__',
          isInitialGreeting: true
        })
      })

      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`)
      await streamResponse(response)
    } catch (err) {
      error.value = 'Connection error. Please try again.'
      saveStatus.value = 'idle'
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
    saveStatus: readonly(saveStatus),
    error,
    loadMessages,
    sendMessage,
    sendGreeting
  }
}
