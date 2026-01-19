<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-gray-800">Админ панель</h1>

      <div class="flex gap-4 mb-8 border-b">
        <button
          @click="activeTab = 'photos'"
          :class="[
            'px-4 py-2 font-medium border-b-2 transition',
            activeTab === 'photos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          Фото на проверку
        </button>

        <button
          @click="activeTab = 'reports'"
          :class="[
            'px-4 py-2 font-medium border-b-2 transition',
            activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          Жалобы на комментарии ({{ reports.length }})
        </button>
      </div>

      <div v-if="activeTab === 'photos'" class="space-y-4">
        <div v-if="pendingPhotos.length === 0" class="text-center py-8 text-gray-600">
          Нет фото на проверке
        </div>

        <div v-for="photo in pendingPhotos" :key="photo.id" class="bg-white rounded-lg shadow p-4 flex gap-4">
          <img :src="getImageUrl(photo.url)" :alt="photo.description" class="w-32 h-32 object-cover rounded" />

          <div class="flex-1">
            <h3 class="font-semibold">{{ photo.description || 'Без описания' }}</h3>
            <p class="text-sm text-gray-600">{{ photo.username }}</p>
            <p class="text-xs text-gray-400">{{ new Date(photo.created_at).toLocaleDateString('ru-RU') }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <button
              @click="approvePhoto(photo.id)"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Одобрить
            </button>

            <button
              @click="openRejectModal(photo.id)"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Отклонить
            </button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'reports'" class="space-y-4">
        <div v-if="reports.length === 0" class="text-center py-8 text-gray-600">
          Нет жалоб
        </div>

        <div v-for="report in reports" :key="report.id" class="bg-white rounded-lg shadow p-4 border-l-4 border-red-600">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold">{{ report.comment.username }}</h3>
            <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Жалоба #{{ report.id }}</span>
          </div>

          <p class="text-sm text-gray-700 mb-2">Комментарий: "{{ report.comment.text }}"</p>
          <p class="text-sm text-gray-600 mb-3">Причина жалобы: {{ report.reason }}</p>

          <div class="flex gap-2">
            <button
              @click="deleteCommentAndResolve(report.id)"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Удалить комментарий
            </button>

            <button
              @click="dismissReport(report.id)"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Отклонить жалобу
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rejectingPhotoId" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeRejectModal">
      <div class="bg-white rounded-lg p-6 w-96" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Отклонить фото</h3>

        <textarea
          v-model="rejectReason"
          placeholder="Укажите причину отклонения..."
          class="w-full px-3 py-2 border rounded mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
        />

        <div class="flex gap-2 justify-end">
          <button
            @click="closeRejectModal"
            class="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Отмена
          </button>

          <button
            @click="rejectPhoto"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminService } from '../services/api'

const activeTab = ref('photos')
const pendingPhotos = ref([])
const reports = ref([])

const rejectingPhotoId = ref(null)
const rejectReason = ref('')

const getImageUrl = (path) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (!path.startsWith('/')) path = '/' + path
  return base + path
}


const loadPendingPhotos = async () => {
  try {
    const response = await adminService.getPendingPhotos()
    pendingPhotos.value = response.data || []
  } catch (err) {
    console.error('Failed to load pending photos:', err)
  }
}

const loadReports = async () => {
  try {
    const response = await adminService.getCommentReports()
    reports.value = response.data || []
  } catch (err) {
    console.error('Failed to load reports:', err)
  }
}

const approvePhoto = async (photoId) => {
  try {
    await adminService.approvePhoto(photoId)
    pendingPhotos.value = pendingPhotos.value.filter((p) => p.id !== photoId)
    alert('Фото одобрено')
  } catch (err) {
    console.error('Failed to approve photo:', err)
    alert('Ошибка при одобрении')
  }
}

const openRejectModal = (photoId) => {
  rejectingPhotoId.value = photoId
  rejectReason.value = ''
}

const closeRejectModal = () => {
  rejectingPhotoId.value = null
  rejectReason.value = ''
}

const rejectPhoto = async () => {
  if (!rejectReason.value.trim()) {
    alert('Укажите причину отклонения')
    return
  }

  try {
    await adminService.rejectPhoto(rejectingPhotoId.value, rejectReason.value)
    pendingPhotos.value = pendingPhotos.value.filter((p) => p.id !== rejectingPhotoId.value)
    closeRejectModal()
    alert('Фото отклонено')
  } catch (err) {
    console.error('Failed to reject photo:', err)
    alert('Ошибка при отклонении')
  }
}

const deleteCommentAndResolve = async (reportId) => {
  try {
    await adminService.resolveCommentReport(reportId, 'delete', 'Удалено администратором')
    reports.value = reports.value.filter((r) => r.id !== reportId)
    alert('Комментарий удалён, жалоба разрешена')
  } catch (err) {
    console.error('Failed to resolve report:', err)
    alert('Ошибка при разрешении жалобы')
  }
}

const dismissReport = async (reportId) => {
  try {
    await adminService.resolveCommentReport(reportId, 'dismiss', 'Жалоба отклонена')
    reports.value = reports.value.filter((r) => r.id !== reportId)
    alert('Жалоба отклонена')
  } catch (err) {
    console.error('Failed to dismiss report:', err)
    alert('Ошибка при отклонении жалобы')
  }
}

onMounted(async () => {
  await loadPendingPhotos()
  await loadReports()
})
</script>
