<script setup lang="ts">
import { getConfig, getAll } from '../../../../lib/assessments/index'

const route = useRoute()
const productSlug = route.params.product as string

const assessmentConfig = getConfig(productSlug)

if (!assessmentConfig) {
  throw createError({ statusCode: 404, statusMessage: `Product "${productSlug}" not found` })
}

useSeoMeta({
  title: `${assessmentConfig.productName} Fit Assessment`,
  description: assessmentConfig.introDescription
})

const { userId, loadFromStorage, login, logout, generateCode } = useAuth()

// Login state
const codeInput = ref('')
const loginError = ref('')
const showNewCode = ref(false)
const generatedCode = ref('')

// Session form — pre-fill from URL query params
const query = route.query
const form = reactive({
  companyName: (query.company as string) || '',
  industry: (query.industry as string) || '',
  // New registration fields
  address: '',
  tin: '',
  numberOfEmployees: undefined as number | undefined,
  authorizedSignatory: '',
  signatoryPosition: '',
  contactPerson: '',
  contactPosition: '',
  contactPhone: '',
  // Existing
  email: (query.email as string) || '',
  dataPrivacyConsent: false
})

// Hidden fields from URL params
const contactName = (query.name as string) || ''
const sourceRef = (query.ref as string) || ''

const industries = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare',
  'Finance', 'Education', 'Construction', 'Hospitality',
  'Professional Services', 'Other'
]

const loading = ref(false)
const formError = ref('')

// Previous sessions (loaded after login)
type PreviousSession = {
  _id: string
  companyName: string
  industry: string
  status: 'in_progress' | 'completed'
  createdAt: number
  completedAt?: number
}
const previousSessions = ref<PreviousSession[]>([])
const loadingSessions = ref(false)

const companyName = useState<string>('companyName')
const industry = useState<string>('industry')

onMounted(async () => {
  loadFromStorage()
  if (userId.value) {
    await fetchSessions()
  }
})

async function fetchSessions() {
  if (!userId.value) return
  loadingSessions.value = true
  try {
    previousSessions.value = await $fetch<PreviousSession[]>(
      `/api/users/${encodeURIComponent(userId.value)}/sessions`
    )
  } catch {
    previousSessions.value = []
  } finally {
    loadingSessions.value = false
  }
}

function handleGenerateCode() {
  generatedCode.value = generateCode()
  showNewCode.value = true
}

async function handleLogin() {
  const code = codeInput.value.trim().toUpperCase()
  if (!code) {
    loginError.value = 'Please enter your access code.'
    return
  }
  loginError.value = ''
  login(code)
  await fetchSessions()
}

async function handleUseGeneratedCode() {
  login(generatedCode.value)
  showNewCode.value = false
  generatedCode.value = ''
  codeInput.value = ''
  await fetchSessions()
}

async function handleLogout() {
  logout()
  previousSessions.value = []
  codeInput.value = ''
  loginError.value = ''
  showNewCode.value = false
}

async function resumeSession(session: PreviousSession) {
  companyName.value = session.companyName
  industry.value = session.industry
  const path = session.status === 'completed'
    ? `/report/${productSlug}/${session._id}`
    : `/assess/${productSlug}/${session._id}`
  await navigateTo(path)
}

