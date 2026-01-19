<template>
  <div>
    <nav class="bg-white shadow-md fixed w-full top-0 left-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <router-link to="/" class="flex items-center gap-3">
          <span class="text-2xl font-bold text-blue-600">PhotoHub</span>
        </router-link>

        <div class="flex items-center gap-3">
          <template v-if="authStore.isAuthenticated">
            <div class="relative" ref="menuRoot">
              <button
                type="button"
                @click="toggleMenu"
                class="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Profile menu"
                title="Профиль"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="text-gray-700"
                >
                  <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z" />
                  <path d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                </svg>
              </button>

              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden"
              >
                <router-link
                  to="/profile"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                  @click="closeMenu"
                >
                  👤 Профиль
                </router-link>

                <router-link
                  to="/gallery"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition border-t"
                  @click="closeMenu"
                >
                  🖼️ Галерея
                </router-link>

                <router-link
                  to="/upload"
                  class="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition border-t"
                  @click="closeMenu"
                >
                  📤 Загрузить фото
                </router-link>

                <router-link
                  v-if="authStore.user?.is_admin"
                  to="/admin"
                  class="block px-4 py-3 text-red-600 hover:bg-red-50 font-medium transition border-t"
                  @click="closeMenu"
                >
                  ⚙️ Админ панель
                </router-link>

                <button
                  class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition border-t"
                  @click="handleLogout"
                >
                  🚪 Выйти
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <router-link
              to="/login"
              class="text-gray-700 hover:text-blue-600 font-medium transition"
            >
              Войти
            </router-link>
            <router-link
              to="/register"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
            >
              Зарегистрироваться
            </router-link>
          </template>
        </div>
      </div>
    </nav>

    <main class="pt-16">
      <router-view v-slot="{ Component }">
        <!-- KeepAlive сохраняет состояние Gallery в памяти -->
        <keep-alive include="Gallery">
          <component :is="Component" />
        </keep-alive>
      </router-view>

    </main>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const menuOpen = ref(false)
const menuRoot = ref(null)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}
const closeMenu = () => {
  menuOpen.value = false
}

const onDocClick = (e) => {
  if (!menuOpen.value) return
  if (!menuRoot.value) return
  if (!menuRoot.value.contains(e.target)) closeMenu()
}

const handleLogout = () => {
  closeMenu()
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  if (authStore.token && !authStore.user) {
    await authStore.loadUser()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>
