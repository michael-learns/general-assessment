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
const { loadSession, saveSession, clearSession } = useAssessmentSession(productSlug)

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
  otherIndustry: '',
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

const effectiveIndustry = computed(() =>
  form.industry === 'Other' ? form.otherIndustry.trim() : form.industry
)

const loading = ref(false)
const submitError = ref('')

type FieldKey = 'companyName' | 'industry' | 'otherIndustry' | 'address' | 'tin' |
  'numberOfEmployees' | 'authorizedSignatory' | 'signatoryPosition' |
  'contactPerson' | 'contactPosition' | 'contactPhone' | 'email'

const fieldErrors = reactive<Partial<Record<FieldKey, string>>>({})
const touched = reactive<Partial<Record<FieldKey, boolean>>>({})

const TIN_RE = /^\d{3}-\d{3}-\d{3}-\d{3}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s\-().]{6,}$/

function validateField(field: FieldKey) {
  const v = (form as Record<string, unknown>)[field]
  const str = typeof v === 'string' ? v.trim() : ''

  switch (field) {
    case 'companyName':
      fieldErrors.companyName = str ? '' : 'Company name is required.'
      break
    case 'industry':
      fieldErrors.industry = form.industry ? '' : 'Please select an industry.'
      break
    case 'otherIndustry':
      fieldErrors.otherIndustry = str ? '' : 'Please specify your industry.'
      break
    case 'address':
      fieldErrors.address = str ? '' : 'Company address is required.'
      break
    case 'tin':
      if (!str) fieldErrors.tin = 'Company TIN is required.'
      else if (!TIN_RE.test(str)) fieldErrors.tin = 'Use the format 000-000-000-000.'
      else fieldErrors.tin = ''
      break
    case 'numberOfEmployees':
      fieldErrors.numberOfEmployees = (form.numberOfEmployees && form.numberOfEmployees >= 1)
        ? '' : 'Enter a valid number of employees.'
      break
    case 'authorizedSignatory':
      fieldErrors.authorizedSignatory = str ? '' : 'Signatory name is required.'
      break
    case 'signatoryPosition':
      fieldErrors.signatoryPosition = str ? '' : 'Signatory position is required.'
      break
    case 'contactPerson':
      fieldErrors.contactPerson = str ? '' : 'Contact person name is required.'
      break
    case 'contactPosition':
      fieldErrors.contactPosition = str ? '' : 'Contact position is required.'
      break
    case 'contactPhone':
      if (!str) fieldErrors.contactPhone = 'Phone number is required.'
      else if (!PHONE_RE.test(str)) fieldErrors.contactPhone = 'Enter a valid phone number.'
      else fieldErrors.contactPhone = ''
      break
    case 'email':
      if (!str) fieldErrors.email = 'Work email is required.'
      else if (!EMAIL_RE.test(str)) fieldErrors.email = 'Enter a valid email address.'
      else fieldErrors.email = ''
      break
  }
}

function touchAndValidate(field: FieldKey) {
  touched[field] = true
  validateField(field)
}

function validateAll(): boolean {
  const fields: FieldKey[] = [
    'companyName', 'industry', 'address', 'tin', 'numberOfEmployees',
    'authorizedSignatory', 'signatoryPosition',
    'contactPerson', 'contactPosition', 'contactPhone', 'email'
  ]
  if (form.industry === 'Other') fields.splice(2, 0, 'otherIndustry')
  fields.forEach(f => { touched[f] = true; validateField(f) })
  return fields.every(f => !fieldErrors[f])
}

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

  const activeSession = loadSession()
  if (activeSession?.sessionId) {
    companyName.value = activeSession.companyName
    industry.value = activeSession.industry

    const resumePath = activeSession.stage === 'scope'
      ? `/assess/${productSlug}/${activeSession.sessionId}/scope`
      : activeSession.stage === 'report'
        ? `/report/${productSlug}/${activeSession.sessionId}`
        : `/assess/${productSlug}/${activeSession.sessionId}`

    await navigateTo(resumePath)
    return
  }

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
  clearSession()
  previousSessions.value = []
  codeInput.value = ''
  loginError.value = ''
  showNewCode.value = false
}

