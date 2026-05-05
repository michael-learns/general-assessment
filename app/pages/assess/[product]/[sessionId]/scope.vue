<script setup lang="ts">
const route = useRoute()
const productSlug = route.params.product as string
const sessionId = route.params.sessionId as string
const companyName = useState<string>('companyName', () => '')
const industry = useState<string>('industry', () => '')
const { loadSession, saveSession } = useAssessmentSession(productSlug)

// Section navigation
const currentSection = ref(1)
const totalSections = 7
const saving = ref(false)
const saveError = ref('')

// Form state
const form = reactive({
  // Section 1: Payroll Structure
  payrollSchedule: '',
  payrollCutoffDetails: '',
  payrollReleaseTiming: '',
  currentPayrollSystem: '',
  payrollComputationProcess: '',
  payrollComputationPainPoints: '',
  employeeClassification: [] as string[],
  payBasis: '',
  multiplePayrollGroups: '',
  multiplePayrollGroupsDetails: '',
  proratedSalaryRules: '',
  uniquePayrollComputationRules: '',
  offCyclePayroll: '',
  offCyclePayrollDetails: '',
  section1Notes: '',

  // Section 2: Timekeeping & Work Schedules
  standardWorkSchedule: '',
  attendanceTracking: '',
  timekeepingProcess: '',
  timekeepingPainPoints: '',
  requestApplicationProcess: '',
  requestApplicationPainPoints: '',
  approvalProcess: '',
  approvalPainPoints: '',
  specialLogsConsiderations: '',
  specialLogsDetails: '',
  gracePeriod: '',
  gracePeriodDetails: '',
  section2Notes: '',

  // Section 3: Overtime, Holidays & Night Differentials
  overtimeComputation: '',
  nightDifferentialComputation: '',
  holidayCompensation: '',
  overtimeRoundingRules: '',
  section3Notes: '',

  // Section 4: Leave Policies
  uniqueLeaves: '',
  uniqueLeavesDetails: '',
  leaveCarryOver: '',
  leaveReplenishment: '',
  section4Notes: '',

  // Section 5: Earnings
  allowancesWithConsiderations: '',
  allowancesDetails: '',
  recurringEarningsDetails: '',
  bonusIncentiveRules: '',
  section5Notes: '',

  // Section 6: Deductions & Compliance
  sssComputation: '',
  sssComputationOther: '',
  phicComputation: '',
  phicComputationOther: '',
  hdmfComputation: '',
  hdmfComputationOther: '',
  taxComputation: '',
  taxComputationOther: '',
  additionalDeductions: '',
  additionalDeductionsDetails: '',
  allowancesExcludedFromTax: '',
  allowancesExcludedFromTaxDetails: '',
  finalPayRules: '',
  section6Notes: '',

  // Section 7: Unique Considerations
  commonReportsNeeded: '',
  reportUsagePurpose: '',
  hasUniqueArrangements: '',
  uniqueConsiderations: ['', '', '', '', ''] as string[],
  overallComments: ''
})

const sectionTitles = [
  'Payroll Structure',
  'Timekeeping & Work Schedules',
  'Overtime, Holidays & Night Differentials',
  'Leave Policies',
  'Earnings',
  'Deductions & Compliance',
  'Unique Considerations'
]

const sectionKickers = [
  'Schedules, classification & computation',
  'Attendance, work hours & approvals',
  'OT, night differentials & holiday pay',
  'Leave types, carry-over & replenishment',
  'Allowances, bonuses & recurring pay',
  'SSS, PHIC, HDMF, tax & other deductions',
  'Reports, edge cases & unique arrangements'
]

const payrollScheduleOptions = [
  { label: 'Semi-monthly', value: 'Semi-monthly' },
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Bi-weekly', value: 'Bi-weekly' },
  { label: 'Mixed', value: 'Mixed' }
]

const employeeClassificationOptions = [
  { label: 'Regular', value: 'Regular' },
  { label: 'Probationary', value: 'Probationary' },
  { label: 'Contractual', value: 'Contractual' },
  { label: 'Project-based', value: 'Project-based' },
  { label: 'Mixed', value: 'Mixed' }
]

const attendanceTrackingOptions = [
  { label: 'Biometric', value: 'Biometric' },
  { label: 'Online / Software', value: 'Online/Software' },
  { label: 'Manual / Logbook', value: 'Manual/Logbook' },
  { label: 'Mixed', value: 'Mixed' }
]

