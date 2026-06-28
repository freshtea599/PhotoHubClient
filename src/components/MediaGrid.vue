<!-- src/components/MediaGrid.vue -->
<template>
  <div
    ref="containerRef"
    class="media-scroller fixed inset-0 top-[150px] overflow-auto"
    @scroll="onScroll"
  >
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 p-6"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="slot in visibleSlots"
          :key="slot.slotIndex"
          @click="slot.photo && emit('photo-click', slot.photo)"
          class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition"
          style="height: 380px; display: flex; flex-direction: column;"
        >
          <template v-if="slot.photo">
            <div class="relative w-full" style="padding-bottom: 56.25%; flex-shrink: 0;">
              <canvas
                v-if="!loadedImages[slot.photo.id] && slot.photo.blurhash"
                :ref="(el) => setCanvasRef(slot.photo.id, el, slot.photo.blurhash)"
                class="absolute inset-0 w-full h-full blur-canvas"
                width="64"
                height="64"
              ></canvas>
              <img
                :src="getImageUrl(slot.photo, 640)"
                :alt="slot.photo.description || 'Photo'"
                loading="lazy"
                class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                :class="{ 'opacity-100': loadedImages[slot.photo.id], 'opacity-0': !loadedImages[slot.photo.id] }"
                @load="loadedImages[slot.photo.id] = true"
                @error="handleImageError"
              />
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
              <p v-if="slot.photo.description" class="text-sm text-gray-700 line-clamp-2 mb-2">
                {{ slot.photo.description }}
              </p>
              <div class="flex justify-between text-xs text-gray-500 mt-auto">
                <span>{{ formatDate(slot.photo.created_at) }}</span>
                <div class="flex gap-3">
                  <span>❤️ {{ slot.photo.likes_count || 0 }}</span>
                  <span>💬 {{ slot.photo.comments_count || 0 }}</span>
                </div>
              </div>
              <p v-if="slot.photo.username" class="text-xs text-gray-400 mt-1">
                Автор: {{ slot.photo.username }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { usePhotoStore } from '../stores/media';

const emit = defineEmits(['photo-click']);
const photoStore = usePhotoStore();
const containerRef = ref(null);

const ITEM_HEIGHT = 380; // фиксированная высота карточки
const BUFFER = 8; // увеличенный буфер для плавного скролла

const totalCount = computed(() => photoStore.publicPhotos.length);
const loading = computed(() => photoStore.loading);

// Состояние скролла
const scrollTop = ref(0);
const containerHeight = ref(window.innerHeight - 150); // начальное приближение

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER));
const endIndex = computed(() => Math.min(totalCount.value, Math.ceil((scrollTop.value + containerHeight.value) / ITEM_HEIGHT) + BUFFER));
const offsetY = computed(() => startIndex.value * ITEM_HEIGHT);
const totalHeight = computed(() => totalCount.value * ITEM_HEIGHT);

// Слоты для рециркуляции (динамическое количество)
const visibleSlots = computed(() => {
  const start = startIndex.value;
  const count = Math.ceil(containerHeight.value / ITEM_HEIGHT) + BUFFER * 2;
  const slots = [];
  for (let i = 0; i < count; i++) {
    const photoIndex = start + i;
    const photo = photoIndex < totalCount.value ? photoStore.publicPhotos[photoIndex] : null;
    slots.push({ slotIndex: i, photo });
  }
  return slots;
});

const loadedImages = ref({});
const canvasRefs = ref({});

// Вспомогательные функции
const setCanvasRef = (id, el, blurhash) => {
  if (el && blurhash) {
    import('blurhash').then(({ decode }) => {
      const pixels = decode(blurhash, 64, 64);
      const canvas = el;
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const imgData = ctx.createImageData(64, 64);
      imgData.data.set(pixels);
      ctx.putImageData(imgData, 0, 0);
    }).catch(e => console.warn('BlurHash decode error', e));
  }
};

const getImageUrl = (photo, width = 640) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base}/api/photos/${photo.id}/variant?width=${width}&format=webp&q=75`;
};

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';

const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml,...';
};

// Переменные для компенсации скролла при подгрузке
let previousScrollTop = 0;
let previousScrollHeight = 0;

// Обработчик скролла
const onScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
  if (!containerHeight.value && e.target.clientHeight) {
    containerHeight.value = e.target.clientHeight;
  }
  // Бесконечная подгрузка
  const container = containerRef.value;
  if (!container) return;
  const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (scrollBottom < 500 && !photoStore.loading && photoStore.hasMore) {
    previousScrollTop = container.scrollTop;
    previousScrollHeight = container.scrollHeight;
    photoStore.fetchPhotos();
  }
};

// Компенсация скролла после добавления новых фото
watch(
  () => photoStore.publicPhotos.length,
  (newLen, oldLen) => {
    if (newLen > oldLen && containerRef.value) {
      const container = containerRef.value;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
    }
  }
);

// Предиктивная загрузка следующих 6 фото
watch(endIndex, (newEnd) => {
  const nextStart = newEnd;
  const nextEnd = Math.min(nextStart + 6, totalCount.value);
  for (let i = nextStart; i < nextEnd; i++) {
    const photo = photoStore.publicPhotos[i];
    if (photo) new Image().src = getImageUrl(photo, 640);
  }
});

onMounted(() => {
  if (!photoStore.publicPhotos.length && !photoStore.loading) {
    photoStore.fetchPhotos();
  }
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
});

// Обновление высоты при ресайзе
const resizeObserver = new ResizeObserver(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight;
  }
});
onMounted(() => resizeObserver.observe(containerRef.value));
onBeforeUnmount(() => resizeObserver.disconnect());
</script>

<style scoped>
.media-scroller {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.media-scroller::-webkit-scrollbar {
  display: none;
}
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