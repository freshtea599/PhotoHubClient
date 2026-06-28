import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// import { vLazy } from './directives/vLazy';
import './assets/base.css';
import './assets/main.css';
import 'virtual:windi.css';

// Убираем индикатор загрузки, если он есть
// const loader = document.getElementById('app-loader');
// if (loader) loader.remove();

// Service Worker (только ручная регистрация, без VitePWA)
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(reg => console.log('SW registered', reg))
//       .catch(err => console.error('SW registration failed', err));
//   });
// }

const app = createApp(App);
app.config.devtools = true;
app.use(createPinia());
app.use(router);
// app.directive('lazy', vLazy);
app.mount('#app');