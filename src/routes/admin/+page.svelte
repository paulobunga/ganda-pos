<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Customer, type Product, type Category, type Staff } from '$lib/db';
	import { v4 as uuidv4 } from 'uuid';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Plus, Home } from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { goto } from '$app/navigation';
	import { numberWithCurrency } from '$lib/tools/numbering';
	import bcrypt from 'bcrypt';

	// --- State ---
	let customers = $state<Customer[]>([]);
	let products = $state<Product[]>([]);
	let categories = $state<Category[]>([]);
	let staff = $state<Staff[]>([]);

	// --- Form State ---
	let newCustomerName = $state('');
	let newCustomerEmail = $state('');
	let newCustomerPhone = $state('');
	let newCustomerIsTrusted = $state(false);

	let newProductName = $state('');
	let newProductPrice = $state(0);
	let newProductStock = $state(0);
	let newProductCategoryId = $state('');
	let newProductIsWeight = $state(false);

	let newCategoryName = $state('');

	let newStaffName = $state('');
	let newStaffPin = $state('');
	let newStaffRole = $state<'Admin' | 'Manager' | 'Cashier'>('Cashier');

	// --- Load Data ---
	async function loadData() {
		const [cust, prods, cats, stf] = await Promise.all([
			db.customers.orderBy('name').toArray(),
			db.products.orderBy('name').toArray(),
			db.categories.orderBy('name').toArray(),
			db.staff.orderBy('name').toArray()
		]);
		customers = cust;
		products = prods;
		categories = cats;
		staff = stf;
		if (cats.length > 0 && !newProductCategoryId) {
			newProductCategoryId = cats[0].id;
		}
	}
	onMount(loadData);

	// --- Handlers ---
	async function handleAddCustomer(event: SubmitEvent) {
		event.preventDefault();
		if (!newCustomerName) return toast.error('Customer name is required');
		await db.customers.add({
			id: uuidv4(),
			name: newCustomerName,
			email: newCustomerEmail,
			phone: newCustomerPhone,
			isTrusted: newCustomerIsTrusted
		});
		toast.success('Customer added');
		newCustomerName = '';
		newCustomerEmail = '';
		newCustomerPhone = '';
		newCustomerIsTrusted = false;
		await loadData();
	}

	async function handleAddCategory(event: SubmitEvent) {
		event.preventDefault();
		if (!newCategoryName) return toast.error('Category name is required');
		await db.categories.add({ id: uuidv4(), name: newCategoryName });
		toast.success('Category added');
		newCategoryName = '';
		await loadData();
	}

	async function handleAddProduct(event: SubmitEvent) {
		event.preventDefault();
		if (!newProductName || !newProductCategoryId)
			return toast.error('Product name and category are required');
		await db.products.add({
			id: uuidv4(),
			name: newProductName,
			price: newProductPrice,
			categoryId: newProductCategoryId,
			stock: newProductStock,
			isWeight: newProductIsWeight
		});
		toast.success('Product added');
		newProductName = '';
		newProductPrice = 0;
		newProductStock = 0;
		newProductIsWeight = false;
		await loadData();
	}

	async function handleAddStaff(event: SubmitEvent) {
		event.preventDefault();
		if (!newStaffName || !newStaffPin) return toast.error('Staff name and PIN are required');
		if (newStaffPin.length !== 4) return toast.error('PIN must be 4 digits');

		const salt = await bcrypt.genSalt(10);
		const hashedPin = await bcrypt.hash(newStaffPin, salt);

		await db.staff.add({
			id: uuidv4(),
			name: newStaffName,
			pin: hashedPin,
			role: newStaffRole
		});
		toast.success('Staff member added');
		newStaffName = '';
		newStaffPin = '';
		await loadData();
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Admin Dashboard</h1>
		<Button variant="outline" onclick={() => goto('/pos/cashier')}>
			<Home class="mr-2 h-4 w-4" />
			POS View
		</Button>
	</div>

	<Tabs.Root value="customers" class="w-full">
		<Tabs.List>
			<Tabs.Trigger value="customers">Customers</Tabs.Trigger>
			<Tabs.Trigger value="products">Products & Categories</Tabs.Trigger>
			<Tabs.Trigger value="staff">Staff</Tabs.Trigger>
		</Tabs.List>

		<!-- Customers Tab -->
		<Tabs.Content value="customers" class="mt-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="md:col-span-1">
					<form onsubmit={handleAddCustomer} class="space-y-4 rounded-md border p-4">
						<h3 class="font-semibold">Add New Customer</h3>
						<div class="grid gap-2">
							<Label for="cust-name">Name</Label><Input id="cust-name" bind:value={newCustomerName} required />
						</div>
						<div class="grid gap-2">
							<Label for="cust-email">Email</Label><Input id="cust-email" type="email" bind:value={newCustomerEmail} />
						</div>
						<div class="grid gap-2">
							<Label for="cust-phone">Phone</Label><Input id="cust-phone" bind:value={newCustomerPhone} />
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="cust-trusted" bind:checked={newCustomerIsTrusted} />
							<label for="cust-trusted" class="text-sm font-medium">Trusted Customer</label>
						</div>
						<Button type="submit" class="w-full"><Plus class="mr-2 h-4 w-4" /> Add Customer</Button>
					</form>
				</div>
				<div class="md:col-span-2">
					<Table>
						<TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Trusted</TableHead></TableRow></TableHeader>
						<TableBody>
							{#each customers as customer (customer.id)}
								<TableRow>
									<TableCell>{customer.name}</TableCell>
									<TableCell>{customer.email || customer.phone || '-'}</TableCell>
									<TableCell>{customer.isTrusted ? 'Yes' : 'No'}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>
		</Tabs.Content>

		<!-- Products & Categories Tab -->
		<Tabs.Content value="products" class="mt-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="space-y-8 md:col-span-1">
					<form onsubmit={handleAddCategory} class="space-y-4 rounded-md border p-4">
						<h3 class="font-semibold">Add New Category</h3>
						<div class="grid gap-2">
							<Label for="cat-name">Name</Label><Input id="cat-name" bind:value={newCategoryName} required />
						</div>
						<Button type="submit" class="w-full"><Plus class="mr-2 h-4 w-4" /> Add Category</Button>
					</form>
					<form onsubmit={handleAddProduct} class="space-y-4 rounded-md border p-4">
						<h3 class="font-semibold">Add New Product</h3>
						<div class="grid gap-2">
							<Label for="prod-name">Name</Label><Input id="prod-name" bind:value={newProductName} required />
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="grid gap-2">
								<Label for="prod-price">Price</Label><Input id="prod-price" type="number" bind:value={newProductPrice} />
							</div>
							<div class="grid gap-2">
								<Label for="prod-stock">Stock</Label><Input id="prod-stock" type="number" bind:value={newProductStock} />
							</div>
						</div>
						<div class="grid gap-2">
							<Label for="prod-cat">Category</Label>
							<Select.Root bind:value={newProductCategoryId}>
								<Select.Trigger id="prod-cat"><Select.Value placeholder="Select a category" /></Select.Trigger>
								<Select.Content>
									{#each categories as c (c.id)}<Select.Item value={c.id}>{c.name}</Select.Item>{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div class="flex items-center space-x-2">
							<Checkbox id="prod-is-weight" bind:checked={newProductIsWeight} />
							<label for="prod-is-weight" class="text-sm font-medium">Sold by weight</label>
						</div>
						<Button type="submit" class="w-full"><Plus class="mr-2 h-4 w-4" /> Add Product</Button>
					</form>
				</div>
				<div class="md:col-span-2">
					<Table>
						<TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead class="text-right">Price</TableHead><TableHead class="text-right">Stock</TableHead></TableRow></TableHeader>
						<TableBody>
							{#each products as p (p.id)}
								<TableRow>
									<TableCell>{p.name}</TableCell>
									<TableCell>{categories.find((c) => c.id === p.categoryId)?.name || 'N/A'}</TableCell>
									<TableCell class="text-right">{numberWithCurrency(p.price)}</TableCell>
									<TableCell class="text-right">{p.stock}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>
		</Tabs.Content>

		<!-- Staff Tab -->
		<Tabs.Content value="staff" class="mt-4">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="md:col-span-1">
					<form onsubmit={handleAddStaff} class="space-y-4 rounded-md border p-4">
						<h3 class="font-semibold">Add New Staff Member</h3>
						<div class="grid gap-2">
							<Label for="staff-name">Name</Label><Input id="staff-name" bind:value={newStaffName} required />
						</div>
						<div class="grid gap-2">
							<Label for="staff-pin">4-Digit PIN</Label><Input id="staff-pin" type="password" bind:value={newStaffPin} required maxlength="4" />
						</div>
						<div class="grid gap-2">
							<Label for="staff-role">Role</Label>
							<Select.Root bind:value={newStaffRole}>
								<Select.Trigger id="staff-role"><Select.Value placeholder="Select a role" /></Select.Trigger>
								<Select.Content>
									<Select.Item value="Cashier">Cashier</Select.Item>
									<Select.Item value="Manager">Manager</Select.Item>
									<Select.Item value="Admin">Admin</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<Button type="submit" class="w-full"><Plus class="mr-2 h-4 w-4" /> Add Staff</Button>
					</form>
				</div>
				<div class="md:col-span-2">
					<Table>
						<TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
						<TableBody>
							{#each staff as s (s.id)}
								<TableRow>
									<TableCell>{s.name}</TableCell>
									<TableCell>{s.role}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
