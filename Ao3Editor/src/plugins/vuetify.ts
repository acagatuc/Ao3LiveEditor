// src/plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles' // global Vuetify styles
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})
