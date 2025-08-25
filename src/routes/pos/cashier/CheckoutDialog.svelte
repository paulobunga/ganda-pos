<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { CreditCard, Banknote, Printer, Check, BookUser, UserPlus, X } from 'lucide-svelte';
	import { cartStore } from '../CartStore.svelte';
	import { numberWithCurrency } from '$lib/tools/numbering';
	import { onDestroy } from 'svelte';
	import { db, type Customer, type Sale, type SaleItem, type Debt } from '$lib/db';
	import { v4 as uuidv4 } from 'uuid';
	import CustomerSearchDialog from './CustomerSearchDialog.svelte';

	// States
	let isOpen = $state(false);
	let selectedPaymentMethod = $state<'CASH' | 'CARD' | 'TAB'>('CASH');
	let isProcessing = $state(false);
	let isCompleted = $state(false);
	let paidAmount = $state(0);
	let completedSaleId = $state<string | null>(null);
	let selectedCustomer = $state<Customer | null>(null);
	let isCustomerSearchOpen = $state(false);

	// Derived State
	let enableCheckout = $derived(cartStore.cart.length > 0);
	let enableOnTab = $derived(!!selectedCustomer);

	const paymentMethods = [
		{ id: 'CASH', name: 'Cash', icon: Banknote },
		{ id: 'CARD', name: 'Card', icon: CreditCard },
		{ id: 'TAB', name: 'On Tab', icon: BookUser, disabled: !enableOnTab }
	];

	function resetDialog() {
		isOpen = false;
		isProcessing = false;
		isCompleted = false;
		selectedCustomer = null;
		completedSaleId = null;
		selectedPaymentMethod = 'CASH';
	}

	async function processPayment() {
		isProcessing = true;

		const saleId = uuidv4();
		const isTab = selectedPaymentMethod === 'TAB';

		try {
			await db.transaction('rw', db.sales, db.saleItems, db.debts, db.products, async () => {
				// 1. Create Sale record
				const sale: Sale = {
					id: saleId,
					customerId: selectedCustomer?.id,
					total: cartStore.total,
					subtotal: cartStore.subtotal,
					tax: cartStore.taxAmount,
					discount: cartStore.discount,
					paymentMethod: selectedPaymentMethod,
					status: isTab ? 'UNPAID' : 'PAID',
					createdAt: new Date()
				};
				await db.sales.add(sale);

				// 2. Create SaleItem records and update product stock
				const saleItems: SaleItem[] = cartStore.cart.map((item) => ({
					id: uuidv4(),
					saleId: saleId,
					productId: item.product.id,
					quantity: item.quantity,
					price: item.product.price
				}));
				await db.saleItems.bulkAdd(saleItems);

				for (const item of cartStore.cart) {
					await db.products.update(item.product.id, {
						stock: { decrement: item.quantity }
					});
				}

				// 3. If it's a tab, create a Debt record
				if (isTab) {
					const debt: Debt = {
						id: uuidv4(),
						customerId: selectedCustomer!.id,
						saleId: saleId,
						amount: cartStore.total,
						createdAt: new Date()
					};
					await db.debts.add(debt);
				}
			});

			paidAmount = isTab ? 0 : cartStore.total;
			completedSaleId = saleId;
			isCompleted = true;
			cartStore.checkout();
			toast.success(isTab ? 'Added to tab successfully!' : 'Payment successful!');
		} catch (error) {
			console.error('Checkout failed:', error);
			toast.error('Checkout Failed', {
				description: 'An error occurred while saving the transaction.'
			});
		} finally {
			isProcessing = false;
		}
	}

	function printReceipt() {
		if (completedSaleId) {
			// This would ideally open a new page for the receipt, but for simplicity,
			// we'll just log it for now. A full implementation would be a new route.
			console.log(`Printing receipt for sale ID: ${completedSaleId}`);
			toast.info('Receipt printing is a stubbed feature.');
		}
	}
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={(open) => !open && resetDialog()}>
	<Button
		class="flex w-full items-center justify-center rounded-lg bg-blue-700 py-2 text-white hover:bg-blue-800"
		disabled={!enableCheckout}
		onclick={() => (isOpen = true)}
	>
		<CreditCard class="mr-2 h-5 w-5" />
		Checkout
	</Button>
	<Dialog.Content class="max-w-sm rounded-lg sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">Complete Transaction</Dialog.Title>
		</Dialog.Header>

		{#if !isCompleted}
			<div class="py-6">
				<div class="mb-8 rounded-lg bg-blue-500 p-4 dark:bg-blue-50/10">
					<div class="mb-1 text-sm text-white dark:text-muted-foreground">Total Amount</div>
					<div class="text-3xl font-bold text-white dark:text-green-500">
						{numberWithCurrency(cartStore.total)}
					</div>
				</div>

				<div class="space-y-4">
					<div>
						<h3 class="text-lg font-medium">Customer (Optional)</h3>
						{#if selectedCustomer}
							<div class="mt-2 flex items-center justify-between rounded-lg border bg-muted p-3">
								<div>
									<p class="font-semibold">{selectedCustomer.name}</p>
									<p class="text-sm text-muted-foreground">{selectedCustomer.email}</p>
								</div>
								<Button variant="ghost" size="icon" on:click={() => (selectedCustomer = null)}>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{:else}
							<Button
								variant="outline"
								class="mt-2 w-full"
								on:click={() => (isCustomerSearchOpen = true)}
							>
								<UserPlus class="mr-2 h-4 w-4" />
								Select Customer
							</Button>
						{/if}
					</div>

					<h3 class="text-lg font-medium">Select Payment Method</h3>
					<RadioGroup bind:value={selectedPaymentMethod} class="grid gap-4 md:grid-cols-3">
						{#each paymentMethods as method}
							<Button
								disabled={method.disabled}
								class="relative flex h-auto flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted {selectedPaymentMethod ===
								method.id
									? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
									: 'hover:border-blue-500/30'}"
								onclick={() => (selectedPaymentMethod = method.id)}
							>
								<div class="flex w-full items-center gap-3">
									<div class="rounded-lg bg-blue-500/10 p-2">
										<svelte:component
											this={method.icon}
											class="h-6 w-6 {selectedPaymentMethod === method.id
												? 'text-blue-500'
												: 'text-muted-foreground'}"
										/>
									</div>
									<div class="flex-1 text-wrap">
										<Label for={method.id} class="cursor-pointer font-bold text-blue-500">
											{method.name}
										</Label>
									</div>
								</div>
								<RadioGroupItem value={method.id} id={method.id} class="sr-only" />
							</Button>
						{/each}
					</RadioGroup>
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button variant="outline" on:click={() => (isOpen = false)}>Cancel</Button>
				<Button
					on:click={processPayment}
					disabled={isProcessing}
					class="bg-blue-600 text-white transition-colors hover:bg-blue-700"
				>
					{#if isProcessing}
						<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						Processing...
					{:else}
						Confirm
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}

		{#if isCompleted}
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
					<Check class="h-8 w-8 text-green-500" />
				</div>
				<h3 class="mb-2 text-2xl font-bold text-green-500">Transaction Complete</h3>
				<p class="mb-8 text-muted-foreground">
					{selectedPaymentMethod === 'TAB'
						? 'Added to tab successfully.'
						: `Paid ${numberWithCurrency(paidAmount)}.`}
				</p>
				<div class="flex w-full gap-3">
					<Button
						variant="outline"
						class="flex-1 border-dashed hover:border-blue-500 hover:bg-blue-500/5"
						on:click={printReceipt}
					>
						<Printer class="mr-2 h-4 w-4" />
						Print Receipt
					</Button>
					<Button
						class="flex-1 bg-blue-600 text-white transition-colors hover:bg-blue-700"
						on:click={resetDialog}
					>
						New Sale
					</Button>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<CustomerSearchDialog bind:isCustomerSearchOpen onSelect={(c) => (selectedCustomer = c)} />
