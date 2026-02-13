<template>
  <v-app-bar color="primary" class="toolbar">
    <v-toolbar-title>Live HTML Editor</v-toolbar-title>

    <v-btn
      href="https://www.w3schools.com/html/"
      target="_blank" 
      rel="noopener noreferrer"
      prepend-icon="mdi-open-in-new"
      title="Open W3Schools HTML reference"
    >
      HTML Tutorial Site  
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts"></script>

<style scoped>
.toolbar {
  background-color: #7b1d1d;
  color: white;
  font-family: 'Lucida Grande', 'Verdana';
}
</style>
