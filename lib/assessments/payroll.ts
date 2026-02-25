import type { AssessmentConfig } from './types'

export const payrollConfig: AssessmentConfig = {
  slug: 'payroll',
  productName: 'Payroll System',
  consultantPersona: 'payroll consultant',
  introDescription: 'Find out if our payroll system is the right fit for your business',

  codeAliveRepoId: 'payroll',
  codeAliveSearchDescription: 'Search the payroll system codebase to check if a specific feature, policy type, or functionality is supported.',
  codeAliveConsultantDescription: 'Get an in-depth analysis of whether a complex HR/payroll policy is supported by the payroll system.',

  sections: [
    {
      name: 'Company Overview',
      requiredQuestions: [
        'How many employees does your company have?',
        'What industry or sector are you in?',
        'Do you operate under multiple legal entities or companies?',
        'Which countries or regions do you operate in?'
      ],
      codealiveSearchHints: ['multi-entity', 'multi-country', 'company setup']
    },
    {
      name: 'Pay Structure',
      requiredQuestions: [
        'What pay frequencies do you use (weekly, bi-weekly, monthly, or mixed)?',
        'Do you have a mix of salaried, hourly, commission-based, or contractor employees?',
        'How do you handle overtime — fixed multiplier or custom rules?',
        'Do any employees have multiple pay rates or split pay?',
        'Are there shift differentials or special pay premiums?'
      ],
      codealiveSearchHints: ['pay frequency', 'overtime', 'salary', 'hourly', 'commission', 'split pay', 'shift differential']
    },
    {
      name: 'Leave & Benefits',
      requiredQuestions: [
        'What leave types do you offer (annual, sick, maternity/paternity, unpaid)?',
        'How does leave accrual work — is it time-based, tenure-based, or policy-based?',
        'What benefits deductions do you manage through payroll (medical, pension, insurance)?',
        'Do you provide allowances such as travel, housing, or meal allowances?'
      ],
      codealiveSearchHints: ['leave management', 'leave accrual', 'benefits deduction', 'allowances']
    },
    {
      name: 'Compliance & Tax',
      requiredQuestions: [
        'What are your primary tax filing requirements?',
        'Which statutory contributions apply to your employees (e.g. SSS, PhilHealth, HDMF, CPF, EPF)?',
        'Are there any government-mandated benefits or contributions unique to your region?',
        'Are any of your employees covered by union agreements or collective bargaining agreements?'
      ],
      codealiveSearchHints: ['tax filing', 'statutory contributions', 'SSS', 'PhilHealth', 'HDMF', 'CPF', 'EPF', 'union', 'CBA']
    },
    {
      name: 'Edge Cases & Special Policies',
      requiredQuestions: [
        'How do you handle mid-period hires or terminations?',
        'What are your final pay computation rules?',
        'Do you ever need retroactive pay adjustments?',
        'Do you run off-cycle payroll for any reason?',
        'Do you pay employees in multiple currencies?'
      ],
      codealiveSearchHints: ['proration', 'final pay', 'retroactive pay', 'off-cycle', 'multi-currency']
    }
  ],

  webhookUrl: undefined
}
