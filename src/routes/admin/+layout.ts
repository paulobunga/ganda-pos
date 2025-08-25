import { sessionStore } from '$lib/sessionStore';
import { goto } from '$app/navigation';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { toast } from 'svelte-sonner';

export const load: LayoutLoad = async () => {
    if (browser) {
        const session = get(sessionStore);
        const user = session.currentUser;

        if (!user) {
            // This should be caught by the root layout, but as a safeguard
            goto('/login');
            return;
        }

        const isAdminOrManager = user.role === 'Admin' || user.role === 'Manager';

        if (!isAdminOrManager) {
            toast.error('Access Denied', { description: 'You do not have permission to view this page.'});
            goto('/pos/cashier');
        }
    }
    return {};
};