const governmentContributionOptions = [
  { label: 'Based on monthly salary', value: 'Based on monthly salary' },
  { label: 'Based on gross pay', value: 'Based on gross pay' },
  { label: 'Other (please specify)', value: 'Other' }
]

const taxComputationOptions = [
  { label: 'Gross pay', value: 'Gross pay' },
  { label: 'Net pay', value: 'Net pay' },
  { label: 'Other (please specify)', value: 'Other' }
]

function toggleClassification(val: string) {
  const idx = form.employeeClassification.indexOf(val)
  if (idx >= 0) form.employeeClassification.splice(idx, 1)
  else form.employeeClassification.push(val)
}

function goNext() {
  if (currentSection.value < totalSections) {
    currentSection.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function goBack() {
  if (currentSection.value > 1) {
    currentSection.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

async function completeScoping() {
  saving.value = true
  saveError.value = ''

  const scopingData = {
    section1: {
      payrollSchedule: form.payrollSchedule,
      payrollCutoffDetails: form.payrollCutoffDetails || undefined,
      payrollReleaseTiming: form.payrollReleaseTiming || undefined,
      currentPayrollSystem: form.currentPayrollSystem || undefined,
      payrollComputationProcess: form.payrollComputationProcess || undefined,
      payrollComputationPainPoints: form.payrollComputationPainPoints || undefined,
      employeeClassification: form.employeeClassification,
      payBasis: form.payBasis || undefined,
      multiplePayrollGroups: form.multiplePayrollGroups,
      multiplePayrollGroupsDetails: form.multiplePayrollGroupsDetails || undefined,
      proratedSalaryRules: form.proratedSalaryRules || undefined,
      uniquePayrollComputationRules: form.uniquePayrollComputationRules || undefined,
      offCyclePayroll: form.offCyclePayroll,
      offCyclePayrollDetails: form.offCyclePayrollDetails || undefined,
      notes: form.section1Notes || undefined
    },
    section2: {
      standardWorkSchedule: form.standardWorkSchedule,
      attendanceTracking: form.attendanceTracking,
      timekeepingProcess: form.timekeepingProcess || undefined,
      timekeepingPainPoints: form.timekeepingPainPoints || undefined,
      requestApplicationProcess: form.requestApplicationProcess || undefined,
      requestApplicationPainPoints: form.requestApplicationPainPoints || undefined,
      approvalProcess: form.approvalProcess || undefined,
      approvalPainPoints: form.approvalPainPoints || undefined,
      specialLogsConsiderations: form.specialLogsConsiderations,
      specialLogsDetails: form.specialLogsDetails || undefined,
      gracePeriod: form.gracePeriod,
      gracePeriodDetails: form.gracePeriodDetails || undefined,
      notes: form.section2Notes || undefined
    },
    section3: {
      overtimeComputation: form.overtimeComputation,
      nightDifferentialComputation: form.nightDifferentialComputation,
      holidayCompensation: form.holidayCompensation,
      overtimeRoundingRules: form.overtimeRoundingRules || undefined,
      notes: form.section3Notes || undefined
    },
    section4: {
      uniqueLeaves: form.uniqueLeaves,
      uniqueLeavesDetails: form.uniqueLeavesDetails || undefined,
      leaveCarryOver: form.leaveCarryOver,
      leaveReplenishment: form.leaveReplenishment,
      notes: form.section4Notes || undefined
    },
    section5: {
      allowancesWithConsiderations: form.allowancesWithConsiderations,
      allowancesDetails: form.allowancesDetails || undefined,
      recurringEarningsDetails: form.recurringEarningsDetails || undefined,
      bonusIncentiveRules: form.bonusIncentiveRules || undefined,
      notes: form.section5Notes || undefined
    },
    section6: {
      sssComputation: form.sssComputation,
      sssComputationOther: form.sssComputationOther || undefined,
      phicComputation: form.phicComputation,
      phicComputationOther: form.phicComputationOther || undefined,
      hdmfComputation: form.hdmfComputation,
      hdmfComputationOther: form.hdmfComputationOther || undefined,
      taxComputation: form.taxComputation,
      taxComputationOther: form.taxComputationOther || undefined,
      additionalDeductions: form.additionalDeductions,
      additionalDeductionsDetails: form.additionalDeductionsDetails || undefined,
      allowancesExcludedFromTax: form.allowancesExcludedFromTax,
      allowancesExcludedFromTaxDetails: form.allowancesExcludedFromTaxDetails || undefined,
      finalPayRules: form.finalPayRules || undefined,
      notes: form.section6Notes || undefined
    },
    section7: {
      commonReportsNeeded: form.commonReportsNeeded || undefined,
      reportUsagePurpose: form.reportUsagePurpose || undefined,
      hasUniqueArrangements: form.hasUniqueArrangements,
      uniqueConsiderations: form.hasUniqueArrangements === 'yes'
        ? form.uniqueConsiderations.filter(c => c.trim())
        : [],
      notes: form.overallComments || undefined
    }
  }

  try {
    await $fetch(`/api/sessions/${sessionId}/scope`, {
      method: 'POST',
      body: { scopingData }
    })
    const persistedSession = loadSession()
    saveSession({
      sessionId,
      companyName: companyName.value || persistedSession?.companyName || '',
      industry: industry.value || persistedSession?.industry || '',
      product: productSlug,
      stage: 'chat'
    })
    await navigateTo(`/assess/${productSlug}/${sessionId}`)
  } catch {
    saveError.value = 'Failed to save scoping data. Please try again.'
    saving.value = false
  }
}

const progressPercent = computed(() => Math.round((currentSection.value / totalSections) * 100))

onMounted(() => {
  const persistedSession = loadSession()
  if (!persistedSession || persistedSession.sessionId !== sessionId) return

  if (!companyName.value) companyName.value = persistedSession.companyName
  if (!industry.value) industry.value = persistedSession.industry
})
</script>

<template>
  <div class="ap-page">
    <div class="ap-ambient" aria-hidden="true" />

    <main class="ap-main">
      <!-- Hero -->
      <div class="ap-hero ap-fade-up">
        <div class="ap-eyebrow">Section {{ currentSection }} of {{ totalSections }} · Payroll Scoping</div>
        <h1 class="ap-h1">{{ sectionTitles[currentSection - 1] }}</h1>
        <p class="ap-sub">{{ sectionKickers[currentSection - 1] }}</p>

        <!-- Step dots -->
        <div class="ap-step-row">
          <template v-for="(_, i) in sectionTitles" :key="i">
            <div
              :class="['ap-step-dot', {
                'ap-step-dot--active': i + 1 === currentSection,
                'ap-step-dot--done': i + 1 < currentSection
              }]"
            >
              <svg v-if="i + 1 < currentSection" viewBox="0 0 16 16" width="10" height="10" fill="none">
                <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span v-if="i < sectionTitles.length - 1" class="ap-step-divider" aria-hidden="true">—</span>
          </template>
        </div>
      </div>

      <!-- ─── Section 1: Payroll Structure ─── -->
      <section v-if="currentSection === 1" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Payroll Structure</h2>
          <span class="ap-card-kicker">Schedules, classification &amp; computation</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field">
            <label class="ap-label">What is your payroll schedule? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.payrollSchedule" class="ap-select">
                <option value="" disabled>Select payroll schedule</option>
                <option v-for="opt in payrollScheduleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are your payroll cutoffs and actual payout dates?</label>
            <textarea v-model="form.payrollCutoffDetails" class="ap-textarea" rows="3" placeholder="e.g. 1st cutoff is the 1st–15th and paid on the 20th; 2nd cutoff is the 16th–end of month and paid on the 5th..." />
          </div>

          <div class="ap-field">
            <label class="ap-label">When a payout date falls on a weekend or holiday, what do you do?</label>
            <input v-model="form.payrollReleaseTiming" type="text" class="ap-input" placeholder="e.g. release on the preceding business day" />
          </div>

          <div class="ap-field">
            <label class="ap-label">What system are you currently using for payroll processing?</label>
            <input v-model="form.currentPayrollSystem" type="text" class="ap-input" placeholder="e.g. manual in Excel, in-house system, third-party software" />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How does your current payroll computation process work from cutoff to release?</label>
            <textarea v-model="form.payrollComputationProcess" class="ap-textarea" rows="4" placeholder="e.g. HR exports attendance, payroll computes basic pay and deductions in Excel, finance reviews, then bank file is uploaded..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are the main pain points in your current payroll computation process?</label>
            <textarea v-model="form.payrollComputationPainPoints" class="ap-textarea" rows="3" placeholder="e.g. manual checking takes too long, late adjustments are hard to track, final pay is computed separately..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How are your employees classified? <span class="ap-req">*</span></label>
            <div class="ap-check-group">
              <button
                v-for="opt in employeeClassificationOptions"
                :key="opt.value"
                type="button"
                :class="['ap-check-pill', { 'ap-check-pill--on': form.employeeClassification.includes(opt.value) }]"
                @click="toggleClassification(opt.value)"
              >
                <svg v-if="form.employeeClassification.includes(opt.value)" viewBox="0 0 16 16" width="12" height="12" fill="none">
                  <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How is employee pay typically structured?</label>
            <input v-model="form.payBasis" type="text" class="ap-input" placeholder="e.g. monthly fixed, daily rate, hourly, mixed" />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have multiple payroll groups with different pay structures? <span class="ap-req">*</span></label>
            <div class="ap-radio-group">
              <label class="ap-radio-label">
                <input v-model="form.multiplePayrollGroups" type="radio" value="yes" class="ap-radio" /> Yes
              </label>
              <label class="ap-radio-label">
                <input v-model="form.multiplePayrollGroups" type="radio" value="no" class="ap-radio" /> No
              </label>
            </div>
            <div v-if="form.multiplePayrollGroups === 'yes'" class="ap-conditional">
              <label class="ap-label">Please describe the different payroll groups</label>
              <textarea v-model="form.multiplePayrollGroupsDetails" class="ap-textarea" rows="3" placeholder="e.g. Head office on monthly, branches on semi-monthly..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How do you prorate salary for new hires, resignations, absences, or incomplete cutoffs?</label>
            <textarea v-model="form.proratedSalaryRules" class="ap-textarea" rows="3" placeholder="e.g. Monthly salary / 26 days, then deduct unpaid days; final cutoff uses actual days worked..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have payroll computation rules that are unique or not standard to DOLE?</label>
            <textarea v-model="form.uniquePayrollComputationRules" class="ap-textarea" rows="4" placeholder="Describe any company-specific payroll computation setup, exceptions, or practices the consultant should understand..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you run off-cycle payroll? <span class="ap-req">*</span></label>
            <div class="ap-radio-group">
              <label class="ap-radio-label">
                <input v-model="form.offCyclePayroll" type="radio" value="yes" class="ap-radio" /> Yes
              </label>
              <label class="ap-radio-label">
                <input v-model="form.offCyclePayroll" type="radio" value="no" class="ap-radio" /> No
              </label>
            </div>
            <div v-if="form.offCyclePayroll === 'yes'" class="ap-conditional">
              <label class="ap-label">When and why do you run off-cycle payroll?</label>
              <textarea v-model="form.offCyclePayrollDetails" class="ap-textarea" rows="3" placeholder="e.g. final pay, commissions, payroll adjustments, special payouts..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section1Notes" class="ap-textarea" rows="3" placeholder="Add anything the consultant should know about your payroll structure..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 2: Timekeeping & Work Schedules ─── -->
      <section v-else-if="currentSection === 2" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Timekeeping &amp; Work Schedules</h2>
          <span class="ap-card-kicker">Attendance, work hours &amp; approvals</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field">
            <label class="ap-label">What is your standard work schedule? <span class="ap-req">*</span></label>
            <input v-model="form.standardWorkSchedule" type="text" class="ap-input" placeholder="e.g. Mon–Fri 8am–5pm" />
          </div>

          <div class="ap-field">
            <label class="ap-label">How do you track employee attendance? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.attendanceTracking" class="ap-select">
                <option value="" disabled>Select tracking method</option>
                <option v-for="opt in attendanceTrackingOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Describe your timekeeping process — what tool you use and how the process works</label>
            <textarea v-model="form.timekeepingProcess" class="ap-textarea" rows="4" placeholder="e.g. employees clock in via biometric, HR exports logs weekly, supervisors validate exceptions before payroll..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are your main pain points with timekeeping?</label>
            <textarea v-model="form.timekeepingPainPoints" class="ap-textarea" rows="3" placeholder="e.g. missing logs, manual corrections, delayed biometric exports, unclear late/undertime validation..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How do employees submit requests (leave, OT, undertime, schedule changes)?</label>
            <textarea v-model="form.requestApplicationProcess" class="ap-textarea" rows="4" placeholder="e.g. through email, paper form, HRIS, Viber, manager chat, Google Form..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are the pain points in request or application filing?</label>
            <textarea v-model="form.requestApplicationPainPoints" class="ap-textarea" rows="3" placeholder="e.g. employees forget forms, requests are scattered across channels, HR manually follows up missing details..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How does the approval process work for those requests?</label>
            <textarea v-model="form.approvalProcess" class="ap-textarea" rows="4" placeholder="e.g. team lead approves first, then HR validates, then payroll encodes approved items..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are the pain points in approvals?</label>
            <textarea v-model="form.approvalPainPoints" class="ap-textarea" rows="3" placeholder="e.g. delayed manager approvals, unclear approver ownership, approved requests missing before cutoff..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have special considerations for employee logs?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.specialLogsConsiderations" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.specialLogsConsiderations" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.specialLogsConsiderations === 'yes'" class="ap-conditional">
              <label class="ap-label">Please describe the special considerations</label>
              <textarea v-model="form.specialLogsDetails" class="ap-textarea" rows="3" placeholder="e.g. Supervisors log manually, night shift overlaps..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you allow grace periods for tardiness?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.gracePeriod" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.gracePeriod" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.gracePeriod === 'yes'" class="ap-conditional">
              <label class="ap-label">Please describe the grace period policy</label>
              <textarea v-model="form.gracePeriodDetails" class="ap-textarea" rows="3" placeholder="e.g. 15 minutes grace period, deducted from VL after 5 instances..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section2Notes" class="ap-textarea" rows="3" placeholder="Add schedule, attendance, or timekeeping notes..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 3: Overtime, Holidays & Night Differentials ─── -->
      <section v-else-if="currentSection === 3" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Overtime, Holidays &amp; Night Differentials</h2>
          <span class="ap-card-kicker">OT, night differentials &amp; holiday pay</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field ap-field--full">
            <label class="ap-label">How do you compute overtime pay? <span class="ap-req">*</span></label>
            <textarea v-model="form.overtimeComputation" class="ap-textarea" rows="3" placeholder="e.g. Hourly rate × 1.25 for regular OT, × 1.30 for night OT..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How do you compute night differential pay? <span class="ap-req">*</span></label>
            <textarea v-model="form.nightDifferentialComputation" class="ap-textarea" rows="3" placeholder="e.g. 10% of hourly rate for hours between 10pm–6am..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How do you compensate for holidays? <span class="ap-req">*</span></label>
            <textarea v-model="form.holidayCompensation" class="ap-textarea" rows="4" placeholder="e.g. Regular holiday: 200% if worked, 100% if unworked. Special non-working: 130% if worked, no pay if unworked..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you apply any OT/ND rounding, minimum increments, or approval rules?</label>
            <textarea v-model="form.overtimeRoundingRules" class="ap-textarea" rows="3" placeholder="e.g. rounded to nearest 30 minutes, minimum 1 hour OT after approval..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section3Notes" class="ap-textarea" rows="3" placeholder="Add any special holiday, rest day, OT, or ND notes..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 4: Leave Policies ─── -->
      <section v-else-if="currentSection === 4" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Leave Policies</h2>
          <span class="ap-card-kicker">Leave types, carry-over &amp; replenishment</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have company-unique leaves beyond standard (VL, SIL, Paternity, Bereavement)?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.uniqueLeaves" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.uniqueLeaves" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.uniqueLeaves === 'yes'" class="ap-conditional">
              <label class="ap-label">Please describe your company-specific leave types and their computation</label>
              <textarea v-model="form.uniqueLeavesDetails" class="ap-textarea" rows="3" placeholder="e.g. Birthday leave (1 day), Solo parent leave (7 days)..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you allow leave carry-over to the next year?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.leaveCarryOver" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.leaveCarryOver" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
          </div>

          <div class="ap-field">
            <label class="ap-label">When do you replenish employee leaves?</label>
            <input v-model="form.leaveReplenishment" type="text" class="ap-input" placeholder="e.g. January 1, Anniversary date" />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section4Notes" class="ap-textarea" rows="3" placeholder="Add leave accrual, conversion, or approval notes..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 5: Earnings ─── -->
      <section v-else-if="currentSection === 5" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Earnings</h2>
          <span class="ap-card-kicker">Allowances, bonuses &amp; recurring pay</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have allowances with unique considerations?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.allowancesWithConsiderations" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.allowancesWithConsiderations" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.allowancesWithConsiderations === 'yes'" class="ap-conditional">
              <label class="ap-label">List allowances and describe their computation details</label>
              <textarea v-model="form.allowancesDetails" class="ap-textarea" rows="4" placeholder="e.g. Transportation allowance: PHP 2,500/month, prorated on absences. Rice subsidy: PHP 2,000/month, not prorated..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">List recurring earnings included in payroll and how each is computed</label>
            <textarea v-model="form.recurringEarningsDetails" class="ap-textarea" rows="4" placeholder="e.g. Basic pay, COLA, meal allowance, transport allowance, fixed monthly stipend..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">How do you handle bonuses, incentives, commissions, or 13th-month-related payouts?</label>
            <textarea v-model="form.bonusIncentiveRules" class="ap-textarea" rows="4" placeholder="e.g. commissions paid one cutoff in arrears, bonuses taxed separately, 13th month prorated for resignations..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section5Notes" class="ap-textarea" rows="3" placeholder="Add earning, allowance, or bonus notes..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 6: Deductions & Compliance ─── -->
      <section v-else-if="currentSection === 6" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Deductions &amp; Compliance</h2>
          <span class="ap-card-kicker">SSS, PHIC, HDMF, tax &amp; other deductions</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field">
            <label class="ap-label">How do you compute SSS? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.sssComputation" class="ap-select">
                <option value="" disabled>Select computation basis</option>
                <option v-for="opt in governmentContributionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div v-if="form.sssComputation === 'Other'" class="ap-conditional" style="margin-top: 10px;">
              <textarea v-model="form.sssComputationOther" class="ap-textarea" rows="2" placeholder="Please describe..." />
            </div>
          </div>

          <div class="ap-field">
            <label class="ap-label">How do you compute PHIC? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.phicComputation" class="ap-select">
                <option value="" disabled>Select computation basis</option>
                <option v-for="opt in governmentContributionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div v-if="form.phicComputation === 'Other'" class="ap-conditional" style="margin-top: 10px;">
              <textarea v-model="form.phicComputationOther" class="ap-textarea" rows="2" placeholder="Please describe..." />
            </div>
          </div>

          <div class="ap-field">
            <label class="ap-label">How do you compute HDMF? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.hdmfComputation" class="ap-select">
                <option value="" disabled>Select computation basis</option>
                <option v-for="opt in governmentContributionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div v-if="form.hdmfComputation === 'Other'" class="ap-conditional" style="margin-top: 10px;">
              <textarea v-model="form.hdmfComputationOther" class="ap-textarea" rows="2" placeholder="Please describe..." />
            </div>
          </div>

          <div class="ap-field">
            <label class="ap-label">How do you compute your tax? <span class="ap-req">*</span></label>
            <div class="ap-select-wrap">
              <select v-model="form.taxComputation" class="ap-select">
                <option value="" disabled>Select tax computation method</option>
                <option v-for="opt in taxComputationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </div>
            <div v-if="form.taxComputation === 'Other'" class="ap-conditional" style="margin-top: 10px;">
              <textarea v-model="form.taxComputationOther" class="ap-textarea" rows="2" placeholder="Please describe..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have additional salary deductions (loans, company benefits)?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.additionalDeductions" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.additionalDeductions" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.additionalDeductions === 'yes'" class="ap-conditional">
              <label class="ap-label">Please describe the additional deductions</label>
              <textarea v-model="form.additionalDeductionsDetails" class="ap-textarea" rows="3" placeholder="e.g. Company loan, HMO, uniform deductions..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have allowances not included in tax computation?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.allowancesExcludedFromTax" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.allowancesExcludedFromTax" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
            <div v-if="form.allowancesExcludedFromTax === 'yes'" class="ap-conditional">
              <label class="ap-label">Please list the tax-exempt allowances</label>
              <textarea v-model="form.allowancesExcludedFromTaxDetails" class="ap-textarea" rows="3" placeholder="e.g. Rice subsidy (up to PHP 2,000/mo), De minimis benefits..." />
            </div>
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Are there special final pay, backpay, annualization, or tax adjustment rules?</label>
            <textarea v-model="form.finalPayRules" class="ap-textarea" rows="4" placeholder="e.g. annualization done in December, final pay tax cleared manually, backpay released after clearance..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Comments or notes for this section</label>
            <textarea v-model="form.section6Notes" class="ap-textarea" rows="3" placeholder="Add deduction, compliance, tax, or government contribution notes..." />
          </div>
        </div>
      </section>

      <!-- ─── Section 7: Unique Considerations ─── -->
      <section v-else-if="currentSection === 7" class="ap-card ap-fade-up">
        <div class="ap-card-head">
          <h2 class="ap-card-title">Unique Considerations</h2>
          <span class="ap-card-kicker">Reports, edge cases &amp; unique arrangements</span>
        </div>

        <div class="ap-grid">
          <div class="ap-field ap-field--full">
            <label class="ap-label">What common payroll or HR reports do you regularly need?</label>
            <textarea v-model="form.commonReportsNeeded" class="ap-textarea" rows="4" placeholder="e.g. payroll register, bank file, 13th month summary, SSS/PHIC/HDMF reports, tax reports, leave balances..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">What are those reports used for?</label>
            <textarea v-model="form.reportUsagePurpose" class="ap-textarea" rows="3" placeholder="e.g. compliance filing, finance reconciliation, management review, audit support, employee inquiries..." />
          </div>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Do you have very unique arrangements or company policies not covered above?</label>
            <div class="ap-radio-group">
              <label class="ap-radio-label"><input v-model="form.hasUniqueArrangements" type="radio" value="yes" class="ap-radio" /> Yes</label>
              <label class="ap-radio-label"><input v-model="form.hasUniqueArrangements" type="radio" value="no" class="ap-radio" /> No</label>
            </div>
          </div>

          <template v-if="form.hasUniqueArrangements === 'yes'">
            <div
              v-for="(_, i) in form.uniqueConsiderations"
              :key="i"
              class="ap-field ap-field--full"
            >
              <label class="ap-label">Unique Consideration {{ i + 1 }}</label>
              <textarea
                v-model="form.uniqueConsiderations[i]"
                class="ap-textarea"
                :placeholder="`Describe unique consideration ${i + 1}...`"
                rows="2"
              />
            </div>
          </template>

          <div class="ap-field ap-field--full">
            <label class="ap-label">Additional comments or notes</label>
            <textarea v-model="form.overallComments" class="ap-textarea" rows="4" placeholder="Anything else about your payroll setup, edge cases, or expectations that we should know?" />
          </div>
        </div>
      </section>

      <!-- Error -->
      <div v-if="saveError" class="ap-error ap-fade-up">{{ saveError }}</div>
    </main>

    <!-- Sticky footer -->
    <footer class="ap-footer">
      <div class="ap-footer-inner">
        <div class="ap-status">
          <span class="ap-status-dot" />
          <span>Section {{ currentSection }} of {{ totalSections }}</span>
        </div>
        <div class="ap-spacer" />
        <button
          class="ap-btn-ghost"
          :disabled="currentSection === 1"
          @click="goBack"
        >
          ← Back
        </button>
        <button
          v-if="currentSection < totalSections"
          class="ap-btn-primary"
          @click="goNext"
        >
          Continue →
        </button>
        <button
          v-else
          class="ap-btn-primary"
          :disabled="saving"
          @click="completeScoping"
        >
          {{ saving ? 'Saving…' : 'Complete Scoping' }}
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ── Page shell ────────────────────────────────────── */
.ap-page {
  min-height: 100vh;
  background: var(--ap-bg);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--ap-ink);
  letter-spacing: -0.011em;
  position: relative;
}

.ap-ambient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(1200px 600px at 12% -10%, rgba(0, 113, 227, 0.08), transparent 60%),
    radial-gradient(900px 500px at 92% 110%, rgba(120, 130, 200, 0.06), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.ap-main {
  position: relative;
  z-index: 1;
  max-width: 880px;
  margin: 0 auto;
  padding: 56px 24px 140px;
}

/* ── Hero ──────────────────────────────────────────── */
.ap-hero { margin-bottom: 36px; }

.ap-eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: var(--ap-accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.ap-h1 {
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: -0.025em;
  font-weight: 600;
  margin: 0 0 12px;
}

.ap-sub {
  font-size: 17px;
  line-height: 1.5;
  color: var(--ap-ink-3);
  margin: 0 0 28px;
  max-width: 580px;
}

/* Step dots */
.ap-step-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.ap-step-dot {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1.5px solid var(--ap-hairline-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--ap-ink-4);
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.ap-step-dot--active {
  border-color: var(--ap-accent);
  color: var(--ap-accent);
  font-weight: 700;
  width: 24px;
  height: 24px;
  box-shadow: 0 0 0 4px var(--ap-accent-tint);
}

.ap-step-dot--done {
  background: var(--ap-accent);
  border-color: var(--ap-accent);
  color: #fff;
}

.ap-step-divider {
  color: var(--ap-hairline-strong);
  font-size: 11px;
  user-select: none;
}

/* ── Card ──────────────────────────────────────────── */
.ap-card {
  background: var(--ap-elev);
  border-radius: var(--ap-radius-card);
  box-shadow: var(--ap-shadow-card);
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 28px 32px 32px;
  margin-bottom: 20px;
}

.ap-card-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.ap-card-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.018em;
  margin: 0;
}

.ap-card-kicker {
  font-size: 12px;
  color: var(--ap-ink-4);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Field grid ────────────────────────────────────── */
.ap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 20px;
}

.ap-field { display: flex; flex-direction: column; }
.ap-field--full { grid-column: 1 / -1; }

.ap-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ap-ink-2);
  margin-bottom: 8px;
  letter-spacing: -0.005em;
}

.ap-req { color: var(--ap-danger); margin-left: 3px; }

/* ── Form controls ─────────────────────────────────── */
.ap-input,
.ap-textarea,
.ap-select {
  width: 100%;
  font-family: inherit;
  font-size: 15px;
  color: var(--ap-ink);
  background: var(--ap-elev);
  border: none;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  border-radius: var(--ap-radius-field);
  padding: 12px 14px;
  box-shadow: inset 0 0 0 1px var(--ap-hairline-strong);
  transition: box-shadow 0.15s ease;
  box-sizing: border-box;
}

.ap-input:focus,
.ap-textarea:focus,
.ap-select:focus {
  box-shadow: 0 0 0 1px var(--ap-accent), 0 0 0 4px var(--ap-accent-tint);
}

.ap-input::placeholder,
.ap-textarea::placeholder { color: #b6b6bb; }

.ap-textarea {
  line-height: 1.5;
  resize: vertical;
  min-height: 88px;
}

.ap-select {
  padding-right: 40px;
  cursor: pointer;
  color: var(--ap-ink);
}

.ap-select-wrap { position: relative; }

.ap-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ap-ink-4);
  pointer-events: none;
  width: 14px;
  height: 14px;
}

