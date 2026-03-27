<script setup lang="ts">
import { getAll } from '../../lib/assessments/index'

const allProducts = getAll()

// If only one product, redirect directly to its intake page
if (allProducts.length === 1) {
  await navigateTo(`/assess/${allProducts[0]!.slug}`, { replace: true })
}

useSeoMeta({
  title: 'Product Fit Assessment',
  description: 'Choose a product to assess your fit'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <div class="w-full max-w-lg space-y-6">
      <div class="text-center space-y-2">
        <div class="flex justify-center items-center gap-3 mb-3">
          <img src="/yahshua-logo-trai.svg" alt="Yahshua TRAI logo" class="w-14 h-14 rounded-full shadow-sm border border-white/40" />
          <img src="/yahshua-logo.svg" alt="Yahshua human logo" class="w-14 h-14 rounded-full shadow-sm border border-white/40" />
        </div>
        <h1 class="text-3xl font-bold">Product Fit Assessment</h1>
        <p class="text-gray-500">Select a product to start your assessment.</p>
      </div>

      <div class="grid gap-4">
        <NuxtLink
          v-for="product in allProducts"
          :key="product.slug"
          :to="`/assess/${product.slug}`"
          class="block"
        >
          <UCard class="hover:border-primary-400 transition-colors cursor-pointer">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-layers" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 class="font-semibold text-base">{{ product.productName }}</h2>
                <p class="text-sm text-gray-500 mt-0.5">{{ product.introDescription }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-gray-400 ml-auto shrink-0 mt-0.5" />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
