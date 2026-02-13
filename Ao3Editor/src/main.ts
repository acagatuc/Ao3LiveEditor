import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Material Icon Import
import '@mdi/font/css/materialdesignicons.css'

// Toastify
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';


const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light'
  }
})

const app = createApp(App).use(vuetify).use(
  Vue3Toastify,
  {
    autoClose: 3000,
    // ...
  } as ToastContainerOptions,
).use(router)
app.mount('#app')
