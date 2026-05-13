import { defineStore } from 'pinia';
import { ref } from 'vue';
import { photoService } from '../services/api';
import { savePhotos, getPhotos, clearPhotos, savePhoto, deletePhotoFromCache } from '../services/indexedDB';

const usePhotoStore = defineStore('photos', () => {
  const photos = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const hasMore = ref(true);
  let page = 0;
  const limit = 20;

  async function fetchPhotos(refresh = false) {
    if (loading.value) return;
    if (!refresh && !hasMore.value && page > 0) return;
    loading.value = true;
    error.value = null;
    try {
      const offset = refresh ? 0 : photos.value.length;
      const response = await photoService.getPhotos(limit, offset);
      const newPhotos = response.data || [];
      if (refresh) {
        photos.value = newPhotos;
        await clearPhotos();
        page = 0;
      } else {
        photos.value = [...photos.value, ...newPhotos];
      }
      hasMore.value = newPhotos.length === limit;
      if (!refresh && newPhotos.length) page++;
      await savePhotos(photos.value);
    } catch (err) {
      error.value = err.message;
      const cached = await getPhotos();
      if (cached.length) photos.value = cached;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyPhotos() {
    loading.value = true;
    error.value = null;
    try {
      const response = await photoService.getMyPhotos(50);
      photos.value = response.data || [];
      await savePhotos(photos.value);
    } catch (err) {
      error.value = err.message;
      const cached = await getPhotos();
      if (cached.length) photos.value = cached;
    } finally {
      loading.value = false;
    }
  }

  async function uploadPhoto(file, description, isPublic) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('description', description);
    formData.append('is_public', isPublic ? 'true' : 'false');
    const response = await photoService.uploadPhoto(formData);
    const newPhoto = response.data;
    photos.value.unshift(newPhoto);
    await savePhoto(newPhoto);
    return newPhoto;
  }

  async function updatePhoto(id, data) {
    const response = await photoService.updatePhoto(id, data);
    const index = photos.value.findIndex(p => p.id === id);
    if (index !== -1) photos.value[index] = response.data;
    await savePhoto(response.data);
    return response.data;
  }

  async function deletePhoto(id) {
    await photoService.deletePhoto(id);
    photos.value = photos.value.filter(p => p.id !== id);
    await deletePhotoFromCache(id);
  }

  async function likePhoto(id) {
    await photoService.likePhoto(id);
    const photo = photos.value.find(p => p.id === id);
    if (photo) photo.likes_count = (photo.likes_count || 0) + 1;
  }

  async function unlikePhoto(id) {
    await photoService.unlikePhoto(id);
    const photo = photos.value.find(p => p.id === id);
    if (photo) photo.likes_count = Math.max(0, (photo.likes_count || 0) - 1);
  }

  return {
    photos,
    loading,
    error,
    hasMore,
    fetchPhotos,
    fetchMyPhotos,
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    likePhoto,
    unlikePhoto
  };
});

export { usePhotoStore };
export const useMediaStore = usePhotoStore;