async function resumeSession(session: PreviousSession) {
  companyName.value = session.companyName
  industry.value = session.industry
  saveSession({
    sessionId: session._id,
    companyName: session.companyName,
    industry: session.industry,
    product: productSlug,
    stage: session.status === 'completed' ? 'report' : 'chat'
  })
  const path = session.status === 'completed'
    ? `/report/${productSlug}/${session._id}`
    : `/assess/${productSlug}/${session._id}`
  await navigateTo(path)
}

async function startAssessment() {
  submitError.value = ''
  if (!validateAll()) return
  if (!form.dataPrivacyConsent) {
    submitError.value = 'Please accept the data privacy consent to continue.'
    return
  }

  loading.value = true

  try {
    const { sessionId } = await $fetch<{ sessionId: string }>('/api/sessions', {
      method: 'POST',
      body: {
        ...form,
        industry: effectiveIndustry.value,
        userId: userId.value ?? undefined,
        product: productSlug,
        contactName: contactName || undefined,
        sourceRef: sourceRef || undefined
      }
    })
    companyName.value = form.companyName
    industry.value = effectiveIndustry.value
    saveSession({
      sessionId,
      companyName: form.companyName.trim(),
      industry: effectiveIndustry.value,
      product: productSlug,
      stage: 'scope'
    })
    await navigateTo(`/assess/${productSlug}/${sessionId}/scope`)
  } catch {
    submitError.value = 'Something went wrong. Please try again.'
    loading.value = false
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="ap-shell">
    <div class="ap-ambient" aria-hidden="true" />

    <!-- Top bar (logged-in only) -->
    <header v-if="userId" class="ap-bar">
      <div class="ap-bar-inner">
        <div class="ap-bar-logo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <defs>
              <linearGradient id="idx-lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0a84ff" />
                <stop offset="100%" stop-color="#0040c0" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#idx-lg)" />
            <path d="M8 12.5l2.6 2.6L16 9.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>{{ assessmentConfig.productName }}</span>
        </div>
        <div class="ap-bar-spacer" />
        <div class="ap-session-pill">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
            <path d="M7 9a3 3 0 0 0 4.2 0l2-2a3 3 0 1 0-4.2-4.2L8 3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            <path d="M9 7a3 3 0 0 0-4.2 0l-2 2a3 3 0 1 0 4.2 4.2L8 12.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span>{{ userId }}</span>
        </div>
        <button class="ap-bar-btn" @click="handleLogout">
          <svg viewBox="0 0 20 20" width="13" height="13" fill="none">
            <path d="M11 14v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M14 7l3 3-3 3M8 10h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Log out
        </button>
      </div>
    </header>

    <main class="ap-main">

      <!-- ─── Not logged in ─── -->
      <template v-if="!userId">
        <HowItWorks />

        <div class="ap-card ap-card--center ap-fade-up">
          <div class="ap-login-hero">
            <div class="ap-login-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                <defs>
                  <linearGradient id="idx-lg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#0a84ff" />
                    <stop offset="100%" stop-color="#0040c0" />
                  </linearGradient>
                </defs>
                <rect x="1" y="1" width="22" height="22" rx="7" fill="url(#idx-lg2)" />
                <path d="M8 12.5l2.6 2.6L16 9.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h1 class="ap-login-title">{{ assessmentConfig.productName }} Fit Assessment</h1>
            <p class="ap-login-sub">Use an access code to save your progress and resume later.</p>
          </div>

          <div class="ap-login-body">
            <!-- Enter code -->
            <div class="ap-field">
              <label class="ap-label">Enter your access code</label>
              <div class="ap-input-row">
                <input
                  v-model="codeInput"
                  class="ap-input"
                  placeholder="XXXX-XXXX"
                  style="text-transform: uppercase; letter-spacing: 0.08em;"
                  @keydown.enter="handleLogin"
                />
                <button class="ap-btn-primary ap-btn-primary--sm" @click="handleLogin">Continue</button>
              </div>
              <p v-if="loginError" class="ap-field-error">{{ loginError }}</p>
            </div>

            <div class="ap-or-divider"><span>or</span></div>

            <!-- Generate new code -->
            <div v-if="!showNewCode">
              <button class="ap-btn-outline ap-btn-outline--block" @click="handleGenerateCode">
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                  <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.4" />
                  <path d="M10 6.5v7M6.5 10h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                Generate a new access code
              </button>
            </div>

            <div v-else class="ap-code-reveal ap-fade-up">
              <p class="ap-code-reveal-label">Your access code</p>
              <p class="ap-code-reveal-code">{{ generatedCode }}</p>
              <p class="ap-code-reveal-hint">Save this code — you'll need it to resume later.</p>
              <button class="ap-btn-primary ap-btn-primary--block" @click="handleUseGeneratedCode">
                Use this code &amp; continue
              </button>
              <button class="ap-btn-ghost ap-btn-ghost--block" @click="showNewCode = false">
                Cancel
              </button>
            </div>

            <p class="ap-skip-hint">
              <button @click="login('guest_' + Date.now())">Continue without a code</button>
              &nbsp;(progress won't be saved)
            </p>
          </div>
        </div>
      </template>

      <!-- ─── Logged in ─── -->
      <template v-else>
        <!-- Previous sessions -->
        <div v-if="loadingSessions || previousSessions.length > 0" class="ap-card ap-fade-up">
          <div class="ap-card-head-sm">Your assessments</div>

          <div v-if="loadingSessions" class="ap-loading">
            <span class="ap-spin" />
          </div>

          <ul v-else class="ap-sessions-list">
            <li v-for="session in previousSessions" :key="session._id" class="ap-session-row">
              <div class="ap-session-info">
                <span class="ap-session-company">{{ session.companyName }}</span>
                <span class="ap-session-meta">{{ session.industry }} · {{ formatDate(session.createdAt) }}</span>
              </div>
              <div class="ap-session-actions">
                <span :class="['ap-badge', session.status === 'completed' ? 'ap-badge--green' : 'ap-badge--yellow']">
                  {{ session.status === 'completed' ? 'Completed' : 'In progress' }}
                </span>
                <button class="ap-bar-btn" @click="resumeSession(session)">
                  {{ session.status === 'completed' ? 'View report' : 'Resume' }}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- New assessment form -->
        <div class="ap-card ap-fade-up">
          <div class="ap-card-head-sm">Start a new {{ assessmentConfig.productName }} assessment</div>

          <form class="ap-form" @submit.prevent="startAssessment">
            <!-- Group 1: Company -->
            <div class="ap-group">
              <div class="ap-group-label">Company</div>
              <div class="ap-group-fields">
                <div class="ap-field">
                  <label class="ap-label">Company Name <span class="ap-req">*</span></label>
                  <input
                    v-model="form.companyName"
                    :class="['ap-input', { 'ap-input--error': touched.companyName && fieldErrors.companyName }]"
                    placeholder="Acme Corp"
                    autofocus
                    @blur="touchAndValidate('companyName')"
                    @input="touched.companyName && validateField('companyName')"
                  />
                  <span v-if="touched.companyName && fieldErrors.companyName" class="ap-field-error">{{ fieldErrors.companyName }}</span>
                </div>

                <div class="ap-field">
                  <label class="ap-label">Industry <span class="ap-req">*</span></label>
                  <div class="ap-select-wrap">
                    <select
                      v-model="form.industry"
                      :class="['ap-select', { 'ap-input--error': touched.industry && fieldErrors.industry }]"
                      @blur="touchAndValidate('industry')"
                      @change="touched.industry && validateField('industry')"
                    >
                      <option value="" disabled>Select your industry</option>
                      <option v-for="ind in industries" :key="ind" :value="ind">{{ ind }}</option>
                    </select>
                    <svg class="ap-chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </div>
                  <span v-if="touched.industry && fieldErrors.industry" class="ap-field-error">{{ fieldErrors.industry }}</span>
                  <template v-if="form.industry === 'Other'">
                    <input
                      v-model="form.otherIndustry"
                      :class="['ap-input', { 'ap-input--error': touched.otherIndustry && fieldErrors.otherIndustry }]"
                      style="margin-top: 8px;"
                      placeholder="Please specify your industry"
                      @blur="touchAndValidate('otherIndustry')"
                      @input="touched.otherIndustry && validateField('otherIndustry')"
                    />
                    <span v-if="touched.otherIndustry && fieldErrors.otherIndustry" class="ap-field-error">{{ fieldErrors.otherIndustry }}</span>
                  </template>
                </div>

                <div class="ap-field">
                  <label class="ap-label">Company Address <span class="ap-req">*</span></label>
                  <textarea
                    v-model="form.address"
                    :class="['ap-textarea', { 'ap-input--error': touched.address && fieldErrors.address }]"
                    rows="2"
                    placeholder="Unit/Floor, Building, Street, City, Province"
                    @blur="touchAndValidate('address')"
                    @input="touched.address && validateField('address')"
                  />
                  <span v-if="touched.address && fieldErrors.address" class="ap-field-error">{{ fieldErrors.address }}</span>
                </div>

                <div class="ap-field-row">
                  <div class="ap-field">
                    <label class="ap-label">Company TIN <span class="ap-req">*</span></label>
                    <input
                      v-model="form.tin"
                      :class="['ap-input', { 'ap-input--error': touched.tin && fieldErrors.tin }]"
                      placeholder="000-000-000-000"
                      @blur="touchAndValidate('tin')"
                      @input="touched.tin && validateField('tin')"
                    />
                    <span v-if="touched.tin && fieldErrors.tin" class="ap-field-error">{{ fieldErrors.tin }}</span>
                  </div>
                  <div class="ap-field">
                    <label class="ap-label">No. of Employees <span class="ap-req">*</span></label>
                    <input
                      v-model.number="form.numberOfEmployees"
                      type="number"
                      :class="['ap-input', { 'ap-input--error': touched.numberOfEmployees && fieldErrors.numberOfEmployees }]"
                      placeholder="e.g. 50"
                      :min="1"
                      @blur="touchAndValidate('numberOfEmployees')"
                      @input="touched.numberOfEmployees && validateField('numberOfEmployees')"
                    />
                    <span v-if="touched.numberOfEmployees && fieldErrors.numberOfEmployees" class="ap-field-error">{{ fieldErrors.numberOfEmployees }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Group 2: Authorized Signatory -->
            <div class="ap-group">
              <div class="ap-group-label">Authorized Signatory</div>
              <div class="ap-group-fields">
                <div class="ap-field">
                  <label class="ap-label">Full Name <span class="ap-req">*</span></label>
                  <input
                    v-model="form.authorizedSignatory"
                    :class="['ap-input', { 'ap-input--error': touched.authorizedSignatory && fieldErrors.authorizedSignatory }]"
                    placeholder="Full name"
                    @blur="touchAndValidate('authorizedSignatory')"
                    @input="touched.authorizedSignatory && validateField('authorizedSignatory')"
                  />
                  <span v-if="touched.authorizedSignatory && fieldErrors.authorizedSignatory" class="ap-field-error">{{ fieldErrors.authorizedSignatory }}</span>
                </div>
                <div class="ap-field">
                  <label class="ap-label">Position <span class="ap-req">*</span></label>
                  <input
                    v-model="form.signatoryPosition"
                    :class="['ap-input', { 'ap-input--error': touched.signatoryPosition && fieldErrors.signatoryPosition }]"
                    placeholder="e.g. CEO, HR Director"
                    @blur="touchAndValidate('signatoryPosition')"
                    @input="touched.signatoryPosition && validateField('signatoryPosition')"
                  />
                  <span v-if="touched.signatoryPosition && fieldErrors.signatoryPosition" class="ap-field-error">{{ fieldErrors.signatoryPosition }}</span>
                </div>
              </div>
            </div>

            <!-- Group 3: Payroll Contact -->
            <div class="ap-group">
              <div class="ap-group-label">Payroll Contact</div>
              <div class="ap-group-fields">
                <div class="ap-field">
                  <label class="ap-label">Full Name <span class="ap-req">*</span></label>
                  <input
                    v-model="form.contactPerson"
                    :class="['ap-input', { 'ap-input--error': touched.contactPerson && fieldErrors.contactPerson }]"
                    placeholder="Full name"
                    @blur="touchAndValidate('contactPerson')"
                    @input="touched.contactPerson && validateField('contactPerson')"
                  />
                  <span v-if="touched.contactPerson && fieldErrors.contactPerson" class="ap-field-error">{{ fieldErrors.contactPerson }}</span>
                </div>
                <div class="ap-field">
                  <label class="ap-label">Position <span class="ap-req">*</span></label>
                  <input
                    v-model="form.contactPosition"
                    :class="['ap-input', { 'ap-input--error': touched.contactPosition && fieldErrors.contactPosition }]"
                    placeholder="e.g. Payroll Officer"
                    @blur="touchAndValidate('contactPosition')"
                    @input="touched.contactPosition && validateField('contactPosition')"
                  />
                  <span v-if="touched.contactPosition && fieldErrors.contactPosition" class="ap-field-error">{{ fieldErrors.contactPosition }}</span>
                </div>
                <div class="ap-field-row">
                  <div class="ap-field">
                    <label class="ap-label">Phone <span class="ap-req">*</span></label>
                    <input
                      v-model="form.contactPhone"
                      :class="['ap-input', { 'ap-input--error': touched.contactPhone && fieldErrors.contactPhone }]"
                      placeholder="+63 917 123 4567"
                      @blur="touchAndValidate('contactPhone')"
                      @input="touched.contactPhone && validateField('contactPhone')"
                    />
                    <span v-if="touched.contactPhone && fieldErrors.contactPhone" class="ap-field-error">{{ fieldErrors.contactPhone }}</span>
                  </div>
                  <div class="ap-field">
                    <label class="ap-label">Work Email <span class="ap-req">*</span></label>
                    <input
                      v-model="form.email"
                      type="email"
                      :class="['ap-input', { 'ap-input--error': touched.email && fieldErrors.email }]"
                      placeholder="you@company.com"
                      @blur="touchAndValidate('email')"
                      @input="touched.email && validateField('email')"
                    />
                    <span v-if="touched.email && fieldErrors.email" class="ap-field-error">{{ fieldErrors.email }}</span>
                  </div>
                </div>
              </div>
            </div>

            <label class="ap-consent">
              <input v-model="form.dataPrivacyConsent" type="checkbox" class="ap-checkbox" />
              <span>
                By ticking this box, I confirm that I have read and understood the Privacy Policy. I voluntarily consent to the collection, use, processing, and storage of my personal data by {{ form.companyName || 'the company' }} for payroll assessment, implementation planning, compliance evaluation, and related legitimate business purposes in accordance with the Data Privacy Act of 2012 and applicable regulations of the National Privacy Commission.
              </span>
            </label>

            <div v-if="submitError" class="ap-form-error">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" style="flex-shrink:0">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
                <path d="M8 5v3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
              </svg>
              {{ submitError }}
            </div>

            <button
              type="submit"
              class="ap-btn-primary ap-btn-primary--block"
              :disabled="loading"
            >
              <span v-if="loading" class="ap-spin ap-spin--white" />
              {{ loading ? 'Starting…' : 'Start Assessment' }}
            </button>
          </form>

          <p class="ap-form-footer">Takes about 10–15 minutes. Your answers are kept confidential.</p>
        </div>
      </template>

    </main>
  </div>
</template>

<style scoped>
/* ── Shell ─────────────────────────────────────────── */
.ap-shell {
  min-height: 100vh;
  background: var(--ap-bg, #f5f5f7);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--ap-ink, #1d1d1f);
  letter-spacing: -0.011em;
  position: relative;
}

.ap-ambient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(1000px 500px at 10% -8%, rgba(0, 113, 227, 0.07), transparent 60%),
    radial-gradient(800px 400px at 90% 110%, rgba(120, 130, 200, 0.05), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ── Top bar ───────────────────────────────────────── */
.ap-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(245, 245, 247, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
}

.ap-bar-inner {
  max-width: 560px;
  margin: 0 auto;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-bar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ap-ink, #1d1d1f);
}

.ap-bar-spacer { flex: 1; }

.ap-session-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
  color: var(--ap-ink-3, #6e6e73);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
}

.ap-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  color: var(--ap-ink-2, #424245);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}
.ap-bar-btn:hover { background: rgba(0, 0, 0, 0.05); }

/* ── Main ──────────────────────────────────────────── */
.ap-main {
  position: relative;
  z-index: 1;
  max-width: 520px;
  margin: 0 auto;
  padding: 48px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Card ──────────────────────────────────────────── */
.ap-card {
  background: #fff;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 24px 48px -16px rgba(0, 0, 0, 0.08), 0 6px 16px -8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ap-card--center { text-align: center; }

.ap-card-head-sm {
  font-size: 13px;
  font-weight: 600;
  color: var(--ap-ink-2, #424245);
  letter-spacing: -0.005em;
  padding: 18px 24px 0;
  margin-bottom: 16px;
}

/* ── Login hero ────────────────────────────────────── */
.ap-login-hero {
  padding: 32px 28px 20px;
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.07));
}

.ap-login-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0a84ff, #0040c0);
  box-shadow: 0 8px 24px -8px rgba(0, 113, 227, 0.5);
  margin-bottom: 18px;
}

.ap-login-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.ap-login-sub {
  font-size: 14px;
  color: var(--ap-ink-3, #6e6e73);
  line-height: 1.45;
  margin: 0;
}

.ap-login-body {
  padding: 20px 28px 28px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Fields ────────────────────────────────────────── */
.ap-field { display: flex; flex-direction: column; }

.ap-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ap-ink-2, #424245);
  margin-bottom: 7px;
  letter-spacing: -0.005em;
}

.ap-req { color: var(--ap-danger, #ff3b30); margin-left: 2px; }

.ap-input,
.ap-select,
.ap-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 14.5px;
  color: var(--ap-ink, #1d1d1f);
  background: var(--ap-bg, #f5f5f7);
  border: none;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 12px;
  padding: 11px 14px;
  box-shadow: inset 0 0 0 1px var(--ap-hairline-strong, rgba(0, 0, 0, 0.13));
  transition: box-shadow 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}

.ap-input:focus,
.ap-select:focus,
.ap-textarea:focus {
  background: #fff;
  box-shadow: inset 0 0 0 1.5px var(--ap-accent, #0071e3), 0 0 0 4px var(--ap-accent-tint, rgba(0, 113, 227, 0.10));
}

.ap-input--error {
  box-shadow: inset 0 0 0 1.5px rgba(255, 59, 48, 0.6);
}
.ap-input--error:focus {
  box-shadow: inset 0 0 0 1.5px var(--ap-danger, #ff3b30), 0 0 0 4px rgba(255, 59, 48, 0.10);
}

.ap-input::placeholder,
.ap-textarea::placeholder { color: #b6b6bb; }

.ap-textarea { line-height: 1.5; resize: vertical; }

.ap-select {
  padding-right: 38px;
  cursor: pointer;
}

.ap-select-wrap { position: relative; }

.ap-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ap-ink-4, #86868b);
  pointer-events: none;
  width: 13px;
  height: 13px;
}

.ap-field-error {
  margin-top: 5px;
  font-size: 12px;
  color: var(--ap-danger, #ff3b30);
  letter-spacing: -0.005em;
}

/* ── Input row (code + button) ─────────────────────── */
.ap-input-row {
  display: flex;
  gap: 8px;
}

.ap-input-row .ap-input { flex: 1; }

/* ── Or divider ────────────────────────────────────── */
.ap-or-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0;
}

.ap-or-divider::before,
.ap-or-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ap-hairline, rgba(0, 0, 0, 0.08));
}

.ap-or-divider span {
  font-size: 12px;
  color: var(--ap-ink-4, #86868b);
  font-weight: 500;
}

/* ── Code reveal ───────────────────────────────────── */
.ap-code-reveal {
  background: var(--ap-accent-tint, rgba(0, 113, 227, 0.07));
  border: 1px solid rgba(0, 113, 227, 0.18);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.ap-code-reveal-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ap-accent, #0071e3);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin: 0;
}

.ap-code-reveal-code {
  font-size: 28px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ap-accent, #0071e3);
  margin: 4px 0;
}

.ap-code-reveal-hint {
  font-size: 12.5px;
  color: var(--ap-ink-3, #6e6e73);
  margin: 0 0 4px;
}

.ap-skip-hint {
  text-align: center;
  font-size: 12px;
  color: var(--ap-ink-4, #86868b);
  margin: 0;
}

.ap-skip-hint button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  color: var(--ap-ink-3, #6e6e73);
  text-decoration: underline;
}

.ap-skip-hint button:hover { color: var(--ap-ink, #1d1d1f); }

/* ── Buttons ───────────────────────────────────────── */
.ap-btn-primary {
  appearance: none;
  border: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
  background: var(--ap-accent, #0071e3);
  color: #fff;
  box-shadow: 0 4px 12px -4px rgba(0, 113, 227, 0.5);
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.ap-btn-primary:hover:not(:disabled) { background: var(--ap-accent-hover, #0077ed); }
.ap-btn-primary:active:not(:disabled) { background: var(--ap-accent-press, #006edb); transform: scale(0.98); }
.ap-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.ap-btn-primary--sm { padding: 10px 16px; font-size: 13.5px; }
.ap-btn-primary--block { width: 100%; justify-content: center; border-radius: 14px; padding: 13px 18px; font-size: 15px; }

.ap-btn-outline {
  appearance: none;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: var(--ap-ink-2, #424245);
  border: 1px solid var(--ap-hairline-strong, rgba(0, 0, 0, 0.14));
  transition: background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.ap-btn-outline:hover { background: rgba(0, 0, 0, 0.04); }
.ap-btn-outline--block { width: 100%; justify-content: center; border-radius: 12px; }

.ap-btn-ghost {
  appearance: none;
  border: none;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  background: transparent;
  color: var(--ap-ink-3, #6e6e73);
  transition: background 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.ap-btn-ghost:hover { background: rgba(0, 0, 0, 0.04); }
.ap-btn-ghost--block { width: 100%; }

/* ── Spinner ───────────────────────────────────────── */
.ap-spin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 113, 227, 0.25);
  border-top-color: var(--ap-accent, #0071e3);
  animation: idx-spin 0.7s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}
.ap-spin--white {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
}
@keyframes idx-spin { to { transform: rotate(360deg); } }

/* ── Sessions list ─────────────────────────────────── */
.ap-sessions-list {
  list-style: none;
  margin: 0;
  padding: 0 24px 8px;
}

.ap-session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.06));
}

.ap-session-row:last-child { border-bottom: none; }

.ap-session-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ap-session-company {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ap-ink, #1d1d1f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ap-session-meta {
  font-size: 12px;
  color: var(--ap-ink-4, #86868b);
}

.ap-session-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ap-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.ap-badge--green { background: rgba(48, 209, 88, 0.12); color: #1a9446; }
.ap-badge--yellow { background: rgba(255, 196, 0, 0.12); color: #8f6200; }

/* ── Form ──────────────────────────────────────────── */
.ap-form {
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.ap-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* ── Field groups ──────────────────────────────────── */
.ap-group {
  padding: 16px 0;
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.07));
}

.ap-group:last-of-type { border-bottom: none; }

.ap-group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--ap-ink-4, #86868b);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.ap-group-fields {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.ap-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 400px) {
  .ap-field-row { grid-template-columns: 1fr; }
}

/* ── Consent ───────────────────────────────────────── */
.ap-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--ap-bg, #f5f5f7);
  border: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  border-radius: 14px;
  cursor: pointer;
}

.ap-checkbox {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  accent-color: var(--ap-accent, #0071e3);
  cursor: pointer;
}

.ap-consent span {
  font-size: 12.5px;
  color: var(--ap-ink-3, #6e6e73);
  line-height: 1.5;
}

/* ── Form error ────────────────────────────────────── */
.ap-form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: rgba(255, 59, 48, 0.07);
  border: 1px solid rgba(255, 59, 48, 0.18);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #d93025;
  letter-spacing: -0.008em;
}

/* ── Form footer ───────────────────────────────────── */
.ap-form-footer {
  text-align: center;
  font-size: 12px;
  color: var(--ap-ink-4, #86868b);
  padding: 12px 24px 20px;
  margin: 0;
  border-top: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.06));
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 560px) {
  .ap-main { padding: 24px 12px 48px; }
  .ap-login-hero { padding: 24px 20px 16px; }
  .ap-login-body { padding: 16px 20px 24px; }
  .ap-form { padding: 0 16px; }
  .ap-sessions-list { padding: 0 16px 8px; }
  .ap-card-head-sm { padding: 16px 16px 0; }
  .ap-form-footer { padding: 12px 16px 16px; }
}
</style>
