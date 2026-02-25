<script setup lang="ts">
// Backward-compat redirect: /assessment/[sessionId] → /assess/payroll/[sessionId]
const route = useRoute()
const sessionId = route.params.sessionId as string
await navigateTo(`/assess/payroll/${sessionId}`, { replace: true })
</script>

<template>
  <div />
</template>
