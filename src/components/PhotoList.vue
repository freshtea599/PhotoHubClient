<template>
  <div class="container mx-auto py-8">
    <h1 class="text-center text-2xl font-bold mb-4">Галерея Фото</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="photo in photos"
        :key="photo.url"
        @click="openImage(photo.url)"
        class="cursor-pointer"
      >
        <img
          :src="photo.url"
          alt="Фото"
          class="object-cover w-full h-64 rounded-xl shadow-md hover:scale-105 transition-transform duration-200"
        />
      </div>
    </div>

    <!-- Модальное окно -->
    <transition name="fade-zoom">
      <div
        v-if="selectedImage"
        class="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
        @click.self="closeImage"
      >
        <div class="relative max-w-5xl w-full">
          <img
            :src="selectedImage"
            class="object-contain w-full max-h-screen rounded-xl"
            alt="Полное изображение"
          />
          <button
            @click="closeImage"
            class="absolute top-4 right-4 text-white text-3xl focus:outline-none"
          >
            ✕
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const photos = ref([]);
const selectedImage = ref(null);

// Получаем изображения с сервера
const fetchPhotos = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/photos");
    if (response.ok) {
      photos.value = await response.json();
    } else {
      console.error("Ошибка загрузки изображений:", response.statusText);
    }
  } catch (error) {
    console.error("Ошибка загрузки изображений:", error);
  }
};

const openImage = (url) => {
  selectedImage.value = url;
};

const closeImage = () => {
  selectedImage.value = null;
};

onMounted(fetchPhotos);
</script>

<style scoped>
/* Анимация модального окна */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.3s ease;
}

.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

button {
  background: transparent;
  border: none;
  cursor: pointer;
}
</style>
