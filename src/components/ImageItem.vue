<template>
  <div class="group overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition" @click="$emit('click')">
    <div class="relative w-full aspect-square bg-gray-200 overflow-hidden">
      <img
        v-lazy="imageUrl"
        class="w-full h-full object-cover transition-opacity duration-500"
        :class="{ 'opacity-100': loaded, 'opacity-0': !loaded }"
        @load="loaded = true"
        alt="photo"
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
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ photo: Object, required: true })
const emit = defineEmits(['click'])
const loaded = ref(false)

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : ''
const imageUrl = computed(() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${base}/api/photos/${props.photo.id}/variant?width=1080&format=webp&q=80`
})
</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>