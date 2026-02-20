<script setup lang="ts">
useSeoMeta({
  title: 'Payroll Fit Assessment',
  description: 'Find out if our payroll system is the right fit for your business'
})

const form = reactive({
  companyName: '',
  industry: '',
  email: ''
})

const industries = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare',
  'Finance', 'Education', 'Construction', 'Hospitality',
  'Professional Services', 'Other'
]

const loading = ref(false)
const error = ref('')

const companyName = useState<string>('companyName')
const industry = useState<string>('industry')

async function startAssessment() {
  if (!form.companyName.trim() || !form.industry) {
    error.value = 'Please enter your company name and select an industry.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { sessionId } = await $fetch<{ sessionId: string }>('/api/sessions', {
      method: 'POST',
      body: form
    })
    // Store for use on assessment page
    companyName.value = form.companyName
    industry.value = form.industry
    await navigateTo(`/assessment/${sessionId}`)
  } catch {
    error.value = 'Something went wrong. Please try again.'
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center space-y-2">
          <div class="flex justify-center mb-3">
            <UIcon name="i-lucide-brain-circuit" class="w-10 h-10 text-primary-500" />
          </div>
          <h1 class="text-2xl font-bold">Payroll Fit Assessment</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Answer a few questions and our AI will determine if our payroll system is the right fit for your business.
          </p>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="startAssessment">
        <UFormField label="Company Name" required>
          <UInput v-model="form.companyName" placeholder="Acme Corp" autofocus class="w-full" />
        </UFormField>

        <UFormField label="Industry" required>
          <USelect
            v-model="form.industry"
            :items="industries"
            placeholder="Select your industry"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Work Email (optional)">
          <UInput v-model="form.email" type="email" placeholder="you@company.com" class="w-full" />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :description="error"
          icon="i-lucide-alert-circle"
        />

        <UButton type="submit" block :loading="loading" size="lg" class="mt-2">
          Start Assessment
        </UButton>
      </form>

      <template #footer>
        <p class="text-xs text-center text-gray-400">
          Takes about 10–15 minutes. Your answers are kept confidential.
        </p>
      </template>
    </UCard>
  </div>
</template>
