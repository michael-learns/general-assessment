import { describe, it, expect } from 'vitest'
import { parseAssessmentBlock, calculateFitScore } from '../../../lib/assessmentScorer'

describe('parseAssessmentBlock', () => {
  it('should extract JSON from assessment code block', () => {
    const content = 'Some text\n```assessment\n{"overallFitScore": 80, "summary": "Good fit", "recommendations": "None", "sections": []}\n```\nMore text'
    const result = parseAssessmentBlock(content)
    expect(result).not.toBeNull()
    expect(result?.overallFitScore).toBe(80)
    expect(result?.summary).toBe('Good fit')
  })

  it('should return null when no assessment block present', () => {
    expect(parseAssessmentBlock('Just a regular message')).toBeNull()
  })

  it('should return null for invalid JSON in block', () => {
    expect(parseAssessmentBlock('```assessment\nnot valid json\n```')).toBeNull()
  })

  it('should return null for JSON missing required fields', () => {
    const content = '```assessment\n{"overallFitScore": 80}\n```'
    expect(parseAssessmentBlock(content)).toBeNull()
  })

  it('should parse sections correctly', () => {
    const content = '```assessment\n{"overallFitScore": 70, "summary": "s", "recommendations": "r", "sections": [{"name": "Pay Structure", "status": "supported", "findings": "ok", "customerRequirements": ["req1"]}]}\n```'
    const result = parseAssessmentBlock(content)
    expect(result?.sections).toHaveLength(1)
    expect(result?.sections[0].name).toBe('Pay Structure')
    expect(result?.sections[0].status).toBe('supported')
  })

  it('should parse sample computations when present', () => {
    const content = '```assessment\n{"overallFitScore": 70, "summary": "s", "recommendations": "r", "sections": [{"name": "Pay Structure", "status": "supported", "findings": "ok", "customerRequirements": ["req1"], "sampleComputations": ["Monthly employee sample with final net pay."]}]}\n```'
    const result = parseAssessmentBlock(content)
    expect(result?.sections[0].sampleComputations).toEqual(['Monthly employee sample with final net pay.'])
  })

  it('should parse client-facing YAHSHUA notes when present', () => {
    const content = '```assessment\n{"overallFitScore": 70, "summary": "s", "recommendations": "r", "sections": [], "consultantNotes": {"lookOutFor": ["risk"], "systemSetup": ["setup"]}}\n```'
    const result = parseAssessmentBlock(content)
    expect(result?.consultantNotes?.lookOutFor).toEqual(['risk'])
    expect(result?.consultantNotes?.systemSetup).toEqual(['setup'])
  })

  it('should still parse legacy consultant note fields', () => {
    const content = '```assessment\n{"overallFitScore": 70, "summary": "s", "recommendations": "r", "sections": [], "consultantNotes": {"lookOutFor": ["risk"], "followUpQuestions": ["question"], "systemSetup": ["setup"], "codealiveGrounding": ["grounded"]}}\n```'
    const result = parseAssessmentBlock(content)
    expect(result?.consultantNotes?.followUpQuestions).toEqual(['question'])
    expect(result?.consultantNotes?.codealiveGrounding).toEqual(['grounded'])
  })

  it('should reject malformed consultant notes', () => {
    const content = '```assessment\n{"overallFitScore": 70, "summary": "s", "recommendations": "r", "sections": [], "consultantNotes": {"lookOutFor": "risk", "systemSetup": []}}\n```'
    expect(parseAssessmentBlock(content)).toBeNull()
  })
})

describe('calculateFitScore', () => {
  it('should return 100 when all sections are supported', () => {
    const sections = [
      { name: 'A', status: 'supported' as const, findings: '', customerRequirements: [] },
      { name: 'B', status: 'supported' as const, findings: '', customerRequirements: [] }
    ]
    expect(calculateFitScore(sections)).toBe(100)
  })

  it('should return 0 when all sections are gaps', () => {
    const sections = [
      { name: 'A', status: 'gap' as const, findings: '', customerRequirements: [] }
    ]
    expect(calculateFitScore(sections)).toBe(0)
  })

  it('should return 50 for a single partial section', () => {
    const sections = [
      { name: 'A', status: 'partial' as const, findings: '', customerRequirements: [] }
    ]
    expect(calculateFitScore(sections)).toBe(50)
  })

  it('should return 0 for empty sections array', () => {
    expect(calculateFitScore([])).toBe(0)
  })

  it('should average mixed statuses correctly', () => {
    // supported(100) + gap(0) + partial(50) = 150 / 3 = 50
    const sections = [
      { name: 'A', status: 'supported' as const, findings: '', customerRequirements: [] },
      { name: 'B', status: 'gap' as const, findings: '', customerRequirements: [] },
      { name: 'C', status: 'partial' as const, findings: '', customerRequirements: [] }
    ]
    expect(calculateFitScore(sections)).toBe(50)
  })
})
