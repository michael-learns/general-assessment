import type { ParsedAssessment } from './assessmentScorer'

export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'model'
  content: string
}

const SAMPLE_CONTEXT_RE = /(?:sample\s+(?:case|computation)|case\s*\d|final\s+net\s+pay|basic\s+pay|daily\s+rate|monthly\s+salary|cutoff)/i
const COMPUTATION_DETAIL_RE = /(?:php|basic pay|net pay|statutory|sss|phic|hdmf|withholding|tax|deduction|allowance|overtime|night differential|holiday|prorat|daily rate|monthly salary)/i

export function extractActualSampleComputations(messages: TranscriptMessage[]): string[] {
  const samples: string[] = []

  for (const message of messages) {
    if (message.role !== 'user') continue

    const content = message.content.trim()
    if (content.length < 80) continue
    if (!SAMPLE_CONTEXT_RE.test(content) || !COMPUTATION_DETAIL_RE.test(content)) continue

    samples.push(...splitSampleCases(content))
  }

  return unique(samples)
}

export function attachActualSampleComputations(
  assessment: ParsedAssessment,
  actualSamples: string[]
): ParsedAssessment {
  if (actualSamples.length === 0 || assessment.sections.length === 0) return assessment

  const targetIndex = findSampleComputationSectionIndex(assessment)

  return {
    ...assessment,
    sections: assessment.sections.map((section, index) => {
      if (index !== targetIndex) return section

      return {
        ...section,
        customerRequirements: unique([
          ...section.customerRequirements,
          'Detailed payroll sample computation scenarios provided for review'
        ]),
        sampleComputations: actualSamples
      }
    })
  }
}

function findSampleComputationSectionIndex(assessment: ParsedAssessment) {
  const preferredNames = ['Pay Structure', 'Edge Cases & Special Policies']

  for (const name of preferredNames) {
    const index = assessment.sections.findIndex(section => section.name === name)
    if (index >= 0) return index
  }

  return 0
}

function splitSampleCases(content: string): string[] {
  const normalized = content.replace(/\r\n/g, '\n').trim()
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map(part => part.trim())
    .filter(Boolean)

  if (paragraphs.length > 1 && paragraphs.some(part => /(?:sample\s+case|case)\s*\d/i.test(part))) {
    return paragraphs
  }

  const caseParts = normalized
    .split(/(?=(?:Sample\s+case|Case)\s+\d+\s*:)/i)
    .map(part => part.trim())
    .filter(Boolean)

  return caseParts.length > 1 ? caseParts : [normalized]
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)))
}