async function startAssessment() {
  if (!form.companyName.trim() || !form.industry) {
    formError.value = 'Please enter your company name and select an industry.'
    return
  }
  if (!form.address.trim()) {
    formError.value = 'Please enter your company address.'
    return
  }
  if (!form.tin.trim()) {
    formError.value = 'Please enter your company TIN.'
    return
  }
  if (!form.numberOfEmployees || form.numberOfEmployees < 1) {
    formError.value = 'Please enter the number of employees.'
    return
  }
  if (!form.authorizedSignatory.trim()) {
    formError.value = 'Please enter the authorized signatory name.'
    return
  }
  if (!form.signatoryPosition.trim()) {
    formError.value = 'Please enter the authorized signatory position.'
    return
  }
  if (!form.contactPerson.trim()) {
    formError.value = 'Please enter the payroll contact person.'
    return
  }
  if (!form.contactPosition.trim()) {
    formError.value = 'Please enter the payroll contact position.'
    return
  }
  if (!form.contactPhone.trim()) {
    formError.value = 'Please enter the contact phone number.'
    return
  }
  if (form.email.trim() && !emailVerified.value) {
    formError.value = 'Please verify your work email using the one-time code.'
    return
  }
  if (!form.dataPrivacyConsent) {
    formError.value = 'Please provide explicit consent by confirming the Data Privacy Act notice and privacy policy/consent form acknowledgment before continuing.'
    return
  }

  loading.value = true
  formError.value = ''

  try {
    const { sessionId } = await $fetch<{ sessionId: string }>('/api/sessions', {
      method: 'POST',
      body: {
        ...form,
        userId: userId.value ?? undefined,
        product: productSlug,
        contactName: contactName || undefined,
        sourceRef: sourceRef || undefined
      }
    })
    companyName.value = form.companyName
    industry.value = form.industry
    localStorage.removeItem('payroll_session')
    await navigateTo(`/assess/${productSlug}/${sessionId}/scope`)
  } catch {
    formError.value = 'Something went wrong. Please try again.'
    loading.value = false
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <div class="w-full max-w-md space-y-4">

      <!-- ─── Not logged in: login panel ─── -->
      <template v-if="!userId">
        <HowItWorks />

        <UCard>
          <template #header>
            <div class="text-center space-y-2">
              <div class="flex justify-center mb-3">
                <UIcon name="i-lucide-brain-circuit" class="w-10 h-10 text-primary-500" />
              </div>
              <h1 class="text-2xl font-bold">{{ assessmentConfig.productName }} Fit Assessment</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Use an access code to save your progress and resume later.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Enter existing code -->
            <div class="space-y-2">
              <label class="text-sm font-medium">Enter your access code</label>
              <div class="flex gap-2">
                <UInput
                  v-model="codeInput"
                  placeholder="XXXX-XXXX"
                  class="flex-1 uppercase"
                  @keydown.enter="handleLogin"
                />
                <UButton @click="handleLogin">Continue</UButton>
              </div>
              <p v-if="loginError" class="text-xs text-red-500">{{ loginError }}</p>
            </div>

            <div class="relative flex items-center gap-3">
              <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span class="text-xs text-gray-400">or</span>
              <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <!-- Generate new code -->
            <div v-if="!showNewCode">
              <UButton variant="outline" block @click="handleGenerateCode">
                <UIcon name="i-lucide-key-round" class="w-4 h-4 mr-2" />
                Generate a new access code
              </UButton>
            </div>

            <div v-else class="space-y-3 p-4 bg-primary-50 dark:bg-primary-950 rounded-lg border border-primary-200 dark:border-primary-800">
              <p class="text-sm font-medium text-primary-700 dark:text-primary-300">Your access code</p>
              <p class="text-2xl font-mono font-bold tracking-widest text-center text-primary-600 dark:text-primary-400">
                {{ generatedCode }}
              </p>
              <p class="text-xs text-primary-600 dark:text-primary-400 text-center">
                Save this code — you'll need it to resume your assessment later.
              </p>
              <UButton block @click="handleUseGeneratedCode">
                Use this code & continue
              </UButton>
              <UButton block variant="ghost" @click="showNewCode = false">
                Cancel
              </UButton>
            </div>

            <!-- Skip (no code) -->
            <p class="text-xs text-center text-gray-400">
              <button class="underline hover:text-gray-600" @click="login('guest_' + Date.now())">
                Continue without a code
              </button>
              &nbsp;(progress won't be saved for resume)
            </p>
          </div>
        </UCard>
      </template>

      <!-- ─── Logged in: previous sessions + new assessment ─── -->
      <template v-else>
        <!-- Identity bar -->
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UIcon name="i-lucide-key-round" class="w-4 h-4" />
            <span class="font-mono font-semibold">{{ userId }}</span>
          </div>
          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-log-out" @click="handleLogout">
            Log out
          </UButton>
        </div>

        <!-- Previous sessions -->
        <UCard v-if="loadingSessions || previousSessions.length > 0">
          <template #header>
            <h2 class="font-semibold text-sm">Your assessments</h2>
          </template>

          <div v-if="loadingSessions" class="flex justify-center py-4">
            <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin text-gray-400" />
          </div>

          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li
              v-for="session in previousSessions"
              :key="session._id"
              class="py-3 flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-medium text-sm truncate">{{ session.companyName }}</p>
                <p class="text-xs text-gray-500">{{ session.industry }} · {{ formatDate(session.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UBadge
                  :color="session.status === 'completed' ? 'success' : 'warning'"
                  variant="subtle"
                  size="xs"
                >
                  {{ session.status === 'completed' ? 'Completed' : 'In progress' }}
                </UBadge>
                <UButton
                  size="xs"
                  variant="ghost"
                  :icon="session.status === 'completed' ? 'i-lucide-file-text' : 'i-lucide-play'"
                  @click="resumeSession(session)"
                >
                  {{ session.status === 'completed' ? 'View report' : 'Resume' }}
                </UButton>
              </div>
            </li>
          </ul>
        </UCard>

        <!-- Start new assessment -->
        <UCard>
          <template #header>
            <h2 class="font-semibold text-sm">Start a new {{ assessmentConfig.productName }} assessment</h2>
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

            <UFormField label="Company Address" required>
              <UTextarea
                v-model="form.address"
                placeholder="Unit/Floor, Building, Street, City, Province"
                class="w-full"
                :rows="2"
              />
            </UFormField>

            <UFormField label="Company TIN" required>
              <UInput v-model="form.tin" placeholder="000-000-000-000" class="w-full" />
            </UFormField>

            <UFormField label="Number of Employees" required>
              <UInput
                v-model.number="form.numberOfEmployees"
                type="number"
                placeholder="e.g. 50"
                :min="1"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Authorized Signatory Name" required>
              <UInput v-model="form.authorizedSignatory" placeholder="Full name" class="w-full" />
            </UFormField>

            <UFormField label="Authorized Signatory Position" required>
              <UInput v-model="form.signatoryPosition" placeholder="e.g. CEO, HR Director" class="w-full" />
            </UFormField>

            <UFormField label="Payroll Contact Person" required>
              <UInput v-model="form.contactPerson" placeholder="Full name" class="w-full" />
            </UFormField>

            <UFormField label="Payroll Contact Position" required>
              <UInput v-model="form.contactPosition" placeholder="e.g. Payroll Officer" class="w-full" />
            </UFormField>

            <UFormField label="Contact Phone" required>
              <UInput v-model="form.contactPhone" placeholder="e.g. +63 917 123 4567" class="w-full" />
            </UFormField>

            <UFormField label="Work Email (optional)">
              <UInput v-model="form.email" type="email" placeholder="you@company.com" class="w-full" />
            </UFormField>

            <label class="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <input
                v-model="form.dataPrivacyConsent"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              <span class="text-sm text-gray-600 dark:text-gray-300">
                By ticking this box, I confirm that I have read and understood the Privacy Policy. I voluntarily consent to the collection, use, processing, and storage of my personal data by [Company Name] for payroll assessment, implementation planning, compliance evaluation, and related legitimate business purposes in accordance with the Data Privacy Act of 2012 and applicable regulations of the National Privacy Commission.
              </span>
            </label>

            <UAlert
              v-if="formError"
              color="error"
              variant="soft"
              :description="formError"
              icon="i-lucide-alert-circle"
            />

            <UButton
              type="submit"
              block
              :loading="loading"
              :disabled="!form.dataPrivacyConsent"
              size="lg"
              class="mt-2"
            >
              Start Assessment
            </UButton>
          </form>

          <template #footer>
            <p class="text-xs text-center text-gray-400">
              Takes about 10–15 minutes. Your answers are kept confidential.
            </p>
          </template>
        </UCard>
      </template>

    </div>
  </div>
</template>
