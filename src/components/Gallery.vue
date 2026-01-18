<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Галерея</h1>

      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="photoStore.photos.length === 0" class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">В галерее пока нет фото</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">
          Загрузить первое фото
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="photo in photoStore.photos"
          :key="photo.id"
          @click="openPhoto(photo)"
          class="overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:scale-105 bg-white"
        >
          <div class="w-full h-64 overflow-hidden bg-gray-200">
            <img
              :src="`http://localhost:3000${photo.url}`"
              :alt="photo.description"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="p-4">
            <p v-if="photo.description" class="text-sm text-gray-600 line-clamp-2">{{ photo.description }}</p>
            <p class="text-xs text-gray-400 mt-2">
              {{ new Date(photo.created_at).toLocaleDateString('ru-RU') }}
            </p>

            <!-- Quick like button -->
            <div class="mt-2 flex items-center gap-1 text-sm text-gray-600">
              <span>❤️</span>
              <span>{{ photo.likes_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Photo detail modal -->
    <PhotoDetail v-if="selectedPhoto" :image="selectedPhoto" @close="closePhoto" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoStore } from '../stores/photos'
import PhotoDetail from './PhotoDetail.vue'

const photoStore = usePhotoStore()
const selectedPhoto = ref(null)

const openPhoto = (photo) => {
  selectedPhoto.value = photo
}

const closePhoto = () => {
  selectedPhoto.value = null
}

onMounted(async () => {
  await photoStore.fetchPhotos()
})
</script>
