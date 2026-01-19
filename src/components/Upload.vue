<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-3xl font-bold mb-8 text-gray-800 text-center">Загрузить фото</h2>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition"
          :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'"
          @click="fileInput?.click()"
        >
          <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileSelect" />

          <svg v-if="!selectedFile" class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>

          <div v-if="!selectedFile">
            <p class="text-gray-700 font-medium">Перетащи фото сюда или кликни для выбора</p>
          </div>

          <div v-else class="space-y-4">
            <div class="flex items-center justify-center">
              <img :src="previewUrl" :alt="selectedFile.name" class="max-h-48 rounded-lg shadow" />
            </div>

            <div class="text-sm text-gray-600">
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
            </div>
          </div>
        </div>

        <div v-if="selectedFile" class="mt-6 space-y-4">
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Описание (опционально)</label>
            <textarea
              v-model="description"
              id="description"
              rows="3"
              placeholder="Добавьте описание к вашему фото..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div class="flex items-center">
            <input v-model="isPublic" id="ispublic" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label for="ispublic" class="ml-2 block text-sm text-gray-700">Сделать фото публичным</label>
          </div>

          <div v-if="photoStore.uploading" class="space-y-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full transition-all" :style="{ width: photoStore.uploadProgress + '%' }"></div>
            </div>
            <p class="text-sm text-gray-600 text-center">{{ photoStore.uploadProgress }}%</p>
          </div>

          <div v-if="photoStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ photoStore.error }}
          </div>

          <button
            type="button"
            @click="uploadPhoto"
            :disabled="photoStore.uploading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {{ photoStore.uploading ? 'Загрузка...' : 'Загрузить фото' }}
          </button>

          <button
            type="button"
            @click="resetForm"
            class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
          >
            Выбрать другое фото
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePhotoStore } from '../stores/photos'

const router = useRouter()
const photoStore = usePhotoStore()

const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)
const isDragging = ref(false)

const description = ref('')
const isPublic = ref(false)

const handleFileSelect = (event) => {
  const file = event?.target?.files?.[0]
  if (file && file.type?.startsWith('image/')) setFile(file)
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event?.dataTransfer?.files?.[0]
  if (file && file.type?.startsWith('image/')) setFile(file)
}

const setFile = (file) => {
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

const uploadPhoto = async () => {
  if (!(selectedFile.value instanceof File)) return
  await photoStore.uploadPhoto(selectedFile.value, description.value, isPublic.value)

  router.push('/library')
}

const resetForm = () => {
  selectedFile.value = null
  previewUrl.value = null
  description.value = ''
  isPublic.value = false
  if (fileInput.value) fileInput.value.value = ''
}
</script>
