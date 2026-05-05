<script setup lang="ts">
import { getConfig } from '../../../../lib/assessments/index'
import { parseAssessmentBlock } from '../../../../lib/assessmentScorer'

const route = useRoute()
const sessionId = route.params.sessionId as string
const productSlug = route.params.product as string
const isReviewEditMode = computed(() => route.query.mode === 'edit')

const assessmentConfig = getConfig(productSlug)

if (!assessmentConfig) {
  throw createError({ statusCode: 404, statusMessage: `Product "${productSlug}" not found` })
}

const companyName = useState<string>('companyName', () => '')
const industry = useState<string>('industry', () => '')
const { loadSession, saveSession, clearSession } = useAssessmentSession(productSlug)

const { userId, logout } = useAuth()

async function handleLogout() {
  logout()
  clearSession()
  await navigateTo('/')
}

const {
  messages,
  isStreaming,
  isCheckingFeature,
  streamingContent,
  saveStatus,
  error,
  loadMessages,
  sendMessage,
  sendGreeting
} = useChat(sessionId, companyName, industry, productSlug)

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const currentSection = ref(assessmentConfig.sections[0]?.name ?? 'Company Overview')
const completedSections = ref<string[]>([])
const isFinalizing = ref(false)
const justSaved = ref(false)
const confirmingRestart = ref(false)
const pendingFinalMessage = ref('')
const selectedOptions = ref<string[]>([])
const otherOptionText = ref('')

function isOtherOption(option: string): boolean {
  return option.toLowerCase().includes('other')
}

function parseAnswerOptions(content: string): string[] {
  if (!content) return []
  const lines = content.split('\n')
  const optionsStart = lines.findIndex(line => /^(options|choices)\s*:?\s*$/i.test(line.trim()))
  if (optionsStart === -1) return []

  const options: string[] = []
  for (let i = optionsStart + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const rawLine = line.trim()
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

    if (option) {
      let normalizedOption = option.replace(/^partners:\s*/i, '').trim()
      if (/^bi[-\s]?weekly$/i.test(normalizedOption)) {
        normalizedOption = 'Bi-monthly'
      }
      if (/^mixed\s*\(.*\)$/i.test(normalizedOption)) {
        normalizedOption = 'Mixed'
      }
      if (/^others?\b/i.test(normalizedOption)) {
        normalizedOption = 'OTHERS (Type Answer)'
      }
      options.push(normalizedOption)
    }
    if (options.length >= 8) break
  }

  return options
}

