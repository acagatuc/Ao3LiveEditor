<template>
  <div class="editor-input">
    <div class="tabs">
      <button :class="{ active: activeTab === 'html' }" @click="activeTab = 'html'">HTML</button>
      <button :class="{ active: activeTab === 'css' }" @click="activeTab = 'css'">CSS</button>
    </div>

    <textarea
      v-if="activeTab === 'html'"
      v-model="localHtml"
      placeholder="Write HTML here"
    />

    <textarea
      v-else
      v-model="localCss"
      placeholder="Write CSS here"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  html: String,
  css: String
})

const emit = defineEmits(['update:html', 'update:css'])

const activeTab = ref('html')
const localHtml = ref(props.html || '')
const localCss = ref(props.css || '')

watch(localHtml, v => emit('update:html', v))
watch(localCss, v => emit('update:css', v))
</script>

<style scoped>
.editor-input {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs {
  display: flex;
}

.tabs button.active {
  font-weight: bold;
}

textarea {
  flex: 1;
  resize: none;
  font-family: monospace;
}
</style>
