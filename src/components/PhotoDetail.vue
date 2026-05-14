<template>
  <div v-if="selectedImage" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
    <div class="max-w-4xl w-full bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Изображение через JIT -->
      <div class="flex-shrink-0 bg-black flex items-center justify-center h-[500px]">
        <img :src="getFullImageUrl" :alt="selectedImage.description" class="max-w-full max-h-full object-contain" />
      </div>

      <div class="flex-1 overflow-y-auto flex flex-col">
        <div class="p-4 border-b">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">{{ selectedImage.description || 'Без описания' }}</h3>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>
          <div class="flex gap-6 text-sm text-gray-600 mb-3">
            <button @click="toggleLike" class="flex items-center gap-1 hover:text-red-600 transition"
              :class="isLiked ? 'text-red-600' : ''" :disabled="likeLoading">
              <span>❤️</span><span>{{ selectedImage.likes_count }}</span>
            </button>
            <div class="flex items-center gap-1"><span>💬</span><span>{{ photoStore.comments.length }}</span></div>
          </div>
          <p class="text-xs text-gray-400">{{ formatDate(selectedImage.created_at) }}</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="photoStore.comments.length === 0" class="text-center text-gray-500 py-8">
            Комментариев нет. Будьте первым!
          </div>
          <div v-for="comment in photoStore.comments" :key="comment.id" class="border rounded p-3 space-y-2 hover:bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium text-sm">{{ comment.username || 'Неизвестный пользователь' }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</p>
              </div>
              <button @click="openReportModal(comment.id)" class="text-gray-400 hover:text-red-600 text-sm">⚠️</button>
            </div>
            <p class="text-sm text-gray-800">{{ comment.text }}</p>
            <div class="flex gap-4 text-xs">
              <button @click="toggleCommentLike(comment.id)" class="text-gray-500 hover:text-red-600 transition flex items-center gap-1"
                :class="comment.user_liked ? 'text-red-600' : ''" :disabled="likeLoading">
                <span>❤️</span><span>{{ comment.likes_count }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 border-t">
          <div class="flex gap-2">
            <input v-model="newCommentText" @keyup.enter="submitComment" type="text" placeholder="Добавьте комментарий..."
              class="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              :disabled="commentLoading" />
            <button @click="submitComment" :disabled="!newCommentText.trim() || commentLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition">
              {{ commentLoading ? 'Отправка...' : 'Отправить' }}
            </button>
          </div>
          <p v-if="commentError" class="text-red-600 text-xs mt-1">{{ commentError }}</p>
        </div>
      </div>
    </div>

    <!-- Модалка жалобы -->
    <div v-if="reportingCommentId" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeReportModal">
      <div class="bg-white rounded-lg p-6 w-96" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Пожаловаться на комментарий</h3>
        <textarea v-model="reportReason" placeholder="Укажите причину жалобы..." rows="3"
          class="w-full px-3 py-2 border rounded mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="reportLoading"></textarea>
        <p v-if="reportError" class="text-red-600 text-xs mb-3">{{ reportError }}</p>
        <div class="flex gap-2 justify-end">
          <button @click="closeReportModal" class="px-4 py-2 border rounded hover:bg-gray-50" :disabled="reportLoading">Отмена</button>
          <button @click="submitReport" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            :disabled="reportLoading">{{ reportLoading ? 'Отправка...' : 'Отправить жалобу' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { usePhotoStore } from '../stores/media'
import { photoService } from '../services/api'

const props = defineProps({ image: Object })
const emit = defineEmits(['close'])

const photoStore = usePhotoStore()
const selectedImage = ref(props.image)
const newCommentText = ref('')
const commentLoading = ref(false)
const commentError = ref('')
const isLiked = ref(false)
const likeLoading = ref(false)
const reportingCommentId = ref(null)
const reportReason = ref('')
const reportLoading = ref(false)
const reportError = ref('')
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const getFullImageUrl = computed(() => {
  if (!selectedImage.value) return ''
  return `${API_ORIGIN}/api/photos/${selectedImage.value.id}/variant?width=1200&format=webp&q=85`
})

watch(() => props.image, (newVal) => { selectedImage.value = newVal })

const closeModal = () => emit('close')
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : ''

const toggleLike = async () => {
  likeLoading.value = true
  try {
    if (isLiked.value) {
      await photoStore.unlikePhoto(selectedImage.value.id)
      selectedImage.value.likes_count = Math.max(0, selectedImage.value.likes_count - 1)
      isLiked.value = false
    } else {
      await photoStore.likePhoto(selectedImage.value.id)
      selectedImage.value.likes_count += 1
      isLiked.value = true
    }
  } catch (err) {
    console.error(err)
    alert('Ошибка при изменении лайка')
  } finally {
    likeLoading.value = false
  }
}

const checkIfLiked = async () => {
  try {
    const res = await photoService.isPhotoLiked(selectedImage.value.id)
    isLiked.value = res.data.liked
  } catch (err) {
    console.error('Failed to check like status', err)
    isLiked.value = false
  }
}

const submitComment = async () => {
  commentError.value = ''
  if (!newCommentText.value?.trim()) {
    commentError.value = 'Комментарий не может быть пустым'
    return
  }
  if (newCommentText.value.length > 500) {
    commentError.value = 'Комментарий не может быть длиннее 500 символов'
    return
  }
  commentLoading.value = true
  try {
    await photoStore.addComment(selectedImage.value.id, newCommentText.value)
    newCommentText.value = ''
  } catch (err) {
    commentError.value = err.response?.data?.error || 'Ошибка при отправке комментария'
  } finally {
    commentLoading.value = false
  }
}

const toggleCommentLike = async (commentId) => {
  likeLoading.value = true
  try {
    const comment = photoStore.comments.find(c => c.id === commentId)
    if (!comment) throw new Error('Comment not found')
    if (comment.user_liked) {
      await photoStore.unlikeComment(commentId)
      comment.likes_count = Math.max(0, comment.likes_count - 1)
      comment.user_liked = false
    } else {
      await photoStore.likeComment(commentId)
      comment.likes_count += 1
      comment.user_liked = true
    }
  } catch (err) {
    console.error(err)
    alert('Ошибка при изменении лайка комментария')
  } finally {
    likeLoading.value = false
  }
}

const openReportModal = (commentId) => {
  reportingCommentId.value = commentId
  reportReason.value = ''
  reportError.value = ''
}
const closeReportModal = () => {
  reportingCommentId.value = null
  reportReason.value = ''
  reportError.value = ''
}
const submitReport = async () => {
  reportError.value = ''
  if (!reportReason.value?.trim()) {
    reportError.value = 'Укажите причину жалобы'
    return
  }
  if (reportReason.value.length > 500) {
    reportError.value = 'Причина не может быть длиннее 500 символов'
    return
  }
  reportLoading.value = true
  try {
    await photoStore.reportComment(reportingCommentId.value, reportReason.value)
    alert('Жалоба отправлена администратору')
    closeReportModal()
  } catch (err) {
    reportError.value = err.response?.data?.error || 'Ошибка при отправке жалобы'
  } finally {
    reportLoading.value = false
  }
}

onMounted(async () => {
  await photoStore.fetchComments(selectedImage.value.id)
  await checkIfLiked()
})
</script>