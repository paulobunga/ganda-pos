<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Customer } from '$lib/db';
	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Plus, Home } from 'lucide-svelte';
    import { goto } from '$app/navigation';

	let customers = $state<Customer[]>([]);
	let newCustomerName = $state('');
	let newCustomerEmail = $state('');
	let newCustomerPhone = $state('');
	let newCustomerIsTrusted = $state(false);

	async function loadCustomers() {
		customers = await db.customers.orderBy('name').toArray();
	}

	onMount(loadCustomers);

	async function handleAddCustomer() {
		if (!newCustomerName) {
			toast.error('Customer name is required');
			return;
		}
		const newCustomer: Customer = {
			id: uuidv4(),
			name: newCustomerName,
			email: newCustomerEmail,
			phone: newCustomerPhone,
			isTrusted: newCustomerIsTrusted
		};
		await db.customers.add(newCustomer);
		toast.success('Customer added');
		// Reset form
		newCustomerName = '';
		newCustomerEmail = '';
		newCustomerPhone = '';
		newCustomerIsTrusted = false;
		await loadCustomers();
	}

    function viewCustomer(customerId: string) {
        goto(`/admin/customers/${customerId}`);
    }
</script>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">Customer Management</h1>
        <Button variant="outline" on:click={() => goto('/pos/cashier')}>
			<Home class="mr-2 h-4 w-4" />
			POS View
		</Button>
    </div>
	<p class="mb-6 text-muted-foreground">
		Add, view, and manage your customers.
	</p>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<div class="md:col-span-1">
			<form onsubmit:preventDefault={handleAddCustomer} class="space-y-4 rounded-md border p-4">
				<h3 class="font-semibold">Add New Customer</h3>
				<div class="grid gap-2">
					<Label for="cust-name">Name</Label>
					<Input id="cust-name" bind:value={newCustomerName} required />
				</div>
				<div class="grid gap-2">
					<Label for="cust-email">Email</Label>
					<Input id="cust-email" type="email" bind:value={newCustomerEmail} />
				</div>
				<div class="grid gap-2">
					<Label for="cust-phone">Phone</Label>
					<Input id="cust-phone" bind:value={newCustomerPhone} />
				</div>
				<div class="flex items-center space-x-2">
					<Checkbox id="cust-trusted" bind:checked={newCustomerIsTrusted} />
					<label
						for="cust-trusted"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Trusted Customer (can have open tabs)
					</label>
				</div>
				<Button type="submit" class="w-full">
					<Plus class="mr-2 h-4 w-4" /> Add Customer
				</Button>
			</form>
		</div>

		<div class="md:col-span-2">
			<Table>
				<TableHeader
					><TableRow
						><TableHead>Name</TableHead><TableHead>Contact</TableHead
						><TableHead>Trusted</TableHead></TableRow
					></TableHeader
				>
				<TableBody>
					{#each customers as customer (customer.id)}
						<TableRow class="cursor-pointer" on:click={() => viewCustomer(customer.id)}>
							<TableCell class="font-medium">{customer.name}</TableCell>
							<TableCell>{customer.email || customer.phone || '-'}</TableCell>
							<TableCell>{customer.isTrusted ? 'Yes' : 'No'}</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</div>
</div>
