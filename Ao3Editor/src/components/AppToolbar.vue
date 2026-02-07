<template>
  <header class="toolbar">
    <h1 class="title">Ao3Editor</h1>

    <div class="actions">
      <button @click="$emit('export')">Export</button>
      <button @click="$emit('clear')">Clear</button>
    </div>
  </header>
</template>

<script setup lang="ts">
// Emits only — no logic here
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #1f1f1f;
  color: #fff;
}

.title {
  font-size: 1rem;
  font-weight: 600;
}

.actions button {
  margin-left: 0.5rem;
}
</style>
