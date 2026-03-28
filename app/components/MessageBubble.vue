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
</script>

<template>
  <div
    class="flex gap-3"
    :class="role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      v-if="role !== 'user'"
      class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-1"
    >
      <UIcon name="i-lucide-bot" class="text-white w-4 h-4" />
    </div>

    <div
      class="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
      :class="role === 'user'
        ? 'bg-primary-500 text-white rounded-tr-sm'
        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-sm'"
    >
      <div v-if="role !== 'user'" class="prose prose-sm dark:prose-invert max-w-none" v-html="renderedContent" />
      <p v-else class="whitespace-pre-wrap">{{ content }}</p>
      <span
        v-if="isStreaming"
        class="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom"
      />
    </div>

    <div
      v-if="role === 'user'"
      class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-1"
    >
      <UIcon name="i-lucide-user" class="w-4 h-4" />
    </div>
  </div>
</template>
