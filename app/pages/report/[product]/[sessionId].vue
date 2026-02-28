<script setup lang="ts">
import { getConfig } from '../../../../lib/assessments/index'

type SectionStatus = 'supported' | 'partial' | 'gap'

interface AssessmentSection {
  name: string
  status: SectionStatus
  findings: string
  customerRequirements?: string[]
}

interface AssessmentData {
  session: { companyName: string; industry: string } | null
  assessment: {
    overallFitScore: number
    summary: string
    recommendations: string
    sections: AssessmentSection[]
  } | null
}

const route = useRoute()
const sessionId = route.params.sessionId as string
const productSlug = route.params.product as string
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

function getFitLabel(score: number) {
  if (score >= 80) return { label: 'Strong Fit', color: 'success' as const }
  if (score >= 60) return { label: 'Good Fit', color: 'primary' as const }
  if (score >= 40) return { label: 'Partial Fit', color: 'warning' as const }
  return { label: 'Poor Fit', color: 'error' as const }
}

function downloadReport() {
  window.print()
}
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

      <!-- Fit Score Card -->
      <UCard>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-1">Overall Fit Score</p>
            <p class="text-5xl font-bold tracking-tight">
              {{ data.assessment.overallFitScore }}
              <span class="text-2xl font-normal text-gray-400">/100</span>
            </p>
            <UBadge
              :color="getFitLabel(data.assessment.overallFitScore).color"
              class="mt-3"
              size="md"
            >
              {{ getFitLabel(data.assessment.overallFitScore).label }}
            </UBadge>
          </div>
          <!-- Circular score indicator -->
          <svg viewBox="0 0 36 36" class="w-28 h-28 -rotate-90 shrink-0">
            <circle
              cx="18" cy="18" r="15.9"
              fill="none" stroke="currentColor" stroke-width="2.5"
              class="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round"
              :stroke-dasharray="`${data.assessment.overallFitScore} 100`"
              :class="{
                'text-green-500': data.assessment.overallFitScore >= 80,
                'text-blue-500': data.assessment.overallFitScore >= 60 && data.assessment.overallFitScore < 80,
                'text-yellow-500': data.assessment.overallFitScore >= 40 && data.assessment.overallFitScore < 60,
                'text-red-500': data.assessment.overallFitScore < 40
              }"
            />
          </svg>
        </div>
      </UCard>

      <!-- Summary -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-base">Executive Summary</h2>
        </template>
        <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ data.assessment.summary }}
        </p>
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
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ section.findings }}</p>
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
          </div>
        </div>
      </UCard>

      <!-- Recommendations -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-base">Implementation Notes</h2>
        </template>
        <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ data.assessment.recommendations }}
        </p>
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
