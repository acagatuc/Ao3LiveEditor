<template>
  <div class="split-root">
    <div class="panel left" :style="{ width: leftWidth + '%' }">
      <slot name="left" />
    </div>

    <div
      class="divider"
      @mousedown="startDrag"
    />

    <div class="panel right" :style="{ width: 100 - leftWidth + '%' }">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const leftWidth = ref(50)

let dragging = false

const startDrag = () => {
  dragging = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!dragging) return
  const percent = (e.clientX / window.innerWidth) * 100
  leftWidth.value = Math.min(80, Math.max(20, percent))
}

const stopDrag = () => {
  dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.split-root {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.panel {
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.divider {
  width: 6px;
  cursor: col-resize;
  background-color: rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  z-index: 10;
}
</style>