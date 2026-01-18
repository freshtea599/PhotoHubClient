import { createRouter, createWebHistory } from 'vue-router'

import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Upload from './components/Upload.vue'
import Gallery from './components/Gallery.vue'
import Profile from './components/Profile.vue'
import MyLibrary from './components/MyLibrary.vue'
import AdminPanel from './components/AdminPanel.vue'

const routes = [
  { path: '/', component: Gallery },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/gallery', component: Gallery },
  { path: '/upload', component: Upload, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/library', component: MyLibrary, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminPanel, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) return next('/login')
  if ((to.path === '/login' || to.path === '/register') && token) return next('/profile')

  // TODO: проверить что юзер админ если требуется

  next()
})

export default router
