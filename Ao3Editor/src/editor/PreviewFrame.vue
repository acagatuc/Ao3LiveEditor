<template>
  <div class="preview-root">
    <div class="preview-header">Preview:</div>
    <v-divider />
    <div class="preview-body">
      <iframe class="preview-frame" sandbox="allow-same-origin" :srcdoc="srcdoc" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  html?: string
  css?: string
}>()

const srcdoc = computed(
  () => `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${props.css || ''}

    /* Safe defaults for preview */
    body {
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
      font-family: "Lucida Grande", "Verdana";
      background-color: white;
    }

    pre, code {
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
 <div id="workskin">
    ${props.html || ''}
  </div>
</body>
</html>
`,
)
</script>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.preview-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  flex-shrink: 0;
}

.preview-body {
  flex: 1;
  min-height: 0; /* critical for flex + iframe */
  padding: 8px; /* fixed padding instead of mx-2 / mt-2 */
  overflow: hidden;
}

.preview-frame {
  width: 100%; /* fill parent width */
  height: 100%; /* fill parent height */
  border: 1px solid #AEAEAE;
  border-radius: 4px;
  box-sizing: border-box; /* include border in width */
}

.preview-frame:hover {
  border-color: #2a2a2a;
}
</style>
