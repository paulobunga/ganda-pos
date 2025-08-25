<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { db, type Customer, type Debt } from '$lib/db';
	import { toast } from 'svelte-sonner';
	import { v4 as uuidv4 } from 'uuid';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { ArrowLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { numberWithCurrency } from '$lib/tools/numbering';

	let customer = $state<Customer | undefined>(undefined);
	let debts = $state<Debt[]>([]);
	let currentDebt = $state(0);
	let paymentAmount = $state(0);

	const customerId = $page.params.id;

	async function loadData() {
		const cust = await db.customers.get(customerId);
		if (cust) {
			customer = cust;
			const customerDebts = await db.debts.where('customerId').equals(customerId).sortBy('createdAt');
			debts = customerDebts;
			currentDebt = debts.reduce((sum, d) => sum + d.amount, 0);
			paymentAmount = currentDebt > 0 ? currentDebt : 0; // Default payment amount to full debt
		} else {
			toast.error('Customer not found');
		}
	}

	onMount(loadData);

	async function handleSettleDebt() {
		if (paymentAmount <= 0) {
			toast.error('Payment amount must be positive.');
			return;
		}
		if (paymentAmount > currentDebt) {
			toast.error('Payment cannot be greater than the outstanding debt.');
			return;
		}

		const newPayment: Debt = {
			id: uuidv4(),
			customerId: customerId,
			amount: -paymentAmount, // Negative for a payment
			createdAt: new Date()
		};

		await db.debts.add(newPayment);
		toast.success('Payment recorded');
		paymentAmount = 0;
		await loadData();
	}
</script>

<div class="container mx-auto py-8">
	<Button variant="outline" class="mb-6" on:click={() => goto('/admin/customers')}>
		<ArrowLeft class="mr-2 h-4 w-4" />
		Back to Customers
	</Button>

	{#if customer}
		<h1 class="text-3xl font-bold mb-2">{customer.name}</h1>
		<p class="text-muted-foreground mb-6">{customer.email || customer.phone}</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="md:col-span-1">
				<h3 class="text-xl font-semibold mb-4">Settle Debt</h3>
				<div class="space-y-4 rounded-md border p-4">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Current Debt</p>
						<p class="text-2xl font-bold text-red-500">{numberWithCurrency(currentDebt)}</p>
					</div>
					{#if currentDebt > 0}
						<form onsubmit:preventDefault={handleSettleDebt}>
							<div class="grid gap-2">
								<Label for="payment">Payment Amount</Label>
								<Input id="payment" type="number" step="0.01" bind:value={paymentAmount} />
							</div>
							<Button type="submit" class="w-full mt-4">Record Payment</Button>
						</form>
					{/if}
				</div>
			</div>
			<div class="md:col-span-2">
				<h3 class="text-xl font-semibold mb-4">Debt History</h3>
				<Table>
					<TableHeader
						><TableRow
							><TableHead>Date</TableHead><TableHead>Type</TableHead
							><TableHead class="text-right">Amount</TableHead></TableRow
						></TableHeader
					>
					<TableBody>
						{#each debts as debt (debt.id)}
							<TableRow>
								<TableCell>{new Date(debt.createdAt).toLocaleDateString()}</TableCell>
								<TableCell>{debt.amount > 0 ? 'New Tab' : 'Payment'}</TableCell>
								<TableCell
									class={`text-right font-semibold ${
										debt.amount > 0 ? 'text-red-500' : 'text-green-500'
									}`}
								>
									{numberWithCurrency(debt.amount)}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		</div>
	{:else}
		<p>Loading customer data...</p>
	{/if}
</div>
