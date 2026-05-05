export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'model'
  content: string
  timestamp?: number
}

export interface ClientResponse {
  prompt: string
  response: string
  timestamp?: number
}

const INITIAL_PROMPT = 'How did you hear about Yahshua?'

export function buildClientResponses(messages: TranscriptMessage[]): ClientResponse[] {
  const responses: ClientResponse[] = []
  let lastPrompt = INITIAL_PROMPT

  for (const message of messages) {
    const content = cleanContent(message.content)
    if (!content) continue

    if (message.role === 'assistant' || message.role === 'model') {
      const prompt = extractPrompt(content)
      if (prompt) lastPrompt = prompt
      continue
    }

    if (message.role === 'user') {
      responses.push({
        prompt: lastPrompt,
        response: content,
        timestamp: message.timestamp
      })
    }
  }

  return responses
}

function extractPrompt(content: string) {
  const withoutOptions = content.split(/\n\s*Options\s*:/i)[0]?.trim() || content
  const lines = withoutOptions
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const questionLine = [...lines].reverse().find(line => line.includes('?'))
  return cleanContent(questionLine || lines.at(-1) || '')
}

function cleanContent(content: string) {
  return content
    .replace(/```assessment[\s\S]*?```/g, '')
    .replace(/```assessment[\s\S]*$/g, '')
    .trim()
}
