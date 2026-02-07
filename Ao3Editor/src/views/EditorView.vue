<template>
  <div class="editor-view">
    <Toolbar />

    <SplitPanel>
      <template #left>
        <EditorInput
          v-model:html="html"
          v-model:css="css"
        />
      </template>

      <template #right>
        <PreviewFrame
          :html="html"
          :css="css"
        />
      </template>
    </SplitPanel>
  </div>
</template>

<script setup lang="ts">
// import { watch } from 'vue'

import Toolbar from '@/components/AppToolbar.vue'
import SplitPanel from '@/components/SplitPanel.vue'

import EditorInput from '@/editor/EditorInput.vue'
import PreviewFrame from '@/editor/PreviewFrame.vue'

// import { useEditorState } from '@/editor/useEditorState'

// const { html, css, loadFromStorage, saveToStorage } = useEditorState()

// Load persisted content on mount
// loadFromStorage()

// Autosave on change
// watch([html, css], saveToStorage, { deep: true })
</script>

<style scoped>
.editor-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
