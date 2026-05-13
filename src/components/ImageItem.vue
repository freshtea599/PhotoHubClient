<template>
  <div
    class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition"
    @click="$emit('click')"
  >
    <div class="relative w-full aspect-square bg-gray-200 overflow-hidden" :data-id="photo.id">
      <!-- BlurHash canvas placeholder -->
      <canvas
        v-if="blurHashData"
        ref="canvasRef"
        class="absolute inset-0 w-full h-full blur-image"
        width="32"
        height="32"
      />
      <!-- реальное изображение -->
      <img
        v-if="realUrl"
        :src="realUrl"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        :class="{ 'opacity-0': !loaded }"
        @load="loaded = true"
        alt="photo"
      />
    </div>
    <div class="p-4">
      <p v-if="photo.description" class="text-sm text-gray-700 line-clamp-2 mb-2">
        {{ photo.description }}
      </p>
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>{{ formatDate(photo.created_at) }}</span>
        <div class="flex gap-3">
          <span>❤️ {{ photo.likes_count || 0 }}</span>
          <span>💬 {{ photo.comments_count || 0 }}</span>
        </div>
      </div>
      <p v-if="photo.username" class="text-xs text-gray-400 mt-2">
        Автор: {{ photo.username }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { decodeBlurHash } from 'blurhash';
import { useImageObserver } from '../composables/useImageObserver';

const props = defineProps({
  photo: { type: Object, required: true }
});
const emit = defineEmits(['click']);

const canvasRef = ref(null);
const realUrl = ref(null);
const loaded = ref(false);
const blurHashData = ref(null);

const { observe } = useImageObserver();

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU');
};

onMounted(() => {
  // Генерация BlurHash
  if (props.photo.blurhash) {
    try {
      const pixels = decodeBlurHash(props.photo.blurhash, 32, 32);
      const canvas = canvasRef.value;
      if (canvas) {
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(32, 32);
        imgData.data.set(pixels);
        ctx.putImageData(imgData, 0, 0);
        blurHashData.value = true;
      }
    } catch (e) {
      console.warn('BlurHash decode error', e);
    }
  }

  // Ленивая загрузка полноразмерного изображения (JIT)
  const element = document.querySelector(`[data-id="${props.photo.id}"]`);
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/photos/${props.photo.id}/variant?width=600&format=webp&q=80`;
  if (element) {
    observe(element, url, (src) => {
      realUrl.value = src;
    });
  } else {
    realUrl.value = url;
  }
});
</script>

<style scoped>
.blur-image {
  filter: blur(12px);
  transform: scale(1.02);
}
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>