// src/stores/media.js
import { defineStore } from 'pinia';
import { ref, toRaw } from 'vue';
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

    // Загрузка из кэша IndexedDB
    async function loadFromCache() {
        const cached = await getPhotos();
        if (cached && cached.length) {
            publicPhotos.value = cached; // объекты из IDB уже обычные
            return true;
        }
        return false;
    }

    // Фоновое обновление без блокировки интерфейса
    async function refreshCacheInBackground() {
        try {
            const response = await photoService.getPhotos(limit, 0);
            const newPhotos = response.data || [];
            if (newPhotos.length) {
                publicPhotos.value = newPhotos;
                // Сохраняем сырой массив
                await savePhotos(newPhotos.map(p => toRaw(p)));
                hasMore.value = newPhotos.length === limit;
            }
        } catch (err) {
            console.error('Background refresh failed', err);
        }
    }

    // Основная загрузка/подгрузка публичных фото
    async function fetchPhotos(refresh = false) {
        if (loading.value) return;

        // Первый запуск – пробуем кэш
        if (!refresh && publicPhotos.value.length === 0) {
            const fromCache = await loadFromCache();
            if (fromCache) {
                refreshCacheInBackground(); // тихое обновление
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

            // Кэшируем сырые объекты
            await savePhotos(toRaw(publicPhotos.value));
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    // Загрузка фото текущего пользователя
    async function fetchMyPhotos() {
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

    // Загрузка нового фото
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
        await savePhoto(toRaw(newPhoto));
        return newPhoto;
    }

    // Обновление описания/публичности
    async function updatePhoto(id, data) {
        const response = await photoService.updatePhoto(id, data);
        const updated = response.data;
        const idxPub = publicPhotos.value.findIndex(p => p.id === id);
        if (idxPub !== -1) publicPhotos.value[idxPub] = updated;
        const idxMine = myPhotos.value.findIndex(p => p.id === id);
        if (idxMine !== -1) myPhotos.value[idxMine] = updated;
        await savePhoto(toRaw(updated));
        return updated;
    }

    // Удаление фото
    async function deletePhoto(id) {
        await photoService.deletePhoto(id);
        publicPhotos.value = publicPhotos.value.filter(p => p.id !== id);
        myPhotos.value = myPhotos.value.filter(p => p.id !== id);
        await deletePhotoFromCache(id);
    }

    // Лайки фото
    async function likePhoto(id) {
        await photoService.likePhoto(id);
        const inc = (arr) => {
            const p = arr.find(p => p.id === id);
            if (p) p.likes_count = (p.likes_count || 0) + 1;
        };
        inc(publicPhotos.value);
        inc(myPhotos.value);
    }

    async function unlikePhoto(id) {
        await photoService.unlikePhoto(id);
        const dec = (arr) => {
            const p = arr.find(p => p.id === id);
            if (p) p.likes_count = Math.max(0, (p.likes_count || 0) - 1);
        };
        dec(publicPhotos.value);
        dec(myPhotos.value);
    }

    // Комментарии
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
        const c = comments.value.find(c => c.id === commentId);
        if (c) c.likes_count += 1;
    }

    async function unlikeComment(commentId) {
        await commentService.unlikeComment(commentId);
        const c = comments.value.find(c => c.id === commentId);
        if (c) c.likes_count -= 1;
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