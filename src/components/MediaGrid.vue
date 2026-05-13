<template>
  <div ref="containerRef" class="overflow-auto h-full" @scroll="onScroll">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <ImageItem
          v-for="photo in visiblePhotos"
          :key="photo.id"
          :photo="photo"
          @click="$emit('photo-click', photo)"
        />
      </div>
    </div>
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ImageItem from './ImageItem.vue';
import { usePhotoStore } from '../stores/media';
import { useVirtualScroll } from '../composables/useVirtualScroll';

const emit = defineEmits(['photo-click']);
const photoStore = usePhotoStore();

const containerRef = ref(null);
const ITEM_HEIGHT = 380; // подберите под свою высоту карточки

const totalCount = computed(() => photoStore.photos.length);
const loading = computed(() => photoStore.loading);

const { startIndex, endIndex, offsetY, totalHeight, onScroll } = useVirtualScroll(ITEM_HEIGHT, totalCount);

const visiblePhotos = computed(() =>
  photoStore.photos.slice(startIndex.value, endIndex.value)
);

const finalOnScroll = (e) => {
  onScroll(e);
  const scrollBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
  if (scrollBottom < 500 && !photoStore.loading && photoStore.hasMore) {
    photoStore.fetchPhotos();
  }
};

onMounted(() => {
  if (!photoStore.photos.length && !photoStore.loading) {
    photoStore.fetchPhotos();
  }
});
</script>