import { describe, it, expect } from 'vitest'
import { TOPIC_MAP, getAllRequiredQuestions, getSectionNames, getNextSection, getSection } from '../../../lib/topicMap'

describe('TOPIC_MAP', () => {
  it('should have 6 sections', () => {
    expect(TOPIC_MAP.length).toBe(6)
  })
})

describe('getSectionNames', () => {
  it('should return all section names', () => {
    const names = getSectionNames()
    expect(names).toContain('Company Overview')
    expect(names).toContain('Pay Structure')
    expect(names).toContain('Leave & Benefits')
    expect(names).toContain('Compliance & Tax')
    expect(names).toContain('Edge Cases & Special Policies')
    expect(names).toContain('Summary')
  })
})

describe('getAllRequiredQuestions', () => {
  it('should return required questions for a section', () => {
    const questions = getAllRequiredQuestions('Pay Structure')
    expect(questions.length).toBeGreaterThan(0)
    expect(typeof questions[0]).toBe('string')
  })

  it('should return empty array for Summary section', () => {
    expect(getAllRequiredQuestions('Summary')).toHaveLength(0)
  })

  it('should return empty array for unknown section', () => {
    expect(getAllRequiredQuestions('Nonexistent')).toHaveLength(0)
  })
})

describe('getNextSection', () => {
  it('should return next section', () => {
    expect(getNextSection('Company Overview')).toBe('Pay Structure')
  })

  it('should return null for last section', () => {
    expect(getNextSection('Summary')).toBeNull()
  })

  it('should return null for unknown section', () => {
    expect(getNextSection('Nonexistent')).toBeNull()
  })
})

describe('getSection', () => {
  it('should return section by name', () => {
    const section = getSection('Compliance & Tax')
    expect(section).toBeDefined()
    expect(section?.codealiveSearchHints.length).toBeGreaterThan(0)
  })

  it('should return undefined for unknown section', () => {
    expect(getSection('Nonexistent')).toBeUndefined()
  })
})
