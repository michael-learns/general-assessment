import type { AssessmentConfig } from './types'
import { payrollConfig } from './payroll'
import { hrmsConfig } from './hrms'

export type { AssessmentConfig, AssessmentSection } from './types'

export const assessmentRegistry: Record<string, AssessmentConfig> = {
  [payrollConfig.slug]: payrollConfig,
  [hrmsConfig.slug]: hrmsConfig
}

export function getConfig(slug: string): AssessmentConfig | undefined {
  return assessmentRegistry[slug]
}

export function getAll(): AssessmentConfig[] {
  return Object.values(assessmentRegistry)
}