/* ── Radio ─────────────────────────────────────────── */
.ap-radio-group {
  display: flex;
  gap: 20px;
  margin-top: 4px;
}

.ap-radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--ap-ink-2);
  cursor: pointer;
}

.ap-radio {
  width: 18px;
  height: 18px;
  accent-color: var(--ap-accent);
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Check pills ───────────────────────────────────── */
.ap-check-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.ap-check-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #fff;
  color: var(--ap-ink-2);
  border: 1px solid var(--ap-hairline-strong);
  letter-spacing: -0.005em;
}

.ap-check-pill:hover {
  background: var(--ap-accent-tint);
  border-color: rgba(0, 113, 227, 0.3);
  color: var(--ap-accent);
}

.ap-check-pill--on {
  background: var(--ap-accent-tint);
  border-color: rgba(0, 113, 227, 0.35);
  color: var(--ap-accent);
  font-weight: 600;
}

/* ── Conditional sub-field ─────────────────────────── */
.ap-conditional {
  margin-top: 12px;
  padding: 16px 18px;
  background: var(--ap-sunken);
  border-radius: 14px;
  border: 1px solid var(--ap-hairline);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Error ─────────────────────────────────────────── */
.ap-error {
  background: rgba(255, 59, 48, 0.08);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 14px;
  color: var(--ap-danger);
  margin-top: 12px;
}

/* ── Sticky footer ─────────────────────────────────── */
.ap-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--ap-hairline);
}

