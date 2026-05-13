// public/sw.js – минимальный сервис-воркер, реальный будет собираться плагином
// Этот файл нужен для регистрации, основная логика в workbox.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());