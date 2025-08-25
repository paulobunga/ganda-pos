<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { toast } from 'svelte-sonner';
	import { Search } from 'lucide-svelte';
	import { db, type Customer } from '$lib/db';

	let { onSelect, isCustomerSearchOpen: open } = $props<{
		onSelect: (customer: Customer) => void;
		isCustomerSearchOpen: boolean;
	}>();

	let searchTerm = $state('');
	let searchResults = $state<Customer[]>([]);
	let isLoading = $state(false);
	let debounceTimer: number;

	function debouncedSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => {
			searchCustomers();
		}, 300);
	}

	async function searchCustomers() {
		if (searchTerm.length < 1) {
			searchResults = [];
			return;
		}
		isLoading = true;
		try {
			searchResults = await db.customers
				.where('name')
				.startsWithIgnoreCase(searchTerm)
				.or('email')
				.startsWithIgnoreCase(searchTerm)
				.toArray();
		} catch (error) {
			toast.error('Error searching customers');
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	function handleSelect(customer: Customer) {
		onSelect(customer);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Search and Select Customer</Dialog.Title>
		</Dialog.Header>
		<div class="relative">
			<Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search by name or email..."
				class="pl-8"
				bind:value={searchTerm}
				oninput={debouncedSearch}
			/>
		</div>
		<div class="mt-4 h-64 overflow-y-auto rounded-md border">
			{#if isLoading}
				<p class="p-4 text-center text-muted-foreground">Searching...</p>
			{:else if searchResults.length > 0}
				<ul>
					{#each searchResults as customer (customer.id)}
						<li
							class="flex cursor-pointer items-center justify-between p-3 hover:bg-muted"
							onclick={() => handleSelect(customer)}
							onkeydown={(e) => e.key === 'Enter' && handleSelect(customer)}
							role="button"
							tabindex="0"
						>
							<div>
								<p class="font-semibold">{customer.name}</p>
								<p class="text-sm text-muted-foreground">{customer.email || customer.phone}</p>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="p-4 text-center text-muted-foreground">No customers found.</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
