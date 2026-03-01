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

      <div v-else class="textarea-lint-wrap">
        <v-textarea
          v-model="localCss"
          ref="textareaWrapper"
          placeholder="Write CSS here"
          variant="outlined"
          hide-details
          class="editor-textarea"
          rows="1"
          no-resize
          spellcheck="false"
          @scroll.passive="onScroll"
        />
        <CssLintOverlay
          v-if="tab === 'css' && lintStatus !== 'idle'"
          :warnings="lintWarnings"
          :raw-css="localCss"
        />
      </div>
      <div class="copy-button">
        <v-btn icon rounded size="small" @click="copyToClipboard"
          ><v-icon>mdi-content-copy</v-icon></v-btn
        >
      </div>
    </div>
    <!-- Warning banner (sits between body and footer) -->
    <CssWarningBanner
      v-if="tab === 'css'"
      :warnings="lintWarnings"
      :visible="lintStatus !== 'idle'"
      @dismiss="resetLint"
      @jump="onJumpToWarning"
    />
    <!-- Button row -->
    <div class="editor-footer">
      <v-btn size="small" variant="text" prepend-icon="mdi-download" @click="saveToFile">
        Export
      </v-btn>

      <v-btn
        v-if="tab === 'css'"
        size="small"
        variant="text"
        prepend-icon="mdi-check-circle-outline"
        :loading="isAnalyzing"
        :color="lintButtonColor"
        @click="validateCss"
      >
        Validate CSS
      </v-btn>

      <v-btn
        v-if="tab === 'css'"
        size="small"
        variant="text"
        prepend-icon="mdi-format-indent-increase"
        @click="autoFormatCss"
      >
        Format CSS
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick, type ComponentPublicInstance } from 'vue'
import { toast, type ToastOptions } from 'vue3-toastify'
import { editorScrollRatio, isSyncingScroll } from './scrollStateSync.ts'
import { formatCss } from '../utilities/formatCss.js'
import { useCssAnalyzer } from '../composables/useCssAnalyzer.ts'
import CssWarningBanner from '../components/CssWarningBanner.vue'
import CssLintOverlay from '../components/CssLintOverlay.vue'
import type { PositionedWarning } from '../composables/useCssAnalyzer'

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

// Variables from useCssAnalyzer
const {
  warnings: lintWarnings,
  status: lintStatus,
  isAnalyzing,
  analyze,
  reset: resetLint,
} = useCssAnalyzer()

// scroll variables
const textareaWrapper = ref<ComponentPublicInstance | null>(null)
const textareaEl = ref<HTMLTextAreaElement | null>(null)

watch(localHtml, (v) => emit('update:html', v))
watch(localCss, (v) => {
  emit('update:css', v)
  // Stale lint results are no longer valid after edits; reset silently
  if (lintStatus.value !== 'idle') resetLint()
})

// Formatting
async function autoFormatCss() {
  localCss.value = await formatCss(localCss.value)
}

// Validation and Linting
function validateCss() {
  analyze(localCss.value)
}

/** Scroll the textarea to the warning's line */
function onJumpToWarning(w: PositionedWarning) {
  if (!textareaEl.value || !w.line) return
  const lineHeight = 20
  textareaEl.value.scrollTop = (w.line - 1) * lineHeight
}

/** Button colour reflects lint result at a glance */
const lintButtonColor = computed(() => {
  if (lintStatus.value === 'clean') return 'success'
  if (lintStatus.value === 'warnings') return 'warning'
  if (lintStatus.value === 'error') return 'error'
  return undefined
})

// Copy and Export (save to file) functions
async function copyToClipboard() {
  try {
    if (tab.value === 'html') {
      await navigator.clipboard.writeText(localHtml.value)
      toast.success('Copied HTML to clipboard!', {
        autoClose: 3000,
        position: toast.POSITION.TOP_CENTER,
      } as ToastOptions)
    } else if (tab.value === 'css') {
      await navigator.clipboard.writeText(localCss.value)
      toast.success('Copied CSS to clipboard!', {
        autoClose: 3000,
        position: toast.POSITION.TOP_CENTER,
      } as ToastOptions)
    }
  } catch ($e) {
    toast.error('Failed to copy.', {
      autoClose: 3000,
      position: toast.POSITION.TOP_CENTER,
    } as ToastOptions)
    console.log($e)
  }
}

// Source - https://stackoverflow.com/a/19332584
// Posted by NatureShade, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-12, License - CC BY-SA 4.0

function saveToFile() {
  if (tab.value === 'html') {
    const textFileAsBlob = new Blob([localHtml.value], { type: 'text/plain' })
    const downloadLink = document.createElement('a')
    downloadLink.download = 'html.txt'
    downloadLink.innerHTML = 'Download File'
    if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob)
    } else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob)
      // downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = 'none'
      document.body.appendChild(downloadLink)
    }
    downloadLink.click()
  } else if (tab.value === 'css') {
    const textFileAsBlob = new Blob([localCss.value], { type: 'text/plain' })
    const downloadLink = document.createElement('a')
    downloadLink.download = 'css.txt'
    downloadLink.innerHTML = 'Download File'
    if (window.webkitURL != null) {
      // Chrome allows the link to be clicked
      // without actually adding it to the DOM.
      downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob)
    } else {
      // Firefox requires the link to be added to the DOM
      // before it can be clicked.
      downloadLink.href = window.URL.createObjectURL(textFileAsBlob)
      // downloadLink.onclick = destroyClickedElement;
      downloadLink.style.display = 'none'
      document.body.appendChild(downloadLink)
    }
    downloadLink.click()
  }
}

// Scroll syncing (now for css)
const onScroll = () => {
  if (!textareaEl.value) return

  // Only sync iframe scroll ratio when editing HTML
  if (tab.value === 'html') {
    if (isSyncingScroll.value) return
    const maxScroll = textareaEl.value.scrollHeight - textareaEl.value.clientHeight
    if (maxScroll <= 0) return
    editorScrollRatio.value = textareaEl.value.scrollTop / maxScroll
  }
}

async function syncTextareaEl() {
  await nextTick()
  textareaEl.value = textareaWrapper.value?.$el?.querySelector('textarea') ?? null
}

onMounted(syncTextareaEl)

watch(tab, syncTextareaEl)
</script>

<style scoped>
.editor-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.editor-body {
  position: relative;
  flex: 1;
  padding: 8px;
  min-height: 0;
}

/* Wrapper that lets the overlay sit on top of the CSS textarea */
.textarea-lint-wrap {
  position: relative;
  height: 100%;
}

.copy-button {
  position: absolute;
  top: 16px;
  right: 16px;
}

.editor-textarea {
  height: 100%;
  font-family: 'Lucida Grande', 'Verdana';
  background-color: white;
}

.editor-footer {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
}
</style>