.ap-footer-inner {
  max-width: 880px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ap-spacer { flex: 1; }

.ap-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ap-ink-3);
}

.ap-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--ap-accent);
  box-shadow: 0 0 0 3px var(--ap-accent-tint);
  flex-shrink: 0;
}

/* ── Buttons ───────────────────────────────────────── */
.ap-btn-ghost,
.ap-btn-primary {
  appearance: none;
  border: none;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  padding: 11px 20px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease, opacity 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.ap-btn-ghost {
  background: transparent;
  color: var(--ap-ink-2);
  border: 1px solid var(--ap-hairline-strong);
}
.ap-btn-ghost:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
.ap-btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }

.ap-btn-primary {
  background: var(--ap-accent);
  color: #fff;
  box-shadow: 0 6px 16px -6px rgba(0, 113, 227, 0.55);
}
.ap-btn-primary:hover:not(:disabled) { background: var(--ap-accent-hover); }
.ap-btn-primary:active:not(:disabled) { background: var(--ap-accent-press); transform: scale(0.98); }
.ap-btn-primary:disabled {
  background: rgba(0, 113, 227, 0.4);
  box-shadow: none;
  cursor: not-allowed;
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 640px) {
  .ap-main { padding: 32px 16px 120px; }
  .ap-h1 { font-size: 28px; }
  .ap-grid { grid-template-columns: 1fr; }
  .ap-field--full { grid-column: 1; }
  .ap-card { padding: 20px 18px 24px; }
  .ap-step-row { gap: 3px; }
  .ap-step-dot { width: 18px; height: 18px; font-size: 10px; }
  .ap-step-dot--active { width: 20px; height: 20px; }
}
</style>
