<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-4xl font-bold text-gray-800">Моя библиотека</h1>
        <router-link to="/upload" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
          Загрузить фото
        </router-link>
      </div>

      <div v-if="photoStore.loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600" />
      </div>
      <div v-else-if="photoStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {{ photoStore.error }}
      </div>
      <div v-else-if="photoStore.myPhotos.length === 0" class="text-center py-20">
        <p class="text-xl text-gray-600 mb-4">В библиотеке пока пусто</p>
        <router-link to="/upload" class="text-blue-600 hover:underline font-medium">Загрузить первое фото</router-link>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="photo in photoStore.myPhotos"
          :key="photo.id"
          class="overflow-hidden rounded-lg shadow-lg bg-white cursor-pointer hover:shadow-xl transition"
          @click="openModal(photo)"
        >
          <div class="w-full h-64 overflow-hidden bg-gray-200">
            <!-- Используем JIT для превью, как в галерее -->
            <img :src="getThumbnailUrl(photo)" :alt="photo.description || 'Photo'" class="w-full h-full object-cover" />
          </div>
          <div class="p-4 space-y-1">
            <p class="text-sm text-gray-700" v-if="photo.description">{{ photo.description }}</p>
            <p class="text-xs" :class="photo.is_public ? 'text-green-700' : 'text-gray-500'">
              {{ photo.is_public ? 'Публичное' : 'Приватное' }}
            </p>
            <p class="text-xs text-gray-400">{{ formatDate(photo.created_at) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования -->
    <div v-if="selectedPhoto" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" @click.self="closeModal">
      <div class="max-w-5xl w-full bg-white rounded-xl overflow-hidden flex flex-col md:flex-row relative">
        <button class="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-3xl leading-none" @click="closeModal">×</button>
        <div class="flex-1 bg-black flex items-center justify-center max-h-[80vh]">
          <!-- Здесь показываем оригинал или большой вариант через JIT -->
          <img :src="getFullImageUrl(selectedPhoto)" :alt="selectedPhoto.description || 'Photo'" class="max-w-full max-h-[80vh] object-contain" />
        </div>
        <div class="w-full md:w-80 p-5 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-200 bg-white">
          <h2 class="text-lg font-semibold text-gray-800">Редактирование фото</h2>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700">Описание</label>
            <textarea v-model="editDescription" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          <div v-if="selectedPhoto.is_public" class="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1">
            <p>❤️ Лайков: <span class="font-semibold">{{ selectedPhoto.likes_count || 0 }}</span></p>
            <p>💬 Комментариев: <span class="font-semibold">{{ commentsCount }}</span></p>
          </div>
          <p class="text-xs text-gray-400">Загружено: {{ formatDate(selectedPhoto.created_at) }}</p>
          <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>
          <div class="mt-auto flex flex-col gap-2">
            <button class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition disabled:bg-blue-300"
              :disabled="saving" @click="saveChanges">{{ saving ? 'Сохранение...' : 'Сохранить изменения' }}</button>
            <button class="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition disabled:bg-red-300"
              :disabled="deleting" @click="deletePhoto">{{ deleting ? 'Удаление...' : 'Удалить фото' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoStore } from '../stores/media'
import { commentService } from '../services/api'

const photoStore = usePhotoStore()
const selectedPhoto = ref(null)
const editDescription = ref('')
const commentsCount = ref(0)
const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getThumbnailUrl = (photo) => {
  // Используем JIT для получения превью 400px WebP
  return `${API_ORIGIN}/api/photos/${photo.id}/variant?width=400&format=webp&q=80`
}

const getFullImageUrl = (photo) => {
  // Для модального окна запрашиваем больший размер (1200px)
  return `${API_ORIGIN}/api/photos/${photo.id}/variant?width=1200&format=webp&q=85`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU')
}

const openModal = async (photo) => {
  selectedPhoto.value = photo
  editDescription.value = photo.description || ''
  commentsCount.value = 0
  errorMessage.value = ''
  if (photo.is_public) {
    try {
      const res = await commentService.getComments(photo.id)
      commentsCount.value = Array.isArray(res.data) ? res.data.length : 0
    } catch (e) {
      console.error('Failed to load comments', e)
    }
  }
}

const closeModal = () => { selectedPhoto.value = null }

const saveChanges = async () => {
  if (!selectedPhoto.value) return
  saving.value = true
  errorMessage.value = ''
  try {
    const updated = await photoStore.updatePhoto(selectedPhoto.value.id, { description: editDescription.value })
    selectedPhoto.value = updated
    closeModal()
  } catch (e) {
    console.error(e)
    errorMessage.value = 'Не удалось сохранить изменения'
  } finally {
    saving.value = false
  }
}

const deletePhoto = async () => {
  if (!selectedPhoto.value) return
  if (!confirm('Удалить это фото? Это действие нельзя отменить.')) return
  deleting.value = true
  errorMessage.value = ''
  try {
    await photoStore.deletePhoto(selectedPhoto.value.id)
    closeModal()
  } catch (e) {
    console.error(e)
    errorMessage.value = 'Не удалось удалить фото'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await photoStore.fetchMyPhotos()
})
</script>