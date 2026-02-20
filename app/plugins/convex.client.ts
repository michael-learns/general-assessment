import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  if (!config.public.convexUrl) return

  const convex = new ConvexClient(config.public.convexUrl)
  return {
    provide: { convex }
  }
})
