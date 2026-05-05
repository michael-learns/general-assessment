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
  <div>
    <div class="panel-title">Assessment Progress</div>

    <div class="stage-list">
      <button
        v-for="section in sections"
        :key="section"
        type="button"
        :class="['stage', `stage--${getStatus(section, currentSection, completedSections)}`]"
        :disabled="disabled"
        @click="emit('jumpToSection', section)"
      >
        <span :class="['stage-dot', `stage-dot--${getStatus(section, currentSection, completedSections)}`]">
          <svg v-if="getStatus(section, currentSection, completedSections) === 'completed'" viewBox="0 0 16 16" width="11" height="11" fill="none">
            <path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="stage-label">{{ section }}</span>
      </button>
    </div>

    <Transition name="slide-fade">
      <div v-if="isCheckingFeature" class="checking-banner">
        <svg viewBox="0 0 20 20" width="13" height="13" fill="none" class="checking-icon">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
          <path d="M6 10l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Checking feature support…
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.panel-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ap-ink-4, #86868b);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

.stage-list { display: flex; flex-direction: column; gap: 2px; }

.stage {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 14px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  transition: background 0.2s ease, color 0.2s ease;
  color: var(--ap-ink-4, #86868b);
}

.stage--active {
  background: var(--ap-accent-tint, rgba(0, 113, 227, 0.10));
  color: var(--ap-accent, #0071e3);
  font-weight: 600;
}

.stage--completed {
  color: var(--ap-ink-2, #424245);
}

.stage--pending {
  color: var(--ap-ink-4, #86868b);
}

.stage:hover:not(:disabled):not(.stage--active) {
  background: rgba(0, 0, 0, 0.04);
  color: var(--ap-ink-2, #424245);
}

.stage:disabled { cursor: default; }

.stage-dot {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1.5px solid var(--ap-hairline-strong, rgba(0, 0, 0, 0.14));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all 0.2s ease;
  color: #fff;
}

.stage-dot--active {
  border-color: var(--ap-accent, #0071e3);
  box-shadow: 0 0 0 4px var(--ap-accent-tint, rgba(0, 113, 227, 0.10));
}

.stage-dot--completed {
  background: var(--ap-accent, #0071e3);
  border-color: var(--ap-accent, #0071e3);
}

.stage-label { line-height: 1.35; }

/* Checking feature banner */
.checking-banner {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--ap-ink-3, #6e6e73);
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--ap-hairline, rgba(0, 0, 0, 0.08));
}

.checking-icon {
  animation: ap-shimmer 1.2s ease-in-out infinite;
  color: var(--ap-accent, #0071e3);
}

/* Transition */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
