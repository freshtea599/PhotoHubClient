import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

// Статический импорт только для Галереи (главная страница)
import Gallery from './components/Gallery.vue'

const routes = [
  { path: '/', component: Gallery },
  { path: '/gallery', component: Gallery },
  
  // ✅ ВСЁ ОСТАЛЬНОЕ - ДИНАМИЧЕСКИЙ ИМПОРТ
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
    component: () => import('./components/Upload.vue'), 
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
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if ((to.path === '/login' || to.path === '/register') && token) {
    return next('/profile')
  }

  if (to.meta.requiresAdmin) {
    if (!token) return next('/login')
    if (!authStore.user) {
      try {
        await authStore.loadUser()
      } catch (err) {
        localStorage.removeItem('token')
        return next('/login')
      }
    }
    if (!authStore.user?.is_admin) {
      return next('/')
    }
  }

  next()
})

export default router
