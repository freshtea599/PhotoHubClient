<template>
  <div class="container mx-auto mt-8 max-w-sm">
    <h2 class="text-3xl font-bold text-center mb-6">Профиль</h2>
    <p class="text-center text-gray-700 mb-4">Добро пожаловать, {{ username }}!</p>

    <!-- Кнопка для выхода -->
    <button @click="handleLogout"
      class="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none">
      Выйти
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');

// Проверка токена при загрузке страницы
onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login');  // Перенаправление на страницу входа, если токен отсутствует
  } else {
    // Предположим, что имя пользователя можно получить из токена (или с сервера)
    username.value = 'Пользователь';  // Заменить на реальное имя, если есть
  }
});

// Функция для выхода
const handleLogout = () => {
  localStorage.removeItem('token');  // Удаление токена из localStorage
  router.push('/login');             // Перенаправление на страницу входа
};
</script>
