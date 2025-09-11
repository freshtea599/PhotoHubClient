<template>
  <div>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <div 
        v-for="(photo, index) in photos" 
        :key="index" 
        @click="openFullscreen('http://localhost:3000' + photo.url)" 
        class="overflow-hidden rounded-lg shadow-md cursor-pointer">
        <div class="w-full h-[200px] overflow-hidden rounded-lg">
          <img 
        :src="'http://localhost:3000' + photo.url" 
        :alt="'Photo ' + (index + 1)" 
        class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>

    <!-- Полноэкранный просмотр -->
    <transition name="fade">
      <div 
        v-if="selectedImage" 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        @click.self="closeFullscreen">
        <img 
          :src="selectedImage" 
          class="max-w-4xl max-h-[80vh] rounded-xl shadow-lg" />
        <button 
          @click="closeFullscreen"
          class="absolute top-5 right-5 text-white text-3xl font-bold">✕</button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const photos = ref([]);
const selectedImage = ref(null);

const openFullscreen = (imageUrl) => {
  selectedImage.value = imageUrl;
};

const closeFullscreen = () => {
  selectedImage.value = null;
};

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/photos');
    photos.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке фото:', error);
  }
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>