<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { User, Trash2, Save, Loader2 } from 'lucide-svelte'; // Replaced ShoppingCart with User
	import { cartStore } from '../CartStore.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatDateTime } from '$lib/tools/time';
	import { isTrue } from '$lib/tools/numbering';
</script>

<div
	class="flex-col border-l border-r bg-card sm:flex sm:w-72 {cartStore.showSavedCarts
		? 'flex w-full'
		: 'hidden'}"
>
	<div class="flex h-9 items-center justify-between border-b p-4">
		<h2 class="flex items-center gap-2 text-lg font-bold">
			<User class="h-5 w-5" />
			Customer Tabs
		</h2>
	</div>

	<ScrollArea class="flex-1">
		{#if cartStore.savedCarts.length === 0}
			<div class="flex h-64 flex-col items-center justify-center p-4 text-muted-foreground">
				<User class="mb-2 h-12 w-12" />
				<p>No customer tabs.</p>
			</div>
		{:else}
			<div class="space-y-3 p-3">
				{#each cartStore.savedCarts as tab (tab.id)}
					<Card.Root class="cursor-pointer transition-colors hover:bg-accent/50">
						<Card.Content class="p-3" onclick={() => cartStore.loadTab(tab)}>
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium">
										{tab.name}
									</p>
									<p class="text-xs text-muted-foreground">
										Total: {tab.total.toFixed(2)}
									</p>
									<p class="text-xs text-muted-foreground">
										Created: {formatDateTime(tab.createdAt, 'DD/MM/YYYY HH:mm')}
									</p>
								</div>
								<Button
									variant="destructive"
									size="sm"
									onclick={(e) => {
										e.stopPropagation();
										cartStore.deleteTab(tab.id);
									}}
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</ScrollArea>

	<div class="flex gap-2 border-t px-3 py-4">
		<Button
			onclick={cartStore.saveOrUpdateTab}
			disabled={cartStore.isSaving || cartStore.cart.length === 0}
			size="lg"
			class="w-full bg-green-600 text-white hover:bg-green-800"
		>
			{#if cartStore.isSaving}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				{cartStore.loadedTab ? 'Updating...' : 'Saving...'}
			{:else}
				<Save class="mr-2 h-4 w-4" />
				{cartStore.loadedTab ? 'Update Tab' : 'Save as Tab'}
			{/if}
		</Button>
	</div>
</div>
