import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: process.env.NODE_ENV === 'development' ? [] : [
    {
      matcher: ({ request }) => request.destination === "style",
      handler: new NetworkFirst(),
    },
    {
      matcher: ({ request }) => request.destination === "script",
      handler: new NetworkFirst(),
    },
    {
      matcher: ({ request }) => request.destination === "document",
      handler: new NetworkFirst(),
    },
  ],
});

serwist.addEventListeners();
