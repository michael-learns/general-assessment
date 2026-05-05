<script setup lang="ts">
import { getConfig } from '../../../../lib/assessments/index'
import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

type SectionStatus = 'supported' | 'partial' | 'gap'

interface AssessmentSection {
  name: string
  status: SectionStatus
  findings: string
  customerRequirements?: string[]
  sampleComputations?: string[]
}

interface ConsultantNotes {
  lookOutFor: string[]
  systemSetup: string[]
  followUpQuestions?: string[]
  codealiveGrounding?: string[]
}

interface ClientResponse {
  prompt: string
  response: string
  timestamp?: number
}

interface ScopingData {
  section1?: {
    payrollSchedule?: string
    currentPayrollSystem?: string
    payrollComputationProcess?: string
    payrollComputationPainPoints?: string
    employeeClassification?: string[]
    multiplePayrollGroups?: string
    multiplePayrollGroupsDetails?: string
  }
  section2?: {
    standardWorkSchedule?: string
    attendanceTracking?: string
    timekeepingProcess?: string
    timekeepingPainPoints?: string
    requestApplicationProcess?: string
    requestApplicationPainPoints?: string
    approvalProcess?: string
    approvalPainPoints?: string
    specialLogsConsiderations?: string
    specialLogsDetails?: string
    gracePeriod?: string
    gracePeriodDetails?: string
  }
}

interface SessionData {
  companyName: string
  industry: string
  address?: string
  tin?: string
  numberOfEmployees?: number
  email?: string
  authorizedSignatory?: string
  signatoryPosition?: string
  contactPerson?: string
  contactPosition?: string
  contactPhone?: string
  scopingData?: ScopingData
}

interface AssessmentData {
  session: SessionData | null
  assessment: {
    overallFitScore: number
    summary: string
    recommendations: string
    consultantNotes?: ConsultantNotes
    sections: AssessmentSection[]
  } | null
  clientResponses?: ClientResponse[]
}

const route = useRoute()
const sessionId = route.params.sessionId as string
const productSlug = route.params.product as string
const { saveSession } = useAssessmentSession(productSlug)
const config = useRuntimeConfig()
const demoBookingUrl = computed(() =>
  config.public.demoBookingUrl?.trim() || 'https://calendar.app.google/ZaTDPhES2ZuLGji48'
)

const assessmentConfig = getConfig(productSlug)

if (!assessmentConfig) {
  throw createError({ statusCode: 404, statusMessage: `Product "${productSlug}" not found` })
}

const { data, pending, error } = await useFetch<AssessmentData>(`/api/assessment/${sessionId}`)

useSeoMeta({ title: `Your Assessment Report — ${assessmentConfig.productName} Fit` })

const statusConfig: Record<SectionStatus, { color: 'success' | 'warning' | 'error'; icon: string; label: string }> = {
  supported: { color: 'success', icon: 'i-lucide-check-circle-2', label: 'Supported' },
  partial: { color: 'warning', icon: 'i-lucide-alert-circle', label: 'Partial Support' },
  gap: { color: 'error', icon: 'i-lucide-x-circle', label: 'Gap' }
}

function downloadReport() {
  window.print()
}

const companyDetails = computed(() => {
  const session = data.value?.session
  if (!session) return []

  return [
    { label: 'Company Name', value: session.companyName },
    { label: 'Industry', value: session.industry },
    { label: 'Company Address', value: session.address },
    { label: 'Company TIN', value: session.tin },
    { label: 'Authorized Signatory Name', value: session.authorizedSignatory },
    { label: 'Signatory Position', value: session.signatoryPosition },
    { label: 'Payroll Contact', value: session.contactPerson },
    { label: 'Contact Position', value: session.contactPosition },
    { label: 'Contact Phone', value: session.contactPhone },
    { label: 'Work Email', value: session.email }
  ].filter(detail => Boolean(detail.value))
})

