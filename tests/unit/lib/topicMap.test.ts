import { describe, it, expect } from 'vitest'
import { payrollConfig } from '../../../lib/assessments/payroll'

describe('payrollConfig sections', () => {
  it('should have 5 non-summary sections', () => {
    expect(payrollConfig.sections.length).toBe(5)
  })

  it('should contain expected section names', () => {
    const names = payrollConfig.sections.map(s => s.name)
    expect(names).toContain('Company Overview')
    expect(names).toContain('Pay Structure')
    expect(names).toContain('Leave & Benefits')
    expect(names).toContain('Compliance & Tax')
    expect(names).toContain('Edge Cases & Special Policies')
  })

  it('should have required questions for Pay Structure', () => {
    const section = payrollConfig.sections.find(s => s.name === 'Pay Structure')
    expect(section?.requiredQuestions.length).toBeGreaterThan(0)
    expect(typeof section?.requiredQuestions[0]).toBe('string')
  })

  it('should have codealive search hints for each section', () => {
    for (const section of payrollConfig.sections) {
      expect(section.codealiveSearchHints.length).toBeGreaterThan(0)
    }
  })
})
