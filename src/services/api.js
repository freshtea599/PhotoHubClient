import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  register: (email, password, username) => api.post('/register', { email, password, username }),
  login: (email, password) => api.post('/login', { email, password }),
  getMe: () => api.get('/auth/me'),
}

export const photoService = {
  // ✅ основные методы (как у вас сейчас)
  getPhotos: (limit = 20, offset = 0) =>
    api.get('/photos', { params: { limit, offset } }),

  getMyPhotos: (limit = 50, offset = 0) =>
    api.get('/photos/mine', { params: { limit, offset } }),

  getPhotoById: (id) => api.get(`/photos/${id}`),

  uploadPhoto: (formData) =>
    api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updatePhoto: (id, data) => api.put(`/photos/${id}`, data),
  deletePhoto: (id) => api.delete(`/photos/${id}`),

  likePhoto: (id) => api.post(`/photos/${id}/like`),
  unlikePhoto: (id) => api.delete(`/photos/${id}/like`),
  isPhotoLiked: (id) => api.get(`/photos/${id}/like`),

  // ✅ алиасы (чинят ошибку "fetchPhotos is not a function")
  fetchPhotos: (limit = 20, offset = 0) =>
    api.get('/photos', { params: { limit, offset } }),

  fetchMyPhotos: (limit = 50, offset = 0) =>
    api.get('/photos/mine', { params: { limit, offset } }),
}


export const commentService = {
  getComments: (photoId) => api.get(`/photos/${photoId}/comments`),
  createComment: (photoId, text) => api.post(`/photos/${photoId}/comments`, { text }),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/comments/${commentId}/like`),
  reportComment: (commentId, reason) => api.post(`/comments/${commentId}/report`, { reason }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
}

export const adminService = {
  getPendingPhotos: () => api.get('/admin/photos/pending'),
  approvePhoto: (id) => api.post(`/admin/photos/${id}/approve`),
  rejectPhoto: (id, reason) => api.post(`/admin/photos/${id}/reject`, { reason }),
  getCommentReports: () => api.get('/admin/comment-reports'),
  resolveCommentReport: (reportId, action, adminNote) =>
    api.post(`/admin/comment-reports/${reportId}/resolve`, { action, adminNote }),
}

export default api
