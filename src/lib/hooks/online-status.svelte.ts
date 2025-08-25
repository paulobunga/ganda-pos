import { readable } from 'svelte/store';

function createOnlineStatusStore() {
	const isBrowser = typeof window !== 'undefined';

	const onlineStatus = readable(isBrowser ? navigator.onLine : true, (set) => {
		if (!isBrowser) {
			return;
		}

		const updateOnlineStatus = () => {
			set(navigator.onLine);
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	});

	return onlineStatus;
}

export const isOnline = createOnlineStatusStore();
