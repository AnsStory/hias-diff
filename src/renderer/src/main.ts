import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'animate.css'
import 'normalize.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './composables/useTheme'
import './assets/main.css'

createApp(App).use(createPinia()).mount('#app')
