import type { AssessmentConfig } from './types'

export const hrmsConfig: AssessmentConfig = {
  slug: 'hrms',
  productName: 'HRMS',
  consultantPersona: 'HR systems consultant',
  introDescription: 'Find out if our HRMS is the right fit for your organization',

  codeAliveRepoId: 'hrms',
  codeAliveSearchDescription: 'Search the HRMS codebase to check if a specific feature or functionality is supported.',
  codeAliveConsultantDescription: 'Get an in-depth analysis of whether a complex HR requirement is supported by the HRMS.',

  sections: [
    {
      name: 'Employee Data Management',
      requiredQuestions: [
        'How many employees do you manage?',
        'What employee data fields are critical for your organization?',
        'Do you require custom fields for employee records?',
        'How do you handle employee document storage?'
      ],
      codealiveSearchHints: ['employee records', 'custom fields', 'document storage', 'employee data']
    },
    {
      name: 'Org Structure',
      requiredQuestions: [
        'How many departments or teams do you have?',
        'Do you have a matrix or hierarchical org structure?',
        'Do you operate across multiple locations or offices?',
        'How do you manage reporting lines?'
      ],
      codealiveSearchHints: ['org chart', 'departments', 'hierarchy', 'reporting lines', 'locations']
    },
    {
      name: 'Attendance and Scheduling',
      requiredQuestions: [
        'Do you track employee attendance or time-in/time-out?',
        'Do you use shift scheduling?',
        'How do you handle flexible work arrangements?',
        'Do you integrate with biometric or access control systems?'
      ],
      codealiveSearchHints: ['attendance tracking', 'shift scheduling', 'flexible work', 'biometric integration']
    },
    {
      name: 'Document Management',
      requiredQuestions: [
        'What types of HR documents do you manage (contracts, certificates, etc.)?',
        'Do you need e-signature capabilities?',
        'How long do you need to retain documents?',
        'Do you have compliance requirements for document storage?'
      ],
      codealiveSearchHints: ['document management', 'e-signature', 'document retention', 'compliance documents']
    },
    {
      name: 'Onboarding',
      requiredQuestions: [
        'What does your current onboarding process look like?',
        'How many new hires do you onboard per month on average?',
        'Do you need to automate onboarding tasks and checklists?',
        'Do you require self-service onboarding portals for new employees?'
      ],
      codealiveSearchHints: ['onboarding workflow', 'onboarding checklist', 'new hire portal', 'onboarding automation']
    }
  ],

  webhookUrl: undefined
}
