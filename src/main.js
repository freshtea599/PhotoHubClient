import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { vLazy } from './directives/vLazy';
import './assets/base.css';
import './assets/main.css';
import 'virtual:windi.css';
import { registerSW } from 'virtual:pwa-register';

// Регистрация Service Worker (будет работать и в dev)
registerSW({ immediate: true });

const app = createApp(App);
app.config.devtools = true 
app.use(createPinia());
app.use(router);
app.directive('lazy', vLazy);
app.mount('#app');