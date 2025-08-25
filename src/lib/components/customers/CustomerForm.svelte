<script lang="ts">
	import type { Customer } from '$lib/components/handler/dexie/customers/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { createEventDispatcher } from 'svelte';

	let { customer = {} as Partial<Customer> } = $props();

	const dispatch = createEventDispatcher<{
		submit: Customer;
	}>();

	let name = $state(customer.name || '');
	let email = $state(customer.email || '');
	let phone = $state(customer.phone || '');
	let isTrusted = $state(customer.isTrusted || false);

	function handleSubmit(event: Event) {
		event.preventDefault();
		dispatch('submit', {
			id: customer.id,
			name,
			email,
			phone,
			isTrusted,
			createdAt: customer.createdAt || new Date().toISOString()
		});
	}
</script>

<form onsubmit={handleSubmit} class="grid gap-4">
	<div class="grid gap-2">
		<Label for="name">Name</Label>
		<Input id="name" bind:value={name} required />
	</div>
	<div class="grid gap-2">
		<Label for="email">Email</Label>
		<Input id="email" type="email" bind:value={email} />
	</div>
	<div class="grid gap-2">
		<Label for="phone">Phone</Label>
		<Input id="phone" type="tel" bind:value={phone} />
	</div>
	<div class="flex items-center space-x-2">
		<input type="checkbox" id="isTrusted" bind:checked={isTrusted} class="h-4 w-4" />
		<Label for="isTrusted">Trusted Customer</Label>
	</div>
	<Button type="submit">Save Customer</Button>
</form>
