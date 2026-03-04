import type { AssessmentConfig, AssessmentSection } from './assessments/types'

export function buildSystemPrompt(
  config: AssessmentConfig,
  companyName: string,
  industry: string,
  scopingData?: Record<string, any>,
  registrationData?: {
    numberOfEmployees?: number
    address?: string
    authorizedSignatory?: string
    contactPerson?: string
    contactPhone?: string
  }
): string {
  const topicMapStr = config.sections
    .map(section => formatSection(section))
    .join('\n\n')

  const scopingContext = buildScopingContext(scopingData, registrationData)

  return `You are a professional ${config.consultantPersona} conducting a fit assessment for ${companyName}, a company in the ${industry} industry.

Your goal is to determine whether our ${config.productName} can meet their HR and payroll needs by conducting a structured but natural conversation.

## Your Behavior

1. **Be conversational and professional.** Ask one question at a time. Acknowledge the customer's answers before asking the next question.

2. **Follow the topic map below.** Cover all required questions in each section before moving on. You may ask follow-up questions based on what you learn.

3. **Use your tools to check features.** When the customer mentions a specific policy or feature, use the \`codealive_search\` tool to check if our system supports it. Use this information to ask smarter follow-up questions. Do NOT mention the tool to the customer — weave findings naturally into the conversation.

4. **Mark section transitions clearly.** When you move to a new section, briefly acknowledge you're shifting topics.

5. **Probe deeper when needed.** If a customer's answer reveals a complex or unusual policy, ask follow-up questions to fully understand it before moving on.

6. **Do not rush.** It's better to fully understand a requirement than to move on too quickly.

7. **Provide selectable answer options for every question.** After each question, include an \`Options:\` block with 3-5 concise options on separate lines (using \`-\` bullets), and always include \`Other (please specify)\`.

8. **Keep scope localized to the Philippines.** Ask and evaluate requirements only within Philippine labor/tax/compliance context. Use Philippine Peso (PHP) for all monetary examples and assumptions.
${scopingContext}
## Topic Map

${topicMapStr}

## Final Summary

When all sections are complete, generate a structured assessment in the following JSON format (wrapped in \`\`\`assessment\`\`\` code block):

\`\`\`assessment
{
  "sections": [
    {
      "name": "Section Name",
      "status": "supported|partial|gap",
      "findings": "What you found about their requirements and system support",
      "customerRequirements": ["requirement 1", "requirement 2"]
    }
  ],
  "overallFitScore": 85,
  "summary": "2-3 paragraph executive summary",
  "recommendations": "What the Implementation Team needs to know and plan for"
}
\`\`\`

Status definitions:
- **supported**: The system fully supports this requirement out of the box
- **partial**: The system partially supports it — some configuration or minor customization needed
- **gap**: The system does not currently support this — requires custom development or is a blocker

Start the conversation by warmly introducing yourself and asking for the customer's first name.

After the customer provides their first name, your very next question must be exactly:
"How did you know about Yahshua"

For that question, provide this exact Options block:
- GLOBE
- RCBC
- STERLING BANK OF ASIA
- OTHERS (Type Answer)`
}

