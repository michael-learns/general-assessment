import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../../../lib/systemPrompt'
import { payrollConfig } from '../../../lib/assessments/payroll'
import { hrmsConfig } from '../../../lib/assessments/hrms'

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
    expect(prompt).toContain('Timekeeping, Requests & Approvals')
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

  it('should instruct AI to include answer options for each question', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('Provide selectable answer options for every question')
    expect(prompt).toContain('Other (please specify)')
  })

  it('should enforce Philippines scope and PHP currency', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('localized to the Philippines')
    expect(prompt).toContain('Philippine Peso (PHP)')
  })

  it('should require company and employee details in the final summary', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('Company information details already collected')
    expect(prompt).toContain('Employee details already collected about the company')
  })

  it('should require payroll sample computation details in the conversation and report', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('Collect payroll sample computation details')
    expect(prompt).toContain('case-by-case scenarios')
    expect(prompt).toContain('final net pay')
    expect(prompt).toContain('Payroll sample computation scenarios provided by the customer')
    expect(prompt).toContain('Include every sample computation scenario the customer provided')
    expect(prompt).toContain('sampleComputations')
  })

  it('should not add payroll sample computation instructions to other products', () => {
    const prompt = buildSystemPrompt(hrmsConfig, 'Test Co', 'Retail')
    expect(prompt).not.toContain('Collect payroll sample computation details')
    expect(prompt).not.toContain('sampleComputations')
  })

  it('should require client-facing YAHSHUA notes without internal grounding fields', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('consultantNotes')
    expect(prompt).toContain('lookOutFor')
    expect(prompt).toContain('systemSetup')
    expect(prompt).toContain('YAHSHUA Notes')
    expect(prompt).toContain('Include only `lookOutFor` and `systemSetup`')
    expect(prompt).toContain('Do not include Codealive names')
    expect(prompt).not.toContain('"followUpQuestions"')
    expect(prompt).not.toContain('"codealiveGrounding"')
  })

  it('should include scoping context for process and pain point fields', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail', {
      section1: {
        currentPayrollSystem: 'Excel',
        payrollComputationProcess: 'HR exports logs, payroll computes in Excel, finance reviews before bank upload.',
        payrollComputationPainPoints: 'Late adjustments and manual reconciliation.'
      },
      section2: {
        timekeepingProcess: 'Biometric export reviewed by HR.',
        timekeepingPainPoints: 'Missing logs.',
        requestApplicationProcess: 'Employees file requests by email.',
        requestApplicationPainPoints: 'Requests are scattered.',
        approvalProcess: 'Managers approve before cutoff.',
        approvalPainPoints: 'Approvals are delayed.'
      }
    })

    expect(prompt).toContain('Current Payroll Computation Process')
    expect(prompt).toContain('Payroll Computation Pain Points')
    expect(prompt).toContain('Timekeeping Pain Points')
    expect(prompt).toContain('Request/Application Pain Points')
    expect(prompt).toContain('Approval Pain Points')
  })

  it('should ask Yahshua source question after name with fixed options', () => {
    const prompt = buildSystemPrompt(payrollConfig, 'Test Co', 'Retail')
    expect(prompt).toContain('"How did you hear about Yahshua?"')
    expect(prompt).toContain('Do NOT repeat the greeting or the Yahshua question')
  })
})
