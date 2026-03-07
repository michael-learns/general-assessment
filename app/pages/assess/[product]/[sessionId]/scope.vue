<script setup lang="ts">
const route = useRoute()
const productSlug = route.params.product as string
const sessionId = route.params.sessionId as string

// Section navigation
const currentSection = ref(1)
const totalSections = 7
const saving = ref(false)
const saveError = ref('')

// Form state
const form = reactive({
  // Section 1: Payroll Structure
  payrollSchedule: '',
  employeeClassification: [] as string[],
  multiplePayrollGroups: '',
  multiplePayrollGroupsDetails: '',

  // Section 2: Timekeeping & Work Schedules
  standardWorkSchedule: '',
  attendanceTracking: '',
  specialLogsConsiderations: '',
  specialLogsDetails: '',
  gracePeriod: '',
  gracePeriodDetails: '',

  // Section 3: Overtime, Holidays & Night Differentials
  overtimeComputation: '',
  nightDifferentialComputation: '',
  holidayCompensation: '',

  // Section 4: Leave Policies
  uniqueLeaves: '',
  uniqueLeavesDetails: '',
  leaveCarryOver: '',
  leaveReplenishment: '',

  // Section 5: Earnings
  allowancesWithConsiderations: '',
  allowancesDetails: '',

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

  // Section 7: Unique Considerations
  hasUniqueArrangements: '',
  uniqueConsiderations: ['', '', '', '', ''] as string[]
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
      employeeClassification: form.employeeClassification,
      multiplePayrollGroups: form.multiplePayrollGroups,
      multiplePayrollGroupsDetails: form.multiplePayrollGroupsDetails || undefined
    },
    section2: {
      standardWorkSchedule: form.standardWorkSchedule,
      attendanceTracking: form.attendanceTracking,
      specialLogsConsiderations: form.specialLogsConsiderations,
      specialLogsDetails: form.specialLogsDetails || undefined,
      gracePeriod: form.gracePeriod,
      gracePeriodDetails: form.gracePeriodDetails || undefined
    },
    section3: {
      overtimeComputation: form.overtimeComputation,
      nightDifferentialComputation: form.nightDifferentialComputation,
      holidayCompensation: form.holidayCompensation
    },
    section4: {
      uniqueLeaves: form.uniqueLeaves,
      uniqueLeavesDetails: form.uniqueLeavesDetails || undefined,
      leaveCarryOver: form.leaveCarryOver,
      leaveReplenishment: form.leaveReplenishment
    },
    section5: {
      allowancesWithConsiderations: form.allowancesWithConsiderations,
      allowancesDetails: form.allowancesDetails || undefined
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
      allowancesExcludedFromTaxDetails: form.allowancesExcludedFromTaxDetails || undefined
    },
    section7: {
      hasUniqueArrangements: form.hasUniqueArrangements,
      uniqueConsiderations: form.hasUniqueArrangements === 'yes'
        ? form.uniqueConsiderations.filter(c => c.trim())
        : []
    }
  }

  try {
    await $fetch(`/api/sessions/${sessionId}/scope`, {
      method: 'POST',
      body: { scopingData }
    })
    await navigateTo(`/assess/${productSlug}/${sessionId}`)
  } catch {
    saveError.value = 'Failed to save scoping data. Please try again.'
    saving.value = false
  }
}

