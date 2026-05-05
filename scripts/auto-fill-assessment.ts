import { parseAssessmentBlock } from '../lib/assessmentScorer'

type ChatMessage = { role: 'user' | 'model'; content: string }

const BASE_URL = process.env.ASSESSMENT_BASE_URL || 'http://localhost:3000'
const PRODUCT = process.env.ASSESSMENT_PRODUCT || 'payroll'
const MAX_TURNS = Number(process.env.ASSESSMENT_MAX_TURNS || 40)

const registration = {
  companyName: process.env.ASSESSMENT_COMPANY_NAME || 'AutoFill Manufacturing Inc.',
  industry: process.env.ASSESSMENT_INDUSTRY || 'Manufacturing',
  address: process.env.ASSESSMENT_ADDRESS || '12 Sample Street, Makati City',
  tin: process.env.ASSESSMENT_TIN || '123-456-789-000',
  numberOfEmployees: Number(process.env.ASSESSMENT_EMPLOYEES || 85),
  authorizedSignatory: process.env.ASSESSMENT_SIGNATORY || 'Maria Santos',
  signatoryPosition: process.env.ASSESSMENT_SIGNATORY_POSITION || 'Finance Director',
  contactPerson: process.env.ASSESSMENT_CONTACT_PERSON || 'Paolo Cruz',
  contactPosition: process.env.ASSESSMENT_CONTACT_POSITION || 'HR Manager',
  contactPhone: process.env.ASSESSMENT_CONTACT_PHONE || '+63 917 555 0101',
  email: process.env.ASSESSMENT_EMAIL || 'payroll@example.com',
  product: PRODUCT
}

const scopingData = {
  section1: {
    payrollSchedule: 'Semi-monthly',
    payrollCutoffDetails: '1st to 15th paid on the 20th, 16th to end of month paid on the 5th.',
    payrollReleaseTiming: 'Release on the preceding business day.',
    currentPayrollSystem: 'Excel with manual approvals',
    payrollComputationProcess: 'HR exports attendance, payroll computes basic pay, deductions, and adjustments in Excel, finance reviews totals, then payroll uploads the bank file.',
    payrollComputationPainPoints: 'Manual reconciliation takes too long, late adjustments are hard to track, and final pay is computed in a separate worksheet.',
    employeeClassification: ['Regular', 'Probationary', 'Contractual'],
    payBasis: 'Monthly for staff and daily for rank-and-file employees.',
    multiplePayrollGroups: 'yes',
    multiplePayrollGroupsDetails: 'Head office and plant employees follow different approval flows.',
    proratedSalaryRules: 'New hires and resigning employees are prorated based on actual days worked.',
    uniquePayrollComputationRules: 'Late minutes and undertime are deducted from base pay.',
    offCyclePayroll: 'yes',
    offCyclePayrollDetails: 'Used for final pay and urgent payroll adjustments.'
  },
  section2: {
    standardWorkSchedule: 'Monday to Friday, 8 AM to 5 PM. Plant operations also run shifting schedules.',
    attendanceTracking: 'Biometric',
    timekeepingProcess: 'Attendance comes from biometrics and HR validates exceptions before payroll.',
    timekeepingPainPoints: 'Missing logs and biometric export delays create manual corrections near cutoff.',
    requestApplicationProcess: 'Employees submit requests through HR and email.',
    requestApplicationPainPoints: 'Requests are scattered across email threads, so HR has to follow up missing details manually.',
    approvalProcess: 'Managers approve attendance adjustments before payroll cutoff.',
    approvalPainPoints: 'Approvals are sometimes delayed, and payroll has to chase managers before cutoff.',
    specialLogsConsiderations: 'yes',
    specialLogsDetails: 'Some teams use manual overtime and trip tickets.',
    gracePeriod: 'yes',
    gracePeriodDetails: '15-minute grace period for office-based employees.'
  },
  section3: {
    overtimeComputation: 'Overtime is paid after approved rendered hours beyond the regular schedule.',
    nightDifferentialComputation: 'Night differential applies to hours worked between 10 PM and 6 AM.',
    holidayCompensation: 'Holiday pay follows standard Philippine holiday rules with OT premiums when applicable.',
    overtimeRoundingRules: 'Rounded to the nearest 30 minutes after approval.'
  },
  section4: {
    uniqueLeaves: 'yes',
    uniqueLeavesDetails: 'Vacation, sick, emergency, birthday, and solo parent leave.',
    leaveCarryOver: 'Up to 5 unused vacation leave credits can be carried over.',
    leaveReplenishment: 'Leave credits refresh yearly.'
  },
  section5: {
    allowancesWithConsiderations: 'yes',
    allowancesDetails: 'Transportation, meal, communication, and shift allowances.',
    recurringEarningsDetails: 'Recurring allowances depend on department and role.',
    bonusIncentiveRules: 'Monthly incentives vary by attendance and output metrics.'
  },
  section6: {
    sssComputation: 'Based on monthly salary',
    phicComputation: 'Based on monthly salary',
    hdmfComputation: 'Based on monthly salary',
    taxComputation: 'Gross pay',
    additionalDeductions: 'yes',
    additionalDeductionsDetails: 'Loans, cash advances, uniforms, and cooperative deductions.',
    allowancesExcludedFromTax: 'yes',
    allowancesExcludedFromTaxDetails: 'De minimis benefits are excluded from tax when applicable.',
    finalPayRules: 'Final pay includes pro-rated pay, unused leave conversion, and statutory deductions.'
  },
  section7: {
    commonReportsNeeded: 'Payroll register, bank file, payslips, 13th month summary, government remittance reports, and leave balances.',
    reportUsagePurpose: 'Used for payroll release, reconciliation, government compliance, and audit support.',
    hasUniqueArrangements: 'yes',
    uniqueConsiderations: [
      'Different approval rules by business unit.',
      'Plant employees sometimes have compressed schedules.',
      'Manual adjustments are common near cutoff.'
    ]
  }
}

