<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Галерея</h1>

      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="photoStore.error" class="text-center py-10">
        <div class="bg-red-100 text-red-700 p-4 rounded-lg inline-block">
          {{ photoStore.error }}
        </div>
        <button 
          @click="photoStore.fetchPhotos()" 
          class="block mx-auto mt-4 text-blue-600 hover:underline"
        >
          Попробовать снова
        </button>
      </div>

      <div
        v-else-if="photoStore.photos.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
          <div
            v-for="photo in photoStore.photos"
            :key="photo.id"
            @click="openFullscreen(photo)"
            @mouseenter="preloadFullImage(photo)" 
            class="group overflow-hidden ..." 
          >

          <div class="relative w-full h-64 bg-gray-200 overflow-hidden skeleton-loader">
            <picture>
              <source
                v-if="getVariantAbsUrl(photo, 'small', 'webp')"
                :data-srcset="getVariantAbsUrl(photo, 'small', 'webp')"
                type="image/webp"
              />
              <img
                v-lazy="getVariantAbsUrl(photo, 'small', 'jpeg') || getOriginalAbsUrl(photo) || placeholderSrc"
                :alt="photo.description || 'Photo'"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 lazy-image"
                @error="handleImageError"
              />
            </picture>
          </div>
          <div class="p-4">
            <p v-if="photo.description" class="text-sm text-gray-700 line-clamp-2 mb-2 font-medium">
              {{ photo.description }}
            </p>
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <span>{{ formatDate(photo) }}</span>
              </span>
              
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1">
                  ❤️ {{ photo.likes_count || 0 }}
                </span>
                <span class="flex items-center gap-1">
                  💬 {{ photo.comments_count || 0 }}
                </span>
              </div>
            </div>
            
            <p v-if="photo.username" class="text-xs text-gray-400 mt-2">
              Автор: {{ photo.username }}
            </p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">Нет фотографий</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">
          Загрузить первую
        </router-link>
      </div>
    </div>
    <transition name="fade">
      <PhotoDetail
        v-if="selectedPhoto"
        :image="selectedPhoto"
        @close="closeFullscreen"
      />
    </transition>
  </div>
</template>
<script>
export default {
  name: 'Gallery'
}
</script>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue' 
import { usePhotoStore } from '../stores/media'
const PhotoDetail = defineAsyncComponent(() => 
  import('./PhotoDetail.vue')
)

const photoStore = usePhotoStore()
const selectedPhoto = ref(null)

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E'

const absUrl = (p) => {
  if (!p) return null
  if (p.startsWith('http')) return p
  if (p.startsWith('/')) return API_ORIGIN + p
  return API_ORIGIN + '/' + p
}

const getVariantAbsUrl = (photo, size, format) => {
  const variants = photo?.variants
  if (!Array.isArray(variants) || variants.length === 0) return null
  const v = variants.find((x) => x.size_name === size && x.format === format)
  return v ? absUrl(`/uploads/variants/${format}/${v.file_path}`) : null
}

const getOriginalAbsUrl = (photo) => absUrl(photo?.url)

//  Предзагрузка при наведении мыши
const preloadFullImage = (photo) => {
  const url = getVariantAbsUrl(photo, 'large', 'webp') || 
              getVariantAbsUrl(photo, 'large', 'jpeg') || 
              getOriginalAbsUrl(photo)
              
  if (url) {
    const img = new Image()
    img.src = url // Браузер положит в кеш, и открытие модалки будет мгновенным
  }
}

const openFullscreen = (photo) => {
  selectedPhoto.value = photo
}

const closeFullscreen = () => {
  selectedPhoto.value = null
}

const handleImageError = (event) => {
  event.target.src = placeholderSrc
  event.target.classList.add('loaded')
}

const formatDate = (photo) => {
  const raw = photo?.created_at || photo?.createdat || photo?.createdAt
  if (!raw) return ''
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU')
}

onMounted(async () => {
  await photoStore.fetchPhotos()
})
</script>


<style scoped>
/* Стили для ленивой загрузки */
.lazy-image {
  opacity: 0;
  transition: opacity 0.5s ease-in-out, transform 0.5s ease;
  will-change: opacity;
}

.lazy-image.loaded {
  opacity: 1;
}

/* Эффект Skeleton (мерцание фона) */
.skeleton-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Анимация модального окна */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Утилиты */
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
