export interface AssessmentSection {
  name: string
  requiredQuestions: string[]
  codealiveSearchHints: string[]
}

export interface AssessmentConfig {
  // Identity
  slug: string
  productName: string
  consultantPersona: string
  introDescription: string

  // Knowledge source
  codeAliveRepoId: string
  codeAliveSearchDescription: string
  codeAliveConsultantDescription: string

  // Assessment structure
  sections: AssessmentSection[]

  // Integration
  webhookUrl?: string
}