function buildScopingContext(
  scopingData?: Record<string, any>,
  registrationData?: {
    numberOfEmployees?: number
    address?: string
    authorizedSignatory?: string
    contactPerson?: string
    contactPhone?: string
  }
): string {
  const hasScoping = scopingData && Object.keys(scopingData).length > 0
  const hasRegistration = registrationData && Object.values(registrationData).some(v => v !== undefined)

  if (!hasScoping && !hasRegistration) return ''

  const lines: string[] = [
    '',
    '## Pre-Collected Scoping Information',
    '',
    'The following information was already collected before this conversation. DO NOT ask about topics already covered here. Instead, use this information to ask targeted follow-up questions that dig deeper.',
    ''
  ]

  if (hasRegistration) {
    lines.push('**Company Profile:**')
    if (registrationData!.numberOfEmployees) lines.push(`- Employees: ${registrationData!.numberOfEmployees}`)
    if (registrationData!.address) lines.push(`- Location: ${registrationData!.address}`)
    if (registrationData!.authorizedSignatory) lines.push(`- Authorized Signatory: ${registrationData!.authorizedSignatory}`)
    if (registrationData!.contactPerson) lines.push(`- Payroll Contact: ${registrationData!.contactPerson}${registrationData!.contactPhone ? ` (${registrationData!.contactPhone})` : ''}`)
    lines.push('')
  }

  if (hasScoping) {
    const s1 = scopingData!.section1
    if (s1) {
      lines.push('**Payroll Structure:**')
      if (s1.payrollSchedule) lines.push(`- Schedule: ${s1.payrollSchedule}`)
      if (s1.employeeClassification?.length) lines.push(`- Employee Classification: ${s1.employeeClassification.join(', ')}`)
      if (s1.multiplePayrollGroups) lines.push(`- Multiple Payroll Groups: ${s1.multiplePayrollGroups === 'yes' ? `Yes — ${s1.multiplePayrollGroupsDetails || 'details not provided'}` : 'No'}`)
      lines.push('')
    }

    const s2 = scopingData!.section2
    if (s2) {
      lines.push('**Timekeeping & Work Schedules:**')
      if (s2.standardWorkSchedule) lines.push(`- Standard Schedule: ${s2.standardWorkSchedule}`)
      if (s2.attendanceTracking) lines.push(`- Attendance Tracking: ${s2.attendanceTracking}`)
      if (s2.specialLogsConsiderations === 'yes' && s2.specialLogsDetails) lines.push(`- Special Log Considerations: ${s2.specialLogsDetails}`)
      if (s2.gracePeriod === 'yes' && s2.gracePeriodDetails) lines.push(`- Grace Period: ${s2.gracePeriodDetails}`)
      else if (s2.gracePeriod === 'no') lines.push('- Grace Period: None')
      lines.push('')
    }

    const s3 = scopingData!.section3
    if (s3) {
      lines.push('**Overtime, Holidays & Night Differentials:**')
      if (s3.overtimeComputation) lines.push(`- Overtime: ${s3.overtimeComputation}`)
      if (s3.nightDifferentialComputation) lines.push(`- Night Differential: ${s3.nightDifferentialComputation}`)
      if (s3.holidayCompensation) lines.push(`- Holiday Compensation: ${s3.holidayCompensation}`)
      lines.push('')
    }

    const s4 = scopingData!.section4
    if (s4) {
      lines.push('**Leave Policies:**')
      if (s4.uniqueLeaves === 'yes' && s4.uniqueLeavesDetails) lines.push(`- Unique Leaves: ${s4.uniqueLeavesDetails}`)
      else if (s4.uniqueLeaves === 'no') lines.push('- Unique Leaves: None beyond standard')
      if (s4.leaveCarryOver) lines.push(`- Leave Carry-Over: ${s4.leaveCarryOver === 'yes' ? 'Allowed' : 'Not allowed'}`)
      if (s4.leaveReplenishment) lines.push(`- Leave Replenishment: ${s4.leaveReplenishment}`)
      lines.push('')
    }

    const s5 = scopingData!.section5
    if (s5) {
      lines.push('**Earnings:**')
      if (s5.allowancesWithConsiderations === 'yes' && s5.allowancesDetails) lines.push(`- Allowances: ${s5.allowancesDetails}`)
      else if (s5.allowancesWithConsiderations === 'no') lines.push('- Allowances: No unique considerations')
      lines.push('')
    }

    const s6 = scopingData!.section6
    if (s6) {
      lines.push('**Deductions & Compliance:**')
      if (s6.sssComputation) lines.push(`- SSS: ${s6.sssComputation}${s6.sssComputationOther ? ` — ${s6.sssComputationOther}` : ''}`)
      if (s6.phicComputation) lines.push(`- PHIC: ${s6.phicComputation}${s6.phicComputationOther ? ` — ${s6.phicComputationOther}` : ''}`)
      if (s6.hdmfComputation) lines.push(`- HDMF: ${s6.hdmfComputation}${s6.hdmfComputationOther ? ` — ${s6.hdmfComputationOther}` : ''}`)
      if (s6.taxComputation) lines.push(`- Tax: ${s6.taxComputation}${s6.taxComputationOther ? ` — ${s6.taxComputationOther}` : ''}`)
      if (s6.additionalDeductions === 'yes' && s6.additionalDeductionsDetails) lines.push(`- Additional Deductions: ${s6.additionalDeductionsDetails}`)
      if (s6.allowancesExcludedFromTax === 'yes' && s6.allowancesExcludedFromTaxDetails) lines.push(`- Tax-Exempt Allowances: ${s6.allowancesExcludedFromTaxDetails}`)
      lines.push('')
    }

    const s7 = scopingData!.section7
    if (s7?.hasUniqueArrangements === 'yes' && s7.uniqueConsiderations?.length) {
      lines.push('**Unique Considerations:**')
      s7.uniqueConsiderations.forEach((c: string, i: number) => {
        if (c) lines.push(`- ${i + 1}. ${c}`)
      })
      lines.push('')
    }

    lines.push('Based on the above, focus your questions on gaps, edge cases, and areas needing clarification. Do not re-ask questions that are already fully answered.')
    lines.push('')
  }

  return lines.join('\n')
}

function formatSection(section: AssessmentSection): string {
  return `### ${section.name}
Required questions (cover all of these):
${section.requiredQuestions.map(q => `- ${q}`).join('\n')}
Codealive search hints: ${section.codealiveSearchHints.join(', ')}`
}
