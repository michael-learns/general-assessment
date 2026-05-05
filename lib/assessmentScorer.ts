export interface AssessmentSection {
  name: string
  status: 'supported' | 'partial' | 'gap'
  findings: string
  customerRequirements: string[]
}

export interface ConsultantNotes {
  lookOutFor: string[]
  systemSetup: string[]
  followUpQuestions?: string[]
  codealiveGrounding?: string[]
}

export interface ParsedAssessment {
  sections: AssessmentSection[]
  overallFitScore: number
  summary: string
  recommendations: string
  consultantNotes?: ConsultantNotes
}

export function parseAssessmentBlock(content: string): ParsedAssessment | null {
  const match = content.match(/```assessment\r?\n([\s\S]*?)```/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1]!.trim())
    if (
      !Array.isArray(parsed.sections) ||
      typeof parsed.overallFitScore !== 'number' ||
      typeof parsed.summary !== 'string' ||
      typeof parsed.recommendations !== 'string'
    ) return null

    if (parsed.consultantNotes !== undefined && !isConsultantNotes(parsed.consultantNotes)) {
      return null
    }

    return parsed as ParsedAssessment
  } catch {
    return null
  }
}

function isConsultantNotes(value: unknown): value is ConsultantNotes {
  if (!value || typeof value !== 'object') return false
  const notes = value as Record<string, unknown>

  return (
    isStringArray(notes.lookOutFor) &&
    isStringArray(notes.systemSetup) &&
    isOptionalStringArray(notes.followUpQuestions) &&
    isOptionalStringArray(notes.codealiveGrounding)
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value)
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
