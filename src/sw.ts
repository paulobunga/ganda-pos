/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// The precacheAndRoute() method caches all the assets defined in the Workbox manifest.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        console.log('Syncing transactions...');
        event.waitUntil(
            // Here we would fetch the queued transactions from IndexedDB
            // and send them to the server.
            // For now, we'll just log a message.
            new Promise<void>((resolve) => {
                console.log('Background sync processed.');
                resolve();
            })
        );
    }
});
