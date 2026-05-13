import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth';

// Статический импорт для главной (галереи) – для быстрой загрузки
import Gallery from './components/Gallery.vue';

const routes = [
  { path: '/', component: Gallery },
  { path: '/gallery', component: Gallery },

  // Динамические импорты для остальных страниц
  {
    path: '/login',
    component: () => import('./components/Login.vue')
  },
  {
    path: '/register',
    component: () => import('./components/Register.vue')
  },
  {
  path: '/upload',
  component: () => import('./components/UploadForm.vue'),
  meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    component: () => import('./components/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/library',
    component: () => import('./components/MyLibrary.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('./components/AdminPanel.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Глобальная защита маршрутов
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const authStore = useAuthStore();

  // Требуется авторизация, но токена нет
  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }

  // Если пользователь уже авторизован и пытается зайти на страницы входа/регистрации
  if ((to.path === '/login' || to.path === '/register') && token) {
    return next('/profile');
  }

  // Проверка прав администратора
  if (to.meta.requiresAdmin) {
    if (!token) return next('/login');
    if (!authStore.user) {
      try {
        await authStore.loadUser();
      } catch (err) {
        localStorage.removeItem('token');
        return next('/login');
      }
    }
    if (!authStore.user?.is_admin) {
      return next('/');
    }
  }

  next();
});

export default router;