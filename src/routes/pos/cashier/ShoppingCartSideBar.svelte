<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { ShoppingCart, Trash2, User, X } from 'lucide-svelte';
	import CartItem from './CartItem.svelte';
	import { cartStore } from '../CartStore.svelte';
	import CheckoutDialog from './CheckoutDialog.svelte';
	import { numberWithCurrency, isTrue } from '$lib/tools/numbering';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import CustomerSelector from '$lib/components/customers/CustomerSelector.svelte';
	import type { Customer } from '$lib/components/handler/dexie/db';

	let isCustomerDialogOpen = $state(false);

	function handleSelectCustomer(event: CustomEvent<Customer>) {
		cartStore.setCustomer(event.detail);
		isCustomerDialogOpen = false;
	}
</script>

<div
	class="mb-14 w-full flex-col border-l bg-card sm:mb-0 sm:w-96 {cartStore.showCartOnMobile
		? 'flex'
		: 'hidden'} sm:flex"
>
	<div class="border-b p-4">
		<div class="flex h-9 items-center justify-between">
			<h2 class="flex items-center gap-2 text-xl font-bold">
				<ShoppingCart class="h-5 w-5" />
				Cart
			</h2>

			{#if cartStore.cart.items.length > 0}
				<Button variant="ghost" size="sm" onclick={cartStore.clearCart}>
					<Trash2 class="mr-1 h-4 w-4" />
					Clear
				</Button>
			{/if}
		</div>
	</div>

	<!-- Customer selection -->
	<div class="border-b p-4">
		{#if cartStore.selectedCustomer}
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<User class="h-5 w-5" />
					<span class="font-semibold">{cartStore.selectedCustomer.name}</span>
				</div>
				<Button variant="ghost" size="icon" onclick={cartStore.clearCustomer}>
					<X class="h-4 w-4" />
				</Button>
			</div>
		{:else}
			<Button onclick={() => (isCustomerDialogOpen = true)} variant="outline" class="w-full">
				<User class="mr-2 h-4 w-4" />
				Select Customer
			</Button>
		{/if}
	</div>

	<Dialog bind:open={isCustomerDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Select a Customer</DialogTitle>
			</DialogHeader>
			<CustomerSelector on:select={handleSelectCustomer} />
		</DialogContent>
	</Dialog>

	<!-- Cart items list -->
	<ScrollArea class="flex-1">
		{#if cartStore.cart.items.length === 0}
			<div class="flex h-64 flex-col items-center justify-center text-muted-foreground">
				<ShoppingCart class="mb-2 h-12 w-12" />
				<p>Cart is empty</p>
			</div>
		{:else}
			<div class="space-y-4 p-4">
				{#each cartStore.cart.items as item (item.product.id)}
					<CartItem {item} />
				{/each}
			</div>
		{/if}
	</ScrollArea>

	<!-- Checkout area -->
	<div class="border-t px-3 py-4 sm:px-4">
		<div class="flex flex-col pb-4">
			<div class="text-md flex justify-between font-thin">
				<span>Items</span>
				<span>
					{cartStore.cart.items.reduce(
						(sum: number, item: { product: { isWeighted: boolean }; quantity: number }) => {
							// Only count non-weighed items for the item count
							if (!isTrue(item.product.isWeighted)) {
								return sum + item.quantity;
							}
							return sum;
						},
						0
					)}
					Items,
					{cartStore.cart.items
						.reduce((sum: number, item: { product: { isWeighted: boolean }; quantity: number }) => {
							// Only count weighed items for the weight
							if (isTrue(item.product.isWeighted)) {
								return sum + item.quantity;
							}
							return sum;
						}, 0)
						.toFixed(2)}
					kg
				</span>
			</div>
			<div class="text-md flex justify-between font-thin">
				<span>Subtotal</span>
				<span>{cartStore.total.toFixed(2)}</span>
			</div>
			<div class="text-md flex justify-between font-thin">
				<span>
					Tax
					{#if cartStore.tax}
						({cartStore.tax}%)
					{/if}
				</span>
				<span>{cartStore.tax.toFixed(2)}</span>
			</div>
			<div class="text-md flex justify-between font-thin">
				<span>Discount</span>
				<span>{cartStore.discount.toFixed(2)}</span>
			</div>
			<div class="flex justify-between text-xl font-extrabold">
				<span>Total</span>
				<span>{numberWithCurrency(cartStore.grandTotal)}</span>
			</div>
		</div>
		<div class="flex justify-between text-lg font-bold">
			<CheckoutDialog />
		</div>
	</div>
</div>
