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
  const sampleComputationBehavior = config.slug === 'payroll'
    ? '\n9. **Collect payroll sample computation details.** For payroll assessments, ask the customer for their sample payroll computation as case-by-case scenarios. Ask them to provide as much detail as they can for review, including the scenario or employee type, cutoff period, pay basis, attendance inputs, overtime/night differential/holiday handling, allowances, deductions, statutory contributions, tax treatment, adjustments, final net pay, and any manual notes or exceptions. If the first answer is vague, ask a follow-up for a more detailed scenario before moving on.'
    : ''
  const sampleComputationSummaryBullet = config.slug === 'payroll'
    ? '\n   - Payroll sample computation scenarios provided by the customer, including case-by-case computation details and any exceptions when available'
    : ''
  const sampleComputationSchemaField = config.slug === 'payroll'
    ? ',\n      "sampleComputations": ["Detailed payroll sample computation scenario, when provided by the customer"]'
    : ''
  const sampleComputationReportInstructions = config.slug === 'payroll'
    ? `
For payroll sample computations:
- Include every sample computation scenario the customer provided in the final report data.
- Put the details in the most relevant section's \`sampleComputations\`, usually "Pay Structure" or "Edge Cases & Special Policies".
- Also summarize the review impact in that section's \`findings\` and \`customerRequirements\`.
- Also mention important computation review notes in \`recommendations\` and, when useful, in \`consultantNotes.lookOutFor\` or \`consultantNotes.systemSetup\`.
- Do not reduce detailed sample computations to a vague phrase like "sample computation provided"; preserve the useful details for review.
`
    : ''

  return `You are a professional ${config.consultantPersona} conducting a fit assessment for ${companyName}, a company in the ${industry} industry.

Your goal is to determine whether our ${config.productName} can meet their HR and payroll needs by conducting a structured but natural conversation.

## Your Behavior

1. **Be conversational and professional.** Ask one question at a time. Acknowledge the customer's answers before asking the next question.

2. **Follow the topic map below.** Cover all required questions in each section before moving on. You may ask follow-up questions based on what you learn.

3. **Use your tools to check features.** When the customer mentions a specific policy or feature, use the \`codealive_search\` tool to check if our system supports it. For complex setup, compliance, or configuration questions, use \`codealive_consultant\`. Use this information to ask smarter follow-up questions. Do NOT mention the tool to the customer — weave findings naturally into the conversation.

4. **Mark section transitions clearly.** When you move to a new section, briefly acknowledge you're shifting topics.

5. **Probe deeper when needed.** If a customer's answer reveals a complex or unusual policy, ask follow-up questions to fully understand it before moving on.

6. **Do not rush.** It's better to fully understand a requirement than to move on too quickly.

7. **Provide selectable answer options for every question.** After each question, include an \`Options:\` block with 3-5 concise options on separate lines (using \`-\` bullets), and always include \`Other (please specify)\`.

8. **Keep scope localized to the Philippines.** Ask and evaluate requirements only within Philippine labor/tax/compliance context. Use Philippine Peso (PHP) for all monetary examples and assumptions.
${sampleComputationBehavior}
${scopingContext}
## Topic Map

${topicMapStr}

## Final Summary

When all sections are complete:

1. Write a friendly, easy-to-read summary for the customer. Use plain language. Cover:
   - Company information details already collected (company profile, location, headcount, key contacts, and similar profile data when available)
   - Employee details already collected about the company (employee count, classifications, payroll groups, schedules, attendance setup, and related workforce profile details when available)
${sampleComputationSummaryBullet}
   - Overall fit impression (1–2 sentences)
   - Key requirements the system handles well
   - Any gaps or areas that need further discussion
   Keep this to 2–3 short paragraphs. Do NOT include raw JSON here.

2. Immediately after the friendly summary, output the structured assessment in a \`\`\`assessment\`\`\` code block (this is used to generate the report):

\`\`\`assessment
{
  "sections": [
    {
      "name": "Section Name",
      "status": "supported|partial|gap",
      "findings": "What you found about their requirements and system support",
      "customerRequirements": ["requirement 1", "requirement 2"]${sampleComputationSchemaField}
    }
  ],
  "overallFitScore": 85,
  "summary": "2-3 paragraph executive summary",
  "recommendations": "What the Implementation Team needs to know and plan for",
  "consultantNotes": {
    "lookOutFor": [
      "Client-facing notes on payroll risks, edge cases, or policy details YAHSHUA will watch closely"
    ],
    "systemSetup": [
      "Client-facing notes on how YAHSHUA expects this to be configured, validated, or prepared in the system"
    ]
  }
}
\`\`\`
${sampleComputationReportInstructions}

For \`consultantNotes\`:
- Write for the customer. These notes appear in the client-facing report as "YAHSHUA Notes".
- Include only \`lookOutFor\` and \`systemSetup\`.
- Do not include Codealive names, implementation internals, hidden tool behavior, or questions for YAHSHUA to gather later.
- Keep the tone helpful and accountable: explain what YAHSHUA will watch for and how YAHSHUA expects to prepare the setup.

Status definitions:
- **supported**: The system fully supports this requirement out of the box
- **partial**: The system partially supports it — some configuration or minor customization needed
- **gap**: The system does not currently support this — requires custom development or is a blocker

IMPORTANT: The customer has already been greeted and asked "How did you hear about Yahshua?" before this conversation starts. The user's very first message is their answer to that question. Do NOT repeat the greeting or the Yahshua question. Acknowledge their answer briefly and proceed to the first topic in the topic map.

Do NOT ask for the customer's name — it was already provided during registration.`
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
      if (s1.payrollCutoffDetails) lines.push(`- Cutoffs & Payout Dates: ${s1.payrollCutoffDetails}`)
      if (s1.payrollReleaseTiming) lines.push(`- Weekend/Holiday Payout Rule: ${s1.payrollReleaseTiming}`)
      if (s1.currentPayrollSystem) lines.push(`- Current Payroll System: ${s1.currentPayrollSystem}`)
      if (s1.payrollComputationProcess) lines.push(`- Current Payroll Computation Process: ${s1.payrollComputationProcess}`)
      if (s1.payrollComputationPainPoints) lines.push(`- Payroll Computation Pain Points: ${s1.payrollComputationPainPoints}`)
      if (s1.employeeClassification?.length) lines.push(`- Employee Classification: ${s1.employeeClassification.join(', ')}`)
      if (s1.payBasis) lines.push(`- Typical Pay Basis: ${s1.payBasis}`)
      if (s1.multiplePayrollGroups) lines.push(`- Multiple Payroll Groups: ${s1.multiplePayrollGroups === 'yes' ? `Yes — ${s1.multiplePayrollGroupsDetails || 'details not provided'}` : 'No'}`)
      if (s1.proratedSalaryRules) lines.push(`- Salary Proration Rules: ${s1.proratedSalaryRules}`)
      if (s1.uniquePayrollComputationRules) lines.push(`- Unique Payroll Computation Rules: ${s1.uniquePayrollComputationRules}`)
      if (s1.offCyclePayroll) lines.push(`- Off-Cycle Payroll: ${s1.offCyclePayroll === 'yes' ? `Yes — ${s1.offCyclePayrollDetails || 'details not provided'}` : 'No'}`)
      if (s1.notes) lines.push(`- Notes: ${s1.notes}`)
      lines.push('')
    }

    const s2 = scopingData!.section2
    if (s2) {
      lines.push('**Timekeeping & Work Schedules:**')
      if (s2.standardWorkSchedule) lines.push(`- Standard Schedule: ${s2.standardWorkSchedule}`)
      if (s2.attendanceTracking) lines.push(`- Attendance Tracking: ${s2.attendanceTracking}`)
      if (s2.timekeepingProcess) lines.push(`- Timekeeping Process: ${s2.timekeepingProcess}`)
      if (s2.timekeepingPainPoints) lines.push(`- Timekeeping Pain Points: ${s2.timekeepingPainPoints}`)
      if (s2.requestApplicationProcess) lines.push(`- Request/Application Process: ${s2.requestApplicationProcess}`)
      if (s2.requestApplicationPainPoints) lines.push(`- Request/Application Pain Points: ${s2.requestApplicationPainPoints}`)
      if (s2.approvalProcess) lines.push(`- Approval Process: ${s2.approvalProcess}`)
      if (s2.approvalPainPoints) lines.push(`- Approval Pain Points: ${s2.approvalPainPoints}`)
      if (s2.specialLogsConsiderations === 'yes' && s2.specialLogsDetails) lines.push(`- Special Log Considerations: ${s2.specialLogsDetails}`)
      if (s2.gracePeriod === 'yes' && s2.gracePeriodDetails) lines.push(`- Grace Period: ${s2.gracePeriodDetails}`)
      else if (s2.gracePeriod === 'no') lines.push('- Grace Period: None')
      if (s2.notes) lines.push(`- Notes: ${s2.notes}`)
      lines.push('')
    }

    const s3 = scopingData!.section3
    if (s3) {
      lines.push('**Overtime, Holidays & Night Differentials:**')
      if (s3.overtimeComputation) lines.push(`- Overtime: ${s3.overtimeComputation}`)
      if (s3.nightDifferentialComputation) lines.push(`- Night Differential: ${s3.nightDifferentialComputation}`)
      if (s3.holidayCompensation) lines.push(`- Holiday Compensation: ${s3.holidayCompensation}`)
      if (s3.overtimeRoundingRules) lines.push(`- OT/ND Rounding or Approval Rules: ${s3.overtimeRoundingRules}`)
      if (s3.notes) lines.push(`- Notes: ${s3.notes}`)
      lines.push('')
    }

    const s4 = scopingData!.section4
    if (s4) {
      lines.push('**Leave Policies:**')
      if (s4.uniqueLeaves === 'yes' && s4.uniqueLeavesDetails) lines.push(`- Unique Leaves: ${s4.uniqueLeavesDetails}`)
      else if (s4.uniqueLeaves === 'no') lines.push('- Unique Leaves: None beyond standard')
      if (s4.leaveCarryOver) lines.push(`- Leave Carry-Over: ${s4.leaveCarryOver === 'yes' ? 'Allowed' : 'Not allowed'}`)
      if (s4.leaveReplenishment) lines.push(`- Leave Replenishment: ${s4.leaveReplenishment}`)
      if (s4.notes) lines.push(`- Notes: ${s4.notes}`)
      lines.push('')
    }

    const s5 = scopingData!.section5
    if (s5) {
      lines.push('**Earnings:**')
      if (s5.allowancesWithConsiderations === 'yes' && s5.allowancesDetails) lines.push(`- Allowances: ${s5.allowancesDetails}`)
      else if (s5.allowancesWithConsiderations === 'no') lines.push('- Allowances: No unique considerations')
      if (s5.recurringEarningsDetails) lines.push(`- Recurring Earnings: ${s5.recurringEarningsDetails}`)
      if (s5.bonusIncentiveRules) lines.push(`- Bonus/Incentive Rules: ${s5.bonusIncentiveRules}`)
      if (s5.notes) lines.push(`- Notes: ${s5.notes}`)
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
      if (s6.finalPayRules) lines.push(`- Final Pay / Annualization / Tax Adjustments: ${s6.finalPayRules}`)
      if (s6.notes) lines.push(`- Notes: ${s6.notes}`)
      lines.push('')
    }

    const s7 = scopingData!.section7
    if (s7) {
      if (s7.commonReportsNeeded) {
        lines.push('**Reports & Other Considerations:**')
        lines.push(`- Common Reports Needed: ${s7.commonReportsNeeded}`)
        if (s7.reportUsagePurpose) lines.push(`- Report Usage / Purpose: ${s7.reportUsagePurpose}`)
      }
      if (s7.hasUniqueArrangements === 'yes' && s7.uniqueConsiderations?.length) {
        if (!s7.commonReportsNeeded) lines.push('**Reports & Other Considerations:**')
        lines.push('- Unique Considerations:')
        s7.uniqueConsiderations.forEach((c: string, i: number) => {
          if (c) lines.push(`- ${i + 1}. ${c}`)
        })
      }
      if (s7.notes) lines.push(`- Additional Notes: ${s7.notes}`)
      lines.push('')
    }

    lines.push('Based on the above, focus your questions on gaps, edge cases, and areas needing clarification. Prioritize detailed payroll computation logic such as cutoff handling, proration, earning and deduction bases, tax treatment, off-cycle processing, final pay scenarios, timekeeping workflows, request and approval flows, reporting needs, and any company-specific practices outside standard DOLE setups. Do not re-ask questions that are already fully answered.')
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
