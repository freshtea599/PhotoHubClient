<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Галерея</h1>

      <!-- Loading -->
      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>

      <!-- Grid -->
      <div
        v-else-if="photoStore.photos.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div
          v-for="photo in photoStore.photos"
          :key="photo.id"
          @click="openFullscreen(photo)"
          class="overflow-hidden rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition transform hover:scale-105 bg-white"
        >
          <!-- Tile -->
          <div class="relative w-full h-64 bg-gray-200 overflow-hidden">
            <picture>
              <source
                v-if="getVariantAbsUrl(photo, 'small', 'webp')"
                :srcset="getVariantAbsUrl(photo, 'small', 'webp')"
                type="image/webp"
              />
              <img
                :src="getVariantAbsUrl(photo, 'small', 'jpeg') || getOriginalAbsUrl(photo) || placeholderSrc"
                :alt="photo.description || 'Photo'"
                loading="lazy"
                decoding="async"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </picture>
          </div>

          <!-- Metadata -->
          <div class="p-4">
            <p v-if="photo.description" class="text-sm text-gray-600 line-clamp-2">
              {{ photo.description }}
            </p>
            <p class="text-xs text-gray-400 mt-2">
              {{ formatDate(photo) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">Нет фотографий</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">
          Загрузить первую
        </router-link>
      </div>
    </div>

    <!-- Fullscreen modal -->
    <transition name="fade">
      <div
        v-if="selectedPhoto"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
        @click.self="closeFullscreen"
      >
        <div class="max-w-5xl w-full relative">
          <picture>
            <source
              v-if="getVariantAbsUrl(selectedPhoto, 'large', 'webp')"
              :srcset="getVariantAbsUrl(selectedPhoto, 'large', 'webp')"
              type="image/webp"
            />
            <img
              :src="getVariantAbsUrl(selectedPhoto, 'large', 'jpeg') || getOriginalAbsUrl(selectedPhoto) || placeholderSrc"
              :alt="selectedPhoto.description || 'Photo'"
              class="w-full max-h-80vh object-contain rounded-xl"
              decoding="async"
              @error="handleImageError"
            />
          </picture>

          <button
            @click="closeFullscreen"
            class="absolute top-5 right-5 text-white text-3xl hover:bg-white hover:bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoStore } from '@/stores/photos'

const photoStore = usePhotoStore()
const selectedPhoto = ref(null)

// Если хочешь — вынеси в .env фронта, но сейчас оставляю как в текущем проекте
const API_ORIGIN = 'http://localhost:3000' // как в старой галерее [file:64]

const placeholderSrc =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E'

const absUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  if (p.startsWith('/')) return API_ORIGIN + p
  return API_ORIGIN + '/' + p
}

/**
 * ВАЖНО:
 * В текущем backend Photo не содержит variants, там есть поле url. [file:64]
 * Поэтому variants используются только если они реально пришли.
 */
const getVariantAbsUrl = (photo, size, format) => {
  const variants = photo?.variants
  if (!Array.isArray(variants) || variants.length === 0) return null

  const v = variants.find((x) => x.size_name === size && x.format === format)
  // Если у тебя file_path уже полный — absUrl его тоже обработает нормально.
  return v ? absUrl(`/uploads/variants/${format}/${v.file_path}`) : null
}

const getOriginalAbsUrl = (photo) => absUrl(photo?.url)

const openFullscreen = (photo) => {
  selectedPhoto.value = photo
}

const closeFullscreen = () => {
  selectedPhoto.value = null
}

const handleImageError = (event) => {
  event.target.src = placeholderSrc
}

const formatDate = (photo) => {
  const raw =
    photo?.created_at ??
    photo?.createdat ??
    photo?.createdAt ??
    null

  if (!raw) return ''

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleDateString('ru-RU')
}

onMounted(async () => {
  await photoStore.fetchPhotos()
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
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
