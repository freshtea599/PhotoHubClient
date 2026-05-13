import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { vLazy } from './directives/vLazy';
import './assets/base.css';
import './assets/main.css';
import 'virtual:windi.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.directive('lazy', vLazy);
app.mount('#app');