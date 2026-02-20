// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    geminiApiKey: '',
    codeAliveApiKey: '',
    assessmentWebhookUrl: '',
    public: {
      convexUrl: ''
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
