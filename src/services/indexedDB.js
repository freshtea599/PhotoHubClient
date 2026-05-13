import { openDB } from 'idb';

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

// Очищаем объект от несериализуемых полей
function sanitizePhoto(photo) {
  // Создаём копию только с нужными полями
  const { variants, comments, user, ...rest } = photo;
  // Если нужно сохранить variants, копируем их как простые объекты
  if (variants && Array.isArray(variants)) {
    rest.variants = variants.map(v => ({ ...v }));
  }
  return rest;
}

export async function savePhotos(photos) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const photo of photos) {
    const clean = sanitizePhoto(photo);
    tx.store.put(clean);
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