import { getDb, videoStoreName } from "../db";
import { Video } from "../model/Video";

export const addVideo = async (video: Video) => {
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], "readwrite");
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
  const db = await getDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], "readwrite");
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
  const db = await getDb();
  return new Promise<Video[]>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], "readonly");
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

export const videoExists = async (id: string) => {
  const db = await getDb();
  return new Promise<boolean>((resolve, reject) => {
    const transaction = db.transaction([videoStoreName], "readonly");
    const objectStore = transaction.objectStore(videoStoreName);
    const request = objectStore.get(id);

    request.onsuccess = function (event) {
      const result = (event.target as IDBRequest).result;
      resolve(result !== undefined);
    };

    request.onerror = function (event) {
      reject(event);
    };
  });
};
