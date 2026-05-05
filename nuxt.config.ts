// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
    },
    provider: 'none'
  },
  css: ['~/assets/css/main.css'],
  alias: {
    '#convex': resolve(__dirname, './convex'),
    '#lib': resolve(__dirname, './lib')
  },
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-3-flash-preview',
    codeAliveApiKey: '',
    assessmentWebhookUrl: '',
    public: {
      convexUrl: '',
      demoBookingUrl: 'https://calendar.app.google/ZaTDPhES2ZuLGji48'
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
