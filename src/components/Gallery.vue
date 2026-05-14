<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Галерея</h1>
      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600" />
      </div>
      <div v-else-if="photoStore.error" class="text-center py-10">
        <div class="bg-red-100 text-red-700 p-4 rounded-lg inline-block">{{ photoStore.error }}</div>
        <button @click="photoStore.fetchPhotos(true)" class="block mx-auto mt-4 text-blue-600 hover:underline">
          Попробовать снова
        </button>
      </div>
      <div v-else-if="photoStore.publicPhotos.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="photo in photoStore.publicPhotos"
          :key="photo.id"
          @click="openFullscreen(photo)"
          class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition"
        >
          <div class="relative w-full h-64 bg-gray-200 overflow-hidden skeleton-loader" :data-id="photo.id">
            <img
              :src="getVariantUrl(photo, 'small') || getOriginalUrl(photo) || placeholderSrc"
              :alt="photo.description || 'Photo'"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
          <div class="p-4">
            <p v-if="photo.description" class="text-sm text-gray-700 line-clamp-2 mb-2 font-medium">
              {{ photo.description }}
            </p>
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>{{ formatDate(photo.created_at) }}</span>
              <div class="flex gap-3">
                <span>❤️ {{ photo.likes_count || 0 }}</span>
                <span>💬 {{ photo.comments_count || 0 }}</span>
              </div>
            </div>
            <p v-if="photo.username" class="text-xs text-gray-400 mt-2">Автор: {{ photo.username }}</p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">Нет фотографий</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">Загрузить первую</router-link>
      </div>
    </div>

    <transition name="fade">
      <PhotoDetail v-if="selectedPhoto" :image="selectedPhoto" @close="closeFullscreen" />
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { usePhotoStore } from '../stores/media'

const PhotoDetail = defineAsyncComponent(() => import('./PhotoDetail.vue'))
const photoStore = usePhotoStore()
const selectedPhoto = ref(null)
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E'

const getOriginalUrl = (photo) => {
  if (!photo.url) return null
  if (photo.url.startsWith('http')) return photo.url
  return API_ORIGIN + (photo.url.startsWith('/') ? photo.url : '/' + photo.url)
}

const getVariantUrl = (photo, size) => {
  // Для JIT используем эндпоинт /api/photos/:id/variant
  return `${API_ORIGIN}/api/photos/${photo.id}/variant?width=400&format=webp&q=80`
}

const openFullscreen = (photo) => { selectedPhoto.value = photo }
const closeFullscreen = () => { selectedPhoto.value = null }
const handleImageError = (event) => { event.target.src = placeholderSrc }
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU')
}

onMounted(async () => {
  if (!photoStore.publicPhotos.length && !photoStore.loading) {
    await photoStore.fetchPhotos()
  }
})
</script>

<style scoped>
.skeleton-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>