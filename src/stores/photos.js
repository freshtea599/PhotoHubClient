import { defineStore } from 'pinia'
import { ref } from 'vue'
import { photoService, commentService } from '../services/api'

export const usePhotoStore = defineStore('photos', () => {
  const photos = ref([])
  const myPhotos = ref([])
  const comments = ref([])

  const loading = ref(false)
  const error = ref(null)

  const uploading = ref(false)
  const uploadProgress = ref(0)

  const fetchPhotos = async (limit = 20, offset = 0) => {
    loading.value = true
    error.value = null
    try {
      const response = await photoService.getPhotos(limit, offset)
      photos.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch photos'
    } finally {
      loading.value = false
    }
  }

  const fetchMyPhotos = async (limit = 50, offset = 0) => {
    loading.value = true
    error.value = null
    try {
      const response = await photoService.getMyPhotos(limit, offset)
      myPhotos.value = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch my photos'
    } finally {
      loading.value = false
    }
  }

  const uploadPhoto = async (file, description = '', isPublic = false) => {
    uploading.value = true
    error.value = null
    uploadProgress.value = 0

    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('description', description)
      formData.append('is_public', isPublic ? 'true' : 'false')

      const response = await photoService.uploadPhoto(formData)

      if (!isPublic) {
        // Если приватное, сразу добавляем в библиотеку
        photos.value.unshift(response.data)
        myPhotos.value.unshift(response.data)
      } else {
        // Если публичное, оно будет на проверке
        myPhotos.value.unshift(response.data)
      }

      uploadProgress.value = 100
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to upload photo'
      throw err
    } finally {
      uploading.value = false
    }
  }

  const updatePhoto = async (id, description, isPublic) => {
    try {
      const response = await photoService.updatePhoto(id, { description, is_public: isPublic })

      const idxPublic = photos.value.findIndex((p) => p.id === id)
      if (idxPublic !== -1) photos.value[idxPublic] = response.data

      const idxMine = myPhotos.value.findIndex((p) => p.id === id)
      if (idxMine !== -1) myPhotos.value[idxMine] = response.data

      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update photo'
      throw err
    }
  }

  const deletePhoto = async (id) => {
    try {
      await photoService.deletePhoto(id)
      photos.value = photos.value.filter((p) => p.id !== id)
      myPhotos.value = myPhotos.value.filter((p) => p.id !== id)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete photo'
      throw err
    }
  }

  // Лайки фото
  const likePhoto = async (photoId) => {
    try {
      const response = await photoService.likePhoto(photoId)
      const idx = photos.value.findIndex((p) => p.id === photoId)
      if (idx !== -1) photos.value[idx] = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to like photo'
    }
  }

  const unlikePhoto = async (photoId) => {
    try {
      const response = await photoService.unlikePhoto(photoId)
      const idx = photos.value.findIndex((p) => p.id === photoId)
      if (idx !== -1) photos.value[idx] = response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to unlike photo'
    }
  }

  // Комментарии
  const fetchComments = async (photoId) => {
    try {
      const response = await commentService.getComments(photoId)
      comments.value = response.data || []
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch comments'
    }
  }

  const addComment = async (photoId, text) => {
    try {
      const response = await commentService.createComment(photoId, text)
      comments.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create comment'
      throw err
    }
  }

  const likeComment = async (commentId) => {
    try {
      await commentService.likeComment(commentId)
      const idx = comments.value.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        comments.value[idx].likes_count += 1
        comments.value[idx].user_liked = true
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to like comment'
    }
  }

  const unlikeComment = async (commentId) => {
    try {
      await commentService.unlikeComment(commentId)
      const idx = comments.value.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        comments.value[idx].likes_count -= 1
        comments.value[idx].user_liked = false
      }
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to unlike comment'
    }
  }

  const reportComment = async (commentId, reason) => {
    try {
      await commentService.reportComment(commentId, reason)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to report comment'
      throw err
    }
  }

  const deleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId)
      comments.value = comments.value.filter((c) => c.id !== commentId)
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete comment'
      throw err
    }
  }

  return {
    photos,
    myPhotos,
    comments,
    loading,
    error,
    uploading,
    uploadProgress,
    fetchPhotos,
    fetchMyPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    likePhoto,
    unlikePhoto,
    fetchComments,
    addComment,
    likeComment,
    unlikeComment,
    reportComment,
    deleteComment,
  }
})
