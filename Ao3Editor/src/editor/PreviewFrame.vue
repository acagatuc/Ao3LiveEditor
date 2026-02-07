<template>
  <iframe
    class="preview-frame"
    sandbox="allow-same-origin"
    :srcdoc="srcdoc"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  html: String,
  css: String
})

const srcdoc = computed(() => `
<!DOCTYPE html>
<html>
<head>
  <style>${props.css || ''}</style>
</head>
<body>
  ${props.html || ''}
</body>
</html>
`)
</script>

<style scoped>
.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
</style>
