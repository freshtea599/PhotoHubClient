import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { vLazy } from './directives/vLazy' // ✅ Импорт

import './assets/base.css'
import './assets/main.css'
import 'virtual:windi.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// ✅ Регистрация директивы
app.directive('lazy', vLazy)

app.mount('#app')
