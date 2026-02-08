<template>
  <div class="editor-view">
    <SplitPanel>
      <template #left>
        <EditorInput v-model:html="html" v-model:css="css" />
      </template>

      <template #right>
        <PreviewFrame :html="html" :css="css" />
      </template>
    </SplitPanel>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

import SplitPanel from '@/components/SplitPanel.vue'

import EditorInput from '@/editor/EditorInput.vue'
import PreviewFrame from '@/editor/PreviewFrame.vue'

import { useEditorState } from '@/editor/useEditorState'

const { html, css, loadFromStorage, saveToStorage } = useEditorState()

// Load persisted content on mount
loadFromStorage()

// Autosave on change
watch([html, css], saveToStorage, { deep: true })
</script>

<style scoped>
.app-main {
  padding: 0 !important;
}

.editor-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100vw;
  margin-bottom: 100px;
  overflow: hidden;
  background-color: #e9e8e8;
  font-family: 'Lucida Grande', 'Verdana';
  color: #2a2a2a;
}
</style>
