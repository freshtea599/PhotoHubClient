<!-- src/components/Gallery.vue -->
<template>
  <div class="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Галерея</h1>

      <!-- Загрузка -->
      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600" />
      </div>

      <!-- Ошибка -->
      <div v-else-if="photoStore.error" class="text-center py-10">
        <div class="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
          {{ photoStore.error }}
        </div>
        <button
          @click="photoStore.fetchPhotos(true)"
          class="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Попробовать снова
        </button>
      </div>

      <!-- Список фотографий -->
      <div v-else-if="photoStore.publicPhotos.length > 0">
        <MediaGrid @photo-click="openFullscreen" />
      </div>

      <!-- Нет фотографий -->
      <div v-else class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">Нет фотографий</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">
          Загрузить первую
        </router-link>
      </div>
    </div>

    <!-- Полноэкранный просмотр -->
    <transition name="fade">
      <PhotoDetail
        v-if="selectedPhoto"
        :image="selectedPhoto"
        @close="closeFullscreen"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoStore } from '../stores/media'
import MediaGrid from './MediaGrid.vue'
import PhotoDetail from './PhotoDetail.vue'

const photoStore = usePhotoStore()
const selectedPhoto = ref(null)

const openFullscreen = (photo) => { selectedPhoto.value = photo }
const closeFullscreen = () => { selectedPhoto.value = null }

onMounted(async () => {
  if (!photoStore.publicPhotos.length && !photoStore.loading) {
    await photoStore.fetchPhotos()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>