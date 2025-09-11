<template>
    <nav class="bg-gray-800 text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <router-link to="/" class="text-xl font-bold">PhotoHub</router-link>
        <div>
          <template v-if="isAuthenticated">
            <router-link to="/profile" class="mx-2 hover:underline">Профиль</router-link>
            <button @click="logout" class="mx-2 hover:underline">Выход</button>
          </template>
          <template v-else>
            <router-link to="/register" class="mx-2 hover:underline">Регистрация</router-link>
            <router-link to="/login" class="mx-2 hover:underline">Вход</router-link>
          </template>
        </div>
      </div>
    </nav>
  </template>
  
  <script setup>
 import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const isAuthenticated = ref(false);
const router = useRouter();
const route = useRoute();

// Проверка авторизации при загрузке страницы
onMounted(() => {
  isAuthenticated.value = !!localStorage.getItem('token');
});

// Следим за изменениями маршрутов и обновляем состояние авторизации
watch(route, () => {
  isAuthenticated.value = !!localStorage.getItem('token');
});

const logout = () => {
  localStorage.removeItem('token');
  isAuthenticated.value = false;
  router.push('/');
};

  </script>
  
  <style scoped>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
  }
  </style>
  