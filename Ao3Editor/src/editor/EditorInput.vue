<template>
  <div class="editor-root">
    <v-tabs v-model="tab" color="primary">
      <v-tab value="html">HTML</v-tab>
      <v-tab value="css">CSS</v-tab>
    </v-tabs>

    <v-divider />

    <div class="editor-body">
      <v-textarea
        v-if="tab === 'html'"
        v-model="localHtml"
        ref="textareaWrapper"
        placeholder="Write HTML here"
        variant="outlined"
        hide-details
        class="editor-textarea"
        rows="1"
        no-resize
        @scroll.passive="onScroll"
      />

      <v-textarea
        v-else
        v-model="localCss"
        ref="textareaWrapper"
        placeholder="Write CSS here"
        variant="outlined"
        hide-details
        class="editor-textarea"
        rows="1"
        no-resize
        @scroll.passive="onScroll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, type ComponentPublicInstance } from 'vue'
import { editorScrollRatio, isSyncingScroll } from './scrollStateSync.ts'

const props = defineProps<{
  html?: string
  css?: string
}>()

const emit = defineEmits<{
  (e: 'update:html', v: string): void
  (e: 'update:css', v: string): void
}>()

const tab = ref<'html' | 'css'>('html')
const localHtml = ref(props.html ?? '')
const localCss = ref(props.css ?? '')

// scroll variables
const textareaWrapper = ref<ComponentPublicInstance | null>(null)
let textareaEl: HTMLTextAreaElement | null = null

watch(localHtml, (v) => emit('update:html', v))
watch(localCss, (v) => emit('update:css', v))

const onScroll = () => {
  if (isSyncingScroll.value || !textareaEl) return

  const maxScroll = textareaEl.scrollHeight - textareaEl.clientHeight
  if (maxScroll <= 0) return

  editorScrollRatio.value = textareaEl.scrollTop / maxScroll
}

onMounted(async () => {
  await nextTick()

  textareaEl = textareaWrapper.value?.$el?.querySelector('textarea') ?? null
})
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%; /* ← NOT 100vh */
  width: 100%;
}

.editor-body {
  flex: 1;
  padding: 8px;
  min-height: 0; /* ← critical for textarea + flex */
}

.editor-textarea {
  height: 100%;
  overflow-y: auto; /* ✅ scrolling happens here */
  font-family: 'Lucida Grande', 'Verdana';
  background-color: white;
}
</style>
