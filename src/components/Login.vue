<template>
  <div class="container mx-auto mt-8 max-w-sm">
    <h2 class="text-3xl font-bold text-center mb-6">Вход</h2>
    <form @submit.prevent="handleLogin">
      <div class="mb-4">
        <label for="username" class="block text-gray-700 font-medium mb-2">Логин:</label>
        <input v-model="username" id="username" type="text" required placeholder="Введите логин"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none" />
      </div>
      <div class="mb-6">
        <label for="password" class="block text-gray-700 font-medium mb-2">Пароль:</label>
        <input v-model="password" id="password" type="password" required placeholder="Введите пароль"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none" />
      </div>
      <div v-if="errorMessage" class="text-red-500 text-sm mb-4">{{ errorMessage }}</div>
      <button type="submit" :disabled="isLoading"
        class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none">
        <span v-if="isLoading">Загрузка...</span>
        <span v-else>Войти</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const isLoading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = "Пожалуйста, заполните все поля.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await axios.post("http://localhost:3000/api/login", {
      email: username.value,
      password: password.value,
    });

    localStorage.setItem("token", response.data.token);
    router.push("/profile");
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Ошибка входа! Проверьте данные.";
  } finally {
    isLoading.value = false;
  }
};
</script>