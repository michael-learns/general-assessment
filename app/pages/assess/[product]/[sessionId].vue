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

const { userId, logout } = useAuth()

async function handleLogout() {
  logout()
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
    const rawLine = lines[i].trim()
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
  return content.replace(/```assessment[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim()
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
    if (messages.value[i].role === 'model') return messages.value[i].content
  }
  return ''
})

const fallbackOptions = ['Yes', 'No', 'Not sure', 'Other (please specify)']

function requiresTypedName(content: string): boolean {
  const normalized = content.toLowerCase()
  return normalized.includes('first name') || normalized.includes('your name')
}

const currentQuestionOptions = computed(() => {
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
  localStorage.removeItem('payroll_session')
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

async function handleSend() {
  if (!canSendMessage.value) return
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
      localStorage.setItem('payroll_session', JSON.stringify({
        sessionId,
        companyName: companyName.value,
        industry: industry.value
      }))

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
    localStorage.setItem('payroll_session', JSON.stringify({
      sessionId,
      companyName: companyName.value,
      industry: industry.value
    }))
    loadMessages([{
      role: 'model',
      content: `Hi there! I'm your payroll consultant, and I'm here to help determine if our payroll system is a good fit for **${companyName.value}**. I already have some information from your registration and scoping form, so we can jump right in.\n\nTo start — how did you hear about Yahshua?\n\nOptions:\n- GLOBE\n- RCBC\n- STERLING BANK OF ASIA\n- OTHERS (Type Answer)`,
      timestamp: Date.now()
    }])
  }
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
      <UIcon name="i-lucide-brain-circuit" class="text-primary-500 w-5 h-5" />
      <span class="font-semibold text-sm">{{ assessmentConfig.productName }} Fit Assessment</span>
      <UBadge v-if="companyName" variant="subtle" color="primary" size="sm">
        {{ companyName }}
      </UBadge>

      <div class="ml-auto flex items-center gap-3">
        <!-- Logged-in user code -->
        <span
          v-if="userId && !userId.startsWith('guest_')"
          class="hidden sm:flex items-center gap-1 text-xs text-gray-400 font-mono"
        >
          <UIcon name="i-lucide-key-round" class="w-3 h-3" />
          {{ userId }}
        </span>
        <UButton
          v-if="userId"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-log-out"
          aria-label="Log out"
          @click="handleLogout"
        />
        <!-- Save status indicator -->
        <span
          v-if="saveStatus === 'saving'"
          class="text-xs text-gray-400 flex items-center gap-1"
        >
          <UIcon name="i-lucide-loader-circle" class="w-3 h-3 animate-spin" />
          Saving...
        </span>
        <span
          v-else-if="saveStatus === 'saved' || justSaved"
          class="text-xs text-green-500 flex items-center gap-1"
        >
          <UIcon name="i-lucide-check" class="w-3 h-3" />
          Saved
        </span>

        <!-- Manual save button -->
        <UButton
          v-if="messages.length > 0 && !isFinalizing"
          size="xs"
          variant="ghost"
          icon="i-lucide-save"
          :disabled="isStreaming || saveStatus === 'saving'"
          aria-label="Save progress"
          @click="handleManualSave"
        >
          Save
        </UButton>

        <!-- Restart button -->
        <UButton
          v-if="!isFinalizing"
          size="xs"
          :variant="confirmingRestart ? 'soft' : 'ghost'"
          :color="confirmingRestart ? 'error' : 'neutral'"
          :icon="confirmingRestart ? 'i-lucide-alert-triangle' : 'i-lucide-rotate-ccw'"
          @click="restartAssessment"
          @blur="confirmingRestart = false"
        >
          {{ confirmingRestart ? 'Confirm restart?' : 'Restart' }}
        </UButton>

        <UBadge v-if="isFinalizing" color="success" variant="subtle" size="sm">
          <UIcon name="i-lucide-check" class="w-3 h-3 mr-1" />
          Generating report...
        </UBadge>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Chat Panel -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <MessageBubble
            v-for="(msg, i) in messages"
            :key="i"
            :role="msg.role"
            :content="msg.role === 'model' ? stripAssessmentBlock(stripOptionsBlock(msg.content)) : msg.content"
          />

          <!-- Streaming message -->
          <MessageBubble
            v-if="isStreaming && streamingContent"
            role="model"
            :content="stripAssessmentBlock(stripOptionsBlock(streamingContent))"
            :is-streaming="true"
          />

          <!-- Typing dots indicator -->
          <div v-if="isStreaming && !streamingContent" class="flex gap-3 justify-start">
            <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-bot" class="text-white w-4 h-4" />
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div class="flex gap-1 items-center h-4">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 0ms" />
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 150ms" />
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style="animation-delay: 300ms" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error alert -->
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :description="error"
          icon="i-lucide-alert-circle"
          class="mx-4 mb-2"
        />

        <!-- Input area -->
        <div class="border-t border-gray-200 dark:border-gray-800 shrink-0">
          <UAlert
            v-if="pendingFinalMessage"
            class="mx-4 mt-3"
            color="warning"
            variant="soft"
            icon="i-lucide-file-check-2"
            title="Assessment draft is ready"
            description="You can review and edit any module before generating the final report."
          />
          <div v-if="pendingFinalMessage" class="px-4 pt-2 pb-1 flex gap-2">
            <UButton size="xs" color="warning" :disabled="isFinalizing" @click="confirmFinalize">
              Generate report now
            </UButton>
          </div>

          <div
            v-if="currentQuestionOptions.length > 0"
            class="px-4 pt-3 pb-2"
          >
            <p class="text-xs text-gray-500 mb-2">Select one or more answers:</p>
            <div class="flex flex-col gap-2">
              <UButton
                v-for="option in currentQuestionOptions"
                :key="option"
                size="xs"
                class="w-fit"
                :variant="selectedOptions.includes(option) ? 'solid' : 'soft'"
                color="neutral"
                :disabled="isStreaming || isFinalizing"
                @click="toggleOption(option)"
              >
                {{ option }}
              </UButton>
            </div>
            <UInput
              v-if="needsOtherInput"
              v-model="otherOptionText"
              placeholder="Enter your custom answer"
              class="mt-2"
              :disabled="isStreaming || isFinalizing"
            />
          </div>
          <div class="p-4 flex gap-3">
          <UTextarea
            v-model="inputMessage"
            placeholder="Type your response or select options above..."
            autoresize
            :rows="1"
            class="flex-1"
            :disabled="isStreaming || isFinalizing"
            @keydown.enter.exact.prevent="handleSend"
          />
          <UButton
            icon="i-lucide-send"
            :loading="isStreaming"
            :disabled="!canSendMessage"
            aria-label="Send message"
            @click="handleSend"
          />
          </div>
        </div>
      </div>

      <!-- Progress Panel (desktop only) -->
      <aside class="w-64 border-l border-gray-200 dark:border-gray-800 p-4 hidden lg:block shrink-0 overflow-y-auto">
        <ProgressPanel
          :sections="assessmentConfig.sections.map(s => s.name)"
          :current-section="currentSection"
          :completed-sections="completedSections"
          :is-checking-feature="isCheckingFeature"
          :disabled="isStreaming || isFinalizing"
          @jump-to-section="jumpToSection"
        />
      </aside>
    </div>
  </div>
</template>
