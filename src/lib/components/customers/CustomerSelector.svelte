<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Customer } from '$lib/components/handler/dexie/db';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { createEventDispatcher } from 'svelte';

	let allCustomers = $state<Customer[]>([]);
	let filteredCustomers = $state<Customer[]>([]);
	let searchTerm = $state('');

	const dispatch = createEventDispatcher<{
		select: Customer;
	}>();

	async function loadCustomers() {
		allCustomers = await db.customers.toArray();
		filteredCustomers = allCustomers;
	}

	function handleSearch() {
		if (!searchTerm) {
			filteredCustomers = allCustomers;
			return;
		}
		const lowerCaseSearchTerm = searchTerm.toLowerCase();
		filteredCustomers = allCustomers.filter(
			(c) =>
				c.name.toLowerCase().includes(lowerCaseSearchTerm) ||
				c.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
				c.phone?.toLowerCase().includes(lowerCaseSearchTerm)
		);
	}

	function selectCustomer(customer: Customer) {
		dispatch('select', customer);
	}

	onMount(loadCustomers);

	$effect(() => {
		handleSearch();
	});
</script>

<div class="grid gap-4">
	<Input placeholder="Search customers..." bind:value={searchTerm} />
	<div class="grid max-h-64 gap-2 overflow-y-auto">
		{#each filteredCustomers as customer}
			<div
				class="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
				onclick={() => selectCustomer(customer)}
				onkeydown={(e) => e.key === 'Enter' && selectCustomer(customer)}
				role="button"
				tabindex="0"
			>
				<div>
					<p class="font-semibold">{customer.name}</p>
					<p class="text-sm text-zinc-500">{customer.email || customer.phone}</p>
				</div>
				<Button variant="outline" size="sm">Select</Button>
			</div>
		{/each}
	</div>
</div>
