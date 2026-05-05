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
        'Do you operate under multiple legal entities or companies in the Philippines?'
      ],
      codealiveSearchHints: ['multi-entity', 'philippines regions', 'company setup']
    },
    {
      name: 'Pay Structure',
      requiredQuestions: [
        'What pay frequencies do you use (weekly, bi-monthly, monthly, mixed, or others)?',
        'What payroll system are you currently using, and how does your payroll computation process work from cutoff to release?',
        'What are the main pain points in your current payroll computation process?',
        'Do you have a mix of full-time fixed-salary, hourly rate, commission-based, or contractor employees?',
        'How do you handle overtime — fixed multiplier or custom rules?',
        'Do any employees have multiple pay rates or split pay?',
        'Are there shift differentials or special pay premiums?'
      ],
      codealiveSearchHints: ['pay frequency', 'payroll computation', 'payroll import', 'payroll approval', 'overtime', 'salary', 'hourly', 'commission', 'split pay', 'shift differential']
    },
    {
      name: 'Timekeeping, Requests & Approvals',
      requiredQuestions: [
        'How do you currently handle timekeeping, and what is the end-to-end process before payroll?',
        'What are the main timekeeping pain points or manual workarounds?',
        'How do employees file requests or applications such as leave, overtime, undertime, missed logs, or schedule changes?',
        'What pain points do you experience with request or application filing?',
        'How are those requests approved, and who validates them before payroll?',
        'What pain points do you experience with approvals before cutoff?'
      ],
      codealiveSearchHints: ['timekeeping', 'attendance import', 'biometric logs', 'leave request', 'overtime approval', 'approval workflow', 'missed logs']
    },
    {
      name: 'Leave & Benefits',
      requiredQuestions: [
        'What leave types do you offer (vacation, annual, sick, maternity/paternity, unpaid)?',
        'How does leave accrual work — is it time-based, tenure-based, or policy-based?',
        'What benefits deductions do you manage through payroll (medical, pension, insurance)?',
        'Do you provide allowances such as travel, housing, or meal allowances?'
      ],
      codealiveSearchHints: ['leave management', 'leave accrual', 'benefits deduction', 'allowances']
    },
    {
      name: 'Compliance & Tax',
      requiredQuestions: [
        'What are your primary Philippine tax filing requirements?',
        'Which statutory contributions apply to your employees (e.g. SSS, PhilHealth, HDMF/Pag-IBIG)?',
        'Are there any government-mandated Philippine benefits or contributions unique to your setup?',
        'Are any of your employees covered by union agreements or collective bargaining agreements?'
      ],
      codealiveSearchHints: ['philippine tax filing', 'statutory contributions', 'SSS', 'PhilHealth', 'HDMF', 'Pag-IBIG', 'union', 'CBA']
    },
    {
      name: 'Edge Cases & Special Policies',
      requiredQuestions: [
        'How do you handle mid-period hires or terminations?',
        'What are your final pay computation rules?',
        'Do you ever need retroactive pay adjustments?',
        'Do you run off-cycle payroll for any reason?',
        'Do all payroll payouts use Philippine Peso (PHP), and are there exceptions?'
      ],
      codealiveSearchHints: ['proration', 'final pay', 'retroactive pay', 'off-cycle', 'php currency']
    }
  ],

  webhookUrl: undefined
}
