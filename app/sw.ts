import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  SerwistGlobalConfig,
  RuntimeCaching,
} from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "offline-v1";

// Cache the root page during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Setting {cache: 'reload'} ensures the response isn't fulfilled from HTTP cache
      await cache.add(new Request("/", { cache: "reload" }));
    })()
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: async ({ event, request }) => {
        try {
          // First, try navigation preload response if supported
          const preloadResponse = await (event as FetchEvent).preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try network first
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          console.log("Fetch failed; returning offline page instead.", error);
          
          // Return cached root page on network failure
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match("/");
          return cachedResponse || Response.redirect("/", 302);
        }
      },
    } satisfies RuntimeCaching,
  ],
});

serwist.addEventListeners();
