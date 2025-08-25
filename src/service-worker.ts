/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE_NAME = `cache-${version}`;

const ASSETS_TO_CACHE = build.concat(files);

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS_TO_CACHE);
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
				})
			);
		})
	);
});

self.addEventListener('sync', (event) => {
	if (event.tag === 'checkout-sync') {
		event.waitUntil(handleCheckoutSync());
	}
});

async function handleCheckoutSync() {
	const { db } = await import('$lib/components/handler/dexie/db');
	const pendingTransactions = await db.pending_transactions.toArray();

	for (const tx of pendingTransactions) {
		try {
			// This is a placeholder for the actual API call
			// In a real application, this would send the transaction to the server
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tx)
			});

			if (response.ok) {
				await db.pending_transactions.delete(tx.id);
			}
		} catch (error) {
			console.error('Failed to sync transaction:', tx.id, error);
			// The transaction will be retried automatically by the browser
		}
	}
}

self.addEventListener('fetch', (event) => {
	const request = event.request;

	if (request.method !== 'GET') {
		return;
	}

	event.respondWith(
		caches.open(CACHE_NAME).then(async (cache) => {
			const cachedResponse = await cache.match(request);

			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request);
		})
	);
});
