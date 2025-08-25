import { sessionStore } from '$lib/sessionStore';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

export const load: LayoutLoad = async () => {
    if (browser) {
        return {
            session: get(sessionStore)
        };
    }
    return {
        session: { currentUser: null, currentShiftId: null }
    };
};