const progressPercent = computed(() => Math.round((currentSection.value / totalSections) * 100))
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
    <div class="w-full max-w-2xl mx-auto space-y-6">

      <!-- Header -->
      <div class="text-center space-y-1">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Payroll Scoping Form</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Help us understand your payroll setup before your consultation.
        </p>
      </div>

      <!-- Progress -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Section {{ currentSection }} of {{ totalSections }}: {{ sectionTitles[currentSection - 1] }}
          </span>
          <UBadge variant="soft" color="primary">{{ progressPercent }}%</UBadge>
        </div>
        <UProgress :value="progressPercent" color="primary" />
      </div>

      <!-- ─── Section 1: Payroll Structure ─── -->
      <UCard v-if="currentSection === 1">
        <template #header>
          <h2 class="font-semibold">Section 1: Payroll Structure</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="What is your payroll schedule?" required>
            <USelect
              v-model="form.payrollSchedule"
              :items="payrollScheduleOptions"
              placeholder="Select payroll schedule"
              class="w-full"
            />
          </UFormField>

          <UFormField label="How are your employees classified?" required>
            <div class="space-y-2 mt-1">
              <label
                v-for="opt in employeeClassificationOptions"
                :key="opt.value"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  v-model="form.employeeClassification"
                  type="checkbox"
                  :value="opt.value"
                  class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                >
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </UFormField>

          <UFormField label="Do you have multiple payroll groups with different pay structures?" required>
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.multiplePayrollGroups" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.multiplePayrollGroups" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.multiplePayrollGroups === 'yes'" class="mt-3">
              <UFormField label="Please describe the different payroll groups">
                <UTextarea
                  v-model="form.multiplePayrollGroupsDetails"
                  placeholder="e.g. Head office on monthly, branches on semi-monthly..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 2: Timekeeping & Work Schedules ─── -->
      <UCard v-else-if="currentSection === 2">
        <template #header>
          <h2 class="font-semibold">Section 2: Timekeeping &amp; Work Schedules</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="What is your standard work schedule?" required>
            <UInput
              v-model="form.standardWorkSchedule"
              placeholder="e.g. Mon–Fri 8am–5pm"
              class="w-full"
            />
          </UFormField>

          <UFormField label="How do you track employee attendance?" required>
            <USelect
              v-model="form.attendanceTracking"
              :items="attendanceTrackingOptions"
              placeholder="Select tracking method"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Do you have special considerations for employee logs?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.specialLogsConsiderations" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.specialLogsConsiderations" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.specialLogsConsiderations === 'yes'" class="mt-3">
              <UFormField label="Please describe the special considerations">
                <UTextarea
                  v-model="form.specialLogsDetails"
                  placeholder="e.g. Supervisors log manually, night shift overlaps..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>

          <UFormField label="Do you allow grace periods for tardiness?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.gracePeriod" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.gracePeriod" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.gracePeriod === 'yes'" class="mt-3">
              <UFormField label="Please describe the grace period policy">
                <UTextarea
                  v-model="form.gracePeriodDetails"
                  placeholder="e.g. 15 minutes grace period, deducted from VL after 5 instances..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 3: Overtime, Holidays & Night Differentials ─── -->
      <UCard v-else-if="currentSection === 3">
        <template #header>
          <h2 class="font-semibold">Section 3: Overtime, Holidays &amp; Night Differentials</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="How do you compute overtime pay?" required>
            <UTextarea
              v-model="form.overtimeComputation"
              placeholder="e.g. Hourly rate × 1.25 for regular OT, × 1.30 for night OT..."
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <UFormField label="How do you compute night differential pay?" required>
            <UTextarea
              v-model="form.nightDifferentialComputation"
              placeholder="e.g. 10% of hourly rate for hours between 10pm–6am..."
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <UFormField label="How do you compensate for holidays?" required>
            <UTextarea
              v-model="form.holidayCompensation"
              placeholder="e.g. Regular holiday: 200% if worked, 100% if unworked. Special non-working: 130% if worked, no pay if unworked..."
              class="w-full"
              :rows="4"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 4: Leave Policies ─── -->
      <UCard v-else-if="currentSection === 4">
        <template #header>
          <h2 class="font-semibold">Section 4: Leave Policies</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="Do you have company-unique leaves beyond standard (VL, SIL, Paternity, Bereavement)?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.uniqueLeaves" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.uniqueLeaves" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.uniqueLeaves === 'yes'" class="mt-3">
              <UFormField label="Please describe your company-specific leave types and their computation">
                <UTextarea
                  v-model="form.uniqueLeavesDetails"
                  placeholder="e.g. Birthday leave (1 day), Solo parent leave (7 days)..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>

          <UFormField label="Do you allow leave carry-over to the next year?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.leaveCarryOver" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.leaveCarryOver" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
          </UFormField>

          <UFormField label="When do you replenish employee leaves?">
            <UInput
              v-model="form.leaveReplenishment"
              placeholder="e.g. January 1, Anniversary date"
              class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 5: Earnings ─── -->
      <UCard v-else-if="currentSection === 5">
        <template #header>
          <h2 class="font-semibold">Section 5: Earnings</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="Do you have allowances with unique considerations?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.allowancesWithConsiderations" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.allowancesWithConsiderations" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.allowancesWithConsiderations === 'yes'" class="mt-3">
              <UFormField label="List allowances and describe their computation details">
                <UTextarea
                  v-model="form.allowancesDetails"
                  placeholder="e.g. Transportation allowance: PHP 2,500/month, prorated on absences. Rice subsidy: PHP 2,000/month, not prorated..."
                  class="w-full"
                  :rows="4"
                />
              </UFormField>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 6: Deductions & Compliance ─── -->
      <UCard v-else-if="currentSection === 6">
        <template #header>
          <h2 class="font-semibold">Section 6: Deductions &amp; Compliance</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="How do you compute SSS?" required>
            <USelect
              v-model="form.sssComputation"
              :items="governmentContributionOptions"
              placeholder="Select computation basis"
              class="w-full"
            />
            <div v-if="form.sssComputation === 'Other'" class="mt-2">
              <UTextarea v-model="form.sssComputationOther" placeholder="Please describe..." class="w-full" :rows="2" />
            </div>
          </UFormField>

          <UFormField label="How do you compute PHIC?" required>
            <USelect
              v-model="form.phicComputation"
              :items="governmentContributionOptions"
              placeholder="Select computation basis"
              class="w-full"
            />
            <div v-if="form.phicComputation === 'Other'" class="mt-2">
              <UTextarea v-model="form.phicComputationOther" placeholder="Please describe..." class="w-full" :rows="2" />
            </div>
          </UFormField>

          <UFormField label="How do you compute HDMF?" required>
            <USelect
              v-model="form.hdmfComputation"
              :items="governmentContributionOptions"
              placeholder="Select computation basis"
              class="w-full"
            />
            <div v-if="form.hdmfComputation === 'Other'" class="mt-2">
              <UTextarea v-model="form.hdmfComputationOther" placeholder="Please describe..." class="w-full" :rows="2" />
            </div>
          </UFormField>

          <UFormField label="How do you compute your tax?" required>
            <USelect
              v-model="form.taxComputation"
              :items="taxComputationOptions"
              placeholder="Select tax computation method"
              class="w-full"
            />
            <div v-if="form.taxComputation === 'Other'" class="mt-2">
              <UTextarea v-model="form.taxComputationOther" placeholder="Please describe..." class="w-full" :rows="2" />
            </div>
          </UFormField>

          <UFormField label="Do you have additional salary deductions (loans, company benefits)?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.additionalDeductions" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.additionalDeductions" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.additionalDeductions === 'yes'" class="mt-3">
              <UFormField label="Please describe the additional deductions">
                <UTextarea
                  v-model="form.additionalDeductionsDetails"
                  placeholder="e.g. Company loan, HMO, uniform deductions..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>

          <UFormField label="Do you have allowances not included in tax computation?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.allowancesExcludedFromTax" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.allowancesExcludedFromTax" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
            <div v-if="form.allowancesExcludedFromTax === 'yes'" class="mt-3">
              <UFormField label="Please list the tax-exempt allowances">
                <UTextarea
                  v-model="form.allowancesExcludedFromTaxDetails"
                  placeholder="e.g. Rice subsidy (up to PHP 2,000/mo), De minimis benefits..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>
            </div>
          </UFormField>
        </div>
      </UCard>

      <!-- ─── Section 7: Unique Considerations ─── -->
      <UCard v-else-if="currentSection === 7">
        <template #header>
          <h2 class="font-semibold">Section 7: Unique Considerations</h2>
        </template>

        <div class="space-y-6">
          <UFormField label="Do you have very unique arrangements or company policies not covered above?">
            <div class="space-y-2 mt-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.hasUniqueArrangements" type="radio" value="yes" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">Yes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.hasUniqueArrangements" type="radio" value="no" class="h-4 w-4 text-primary-600" />
                <span class="text-sm">No</span>
              </label>
            </div>
          </UFormField>

          <template v-if="form.hasUniqueArrangements === 'yes'">
            <div
              v-for="(_, i) in form.uniqueConsiderations"
              :key="i"
              class="space-y-1"
            >
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unique Consideration {{ i + 1 }}
              </label>
              <UTextarea
                v-model="form.uniqueConsiderations[i]"
                :placeholder="`Describe unique consideration ${i + 1}...`"
                class="w-full"
                :rows="2"
              />
            </div>
          </template>
        </div>
      </UCard>

      <!-- Error alert -->
      <UAlert
        v-if="saveError"
        color="error"
        variant="soft"
        :description="saveError"
        icon="i-lucide-alert-circle"
      />

      <!-- Navigation buttons -->
      <div class="flex justify-between gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="currentSection === 1"
          icon="i-lucide-arrow-left"
          @click="goBack"
        >
          Back
        </UButton>

        <UButton
          v-if="currentSection < totalSections"
          trailing-icon="i-lucide-arrow-right"
          @click="goNext"
        >
          Next
        </UButton>

        <UButton
          v-else
          color="primary"
          :loading="saving"
          icon="i-lucide-check"
          @click="completeScoping"
        >
          Complete Scoping
        </UButton>
      </div>

    </div>
  </div>
</template>
