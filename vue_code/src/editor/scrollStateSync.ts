import { ref } from 'vue'

export const editorScrollRatio = ref(0)
export const previewScrollRatio = ref(0)

/**
 * Prevents infinite feedback loops
 * when syncing scroll positions.
 */
export const isSyncingScroll = ref(false)