const fallbackAnswers = [
  'GLOBE',
  'Semi-monthly.',
  'Biometric attendance with manager approvals.',
  'Standard Philippine statutory payroll rules with a few manual exceptions.',
  'Yes.',
  'No.',
  'Manual adjustments happen near cutoff.',
  'We need accurate payroll, reports, and less manual work.'
]

const sampleComputationAnswer = [
  'Sample case 1: Regular monthly employee, PHP 30,000 monthly salary, semi-monthly payroll for the 1st to 15th cutoff. Basic pay is PHP 15,000 for the cutoff. The employee had 1 unpaid day, 2 approved overtime hours on a regular day, no holiday work, PHP 1,500 taxable allowance, PHP 500 de minimis allowance, standard SSS/PHIC/HDMF employee shares, withholding tax based on taxable compensation, and PHP 1,000 loan deduction. Net pay is reviewed manually after statutory and loan deductions.',
  'Sample case 2: Daily-paid plant employee, PHP 900 daily rate, 12 paid days in the cutoff, 1 regular holiday worked, 4 approved night differential hours, meal allowance of PHP 100 per worked day, standard government deductions, and tax computed on taxable gross. Payroll manually checks holiday premium, night differential, and attendance exceptions before final net pay.',
  'Sample case 3: Resigned employee final pay. The employee has prorated basic pay up to last working day, unused leave conversion, late/undertime deductions, loan balance deduction, statutory contribution checks, tax annualization/final withholding review, and clearance-related manual notes before release.'
].join('\n\n')

async function createSession() {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registration)
  })

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status} ${await response.text()}`)
  }

  const data = await response.json() as { sessionId: string }
  return data.sessionId
}

async function submitScoping(sessionId: string) {
  const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}/scope`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopingData })
  })

  if (!response.ok) {
    throw new Error(`Failed to save scoping data: ${response.status} ${await response.text()}`)
  }
}

function parseAnswerOptions(content: string): string[] {
  if (!content) return []
  const lines = content.split('\n')
  const optionsStart = lines.findIndex(line => /^(options|choices)\s*:?\s*$/i.test(line.trim()))
  if (optionsStart === -1) return []

  const options: string[] = []
  for (let i = optionsStart + 1; i < lines.length; i++) {
    const rawLine = lines[i]?.trim()
    if (!rawLine) {
      if (options.length > 0) break
      continue
    }
    if (/^[A-Z][\w\s-]+:\s*$/.test(rawLine) && !/^other/i.test(rawLine)) break

    const option = rawLine
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+[\.\)]\s+/, '')
      .replace(/^[A-Za-z][\.\)]\s+/, '')
      .trim()

    if (option) options.push(option)
    if (options.length >= 8) break
  }

  return options
}

function pickAnswer(message: string, turn: number) {
  if (/sample\s+.*computation|case-by-case|final net pay/i.test(message)) {
    return sampleComputationAnswer
  }

  const options = parseAnswerOptions(message)
  if (options.length > 0) {
    const choice = options.find(option => !/other/i.test(option)) || options[0]
    return choice
  }

  return fallbackAnswers[turn % fallbackAnswers.length]
}

async function sendChatMessage(sessionId: string, messages: ChatMessage[], userMessage: string) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      companyName: registration.companyName,
      industry: registration.industry,
      product: PRODUCT,
      messages,
      userMessage
    })
  })

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed: ${response.status} ${await response.text()}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let assistantMessage = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      const data = JSON.parse(line.slice(6)) as {
        type: 'text' | 'tool_call' | 'done' | 'error'
        content?: string
        message?: string
      }

      if (data.type === 'text') {
        assistantMessage += data.content || ''
      } else if (data.type === 'error') {
        throw new Error(data.message || 'Unknown chat error')
      }
    }
  }

  return assistantMessage.trim()
}

async function finalizeAssessment(sessionId: string, lastAssistantMessage: string) {
  const response = await fetch(`${BASE_URL}/api/assessment/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      lastAssistantMessage,
      companyName: registration.companyName,
      industry: registration.industry,
      product: PRODUCT
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to finalize assessment: ${response.status} ${await response.text()}`)
  }
}

async function run() {
  console.log(`Creating ${PRODUCT} assessment session against ${BASE_URL}`)
  const sessionId = await createSession()
  console.log(`Session created: ${sessionId}`)

  await submitScoping(sessionId)
  console.log('Scoping data submitted.')

  const messages: ChatMessage[] = []
  let lastAssistantMessage = ''

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const answer = pickAnswer(lastAssistantMessage, turn)
    console.log(`Turn ${turn + 1}: ${answer}`)

    messages.push({ role: 'user', content: answer })
    const assistantMessage = await sendChatMessage(sessionId, messages.slice(0, -1), answer)
    messages.push({ role: 'model', content: assistantMessage })
    lastAssistantMessage = assistantMessage

    if (parseAssessmentBlock(assistantMessage)) {
      console.log('Assessment block detected. Finalizing report…')
      await finalizeAssessment(sessionId, assistantMessage)
      console.log(`Report ready: ${BASE_URL}/report/${PRODUCT}/${sessionId}`)
      return
    }
  }

  throw new Error(`Assessment did not complete within ${MAX_TURNS} turns.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
