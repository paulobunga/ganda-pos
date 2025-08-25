<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/components/handler/dexie/db';
	import type { Customer } from '$lib/components/handler/dexie/customers/types';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import CustomerForm from '$lib/components/customers/CustomerForm.svelte';

	let customers = $state<Customer[]>([]);
	let isAddDialogOpen = $state(false);
	let isEditDialogOpen = $state(false);
	let selectedCustomer: Customer | null = $state(null);

	async function loadCustomers() {
		customers = await db.customers.toArray();
	}

	async function handleAddCustomer(event: CustomEvent<Customer>) {
		const newCustomer = event.detail;
		delete newCustomer.id; // Ensure new customer gets a new ID
		await db.customers.add(newCustomer);
		isAddDialogOpen = false;
		await loadCustomers();
	}

	function openEditDialog(customer: Customer) {
		selectedCustomer = customer;
		isEditDialogOpen = true;
	}

	async function handleEditCustomer(event: CustomEvent<Customer>) {
		const updatedCustomer = event.detail;
		await db.customers.put(updatedCustomer);
		isEditDialogOpen = false;
		selectedCustomer = null;
		await loadCustomers();
	}

	onMount(() => {
		loadCustomers();
	});
</script>

<div class="p-8">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Customers</h2>
		<Dialog bind:open={isAddDialogOpen}>
			<DialogTrigger asChild let:builder>
				<Button builders={[builder]}>Add Customer</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add New Customer</DialogTitle>
				</DialogHeader>
				<CustomerForm on:submit={handleAddCustomer} />
			</DialogContent>
		</Dialog>
	</div>

	<div class="mt-4 rounded-md border">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Phone</TableHead>
					<TableHead>Trusted</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if customers.length > 0}
					{#each customers as customer}
						<TableRow>
							<TableCell>{customer.name}</TableCell>
							<TableCell>{customer.email || '-'}</TableCell>
							<TableCell>{customer.phone || '-'}</TableCell>
							<TableCell>{customer.isTrusted ? 'Yes' : 'No'}</TableCell>
							<TableCell>
								<Button variant="outline" size="sm" onclick={() => openEditDialog(customer)}
									>Edit</Button
								>
							</TableCell>
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan="5" class="text-center">No customers found.</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</div>
</div>

{#if selectedCustomer}
	<Dialog bind:open={isEditDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Customer</DialogTitle>
			</DialogHeader>
			<CustomerForm customer={selectedCustomer} on:submit={handleEditCustomer} />
		</DialogContent>
	</Dialog>
{/if}
