// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash-preview-04-17',
    codeAliveApiKey: '',
    assessmentWebhookUrl: '',
    public: {
      convexUrl: '',
      demoBookingUrl: 'https://calendly.com'
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
