<template>
  <div class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition" @click="$emit('click')">
    <div class="relative w-full aspect-square bg-gray-200 overflow-hidden">
      <!-- Canvas для BlurHash -->
      <canvas v-if="blurHashData" ref="canvasRef" class="absolute inset-0 w-full h-full blur-canvas" width="64" height="64"></canvas>
      <!-- Реальное изображение -->
      <img v-if="realUrl" :src="realUrl" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
           :class="{ 'opacity-100': loaded, 'opacity-0': !loaded }"
           @load="loaded = true" alt="photo" />
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { decodeBlurHash } from 'blurhash'
import { useImageObserver } from '../composables/useImageObserver'

const props = defineProps({ photo: Object, required: true })
const emit = defineEmits(['click'])

const canvasRef = ref(null)
const realUrl = ref(null)
const loaded = ref(false)
const blurHashData = ref(null)

const { observe } = useImageObserver('200px')

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : ''

onMounted(() => {
  // 1. Отображаем BlurHash, если есть
  if (props.photo.blurhash) {
    try {
      // Декодируем в 64x64 пикселя
      const pixels = decodeBlurHash(props.photo.blurhash, 64, 64)
      const canvas = canvasRef.value
      if (canvas) {
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        const imgData = ctx.createImageData(64, 64)
        imgData.data.set(pixels)
        ctx.putImageData(imgData, 0, 0)
        blurHashData.value = true
      }
    } catch (e) {
      console.warn('BlurHash decode error', e)
    }
  }

  // 2. Ленивая загрузка реального изображения через Intersection Observer
  // Ищем родительский элемент с data-id (можно передать через ref, но для простоты так)
  const element = document.querySelector(`[data-id="${props.photo.id}"]`) || canvasRef.value?.parentElement
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/photos/${props.photo.id}/variant?width=600&format=webp&q=80`
  if (element) {
    observe(element, url, (src) => {
      realUrl.value = src
    })
  } else {
    realUrl.value = url
  }
})
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