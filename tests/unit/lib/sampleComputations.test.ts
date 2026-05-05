import { describe, expect, it } from 'vitest'
import { attachActualSampleComputations, extractActualSampleComputations } from '../../../lib/sampleComputations'
import type { ParsedAssessment } from '../../../lib/assessmentScorer'

describe('extractActualSampleComputations', () => {
  it('preserves detailed user-provided sample computation cases', () => {
    const samples = extractActualSampleComputations([
      { role: 'assistant', content: 'Please provide sample computations.' },
      {
        role: 'user',
        content: [
          'Sample case 1: Regular monthly employee, PHP 30,000 monthly salary, semi-monthly payroll for the 1st to 15th cutoff. Basic pay is PHP 15,000 for the cutoff. The employee had 1 unpaid day, 2 approved overtime hours on a regular day, no holiday work, PHP 1,500 taxable allowance, PHP 500 de minimis allowance, standard SSS/PHIC/HDMF employee shares, withholding tax based on taxable compensation, and PHP 1,000 loan deduction. Net pay is reviewed manually after statutory and loan deductions.',
          'Sample case 2: Daily-paid plant employee, PHP 900 daily rate, 12 paid days in the cutoff, 1 regular holiday worked, 4 approved night differential hours, meal allowance of PHP 100 per worked day, standard government deductions, and tax computed on taxable gross. Payroll manually checks holiday premium, night differential, and attendance exceptions before final net pay.'
        ].join('\n\n')
      }
    ])

    expect(samples).toHaveLength(2)
    expect(samples[0]).toContain('PHP 30,000 monthly salary')
    expect(samples[0]).toContain('PHP 1,000 loan deduction')
    expect(samples[1]).toContain('4 approved night differential hours')
  })
})

describe('attachActualSampleComputations', () => {
  it('puts actual sample computations into the Pay Structure section', () => {
    const assessment: ParsedAssessment = {
      overallFitScore: 100,
      summary: 'Summary',
      recommendations: 'Recommendations',
      sections: [
        {
          name: 'Company Overview',
          status: 'supported',
          findings: 'Ok',
          customerRequirements: []
        },
        {
          name: 'Pay Structure',
          status: 'supported',
          findings: 'Ok',
          customerRequirements: ['Semi-monthly payroll'],
          sampleComputations: ['AI-shortened sample']
        }
      ]
    }

    const updated = attachActualSampleComputations(assessment, [
      'Full actual sample with PHP 30,000 salary and final net pay details.'
    ])

    expect(updated.sections[1].sampleComputations).toEqual([
      'Full actual sample with PHP 30,000 salary and final net pay details.'
    ])
    expect(updated.sections[1].customerRequirements).toContain('Detailed payroll sample computation scenarios provided for review')
  })
})