const employeeDetails = computed(() => {
  const session = data.value?.session
  if (!session) return []

  const section1 = session.scopingData?.section1
  const section2 = session.scopingData?.section2

  return [
    { label: 'Employee Count', value: session.numberOfEmployees ? String(session.numberOfEmployees) : undefined },
    { label: 'Employee Classifications', value: section1?.employeeClassification?.length ? section1.employeeClassification.join(', ') : undefined },
    { label: 'Payroll Schedule', value: section1?.payrollSchedule },
    { label: 'Current Payroll System', value: section1?.currentPayrollSystem },
    { label: 'Payroll Computation Process', value: section1?.payrollComputationProcess },
    { label: 'Payroll Computation Pain Points', value: section1?.payrollComputationPainPoints },
    {
      label: 'Multiple Payroll Groups',
      value: section1?.multiplePayrollGroups === 'yes'
        ? `Yes${section1.multiplePayrollGroupsDetails ? ` - ${section1.multiplePayrollGroupsDetails}` : ''}`
        : section1?.multiplePayrollGroups === 'no'
          ? 'No'
          : undefined
    },
    { label: 'Standard Work Schedule', value: section2?.standardWorkSchedule },
    { label: 'Attendance Tracking', value: section2?.attendanceTracking },
    { label: 'Timekeeping Process', value: section2?.timekeepingProcess },
    { label: 'Timekeeping Pain Points', value: section2?.timekeepingPainPoints },
    { label: 'Request/Application Process', value: section2?.requestApplicationProcess },
    { label: 'Request/Application Pain Points', value: section2?.requestApplicationPainPoints },
    { label: 'Approval Process', value: section2?.approvalProcess },
    { label: 'Approval Pain Points', value: section2?.approvalPainPoints },
    {
      label: 'Special Log Considerations',
      value: section2?.specialLogsConsiderations === 'yes'
        ? section2.specialLogsDetails || 'Yes'
        : section2?.specialLogsConsiderations === 'no'
          ? 'No'
          : undefined
    },
    {
      label: 'Grace Period',
      value: section2?.gracePeriod === 'yes'
        ? section2.gracePeriodDetails || 'Yes'
        : section2?.gracePeriod === 'no'
          ? 'None'
          : undefined
    }
  ].filter(detail => Boolean(detail.value))
})

const clientResponses = computed(() => data.value?.clientResponses ?? [])

