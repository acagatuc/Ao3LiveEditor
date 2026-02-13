<script setup lang="ts">
import EditorView from '@/views/EditorView.vue'
import Toolbar from '@/components/AppToolbar.vue'
</script>

<template>
  <v-app>
    <Toolbar />
    <v-main>
      <EditorView />
    </v-main>
  </v-app>
</template>

<style scoped>
html,
body,
#app,
.v-application {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
</style>
