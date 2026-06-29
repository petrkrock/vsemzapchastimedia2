import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Запускаем init и монтируем сразу — App.vue показывает спиннер пока loading=true
const auth = useAuthStore()
auth.init()
app.mount('#app')
