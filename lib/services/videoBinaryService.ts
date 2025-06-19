import { getDb, videoBinaryStoreName } from "../db";
import { MediaBinaryData } from "../model/MediaBinaryData";

export const saveVideoBinary = async (id: string, data: ArrayBuffer) => {
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], "readwrite");
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
  const db = await getDb();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], "readonly");
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

export const saveMediaBinary = async (
  id: string,
  video: ArrayBuffer,
  audio: ArrayBuffer
) => {
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], "readwrite");
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
  const db = await getDb();
  return new Promise<MediaBinaryData>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], "readonly");
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
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoBinaryStoreName], "readwrite");
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
