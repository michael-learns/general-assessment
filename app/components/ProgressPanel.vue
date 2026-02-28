<script setup lang="ts">
defineProps<{
  sections: string[]
  currentSection: string
  completedSections: string[]
  isCheckingFeature?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  jumpToSection: [section: string]
}>()

function getStatus(section: string, currentSection: string, completedSections: string[]) {
  if (completedSections.includes(section)) return 'completed'
  if (section === currentSection) return 'active'
  return 'pending'
}
</script>

<template>
  <div class="space-y-3">
    <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      Assessment Progress
    </h2>

    <div class="space-y-1">
      <button
        v-for="section in sections"
        :key="section"
        type="button"
        class="w-full flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-200 text-left"
        :class="{
          'bg-primary-50 dark:bg-primary-950/50': getStatus(section, currentSection, completedSections) === 'active',
          'opacity-50': getStatus(section, currentSection, completedSections) === 'pending',
          'hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer': !disabled
        }"
        :disabled="disabled"
        @click="emit('jumpToSection', section)"
      >
        <div class="w-5 h-5 shrink-0 flex items-center justify-center">
          <UIcon
            v-if="getStatus(section, currentSection, completedSections) === 'completed'"
            name="i-lucide-check-circle-2"
            class="text-green-500 w-5 h-5"
          />
          <div
            v-else-if="getStatus(section, currentSection, completedSections) === 'active'"
            class="w-3 h-3 rounded-full bg-primary-500 ring-2 ring-primary-200 dark:ring-primary-800"
          />
          <div
            v-else
            class="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600"
          />
        </div>

        <span
          class="text-sm transition-all"
          :class="getStatus(section, currentSection, completedSections) === 'active'
            ? 'font-semibold text-primary-600 dark:text-primary-400'
            : 'text-gray-700 dark:text-gray-300'"
        >
          {{ section }}
        </span>
      </button>
    </div>

    <Transition name="fade">
      <div
        v-if="isCheckingFeature"
        class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800"
      >
        <UIcon name="i-lucide-search" class="w-3 h-3 animate-pulse text-primary-400" />
        <span>Checking feature support...</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
