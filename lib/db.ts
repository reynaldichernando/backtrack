const dbName = "db";
const dbVersion = 1;

let db: IDBDatabase;

export const videoStoreName = "video";
export const videoBinaryStoreName = "video_binary";

export const openDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (event) => {
      console.error("Error opening database", event);
      reject(event);
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(videoStoreName, { keyPath: "id" });
      db.createObjectStore(videoBinaryStoreName, { keyPath: "id" });
    };
  });
};

export const getDb = async () => {
  if (!db) {
    await openDB();
  }
  return db;
};
