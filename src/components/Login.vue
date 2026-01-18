<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">Вход</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            v-model="email"
            id="email"
            type="email"
            required
            placeholder="your@email.com"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
          <input
            v-model="password"
            id="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        <div v-if="authStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          {{ authStore.loading ? 'Загрузка...' : 'Войти' }}
        </button>
      </form>

      <p class="text-center text-gray-600 mt-4">
        Нет аккаунта?
        <router-link to="/register" class="text-blue-600 hover:underline font-medium">
          Зарегистрироваться
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
    router.push('/profile')
  } catch (err) {
    console.error('Login error:', err)
  }
}
</script>
