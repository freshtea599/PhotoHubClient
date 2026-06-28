// src/services/indexedDB.js
import { openDB } from 'idb';
import { toRaw } from 'vue';

const DB_NAME = 'PhotoHubDB';
const STORE_NAME = 'photos';
const VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

function sanitizePhoto(photo) {
  // Снимаем реактивность, если объект проксирован
  const raw = toRaw(photo);
  // Убираем поля, которые нельзя клонировать или которые занимают много места
  const { variants, comments, user, ...rest } = raw;
  return { ...rest };
}

export async function savePhotos(photos) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const rawPhotos = Array.isArray(photos) ? photos.map(p => sanitizePhoto(p)) : [];
  for (const photo of rawPhotos) {
    tx.store.put(photo);
  }
  await tx.done;
}

export async function getPhotos() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearPhotos() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

export async function savePhoto(photo) {
  const db = await getDB();
  const clean = sanitizePhoto(photo);
  await db.put(STORE_NAME, clean);
}

export async function deletePhotoFromCache(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}