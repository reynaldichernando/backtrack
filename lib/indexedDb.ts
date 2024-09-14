import { MediaBinaryData } from "./model/MediaBinaryData";
import { Video } from "./model/Video";

const dbName = 'db';
const dbVersion = 1;

let db: IDBDatabase;

const videoStoreName = 'video';
const videoBinaryStoreName = 'video_binary';

const openDB = async () => {
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
      db.createObjectStore(videoStoreName, { keyPath: 'id' });
      db.createObjectStore(videoBinaryStoreName, { keyPath: 'id' });
    };
  });
};

export const addVideo = async (video: Video) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], 'readwrite');
    const objectStore = transaction.objectStore(videoStoreName);
    const request = objectStore.add(video);

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const deleteVideo = async (id: string) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], 'readwrite');
    const objectStore = transaction.objectStore(videoStoreName);
    const request = objectStore.delete(id);

    request.onsuccess = function () {
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
    const transaction = db.transaction([videoStoreName], 'readonly');
    const objectStore = transaction.objectStore(videoStoreName);
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

export const saveVideoBinary = async (id: string, data: ArrayBuffer) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], 'readwrite');    
    const objectStore = transaction.objectStore(videoBinaryStoreName);
    const request = objectStore.put({ id, data });

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const getVideoBinary = async (id: string) => {
  await openDB();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], 'readonly');
    const objectStore = transaction.objectStore(videoBinaryStoreName);
    const request = objectStore.get(id);

    request.onsuccess = function (event) {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const saveMediaBinary = async (id: string, video: ArrayBuffer, audio: ArrayBuffer) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], 'readwrite');
    const objectStore = transaction.objectStore(videoBinaryStoreName);
    const request = objectStore.put({ id, video, audio });

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const getMediaBinary = async (id: string) => {
  await openDB();
  return new Promise<MediaBinaryData>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], 'readonly');
    const objectStore = transaction.objectStore(videoBinaryStoreName);
    const request = objectStore.get(id);

    request.onsuccess = function (event) {
      resolve((event.target as IDBRequest).result);
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};

export const deleteMediaBinary = async (id: string) => {
  await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], 'readwrite');
    const objectStore = transaction.objectStore(videoBinaryStoreName);
    const request = objectStore.delete(id);

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};
