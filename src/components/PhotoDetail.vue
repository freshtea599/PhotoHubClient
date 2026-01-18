<template>
  <div v-if="selectedImage" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
    <div class="max-w-4xl w-full bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Image section -->
      <div class="flex-shrink-0 bg-black flex items-center justify-center" style="height: 500px">
        <img :src="`http://localhost:3000${selectedImage.url}`" :alt="selectedImage.description" class="max-w-full max-h-full object-contain" />
      </div>

      <!-- Info and comments section -->
      <div class="flex-1 overflow-y-auto flex flex-col">
        <!-- Photo info -->
        <div class="p-4 border-b">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">{{ selectedImage.description || 'Без описания' }}</h3>
            <button
              @click="closeModal"
              class="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <!-- Likes and comments count -->
          <div class="flex gap-6 text-sm text-gray-600 mb-3">
            <button
              @click="toggleLike"
              class="flex items-center gap-1 hover:text-red-600 transition"
              :class="isLiked ? 'text-red-600' : ''"
            >
              <span>❤️</span>
              <span>{{ selectedImage.likes_count }}</span>
            </button>
            <div class="flex items-center gap-1">
              <span>💬</span>
              <span>{{ photoStore.comments.length }}</span>
            </div>
          </div>

          <p class="text-xs text-gray-400">
            {{ new Date(selectedImage.created_at).toLocaleDateString('ru-RU') }}
          </p>
        </div>

        <!-- Comments section -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="photoStore.comments.length === 0" class="text-center text-gray-500 py-8">
            Комментариев нет. Будьте первым!
          </div>

          <div v-for="comment in photoStore.comments" :key="comment.id" class="border rounded p-3 space-y-2 hover:bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium text-sm">{{ comment.username }}</p>
                <p class="text-xs text-gray-500">{{ new Date(comment.created_at).toLocaleDateString('ru-RU') }}</p>
              </div>

              <!-- Report button -->
              <button
                @click="openReportModal(comment.id)"
                class="text-gray-400 hover:text-red-600 text-sm"
              >
                ⚠️
              </button>
            </div>

            <p class="text-sm text-gray-800">{{ comment.text }}</p>

            <!-- Comment like button -->
            <div class="flex gap-4 text-xs">
              <button
                @click="toggleCommentLike(comment.id)"
                class="text-gray-500 hover:text-red-600 transition flex items-center gap-1"
                :class="comment.user_liked ? 'text-red-600' : ''"
              >
                <span>❤️</span>
                <span>{{ comment.likes_count }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Comment input -->
        <div class="p-4 border-t">
          <div class="flex gap-2">
            <input
              v-model="newCommentText"
              @keyup.enter="submitComment"
              type="text"
              placeholder="Добавьте комментарий..."
              class="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              @click="submitComment"
              :disabled="!newCommentText.trim()"
              class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Report comment modal -->
    <div v-if="reportingCommentId" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeReportModal">
      <div class="bg-white rounded-lg p-6 w-96" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Пожаловаться на комментарий</h3>

        <textarea
          v-model="reportReason"
          placeholder="Укажите причину жалобы..."
          class="w-full px-3 py-2 border rounded mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />

        <div class="flex gap-2 justify-end">
          <button
            @click="closeReportModal"
            class="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            @click="submitReport"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Отправить жалобу
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePhotoStore } from '../stores/photos'
import { photoService } from '../services/api'

const props = defineProps({
  image: Object,
})

const emit = defineEmits(['close'])

const photoStore = usePhotoStore()
const selectedImage = ref(props.image)
const newCommentText = ref('')
const isLiked = ref(false)
const reportingCommentId = ref(null)
const reportReason = ref('')

const closeModal = () => {
  emit('close')
}

const toggleLike = async () => {
  if (isLiked.value) {
    await photoStore.unlikePhoto(selectedImage.value.id)
  } else {
    await photoStore.likePhoto(selectedImage.value.id)
  }
  isLiked.value = !isLiked.value
}

const submitComment = async () => {
  if (!newCommentText.value.trim()) return

  try {
    await photoStore.addComment(selectedImage.value.id, newCommentText.value)
    newCommentText.value = ''
  } catch (err) {
    console.error('Failed to add comment:', err)
  }
}

const toggleCommentLike = async (commentId) => {
  const comment = photoStore.comments.find((c) => c.id === commentId)
  if (comment.user_liked) {
    await photoStore.unlikeComment(commentId)
  } else {
    await photoStore.likeComment(commentId)
  }
}

const openReportModal = (commentId) => {
  reportingCommentId.value = commentId
  reportReason.value = ''
}

const closeReportModal = () => {
  reportingCommentId.value = null
  reportReason.value = ''
}

const submitReport = async () => {
  if (!reportReason.value.trim()) {
    alert('Укажите причину жалобы')
    return
  }

  try {
    await photoStore.reportComment(reportingCommentId.value, reportReason.value)
    alert('Жалоба отправлена администратору')
    closeReportModal()
  } catch (err) {
    console.error('Failed to report comment:', err)
  }
}

const checkIfLiked = async () => {
  try {
    const response = await photoService.isPhotoLiked(selectedImage.value.id)
    isLiked.value = response.data.liked
  } catch (err) {
    console.error('Failed to check if liked:', err)
  }
}

onMounted(async () => {
  await photoStore.fetchComments(selectedImage.value.id)
  await checkIfLiked()
})
</script>
