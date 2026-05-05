<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{
  role: 'user' | 'assistant' | 'model'
  content: string
  isStreaming?: boolean
}>()

marked.setOptions({ breaks: true, gfm: true })

const renderedContent = computed(() => {
  if (props.role === 'user') return ''
  return marked.parse(props.content) as string
})

const isAI = computed(() => props.role !== 'user')
</script>

<template>
  <!-- AI message -->
  <div v-if="isAI" class="msg-row msg-row--ai ap-fade-up">
    <div class="msg-avatar">
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
        <path d="M10 2.5l1.7 4.3 4.3 1.7-4.3 1.7L10 14.5l-1.7-4.3L4 8.5l4.3-1.7L10 2.5z" fill="currentColor" />
        <circle cx="16" cy="3.5" r="1" fill="currentColor" />
        <circle cx="3.5" cy="14.5" r="0.8" fill="currentColor" />
      </svg>
    </div>
    <div>
      <div class="msg-bubble msg-bubble--ai">
        <div class="msg-prose" v-html="renderedContent" />
        <span v-if="isStreaming" class="msg-cursor" />
      </div>
      <div class="msg-meta">Consultant · just now</div>
    </div>
  </div>

  <!-- User message -->
  <div v-else class="msg-row msg-row--user ap-fade-up">
    <div>
      <div class="msg-bubble msg-bubble--user">
        <p class="msg-text">{{ content }}</p>
      </div>
      <div class="msg-meta msg-meta--right">You · just now</div>
    </div>
  </div>
</template>

<style scoped>
.msg-row {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
  align-items: flex-start;
}

.msg-row--user {
  justify-content: flex-end;
}

.msg-avatar {
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

.msg-bubble {
  border-radius: 18px;
  padding: 14px 18px;
  max-width: 640px;
  font-size: 15.5px;
  line-height: 1.55;
}

.msg-bubble--ai {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px 18px 18px 18px;
  color: #1d1d1f;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02), 0 12px 28px -16px rgba(0, 0, 0, 0.08);
}

.msg-bubble--user {
  background: var(--ap-accent, #0071e3);
  color: #fff;
  border-radius: 18px 4px 18px 18px;
  padding: 12px 16px;
  max-width: 560px;
  box-shadow: 0 8px 20px -8px rgba(0, 113, 227, 0.45);
}

.msg-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.msg-meta {
  font-size: 11px;
  color: #86868b;
  margin-top: 6px;
  letter-spacing: 0.02em;
}

.msg-meta--right { text-align: right; }

.msg-cursor {
  display: inline-block;
  width: 6px;
  height: 15px;
  background: currentColor;
  opacity: 0.7;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ap-shimmer 1s ease-in-out infinite;
}

/* Prose reset for AI bubble */
.msg-prose :deep(p) { margin: 0 0 8px; }
.msg-prose :deep(p:last-child) { margin-bottom: 0; }
.msg-prose :deep(strong) { font-weight: 600; }
.msg-prose :deep(ul), .msg-prose :deep(ol) { padding-left: 20px; margin: 8px 0; }
.msg-prose :deep(li) { margin-bottom: 4px; }
.msg-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 5px;
  border-radius: 5px;
}
</style>
