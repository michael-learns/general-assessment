import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../../lib/systemPrompt'
import { payrollConfig } from '../../../lib/assessments/payroll'

describe('buildSystemPrompt', () => {
  it('should include company name and industry', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Acme Corp', 'Manufacturing')
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('Manufacturing')
  })

  it('should include all topic section names', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('Company Overview')
    expect(prompt).toContain('Pay Structure')
    expect(prompt).toContain('Leave & Benefits')
    expect(prompt).toContain('Compliance & Tax')
    expect(prompt).toContain('Edge Cases & Special Policies')
  })

  it('should instruct AI to produce assessment JSON block', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('```assessment')
    expect(prompt).toContain('overallFitScore')
  })

  it('should include codealive_search tool instruction', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('codealive_search')
  })

  it('should include consultant persona from config', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain(payrollConfig.consultantPersona)
  })
})