function stripAssessmentBlock(content: string): string {
  // Remove complete assessment blocks
  let result = content.replace(/```assessment[\s\S]*?```/g, '')
  // Also remove incomplete/in-progress assessment blocks (during streaming)
  result = result.replace(/```assessment[\s\S]*$/g, '')
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

function stripOptionsBlock(content: string): string {
  if (!content) return content
  const lines = content.split('\n')
  const output: string[] = []
  let skippingOptions = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (!skippingOptions && /^(options|choices)\s*:?\s*$/i.test(trimmed)) {
      skippingOptions = true
      continue
    }

    if (skippingOptions) {
      const isOptionLine = /^[-*]\s+/.test(trimmed) || /^\d+[\.\)]\s+/.test(trimmed) || /^[A-Za-z][\.\)]\s+/.test(trimmed)
      if (!trimmed || isOptionLine) {
        continue
      }
      skippingOptions = false
    }

    output.push(line)
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

const latestModelMessage = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const message = messages.value[i]
    if (message?.role === 'model') return message.content
  }
  return ''
})

const fallbackOptions = ['Yes', 'No', 'Not sure', 'Other (please specify)']

function requiresTypedName(content: string): boolean {
  const normalized = content.toLowerCase()
  return normalized.includes('first name') || normalized.includes('your name')
}

const currentQuestionOptions = computed(() => {
  if (showGreeting.value) return greetingOptions
  if (requiresTypedName(latestModelMessage.value)) return []
  const parsedOptions = parseAnswerOptions(latestModelMessage.value)
  if (parsedOptions.length > 0) return parsedOptions
  if (latestModelMessage.value.includes('?')) return fallbackOptions
  return []
})

const needsOtherInput = computed(() => selectedOptions.value.some(isOtherOption))

const hasSelectedResponse = computed(() => {
  if (selectedOptions.value.length === 0) return false
  if (needsOtherInput.value) return !!otherOptionText.value.trim()
  return true
})

const canSendMessage = computed(() =>
  !isStreaming.value &&
  !isFinalizing.value &&
  (!!inputMessage.value.trim() || hasSelectedResponse.value)
)

function toggleOption(option: string) {
  if (isStreaming.value || isFinalizing.value) return
  if (selectedOptions.value.includes(option)) {
    selectedOptions.value = selectedOptions.value.filter(o => o !== option)
    if (isOtherOption(option)) otherOptionText.value = ''
    return
  }
  selectedOptions.value = [...selectedOptions.value, option]
}

function buildSelectedOptionsMessage(): string {
  return selectedOptions.value
    .map(option => {
      if (isOtherOption(option)) return `Other: ${otherOptionText.value.trim()}`
      return option
    })
    .join('; ')
}

async function jumpToSection(section: string) {
  if (isStreaming.value || isFinalizing.value) return
  currentSection.value = section
  selectedOptions.value = []
  otherOptionText.value = ''
  inputMessage.value = ''
  pendingFinalMessage.value = ''

  await sendMessage(`I want to review and correct my answers in the "${section}" module. Please ask me the questions for this module again one by one, and use my updated answers for the final assessment.`)
}

async function restartAssessment() {
  if (!confirmingRestart.value) {
    confirmingRestart.value = true
    return
  }
  clearSession()
  companyName.value = ''
  industry.value = ''
  await navigateTo(`/assess/${productSlug}`)
}

useSeoMeta({ title: `Assessment in Progress — ${assessmentConfig.productName} Fit` })

// Auto-scroll to bottom on new messages
watch([messages, streamingContent], async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}, { deep: true })

// Detect section transitions and assessment completion from AI messages
watch(messages, (newMessages) => {
  const aiMessages = [...newMessages].filter(m => m.role === 'model')
  const lastAi = aiMessages[aiMessages.length - 1]
  if (!lastAi) return

  // Check if assessment is complete
  const assessment = parseAssessmentBlock(lastAi.content)
  if (assessment && !isFinalizing.value) {
    pendingFinalMessage.value = lastAi.content
    return
  }

  // Detect section transitions
  const sectionNames = assessmentConfig.sections.map(s => s.name)
  for (const section of sectionNames) {
    if (
      lastAi.content.toLowerCase().includes(section.toLowerCase()) &&
      section !== currentSection.value &&
      !completedSections.value.includes(section)
    ) {
      if (!completedSections.value.includes(currentSection.value)) {
        completedSections.value = [...completedSections.value, currentSection.value]
      }
      currentSection.value = section
      break
    }
  }

  const lastMessage = newMessages[newMessages.length - 1]
  if (lastMessage?.role === 'model') {
    selectedOptions.value = []
    otherOptionText.value = ''
  }
}, { deep: true })

const greetingMessage = computed(() =>
  `Hi there! I'm your payroll consultant, and I'm here to help determine if our payroll system is a good fit for **${companyName.value}**. I already have some information from your registration and scoping form, so we can jump right in.\n\nTo start — how did you hear about Yahshua?`
)

const greetingOptions = ['GLOBE', 'RCBC', 'STERLING BANK OF ASIA', 'OTHERS (Type Answer)']
const showGreeting = computed(() => messages.value.length === 0 && !isStreaming.value && companyName.value)

async function handleSend() {
  if (!canSendMessage.value) return
  // Inject greeting into history before first user message
  if (messages.value.length === 0) {
    loadMessages([{
      role: 'model',
      content: greetingMessage.value,
      timestamp: Date.now()
    }])
  }
  const msg = inputMessage.value.trim() || buildSelectedOptionsMessage()
  inputMessage.value = ''
  selectedOptions.value = []
  otherOptionText.value = ''
  await sendMessage(msg)
}

async function finalizeAssessment(lastMessage: string) {
  isFinalizing.value = true
  try {
    await $fetch('/api/assessment/finalize', {
      method: 'POST',
      body: {
        sessionId,
        lastAssistantMessage: lastMessage,
        companyName: companyName.value,
        industry: industry.value,
        product: productSlug
      }
    })
    saveSession({
      sessionId,
      companyName: companyName.value,
      industry: industry.value,
      product: productSlug,
      stage: 'report'
    })
    await navigateTo(`/report/${productSlug}/${sessionId}`)
  } catch (err) {
    console.error('Failed to finalize assessment:', err)
    isFinalizing.value = false
  }
}

async function confirmFinalize() {
  if (!pendingFinalMessage.value || isFinalizing.value) return
  await finalizeAssessment(pendingFinalMessage.value)
}

function handleManualSave() {
  justSaved.value = true
  setTimeout(() => { justSaved.value = false }, 2000)
}

onMounted(async () => {
  // Restore auth state on refresh
  const { loadFromStorage } = useAuth()
  loadFromStorage()

  const persistedSession = loadSession()
  if (persistedSession?.sessionId === sessionId) {
    if (!companyName.value) companyName.value = persistedSession.companyName
    if (!industry.value) industry.value = persistedSession.industry
  }

  // Redirect to scoping form if not yet completed
  const session = await $fetch<{ companyName: string; industry: string; scopingCompleted?: boolean } | null>(
    `/api/sessions/${sessionId}`
  ).catch(() => null)
  if (session && !session.scopingCompleted) {
    await navigateTo(`/assess/${productSlug}/${sessionId}/scope`)
    return
  }

  // Restore session data if state was lost (e.g. page refresh or direct link)
  if (!companyName.value) {
    if (session) {
      companyName.value = session.companyName
      industry.value = session.industry
    } else if (persistedSession?.sessionId === sessionId) {
      companyName.value = persistedSession.companyName
      industry.value = persistedSession.industry
    } else {
      await navigateTo(`/assess/${productSlug}`)
      return
    }
  }

  // Load previous messages (enables refresh/resume)
  try {
    const previous = await $fetch<Array<{ role: 'user' | 'model'; content: string; timestamp: number }>>(
      `/api/sessions/${sessionId}/messages`
    )
    if (previous && previous.length > 0) {
      loadMessages(previous)
      saveSession({
        sessionId,
        companyName: companyName.value,
        industry: industry.value,
        product: productSlug,
        stage: 'chat'
      })

      // Review/Edit mode: continue from captured answers instead of restarting modules.
      if (isReviewEditMode.value) {
        const editPromptKey = `review_edit_prompted_${sessionId}`
        const alreadyPrompted = sessionStorage.getItem(editPromptKey) === '1'
        if (!alreadyPrompted) {
          sessionStorage.setItem(editPromptKey, '1')
          await sendMessage('I want to review and edit my existing answers only. Do not restart from the first question of each module. Briefly summarize my current answers by module and ask me which specific answers I want to change.')
        }
      }
      return // Don't auto-start — we have history already
    }
  } catch {
    // Non-fatal — fall through to auto-start
  }

  // No prior messages — start fresh with a manual greeting
  if (companyName.value) {
    saveSession({
      sessionId,
      companyName: companyName.value,
      industry: industry.value,
      product: productSlug,
      stage: 'chat'
    })
    loadMessages([{
      role: 'model',
      content: `Hi there! I'm your payroll consultant, and I'm here to help determine if our payroll system is a good fit for **${companyName.value}**. I already have some information from your registration and scoping form, so we can jump right in.\n\nTo start — how did you hear about Yahshua?\n\nOptions:\n- GLOBE\n- RCBC\n- STERLING BANK OF ASIA\n- OTHERS (Type Answer)`,
      timestamp: Date.now()
    }])
  }
})
</script>

<template>
  <div class="ch-shell">
    <!-- Translucent top bar -->
    <header class="ch-bar">
      <div class="ch-bar-inner">
        <!-- Logo + title -->
        <div class="ch-title">
          <div class="ch-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <defs>
                <linearGradient id="ch-lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#0a84ff" />
                  <stop offset="100%" stop-color="#0040c0" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ch-lg)" />
              <path d="M8 12.5l2.6 2.6L16 9.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span>{{ assessmentConfig.productName }} · Fit Assessment</span>
          <span v-if="companyName" class="ch-badge">{{ companyName }}</span>
        </div>

        <div class="ch-spacer" />

        <!-- Generating report badge -->
        <div v-if="isFinalizing" class="ch-pill ch-pill--success">
          <span class="ch-pill-dot ch-pill-dot--success" />
          Generating report…
        </div>

        <!-- Save status -->
        <div v-else-if="saveStatus === 'saving'" class="ch-pill">
          <span class="ch-spin" aria-hidden="true" />
          Saving…
        </div>
        <div v-else-if="saveStatus === 'saved' || justSaved" class="ch-pill ch-pill--saved">
          <span class="ch-pill-dot ch-pill-dot--success" />
          Saved
        </div>

        <!-- Session ID -->
        <div class="ch-session" title="Session ID">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path d="M7 9a3 3 0 0 0 4.2 0l2-2a3 3 0 1 0-4.2-4.2L8 3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            <path d="M9 7a3 3 0 0 0-4.2 0l-2 2a3 3 0 1 0 4.2 4.2L8 12.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <span class="ch-session-id">{{ sessionId }}</span>
        </div>

        <!-- Save button -->
        <button
          v-if="messages.length > 0 && !isFinalizing"
          class="ch-btn"
          :disabled="isStreaming || saveStatus === 'saving'"
          @click="handleManualSave"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path d="M3 3h7l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4" />
            <path d="M5 3v3h5V3M5 9h6v4H5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
          </svg>
          Save
        </button>

        <!-- Restart -->
        <button
          v-if="!isFinalizing"
          :class="['ch-btn', { 'ch-btn--danger': confirmingRestart }]"
          @click="restartAssessment"
          @blur="confirmingRestart = false"
        >
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
            <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M14 2v3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ confirmingRestart ? 'Confirm restart?' : 'Restart' }}
        </button>

        <!-- Logout -->
        <button v-if="userId" class="ch-btn" aria-label="Log out" @click="handleLogout">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
            <path d="M11 14v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M14 7l3 3-3 3M8 10h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Log out
        </button>
      </div>
    </header>

    <!-- Body -->
    <div class="ch-body">
      <!-- Chat main -->
      <section class="ch-main">
        <!-- Messages -->
        <div ref="messagesContainer" class="ch-scroll">
          <MessageBubble
            v-if="messages.length === 0 && !isStreaming && companyName"
            role="model"
            :content="greetingMessage"
          />
          <MessageBubble
            v-for="(msg, i) in messages"
            :key="i"
            :role="msg.role"
            :content="msg.role === 'model' ? stripAssessmentBlock(stripOptionsBlock(msg.content)) : msg.content"
          />
          <MessageBubble
            v-if="isStreaming && streamingContent"
            role="model"
            :content="stripAssessmentBlock(stripOptionsBlock(streamingContent))"
            :is-streaming="true"
          />

          <!-- Typing dots -->
          <div v-if="isStreaming && !streamingContent" class="ch-typing-row ap-fade-up">
            <div class="ch-typing-avatar">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M10 2.5l1.7 4.3 4.3 1.7-4.3 1.7L10 14.5l-1.7-4.3L4 8.5l4.3-1.7L10 2.5z" fill="currentColor" />
              </svg>
            </div>
            <div class="ch-typing-bubble">
              <span class="ch-dot" style="animation-delay: 0s" />
              <span class="ch-dot" style="animation-delay: 0.15s" />
              <span class="ch-dot" style="animation-delay: 0.3s" />
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="ch-error">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" class="ch-error-icon" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 5v3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
          </svg>
          {{ error }}
        </div>

        <!-- Composer area -->
        <div class="ch-composer-wrap">
          <!-- Assessment-ready banner -->
          <div v-if="pendingFinalMessage" class="ch-ready-banner ap-fade-up">
            <div class="ch-ready-icon">
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M7 10l2.5 2.5L14 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </div>
            <div class="ch-ready-text">
              <strong>Assessment draft is ready.</strong>
              You can review and edit any module before generating the final report.
            </div>
            <button class="ch-ready-btn" :disabled="isFinalizing" @click="confirmFinalize">
              Generate report
            </button>
          </div>

          <!-- Option panel (numbered rows + integrated composer) -->
          <div v-if="currentQuestionOptions.length > 0" class="ch-option-card ap-fade-up">
            <div class="ch-option-head">{{ needsOtherInput ? 'Select one or more' : 'Choose an answer' }}</div>
            <div class="ch-option-list">
              <button
                v-for="(option, i) in currentQuestionOptions"
                :key="option"
                :class="['ch-option-row', { 'ch-option-row--on': selectedOptions.includes(option), 'ch-option-row--other': isOtherOption(option) }]"
                :disabled="isStreaming || isFinalizing"
                @click="toggleOption(option)"
              >
                <span class="ch-option-num">
                  <svg v-if="selectedOptions.includes(option)" viewBox="0 0 16 16" width="10" height="10" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span v-else>{{ i + 1 }}</span>
                </span>
                <span class="ch-option-text">{{ option }}</span>
              </button>
            </div>
            <!-- Integrated text input -->
            <div class="ch-option-composer">
              <svg class="ch-option-pencil" viewBox="0 0 20 20" width="15" height="15" fill="none">
                <path d="M3 14.5l1.2-4.2L13.5 1l3.5 3.5-9.3 9.3L3 14.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M11 3l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <textarea
                v-model="inputMessage"
                class="ch-option-input"
                :placeholder="needsOtherInput ? 'Enter your custom answer…' : 'Or type your own response…'"
                rows="1"
                :disabled="isStreaming || isFinalizing"
                @keydown.enter.exact.prevent="handleSend"
                @input="(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }"
              />
              <button
                :class="['ch-send', { 'ch-send--active': canSendMessage }]"
                :disabled="!canSendMessage"
                aria-label="Send"
                @click="handleSend"
              >
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none">
                  <path d="M3 10l14-7-7 14-2-6-5-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Plain composer (no options) -->
          <div v-else class="ch-composer">
            <textarea
              v-model="inputMessage"
              class="ch-composer-input"
              placeholder="Type your response…"
              rows="1"
              :disabled="isStreaming || isFinalizing"
              @keydown.enter.exact.prevent="handleSend"
              @input="(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px' }"
            />
            <button
              :class="['ch-send', { 'ch-send--active': canSendMessage }]"
              :disabled="!canSendMessage"
              aria-label="Send message"
              @click="handleSend"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M3 10l14-7-7 14-2-6-5-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Sidebar (desktop) -->
      <aside class="ch-sidebar">
        <ProgressPanel
          :sections="assessmentConfig.sections.map(s => s.name)"
          :current-section="currentSection"
          :completed-sections="completedSections"
          :is-checking-feature="isCheckingFeature"
          :disabled="isStreaming || isFinalizing"
          @jump-to-section="jumpToSection"
        />

        <!-- Context card -->
        <div class="ch-context-card">
          <div class="ch-context-title">Context</div>
          <div class="ch-context-row">
            <span class="ch-context-label">Company</span>
            <span class="ch-context-val">{{ companyName || '—' }}</span>
          </div>
          <div class="ch-context-row">
            <span class="ch-context-label">Industry</span>
            <span class="ch-context-val">{{ industry || '—' }}</span>
          </div>
          <div class="ch-context-row">
            <span class="ch-context-label">Session</span>
            <span class="ch-context-val" style="font-family: ui-monospace, monospace; font-size: 11px;">{{ sessionId }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* ── Shell ─────────────────────────────────────────── */
.ch-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ap-bg, #f5f5f7);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--ap-ink, #1d1d1f);
  letter-spacing: -0.011em;
}

/* ── Top bar ───────────────────────────────────────── */
.ch-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(245, 245, 247, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  flex-shrink: 0;
}

.ch-bar-inner {
  max-width: 100%;
  padding: 11px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.ch-logo { flex-shrink: 0; display: flex; }

.ch-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -0.012em;
  white-space: nowrap;
}

.ch-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--ap-accent, #0071e3);
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--ap-accent-tint, rgba(0, 113, 227, 0.10));
  letter-spacing: -0.005em;
}

.ch-spacer { flex: 1; }

.ch-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ap-ink-3, #6e6e73);
  background: rgba(0, 0, 0, 0.05);
}

.ch-pill--success {
  background: rgba(48, 209, 88, 0.12);
  color: #1a9446;
}

.ch-pill--saved {
  background: rgba(48, 209, 88, 0.10);
  color: #1a9446;
}

.ch-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.ch-pill-dot--success { background: #30d158; }

.ch-spin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid rgba(0, 0, 0, 0.2);
  border-top-color: var(--ap-accent, #0071e3);
  animation: ch-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes ch-spin { to { transform: rotate(360deg); } }

.ch-session {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ap-ink-3, #6e6e73);
  padding: 5px 8px;
  border-radius: 8px;
}

.ch-session-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0;
  font-size: 11.5px;
}

.ch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--ap-ink-2, #424245);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}

.ch-btn:hover:not(:disabled) { background: rgba(0, 0, 0, 0.05); }
.ch-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.ch-btn--danger {
  color: var(--ap-danger, #ff3b30);
  background: rgba(255, 59, 48, 0.08);
}
.ch-btn--danger:hover:not(:disabled) { background: rgba(255, 59, 48, 0.14); }

/* ── Body ──────────────────────────────────────────── */
.ch-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  overflow: hidden;
}

/* ── Chat main ─────────────────────────────────────── */
.ch-main {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  overflow: hidden;
}

.ch-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 36px 48px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.12) transparent;
}

/* ── Typing dots ───────────────────────────────────── */
.ch-typing-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
}

.ch-typing-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a84ff, #0040c0);
  color: #fff;
  box-shadow: 0 8px 18px -8px rgba(0, 113, 227, 0.55);
}

.ch-typing-bubble {
  background: #fff;
  border: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  border-radius: 4px 18px 18px 18px;
  padding: 16px 18px;
  display: inline-flex;
  gap: 5px;
  align-items: center;
  box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 12px 28px -16px rgba(0,0,0,0.08);
}

.ch-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--ap-ink-4, #86868b);
  animation: ap-shimmer 1.2s ease-in-out infinite;
}

/* ── Error ─────────────────────────────────────────── */
.ch-error {
  margin: 0 48px 12px;
  padding: 11px 16px;
  background: rgba(255, 59, 48, 0.07);
  border: 1px solid rgba(255, 59, 48, 0.18);
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  color: #d93025;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.008em;
}

.ch-error-icon {
  flex-shrink: 0;
  color: #d93025;
  opacity: 0.9;
}

/* ── Composer wrap ─────────────────────────────────── */
.ch-composer-wrap {
  padding: 12px 48px 24px;
  background: linear-gradient(to top, rgba(245, 245, 247, 0.95) 60%, rgba(245, 245, 247, 0));
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

/* Assessment-ready banner */
.ch-ready-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 196, 0, 0.10);
  border: 1px solid rgba(255, 196, 0, 0.3);
  border-radius: 14px;
  margin-bottom: 12px;
}

.ch-ready-icon {
  flex-shrink: 0;
  color: #b07800;
  margin-top: 1px;
}

.ch-ready-text {
  flex: 1;
  font-size: 13.5px;
  color: var(--ap-ink-2, #424245);
  line-height: 1.45;
}

.ch-ready-text strong { color: var(--ap-ink, #1d1d1f); }

.ch-ready-btn {
  flex-shrink: 0;
  appearance: none;
  border: none;
  background: #b07800;
  color: #fff;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
}
.ch-ready-btn:hover:not(:disabled) { background: #8f6200; }
.ch-ready-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Option panel ──────────────────────────────────── */
.ch-option-card {
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  border-radius: 20px;
  box-shadow: 0 2px 8px -4px rgba(0, 0, 0, 0.08), 0 16px 36px -20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.ch-option-head {
  padding: 12px 18px 10px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--ap-ink-4, #86868b);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.07));
}

.ch-option-list { display: flex; flex-direction: column; }

.ch-option-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.06));
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--ap-ink-2, #424245);
  text-align: left;
  transition: background 0.14s ease, color 0.14s ease;
  letter-spacing: -0.008em;
  line-height: 1.35;
}

.ch-option-row:last-child { border-bottom: none; }
.ch-option-row:hover:not(:disabled) { background: var(--ap-bg, #f5f5f7); }

.ch-option-row--on {
  background: var(--ap-accent-tint, rgba(0, 113, 227, 0.07));
  color: var(--ap-accent, #0071e3);
  font-weight: 600;
}
.ch-option-row--on:hover:not(:disabled) { background: rgba(0, 113, 227, 0.11); }
.ch-option-row:disabled { opacity: 0.38; cursor: not-allowed; }

.ch-option-num {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--ap-ink-3, #6e6e73);
  flex-shrink: 0;
  transition: background 0.14s ease, color 0.14s ease;
}

.ch-option-row--on .ch-option-num {
  background: var(--ap-accent, #0071e3);
  color: #fff;
}

.ch-option-text { flex: 1; }

.ch-option-composer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 18px;
  border-top: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.07));
  background: var(--ap-bg, #f5f5f7);
}

.ch-option-pencil {
  flex-shrink: 0;
  color: var(--ap-ink-4, #86868b);
}

.ch-option-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--ap-ink, #1d1d1f);
  resize: none;
  line-height: 1.4;
  max-height: 100px;
  overflow-y: auto;
  padding: 2px 0;
}
.ch-option-input::placeholder { color: #b6b6bb; }

/* Composer bar */
.ch-composer {
  background: #fff;
  border-radius: 18px;
  border: 1px solid var(--ap-hairline-strong, rgba(0, 0, 0, 0.14));
  padding: 6px;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  box-shadow: 0 12px 30px -16px rgba(0, 0, 0, 0.18);
}

.ch-composer-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 9px 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--ap-ink, #1d1d1f);
  background: transparent;
  resize: none;
  line-height: 1.45;
  max-height: 120px;
  overflow-y: auto;
}

.ch-composer-input::placeholder { color: #b6b6bb; }

.ch-send {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 999px;
  border: none;
  background: #e5e5ea;
  color: #fff;
  cursor: not-allowed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease;
}

.ch-send--active {
  background: var(--ap-accent, #0071e3);
  cursor: pointer;
  box-shadow: 0 6px 14px -6px rgba(0, 113, 227, 0.5);
}

.ch-send--active:hover { background: var(--ap-accent-hover, #0077ed); }
.ch-send--active:active { background: var(--ap-accent-press, #006edb); transform: scale(0.94); }

/* ── Sidebar ───────────────────────────────────────── */
.ch-sidebar {
  padding: 36px 24px 24px;
  overflow-y: auto;
  background: var(--ap-bg, #f5f5f7);
}

/* Context card */
.ch-context-card {
  margin-top: 24px;
  padding: 16px 18px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
  box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.08);
}

.ch-context-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ap-ink-4, #86868b);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.ch-context-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  padding: 7px 0;
  color: var(--ap-ink-2, #424245);
  border-bottom: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.06));
}

.ch-context-row:last-child { border-bottom: none; }

.ch-context-label { color: var(--ap-ink-4, #86868b); }

.ch-context-val {
  font-weight: 500;
  max-width: 60%;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 900px) {
  .ch-body { grid-template-columns: 1fr; }
  .ch-sidebar { display: none; }
  .ch-main { border-right: none; }
  .ch-scroll { padding: 24px 20px 16px; }
  .ch-composer-wrap { padding: 10px 16px 20px; }
  .ch-error { margin: 0 16px 10px; }
}
</style>
