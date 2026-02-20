import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../../lib/systemPrompt'

describe('buildSystemPrompt', () => {
  it('should include company name and industry', () => {
    const prompt = buildSystemPrompt('Acme Corp', 'Manufacturing')
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('Manufacturing')
  })

  it('should include all topic section names except Summary', () => {
    const prompt = buildSystemPrompt('Test Co', 'Retail')
    expect(prompt).toContain('Company Overview')
    expect(prompt).toContain('Pay Structure')
    expect(prompt).toContain('Leave & Benefits')
    expect(prompt).toContain('Compliance & Tax')
    expect(prompt).toContain('Edge Cases & Special Policies')
    expect(prompt).not.toContain('### Summary')
  })

  it('should instruct AI to produce assessment JSON block', () => {
    const prompt = buildSystemPrompt('Test Co', 'Retail')
    expect(prompt).toContain('```assessment')
    expect(prompt).toContain('overallFitScore')
  })

  it('should include codealive_search tool instruction', () => {
    const prompt = buildSystemPrompt('Test Co', 'Retail')
    expect(prompt).toContain('codealive_search')
  })
})
