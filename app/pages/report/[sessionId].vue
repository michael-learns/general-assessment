<script setup lang="ts">
// Backward-compat redirect: /report/[sessionId] → /report/payroll/[sessionId]
const route = useRoute()
const sessionId = route.params.sessionId as string
await navigateTo(`/report/payroll/${sessionId}`, { replace: true })
</script>

<template>
  <div />
</template>
