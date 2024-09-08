import { Video } from "./model/Video";

const dbName = 'db';
const dbVersion = 1;

let db: IDBDatabase;

export const openDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error('Error opening database', event);
      reject(event);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('videos', { keyPath: 'id' });
      db.createObjectStore('videoFiles', { keyPath: 'id' });
    };
  });
};

export const addVideo = async (video: Video) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['videos'], 'readwrite');
    const objectStore = transaction.objectStore('videos');
    const request = objectStore.add(video);

    request.onsuccess = function (event) {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const getAllVideos = async () => {
  await openDB();
  return new Promise<Video[]>((resolve, reject) => {
    const transaction = db.transaction(['videos'], 'readonly');
    const objectStore = transaction.objectStore('videos');
    const request = objectStore.openCursor();

    const videoList: Video[] = [];

    request.onsuccess = function (event) {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const video = cursor.value;
        videoList.push(video);
        cursor.continue();
      } else {
        resolve(videoList);
      }
    };

    request.onerror = function (event) {
      reject((event.target as IDBRequest).error);
    };
  });
};

export const saveVideoArrayBuffer = async (id: string, buffer: ArrayBuffer) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['videoFiles'], 'readwrite');
    const objectStore = transaction.objectStore('videoFiles');
    const request = objectStore.put({ id, data: buffer });

    request.onsuccess = function (event) {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const getVideoArrayBuffer = async (id: string) => {
  await openDB();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const transaction = db.transaction(['videoFiles'], 'readonly');
    const objectStore = transaction.objectStore('videoFiles');
    const request = objectStore.get(id);

    request.onsuccess = function (event) {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};
