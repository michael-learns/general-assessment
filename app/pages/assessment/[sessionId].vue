<script setup lang="ts">
import { getSectionNames } from '../../../lib/topicMap'
import { parseAssessmentBlock } from '../../../lib/assessmentScorer'

const route = useRoute()
const sessionId = route.params.sessionId as string

const companyName = useState<string>('companyName', () => '')
const industry = useState<string>('industry', () => '')

const {
  messages,
  isStreaming,
  isCheckingFeature,
  streamingContent,
  error,
  sendMessage
} = useChat(sessionId, companyName.value, industry.value)

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const currentSection = ref('Company Overview')
const completedSections = ref<string[]>([])
const isFinalizing = ref(false)

useSeoMeta({ title: 'Assessment in Progress — Payroll Fit' })

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
    finalizeAssessment(lastAi.content)
    return
  }

  // Detect section transitions
  const sectionNames = getSectionNames()
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
}, { deep: true })

async function handleSend() {
  if (!inputMessage.value.trim() || isStreaming.value) return
  const msg = inputMessage.value.trim()
  inputMessage.value = ''
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
        industry: industry.value
      }
    })
    await navigateTo(`/report/${sessionId}`)
  } catch (err) {
    console.error('Failed to finalize assessment:', err)
    isFinalizing.value = false
  }
}

// Start the conversation automatically when no messages yet
onMounted(async () => {
  // Restore session data if state was lost (e.g. page refresh or direct link)
  if (!companyName.value) {
    try {
      const session = await $fetch<{ companyName: string; industry: string } | null>(
        `/api/sessions/${sessionId}`
      )
      if (session) {
        companyName.value = session.companyName
        industry.value = session.industry
      }
    } catch {
      // Session not found — redirect to landing
      await navigateTo('/')
      return
    }
  }

  if (messages.value.length === 0 && companyName.value) {
    await sendMessage(`Hi! I'm from ${companyName.value}, a ${industry.value} company. I'd like to start the assessment.`)
  }
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
      <UIcon name="i-lucide-brain-circuit" class="text-primary-500 w-5 h-5" />
      <span class="font-semibold text-sm">Payroll Fit Assessment</span>
      <UBadge v-if="companyName" variant="subtle" color="primary" size="sm">
        {{ companyName }}
      </UBadge>
      <div class="ml-auto">
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
            :content="msg.content"
          />

          <!-- Streaming message -->
          <MessageBubble
            v-if="isStreaming && streamingContent"
            role="model"
            :content="streamingContent"
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
        <div class="border-t border-gray-200 dark:border-gray-800 p-4 flex gap-3 shrink-0">
          <UTextarea
            v-model="inputMessage"
            placeholder="Type your response..."
            autoresize
            :rows="1"
            class="flex-1"
            :disabled="isStreaming || isFinalizing"
            @keydown.enter.exact.prevent="handleSend"
          />
          <UButton
            icon="i-lucide-send"
            :loading="isStreaming"
            :disabled="!inputMessage.trim() || isFinalizing"
            aria-label="Send message"
            @click="handleSend"
          />
        </div>
      </div>

      <!-- Progress Panel (desktop only) -->
      <aside class="w-64 border-l border-gray-200 dark:border-gray-800 p-4 hidden lg:block shrink-0 overflow-y-auto">
        <ProgressPanel
          :current-section="currentSection"
          :completed-sections="completedSections"
          :is-checking-feature="isCheckingFeature"
        />
      </aside>
    </div>
  </div>
</template>
