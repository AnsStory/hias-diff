import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'normalize.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './assets/main.css'
import './composables/useTheme'

createApp(App).use(createPinia()).mount('#app')
