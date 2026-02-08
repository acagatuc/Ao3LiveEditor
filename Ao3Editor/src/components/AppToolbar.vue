<template>
  <v-app-bar color="primary" class="toolbar">
    <v-toolbar-title>Live HTML Editor</v-toolbar-title>

    <v-btn icon @click="$emit('export')">
      <v-icon>mdi-download</v-icon>
    </v-btn>

    <v-btn icon @click="$emit('clear')">
      <v-icon>mdi-delete</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts"></script>

<style scoped>
.toolbar {
  background-color: #7b1d1d;
  color: white;
  font-family: "Lucida Grande", "Verdana";
}
</style>
