<template>
  <div class="split-panel" :style="gridStyle">
    <div class="panel left">
      <slot name="left" />
    </div>

    <div class="divider" @mousedown="startDrag" />

    <div class="panel right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const leftWidth = ref(50)
let dragging = false

const gridStyle = computed(() => ({
  gridTemplateColumns: `${leftWidth.value}% 6px ${100 - leftWidth.value}%`
}))

function startDrag() {
  dragging = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!dragging) return
  const percent = (e.clientX / window.innerWidth) * 100
  leftWidth.value = Math.min(80, Math.max(20, percent))
}

function stopDrag() {
  dragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

onUnmounted(stopDrag)
</script>

<style scoped>
.split-panel {
  display: grid;
  height: 100%;
  width: 100%;
}

.panel {
  overflow: auto;
}

.divider {
  cursor: col-resize;
  background: var(--divider-color, #ccc);
}
</style>
