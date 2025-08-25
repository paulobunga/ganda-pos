<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { sessionStore } from '$lib/sessionStore';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			const isLoginPage = $page.route.id === '/login';
			const currentUser = $sessionStore.currentUser;

			if (!currentUser && !isLoginPage) {
				goto('/login');
			} else if (currentUser && isLoginPage) {
				goto('/pos/cashier');
			}
		}
	});
</script>

<Toaster position="bottom-left" />
<ModeWatcher />

{@render children()}