function formatTimestamp(timestamp?: number) {
  if (!timestamp) return ''

  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

watchEffect(() => {
  const session = data.value?.session
  if (!session?.companyName || !session.industry) return

  saveSession({
    sessionId,
    companyName: session.companyName,
    industry: session.industry,
    product: productSlug,
    stage: 'report'
  })
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
    <!-- Loading -->
    <div v-if="pending" class="flex justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- Error -->
    <div v-else-if="error || !data?.assessment" class="text-center py-20 space-y-3">
      <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-300 mx-auto" />
      <p class="text-gray-500">Report not found. The assessment may still be processing.</p>
      <UButton variant="ghost" icon="i-lucide-arrow-left" :to="`/assess/${productSlug}/${sessionId}`">
        Return to assessment
      </UButton>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="text-center space-y-1">
        <h1 class="text-3xl font-bold">{{ assessmentConfig.productName }} Fit Report</h1>
        <p v-if="data.session" class="text-gray-500">
          {{ data.session.companyName }} &middot; {{ data.session.industry }}
        </p>
      </div>

      <!-- Summary -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-base">Executive Summary</h2>
        </template>
        <div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" v-html="marked.parse(data.assessment.summary)" />
      </UCard>

      <UCard v-if="companyDetails.length">
        <template #header>
          <h2 class="font-semibold text-base">Company Information</h2>
        </template>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="detail in companyDetails"
            :key="detail.label"
            class="rounded-xl border border-gray-100 dark:border-gray-800 p-3"
          >
            <dt class="text-xs uppercase tracking-wide text-gray-500">{{ detail.label }}</dt>
            <dd class="mt-1 text-sm text-gray-800 dark:text-gray-200">{{ detail.value }}</dd>
          </div>
        </dl>
      </UCard>

      <UCard v-if="employeeDetails.length">
        <template #header>
          <h2 class="font-semibold text-base">Employee Details</h2>
        </template>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="detail in employeeDetails"
            :key="detail.label"
            class="rounded-xl border border-gray-100 dark:border-gray-800 p-3"
          >
            <dt class="text-xs uppercase tracking-wide text-gray-500">{{ detail.label }}</dt>
            <dd class="mt-1 text-sm text-gray-800 dark:text-gray-200">{{ detail.value }}</dd>
          </div>
        </dl>
      </UCard>

      <UCard v-if="clientResponses.length">
        <template #header>
          <h2 class="font-semibold text-base">Client Responses</h2>
        </template>
        <div class="space-y-3">
          <article
            v-for="(item, index) in clientResponses"
            :key="`${index}-${item.timestamp || item.response}`"
            class="rounded-xl border border-gray-100 dark:border-gray-800 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Response {{ index + 1 }}
              </p>
              <time v-if="item.timestamp" class="text-xs text-gray-400">
                {{ formatTimestamp(item.timestamp) }}
              </time>
            </div>
            <p class="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ item.prompt }}
            </p>
            <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {{ item.response }}
            </p>
          </article>
        </div>
      </UCard>

      <!-- Section Breakdown -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-base">Section Breakdown</h2>
        </template>
        <div class="space-y-4">
          <div
            v-for="section in data.assessment.sections"
            :key="section.name"
            class="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-2"
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-medium text-sm">{{ section.name }}</h3>
              <UBadge :color="statusConfig[section.status].color" size="sm" class="shrink-0">
                <UIcon :name="statusConfig[section.status].icon" class="w-3 h-3 mr-1" />
                {{ statusConfig[section.status].label }}
              </UBadge>
            </div>
            <div class="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400" v-html="marked.parse(section.findings)" />
            <ul v-if="section.customerRequirements?.length" class="space-y-1 mt-2">
              <li
                v-for="req in section.customerRequirements"
                :key="req"
                class="text-xs text-gray-500 flex items-start gap-1.5"
              >
                <UIcon name="i-lucide-chevron-right" class="w-3 h-3 mt-0.5 shrink-0" />
                {{ req }}
              </li>
            </ul>
            <div v-if="section.sampleComputations?.length" class="space-y-2 pt-2">
              <h4 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Sample Payroll Computations</h4>
              <ul class="space-y-2">
                <li
                  v-for="sample in section.sampleComputations"
                  :key="sample"
                  class="whitespace-pre-line rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300"
                >
                  {{ sample }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Recommendations -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-base">Implementation Notes</h2>
        </template>
        <div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" v-html="marked.parse(data.assessment.recommendations)" />
      </UCard>

      <!-- YAHSHUA Notes -->
      <UCard v-if="data.assessment.consultantNotes">
        <template #header>
          <h2 class="font-semibold text-base">YAHSHUA Notes</h2>
        </template>
        <div class="grid gap-4">
          <section v-if="data.assessment.consultantNotes.lookOutFor.length" class="space-y-2">
            <h3 class="text-sm font-medium text-gray-800 dark:text-gray-100">What to look out for</h3>
            <ul class="space-y-1">
              <li
                v-for="note in data.assessment.consultantNotes.lookOutFor"
                :key="note"
                class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
              >
                <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 mt-0.5 shrink-0 text-yellow-500" />
                <span>{{ note }}</span>
              </li>
            </ul>
          </section>

          <section v-if="data.assessment.consultantNotes.systemSetup.length" class="space-y-2">
            <h3 class="text-sm font-medium text-gray-800 dark:text-gray-100">System setup guidance</h3>
            <ul class="space-y-1">
              <li
                v-for="step in data.assessment.consultantNotes.systemSetup"
                :key="step"
                class="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
              >
                <UIcon name="i-lucide-settings-2" class="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                <span>{{ step }}</span>
              </li>
            </ul>
          </section>
        </div>
      </UCard>

      <!-- Actions -->
      <div class="flex gap-3 justify-center print:hidden pb-4">
        <UButton
          icon="i-lucide-plus-circle"
          variant="outline"
          color="neutral"
          :to="`/assess/${productSlug}`"
        >
          Start a new assessment
        </UButton>
        <UButton icon="i-lucide-printer" variant="outline" color="neutral" @click="downloadReport">
          Download PDF
        </UButton>
        <UButton
          icon="i-lucide-calendar"
          :href="demoBookingUrl"
          external
          target="_blank"
          rel="noopener noreferrer"
        >
          Book a Demo
        </UButton>
      </div>
    </template>
  </div>
</template>
