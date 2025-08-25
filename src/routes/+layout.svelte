<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import { onMount } from 'svelte';
	import { isOnline } from '$lib/hooks/online-status.svelte';

	onMount(async () => {
		if (navigator.storage && navigator.storage.persist) {
			const isPersisted = await navigator.storage.persisted();
			if (!isPersisted) {
				try {
					const result = await navigator.storage.persist();
					console.log(`Storage persistence request result: ${result}`);
				} catch (error) {
					console.error('Failed to request persistent storage:', error);
				}
			} else {
				console.log('Storage is already persisted.');
			}
		}
	});

	let { children } = $props();
</script>

<Toaster position="bottom-left" />
<ModeWatcher />

{#if !$isOnline}
	<div class="fixed bottom-4 right-4 z-50 rounded-md bg-red-500 p-2 text-white">
		You are offline
	</div>
{/if}

{@render children()}
