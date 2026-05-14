import { defineStore } from 'pinia';
import { ref } from 'vue';
import { photoService, commentService } from '../services/api';
import { savePhotos, getPhotos, clearPhotos, savePhoto, deletePhotoFromCache } from '../services/indexedDB';

export const usePhotoStore = defineStore('photos', () => {
  // Публичные фото (галерея)
  const publicPhotos = ref([]);
  // Мои фото (библиотека)
  const myPhotos = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const hasMore = ref(true);
  let publicPage = 0;
  const limit = 20;

  // Комментарии текущего открытого фото
  const comments = ref([]);

  // ========== Публичные фото ==========
  async function fetchPhotos(refresh = false) {
    if (loading.value) return;
    if (!refresh && !hasMore.value && publicPage > 0) return;
    loading.value = true;
    error.value = null;
    try {
      const offset = refresh ? 0 : publicPhotos.value.length;
      const response = await photoService.getPhotos(limit, offset);
      const newPhotos = response.data || [];
      if (refresh) {
        publicPhotos.value = newPhotos;
        publicPage = 0;
      } else {
        publicPhotos.value = [...publicPhotos.value, ...newPhotos];
      }
      hasMore.value = newPhotos.length === limit;
      if (!refresh && newPhotos.length) publicPage++;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  // ========== Мои фото ==========
  async function fetchMyPhotos(refresh = false) {
    loading.value = true;
    error.value = null;
    try {
      const response = await photoService.getMyPhotos(100); // или с пагинацией
      myPhotos.value = response.data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  // ========== Общие действия ==========
  async function uploadPhoto(file, description, isPublic) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('description', description);
    formData.append('is_public', isPublic ? 'true' : 'false');
    const response = await photoService.uploadPhoto(formData);
    const newPhoto = response.data;
    // Добавляем в мои фото
    myPhotos.value.unshift(newPhoto);
    // Если публичное – добавляем и в галерею
    if (isPublic) {
      publicPhotos.value.unshift(newPhoto);
    }
    await savePhoto(newPhoto);
    return newPhoto;
  }

  async function updatePhoto(id, data) {
    const response = await photoService.updatePhoto(id, data);
    // Обновляем в обоих массивах
    const idxPub = publicPhotos.value.findIndex(p => p.id === id);
    if (idxPub !== -1) 
      publicPhotos.value[idxPub] = response.data;
    const idxMine = myPhotos.value.findIndex(p => p.id === id);
    if (idxMine !== -1) 
      myPhotos.value[idxMine] = response.data;
    await savePhoto(response.data);
    return response.data;
  }

  async function deletePhoto(id) {
    await photoService.deletePhoto(id);
    publicPhotos.value = publicPhotos.value.filter(p => p.id !== id);
    myPhotos.value = myPhotos.value.filter(p => p.id !== id);
    await deletePhotoFromCache(id);
  }

  // ========== Лайки фото ==========
  async function likePhoto(id) {
    await photoService.likePhoto(id);
    const updateLikes = (arr) => {
      const photo = arr.find(p => p.id === id);
      if (photo) photo.likes_count = (photo.likes_count || 0) + 1;
    };
    updateLikes(publicPhotos.value);
    updateLikes(myPhotos.value);
  }

  async function unlikePhoto(id) {
    await photoService.unlikePhoto(id);
    const updateLikes = (arr) => {
      const photo = arr.find(p => p.id === id);
      if (photo) photo.likes_count = Math.max(0, (photo.likes_count || 0) - 1);
    };
    updateLikes(publicPhotos.value);
    updateLikes(myPhotos.value);
  }

  // ========== Комментарии ==========
  async function fetchComments(photoId) {
    const response = await commentService.getComments(photoId);
    comments.value = response.data || [];
  }

  async function addComment(photoId, text) {
    const response = await commentService.createComment(photoId, text);
    comments.value.unshift(response.data);
    // также увеличить счётчик комментариев у фото (если нужно)
  }

  async function likeComment(commentId) {
    await commentService.likeComment(commentId);
    const comment = comments.value.find(c => c.id === commentId);
    if (comment) comment.likes_count += 1;
  }

  async function unlikeComment(commentId) {
    await commentService.unlikeComment(commentId);
    const comment = comments.value.find(c => c.id === commentId);
    if (comment) comment.likes_count -= 1;
  }

  async function reportComment(commentId, reason) {
    await commentService.reportComment(commentId, reason);
  }

  async function deleteComment(commentId) {
    await commentService.deleteComment(commentId);
    comments.value = comments.value.filter(c => c.id !== commentId);
  }

  return {
    publicPhotos,
    myPhotos,
    comments,
    loading,
    error,
    hasMore,
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
  };
});