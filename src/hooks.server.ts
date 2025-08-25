// This file is intentionally left empty in the local-first version.
// Server-side hooks for authentication would be added here if needed.
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	return response;
};
