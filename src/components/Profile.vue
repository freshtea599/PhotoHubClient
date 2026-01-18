<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-3xl font-bold mb-8 text-gray-800">Профиль</h1>

        <div v-if="authStore.user" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <p class="text-lg text-gray-900">{{ authStore.user.username }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p class="text-lg text-gray-900">{{ authStore.user.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Создан</label>
            <p class="text-lg text-gray-900">
              {{ new Date(authStore.user.createdat || authStore.user.created_at).toLocaleDateString('ru-RU') }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-4 pt-6">
            <router-link
              to="/upload"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              Загрузить фото
            </router-link>

            <router-link
              to="/library"
              class="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              Моя библиотека
            </router-link>

            <router-link
              to="/"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              Общая галерея
            </router-link>
          </div>
        </div>

        <div v-else class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.token) router.push('/login')
  else if (!authStore.user) await authStore.loadUser()
})
</script>
