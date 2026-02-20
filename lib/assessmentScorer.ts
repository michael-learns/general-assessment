export interface AssessmentSection {
  name: string
  status: 'supported' | 'partial' | 'gap'
  findings: string
  customerRequirements: string[]
}

export interface ParsedAssessment {
  sections: AssessmentSection[]
  overallFitScore: number
  summary: string
  recommendations: string
}

export function parseAssessmentBlock(content: string): ParsedAssessment | null {
  const match = content.match(/```assessment\n([\s\S]*?)```/)
  if (!match) return null

  try {
    return JSON.parse(match[1].trim()) as ParsedAssessment
  } catch {
    return null
  }
}

const STATUS_WEIGHTS: Record<AssessmentSection['status'], number> = {
  supported: 100,
  partial: 50,
  gap: 0
}

export function calculateFitScore(sections: AssessmentSection[]): number {
  if (sections.length === 0) return 0
  const total = sections.reduce((sum, s) => sum + STATUS_WEIGHTS[s.status], 0)
  return Math.round(total / sections.length)
}
