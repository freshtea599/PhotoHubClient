<template>
  <div v-if="image" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" @click.self="emit('close')">
    <div class="relative max-w-5xl w-full bg-white rounded-lg overflow-hidden">
      <button class="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-3xl leading-none z-10" @click="emit('close')">×</button>
      <div class="bg-black flex items-center justify-center relative" style="min-height: 400px;">
        <!-- BlurHash placeholder -->
        <canvas
          v-if="image.blurhash && !originalImageLoaded"
          ref="blurCanvasRef"
          class="absolute inset-0 w-full h-full blur-canvas"
          width="64"
          height="64"
        ></canvas>
        <!-- Оригинал изображения (width=0) -->
        <img
          :src="originalImageUrl"
          :alt="image.description || 'Photo'"
          class="max-w-full max-h-[80vh] object-contain transition-opacity duration-500"
          :class="{ 'opacity-100': originalImageLoaded, 'opacity-0': !originalImageLoaded }"
          @load="originalImageLoaded = true"
          @error="handleError"
        />
      </div>
      <div class="p-4">
        <h3 class="text-lg font-semibold">{{ image.description || 'Без описания' }}</h3>
        <div class="flex gap-6 text-sm text-gray-600 mt-2">
          <span>❤️ {{ image.likes_count || 0 }}</span>
          <span>💬 {{ image.comments_count || 0 }}</span>
          <span>{{ formatDate(image.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { decode } from 'blurhash';

const props = defineProps({ image: Object });
const emit = defineEmits(['close']);
const originalImageLoaded = ref(false);
const blurCanvasRef = ref(null);

const originalImageUrl = computed(() => {
  if (!props.image?.id) return '';
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // width=0 означает отдачу оригинала
  return `${base}/api/photos/${props.image.id}/variant?width=0`;
});

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';
const handleError = (e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3C/svg%3E'; };

onMounted(() => {
  if (props.image?.blurhash && blurCanvasRef.value) {
    try {
      const pixels = decode(props.image.blurhash, 64, 64);
      const canvas = blurCanvasRef.value;
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(64, 64);
      imgData.data.set(pixels);
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn('BlurHash decode error in modal', e);
    }
  }
});
</script>

<style scoped>
.blur-canvas {
  filter: blur(15px);
  transform: scale(1.02);
}
</style>