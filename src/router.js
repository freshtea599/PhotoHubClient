import { createRouter, createWebHistory } from "vue-router";
import Home from "./components/Home.vue";
import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import Upload from "./components/Upload.vue";
import Gallery from "./components/Gallery.vue";
import Profile from "./components/Profile.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/upload", component: Upload, meta: { requiresAuth: true } },  // Требует авторизации
  { path: "/gallery", component: Gallery },
  { path: "/profile", component: Profile, meta: { requiresAuth: true } },  // Требует авторизации
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Проверка авторизации перед переходом на защищённые маршруты
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    // Если маршрут требует авторизации и токена нет, перенаправляем на страницу входа
    next("/login");
  } else if ((to.path === "/login" || to.path === "/register") && token) {
    // Если пользователь уже авторизован, не пускаем его на страницы логина/регистрации
    next("/profile");
  } else {
    // В остальных случаях разрешаем переход
    next();
  }
});

export default router;
