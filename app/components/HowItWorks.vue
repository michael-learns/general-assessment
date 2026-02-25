<script setup lang="ts">
const DISMISSED_KEY = 'payroll_guide_dismissed'
const isOpen = ref(false)
const currentSlide = ref(0)
const direction = ref<'forward' | 'back'>('forward')

const slides = [
  {
    emoji: '👋',
    title: 'Welcome!',
    body: 'This tool will chat with you about your company\'s payroll needs — and tell you if our system is a good fit for your business.',
    note: null
  },
  {
    emoji: '🔑',
    title: 'First, get your personal code',
    body: 'On the next screen, click "Generate a new access code". You\'ll get a short code that looks like this:',
    code: 'MXQT-K7R2',
    note: null
  },
  {
    emoji: '✍️',
    title: 'Write that code down — right now',
    body: 'Your code is the only way to come back and see your results later. Write it on a piece of paper or save it somewhere safe.',
    note: 'We cannot recover your code for you if you lose it.'
  },
  {
    emoji: '💬',
    title: 'Chat with our AI assistant',
    body: 'It will ask simple questions about your business. There are no wrong answers — just be honest. Takes about 10–15 minutes.',
    note: null
  },
  {
    emoji: '📋',
    title: 'Get your free report',
    body: 'At the end, you\'ll receive a clear report showing how well our payroll system matches your needs. You can share it with your team.',
    note: null,
    last: true
  }
]

onMounted(() => {
  if (!localStorage.getItem(DISMISSED_KEY)) {
    setTimeout(() => { isOpen.value = true }, 350)
  }
})

function dismiss() {
  isOpen.value = false
  localStorage.setItem(DISMISSED_KEY, '1')
}

function next() {
  if (currentSlide.value < slides.length - 1) {
    direction.value = 'forward'
    currentSlide.value++
  } else {
    dismiss()
  }
}

function prev() {
  if (currentSlide.value > 0) {
    direction.value = 'back'
    currentSlide.value--
  }
}

function goTo(i: number) {
  direction.value = i > currentSlide.value ? 'forward' : 'back'
  currentSlide.value = i
}

const slide = computed(() => slides[currentSlide.value])
const isLast = computed(() => currentSlide.value === slides.length - 1)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="isOpen" class="hw-overlay" @click.self="dismiss">
        <Transition name="dialog-pop" appear>
          <div v-if="isOpen" class="hw-dialog" role="dialog" aria-modal="true" aria-label="How it works">

            <!-- Close -->
            <button class="hw-close" aria-label="Close" @click="dismiss">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>

            <!-- Slide area -->
            <div class="hw-slide-wrap">
              <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
                <div :key="currentSlide" class="hw-slide">

                  <!-- Emoji -->
                  <div class="hw-emoji">{{ slide.emoji }}</div>

                  <!-- Title -->
                  <h2 class="hw-title">{{ slide.title }}</h2>

                  <!-- Body -->
                  <p class="hw-body">{{ slide.body }}</p>

                  <!-- Inline code example -->
                  <div v-if="slide.code" class="hw-code-example">
                    {{ slide.code }}
                  </div>

                  <!-- Warning note -->
                  <div v-if="slide.note" class="hw-warning">
                    <span class="hw-warning-icon">⚠️</span>
                    <p>{{ slide.note }}</p>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- Dots -->
            <div class="hw-dots">
              <button
                v-for="(_, i) in slides"
                :key="i"
                class="hw-dot"
                :class="{ active: i === currentSlide }"
                :aria-label="`Go to step ${i + 1}`"
                @click="goTo(i)"
              />
            </div>

            <!-- Navigation -->
            <div class="hw-nav">
              <button
                v-if="currentSlide > 0"
                class="hw-btn-back"
                @click="prev"
              >
                ← Back
              </button>
              <span v-else />

              <button class="hw-btn-next" @click="next">
                {{ isLast ? 'Got it — let\'s start! 🚀' : 'Next →' }}
              </button>
            </div>

            <!-- Step counter -->
            <p class="hw-counter">Step {{ currentSlide + 1 }} of {{ slides.length }}</p>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.hw-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* ── Dialog ── */
