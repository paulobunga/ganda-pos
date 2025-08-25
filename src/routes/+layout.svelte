<script lang="ts">
	import { onMount } from 'svelte';
	import { enablePersistentStorage } from '$lib/db';
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		enablePersistentStorage();
	});
</script>

<Toaster position="bottom-left" />
<ModeWatcher />

<ParaglideJS {i18n}>
	{@render children()}
</ParaglideJS>
