<template>
  <div ref="containerRef" class="overflow-auto h-[calc(100vh-200px)]" @scroll="onScrollHandler">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="photo in visiblePhotos"
          :key="photo.id"
          @click="emit('photo-click', photo)"
          class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition"
        >
          <div class="relative w-full" :style="{ paddingBottom: '56.25%' }">
            <!-- BlurHash canvas (будет отрисован асинхронно) -->
            <canvas
              v-if="photo.blurhash"
              :ref="(el) => setCanvasRef(photo.id, el)"
              class="absolute inset-0 w-full h-full blur-canvas"
              width="64"
              height="64"
            ></canvas>
            <!-- Реальное изображение -->
            <img
              :src="getImageUrl(photo)"
              :alt="photo.description || 'Photo'"
              class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              :class="{ 'opacity-100': loadedImages[photo.id], 'opacity-0': !loadedImages[photo.id] }"
              @load="loadedImages[photo.id] = true"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
          <div class="p-4">
            <p v-if="photo.description" class="text-sm text-gray-700 line-clamp-2 mb-2">{{ photo.description }}</p>
            <div class="flex justify-between text-xs text-gray-500">
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
    </div>
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { usePhotoStore } from '../stores/media'
import { useVirtualScroll } from '../composables/useVirtualScroll'

const emit = defineEmits(['photo-click'])
const photoStore = usePhotoStore()
const containerRef = ref(null)

// Адаптивная высота карточки (3:2)
const itemHeight = ref(380)
const updateItemHeight = () => {
  if (containerRef.value) {
    const card = containerRef.value.querySelector('.group')
    if (card) itemHeight.value = card.offsetHeight
  }
}

const totalCount = computed(() => photoStore.publicPhotos.length)
const loading = computed(() => photoStore.loading)

const { startIndex, endIndex, offsetY, totalHeight, onScroll, setContainerHeight } = useVirtualScroll(itemHeight, totalCount)

// Уменьшенный буфер: вместо +4 используем +2
const visiblePhotos = computed(() => {
  const start = startIndex.value
  let end = endIndex.value + 2
  if (end > totalCount.value) end = totalCount.value
  return photoStore.publicPhotos.slice(start, end)
})

const loadedImages = ref({})
const canvasRefs = ref({})

// Ленивая загрузка decode из blurhash
const setCanvasRef = async (id, el) => {
  if (el && !canvasRefs.value[id]) {
    canvasRefs.value[id] = el
    const photo = photoStore.publicPhotos.find(p => p.id === id)
    if (photo?.blurhash) {
      try {
        const { decode } = await import('blurhash')
        const pixels = decode(photo.blurhash, 64, 64)
        const canvas = el
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        const imgData = ctx.createImageData(64, 64)
        imgData.data.set(pixels)
        ctx.putImageData(imgData, 0, 0)
      } catch (e) {
        console.warn('BlurHash decode error', e)
      }
    }
  }
}

const getImageUrl = (photo) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${base}/api/photos/${photo.id}/variant?width=400&format=webp&q=80`
}

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : ''
const handleImageError = (e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E' }

let scrollTimeout = null
const onScrollHandler = (e) => {
  onScroll(e)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    const scrollBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight
    if (scrollBottom < 500 && !photoStore.loading && photoStore.hasMore) {
      photoStore.fetchPhotos()
    }
  }, 100)
}

onMounted(async () => {
  if (!photoStore.publicPhotos.length && !photoStore.loading) {
    await photoStore.fetchPhotos()
  }
  await nextTick()
  updateItemHeight()
  if (containerRef.value) {
    setContainerHeight(containerRef.value.clientHeight)
    onScroll({ target: containerRef.value })
  }
})

const resizeObserver = new ResizeObserver(() => {
  if (containerRef.value) {
    setContainerHeight(containerRef.value.clientHeight)
    updateItemHeight()
  }
})
onMounted(() => resizeObserver.observe(containerRef.value))
onBeforeUnmount(() => resizeObserver.disconnect())
</script>

<style scoped>
.blur-canvas {
  filter: blur(10px);
  transform: scale(1.02);
}
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>