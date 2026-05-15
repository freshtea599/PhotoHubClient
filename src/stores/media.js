import { defineStore } from 'pinia';
import { ref } from 'vue';
import { photoService, commentService } from '../services/api';
import { savePhotos, getPhotos, clearPhotos, savePhoto, deletePhotoFromCache } from '../services/indexedDB';

export const usePhotoStore = defineStore('photos', () => {
    const publicPhotos = ref([]);
    const myPhotos = ref([]);
    const comments = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const hasMore = ref(true);
    let publicPage = 0;
    const limit = 20;

    // Вспомогательные методы для работы с IndexedDB
    async function loadFromCache() {
        const cached = await getPhotos();
        if (cached && cached.length) {
            publicPhotos.value = cached;
            return true;
        }
        return false;
    }

    async function refreshCacheInBackground() {
        try {
            const response = await photoService.getPhotos(limit, 0);
            const newPhotos = response.data || [];
            if (newPhotos.length) {
                publicPhotos.value = newPhotos;
                await savePhotos(newPhotos);
                hasMore.value = newPhotos.length === limit;
            }
        } catch (err) {
            console.error('Background refresh failed', err);
        }
    }

    async function fetchPhotos(refresh = false) {
        if (loading.value) return;
        // При первом вызове (нет данных) пытаемся загрузить из кэша
        if (!refresh && publicPhotos.value.length === 0) {
            const fromCache = await loadFromCache();
            if (fromCache) {
                // Фоновое обновление
                refreshCacheInBackground();
                return;
            }
        }
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
            await savePhotos(publicPhotos.value);
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    async function fetchMyPhotos(refresh = false) {
        loading.value = true;
        error.value = null;
        try {
            const response = await photoService.getMyPhotos(100);
            myPhotos.value = response.data || [];
        } catch (err) {
            error.value = err.message;
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
        myPhotos.value.unshift(newPhoto);
        if (isPublic) {
            publicPhotos.value.unshift(newPhoto);
        }
        await savePhoto(newPhoto);
        return newPhoto;
    }

    async function updatePhoto(id, data) {
        const response = await photoService.updatePhoto(id, data);
        const idxPub = publicPhotos.value.findIndex(p => p.id === id);
        if (idxPub !== -1) publicPhotos.value[idxPub] = response.data;
        const idxMine = myPhotos.value.findIndex(p => p.id === id);
        if (idxMine !== -1) myPhotos.value[idxMine] = response.data;
        await savePhoto(response.data);
        return response.data;
    }

    async function deletePhoto(id) {
        await photoService.deletePhoto(id);
        publicPhotos.value = publicPhotos.value.filter(p => p.id !== id);
        myPhotos.value = myPhotos.value.filter(p => p.id !== id);
        await deletePhotoFromCache(id);
    }

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

    async function fetchComments(photoId) {
        const response = await commentService.getComments(photoId);
        comments.value = response.data || [];
    }

    async function addComment(photoId, text) {
        const response = await commentService.createComment(photoId, text);
        comments.value.unshift(response.data);
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