<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold text-gray-800">Моя библиотека</h1>
        <router-link
          to="/upload"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Загрузить фото
        </router-link>
      </div>

      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="photoStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ photoStore.error }}
      </div>

      <div v-else-if="photoStore.myPhotos.length === 0" class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">В библиотеке пока пусто</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">
          Загрузить первое фото
        </router-link>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="photo in photoStore.myPhotos"
          :key="photo.id"
          class="overflow-hidden rounded-lg shadow-lg bg-white"
        >
          <div class="w-full h-64 overflow-hidden bg-gray-200">http://localhost:3000
            <img
            :src="getImageUrl(photo.url)"
            :alt="photo.description || 'Photo'"
            class="w-full h-full object-cover"
            />
          </div>
          <div class="p-4 space-y-1">
            <p class="text-sm text-gray-700" v-if="photo.description">{{ photo.description }}</p>
            <p class="text-xs" :class="photo.is_public ? 'text-green-700' : 'text-gray-500'">
              {{ photo.is_public ? 'Публичное' : 'Приватное' }}
            </p>
            <p class="text-xs text-gray-400">
              {{ new Date(photo.created_at || photo.createdat).toLocaleDateString('ru-RU') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { usePhotoStore } from '../stores/photos'

const photoStore = usePhotoStore()
const getImageUrl = (path) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (!path.startsWith('/')) path = '/' + path
  return base + path
}

onMounted(async () => {
  await photoStore.fetchMyPhotos()
})
</script>
