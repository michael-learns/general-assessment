import { describe, expect, it } from 'vitest'
import { buildClientResponses } from '../../../lib/clientResponses'

describe('buildClientResponses', () => {
  it('pairs user responses with the prior assistant prompt', () => {
    const responses = buildClientResponses([
      { role: 'user', content: 'GLOBE', timestamp: 1 },
      {
        role: 'assistant',
        content: 'Thanks. Please provide your payroll sample computation?\n\nOptions:\n- I can provide one\n- Other'
      },
      {
        role: 'user',
        content: 'Sample case 1: PHP 30,000 salary.\n\nSample case 2: PHP 900 daily rate.',
        timestamp: 2
      }
    ])

    expect(responses).toEqual([
      {
        prompt: 'How did you hear about Yahshua?',
        response: 'GLOBE',
        timestamp: 1
      },
      {
        prompt: 'Thanks. Please provide your payroll sample computation?',
        response: 'Sample case 1: PHP 30,000 salary.\n\nSample case 2: PHP 900 daily rate.',
        timestamp: 2
      }
    ])
  })

  it('removes hidden assessment blocks from prompts', () => {
    const responses = buildClientResponses([
      {
        role: 'assistant',
        content: 'Anything else?\n```assessment\n{"sections":[]}\n```'
      },
      { role: 'user', content: 'No more details.' }
    ])

    expect(responses[0].prompt).toBe('Anything else?')
  })
})
