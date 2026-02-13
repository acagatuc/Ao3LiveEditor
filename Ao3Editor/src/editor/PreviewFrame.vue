<template>
  <div class="preview-root">
    <div class="preview-header-row">
      <div class="preview-header-title">Preview:</div>
      <v-btn size="small" variant="tonal" @click="toggleHideStyle">
        {{ hideCreatorStyleMode ? "Show Creator's Style" : "Hide Creator's Style" }}
      </v-btn>
    </div>
    <v-divider />
    <div class="preview-body">
      <iframe ref="iframeRef" class="preview-frame" sandbox="allow-same-origin" :srcdoc="srcdoc" />
    </div>

    <!-- Button row -->
    <div class="preview-footer">
      <v-tooltip location="top">
        <template #activator="{ props }">
          <div class="preview-footer-label" v-bind="props">
            <v-icon size="16">mdi-link-off</v-icon>
            <span>Links disabled</span>
          </div>
        </template>
        <span>Links disabled in preview. You can still open them in a new tab.</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { editorScrollRatio, previewScrollRatio, isSyncingScroll } from './scrollStateSync.ts'
import { generateSrcdoc } from './generateSrcdoc.ts'

const props = defineProps<{
  html?: string
  css?: string
}>()

// iframe ref to preview ao3 html
const iframeRef = ref<HTMLIFrameElement | null>(null)

// boolean to determine whether the user wants to hide style
const hideCreatorStyleMode = ref(false)

// Strips all CSS but keeps HTML intact
function hideCreatorStyle(html: string): string {
  // Remove inline styles only; you already wrap the HTML in #workskin
  return html.replace(/\s*style="[^"]*"/gi, '')
}

// Toggle handler
function toggleHideStyle() {
  hideCreatorStyleMode.value = !hideCreatorStyleMode.value
}

// debounce on keystroke so that html generation/sanitization only occurs when author stops typing for a bit
const debouncedHtml = ref(props.html || '')
let debounceTimer: number | null = null

watch(
  () => props.html,
  (newHtml) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = window.setTimeout(() => {
      debouncedHtml.value = newHtml || ''
    }, 400)
  },
)

function disableIframeLinks() {
  const iframe = iframeRef.value
  const doc = iframe?.contentDocument
  if (!doc) return

  doc.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    const link = target?.closest('a')

    if (link) {
      e.preventDefault()
      e.stopPropagation()
    }
  })
}

const srcdoc = computed(() =>
  generateSrcdoc({
    html: hideCreatorStyleMode.value
      ? hideCreatorStyle(debouncedHtml.value || '')
      : debouncedHtml.value || '',
    css: hideCreatorStyleMode.value ? '' : props.css || '',
    hideCreatorStyle: hideCreatorStyleMode.value,
  }),
)

watch(editorScrollRatio, (ratio) => {
  const iframe = iframeRef.value
  const doc = iframe?.contentDocument?.documentElement
  if (!iframe || !doc) return

  isSyncingScroll.value = true

  const maxScroll = doc.scrollHeight - doc.clientHeight
  iframe.contentWindow!.scrollTo(0, ratio * maxScroll)

  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
})

/**
 * Preview → editor scroll (optional but recommended)
 */
const onIframeScroll = () => {
  if (isSyncingScroll.value) return

  const iframe = iframeRef.value
  if (!iframe?.contentWindow) return

  const doc = iframe.contentDocument?.documentElement
  if (!doc) return

  const maxScroll = doc.scrollHeight - doc.clientHeight
  if (maxScroll <= 0) return

  previewScrollRatio.value = doc.scrollTop / maxScroll
}

onMounted(() => {
  iframeRef.value?.addEventListener('load', () => {
    const win = iframeRef.value?.contentWindow
    if (!win) return

    win.addEventListener('scroll', onIframeScroll, { passive: true })

    // Disable all links inside the iframe to prevent navigation
    disableIframeLinks()
  })
})
</script>

<style scoped>
.preview-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.preview-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  flex-shrink: 0;
}

.preview-header-title {
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
  border: 1px solid #aeaeae;
  border-radius: 4px;
  box-sizing: border-box; /* include border in width */
}

.preview-frame:hover {
  border-color: #2a2a2a;
}

.preview-footer {
  flex-shrink: 0;
  height: 36px; /* FIXED HEIGHT */
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px;
}

.preview-footer-label {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}
</style>
