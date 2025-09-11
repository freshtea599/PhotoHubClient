<template>
  <div>
    <nav class="bg-white p-4 shadow-md fixed w-full top-0 left-0 z-50">
      <div class="container mx-auto flex justify-between items-center">
        <router-link to="/" class="text-xl font-bold text-blue-600">PhotoHub</router-link>
        <div>
          <template v-if="isAuthenticated">
            <router-link to="/profile" class="mr-4 text-blue-600 hover:underline">Профиль</router-link>
            <button @click="logout" class="text-blue-600 hover:underline">Выход</button>
          </template>
          <template v-else>
            <router-link to="/login" class="mr-4 text-blue-600 hover:underline">Вход</router-link>
            <router-link to="/register" class="text-blue-600 hover:underline">Регистрация</router-link>
          </template>
        </div>
      </div>
    </nav>

    <!-- Добавляем отступ для предотвращения перекрытия -->
    <main class="pt-20">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const isAuthenticated = ref(false);
const router = useRouter();
const route = useRoute();

// Проверка авторизации
const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem("token");
};

// Логика выхода
const logout = () => {
  localStorage.removeItem("token");
  isAuthenticated.value = false;
  router.push("/");
};

// Проверка состояния при монтировании и смене маршрута
onMounted(checkAuth);
watch(() => route.fullPath, checkAuth);
</script>

<style scoped>
/* Устанавливаем фиксированную высоту для навигации */
nav {
  height: 64px;
}

/* Добавляем отступ для всего контента, чтобы избежать перекрытия */
main {
  padding-top: 80px; /* Можно регулировать в зависимости от высоты навигации */
}
</style>
