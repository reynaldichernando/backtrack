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
          // Try to use navigation preload if available
          const preloadResponse = await (event as FetchEvent).preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          // Always try network first
          return await fetch(request);
        } catch (error) {
          // On network failure, fall back to cached root page
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match("/");
          return cachedResponse || Response.redirect("/", 302);
        }
      },
    } satisfies RuntimeCaching,
  ],
});

// Cache the root page during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request("/", { cache: "reload" }));
    })()
  );
});

serwist.addEventListeners();