.hw-dialog {
  position: relative;
  background: #fff;
  border-radius: 20px;
  padding: 36px 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1);
  overflow: hidden;
}

:root.dark .hw-dialog {
  background: #1c1c22;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}

/* ── Close button ── */
.hw-close {
  position: absolute;
  top: 14px;
  right: 14px;
  color: #aaa;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.hw-close:hover { background: #ebebeb; color: #555; }
:root.dark .hw-close { background: #2a2a35; color: #888; }
:root.dark .hw-close:hover { background: #35353f; color: #ccc; }

/* ── Slide wrap — fixed height prevents layout shift ── */
.hw-slide-wrap {
  min-height: 240px;
  display: flex;
  align-items: flex-start;
}

/* ── Slide ── */
.hw-slide {
  width: 100%;
  text-align: center;
}

.hw-emoji {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 16px;
}

.hw-title {
  font-size: 22px;
  font-weight: 800;
  color: #111;
  margin: 0 0 12px;
  line-height: 1.25;
}
:root.dark .hw-title { color: #f0f0f0; }

.hw-body {
  font-size: 15.5px;
  color: #555;
  line-height: 1.65;
  margin: 0;
}
:root.dark .hw-body { color: #aaa; }

/* ── Code example ── */
.hw-code-example {
  display: inline-block;
  margin-top: 14px;
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #0a6;
  background: #f0faf4;
  border: 2px solid #c0e8d0;
  border-radius: 10px;
  padding: 10px 20px;
}
:root.dark .hw-code-example {
  background: #0e2018;
  border-color: #1a5030;
  color: #4dbb80;
}

/* ── Warning note ── */
.hw-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  background: #fff8e1;
  border: 1.5px solid #ffe082;
  border-radius: 10px;
  padding: 12px 14px;
  text-align: left;
}
:root.dark .hw-warning { background: #1e1a06; border-color: #5a4800; }
.hw-warning-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.hw-warning p {
  font-size: 13.5px;
  color: #7a5800;
  line-height: 1.5;
  margin: 0;
  font-weight: 500;
}
:root.dark .hw-warning p { color: #c09020; }

/* ── Dots ── */
.hw-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin: 22px 0 18px;
}
.hw-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ddd;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}
.hw-dot.active {
  background: #2563eb;
  transform: scale(1.3);
}
:root.dark .hw-dot { background: #444; }
:root.dark .hw-dot.active { background: #3b82f6; }

/* ── Navigation ── */
.hw-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hw-btn-back {
  background: none;
  border: 1.5px solid #ddd;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.hw-btn-back:hover { border-color: #aaa; color: #333; }
:root.dark .hw-btn-back { border-color: #444; color: #999; }
:root.dark .hw-btn-back:hover { border-color: #666; color: #ddd; }

.hw-btn-next {
  flex: 1;
  background: #2563eb;
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  padding: 11px 20px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.hw-btn-next:hover { background: #1d4ed8; }
.hw-btn-next:active { transform: scale(0.99); }
:root.dark .hw-btn-next { background: #3b82f6; }
:root.dark .hw-btn-next:hover { background: #2563eb; }

/* ── Counter ── */
.hw-counter {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  margin: 10px 0 0;
}
:root.dark .hw-counter { color: #555; }

/* ── Overlay fade ── */
.overlay-fade-enter-active { transition: opacity 0.3s ease; }
.overlay-fade-leave-active { transition: opacity 0.25s ease; }
.overlay-fade-enter-from,
.overlay-fade-leave-to { opacity: 0; }

/* ── Dialog pop ── */
.dialog-pop-enter-active { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.dialog-pop-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.dialog-pop-enter-from { opacity: 0; transform: scale(0.88) translateY(12px); }
.dialog-pop-leave-to   { opacity: 0; transform: scale(0.95) translateY(6px); }

/* ── Carousel slide transitions ── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.slide-left-enter-from  { opacity: 0; transform: translateX(40px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-40px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(40px); }
</style>
