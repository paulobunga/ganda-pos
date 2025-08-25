<script lang="ts">
	import { onMount } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import type { Product } from '../types';
	import type { Cart } from '$lib/components/handler/dexie/carts/types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { numberWithCurrency, isTrue } from '$lib/tools/numbering';

	let cart = $state<Cart | null>(null);
	let subtotal = $state(0);
	let tax = $state(0);
	let discount = $state(0);
	let total = $state(0);

	const calculateTotals = () => {
		if (!cart) return;
		subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
		total = subtotal + tax - discount;
	};

	onMount(() => {
		const channel = new BroadcastChannel('cart-channel');

		channel.onmessage = (event) => {
			cart = event.data;
			calculateTotals();
		};

		// Set the viewport height variable for mobile browsers
		const setVh = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		};

		setVh();
		window.addEventListener('resize', setVh);

		return () => {
			window.removeEventListener('resize', setVh);
		};
	});
</script>

<div class="full-height flex flex-col overflow-hidden bg-background p-4">
	<Card.Root class="flex h-full w-full flex-1 flex-col">
		<Card.Content class="flex flex-1 flex-col overflow-hidden rounded-lg p-0">
			<ScrollArea class="flex-1">
				{#if !cart || cart.items.length === 0}
					<div class="flex h-full items-center justify-center p-8">
						<p class="text-xl text-muted-foreground">Cart is empty</p>
					</div>
				{:else}
					<div class="w-full">
						<div
							class="sticky top-0 z-10 grid grid-cols-4 gap-4 border-b bg-background p-4 font-medium"
						>
							<div>Items</div>
							<div class="text-right">Qty</div>
							<div class="text-right">Price</div>
							<div class="text-right">Total</div>
						</div>
						<div class="divide-y">
							{#each cart.items as item}
								<div class="grid grid-cols-4 gap-4 p-4">
									<div class="font-medium">{item.product.name}</div>
									<div class="text-right">{item.quantity}</div>
									<div class="text-right">{numberWithCurrency(item.product.price)}</div>
									<div class="text-right">
										{numberWithCurrency(item.product.price * item.quantity)}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</ScrollArea>
		</Card.Content>
		<Card.Footer class="w-full border-t bg-muted/30 px-4 py-2">
			<div class="flex w-full flex-col">
				<div class="text-md flex justify-between font-thin">
					<span>Items</span>
					<span>
						{cart
							? cart.items.reduce(
									(
										sum: number,
										item: { product: { isWeighted: boolean }; quantity: number }
									) => {
										// Only count non-weighed items for the item count
										if (!isTrue(item.product.isWeighted)) {
											return sum + item.quantity;
										}
										return sum;
									},
									0
								)
							: 0}
						Items,
						{cart
							? cart.items
									.reduce(
										(
											sum: number,
											item: { product: { isWeighted: boolean }; quantity: number }
										) => {
											// Only count weighed items for the weight
											if (isTrue(item.product.isWeighted)) {
												return sum + item.quantity;
											}
											return sum;
										},
										0
									)
									.toFixed(2)
							: '0.00'}
						kg
					</span>
				</div>
				<div class="text-md mb-1 flex justify-between font-thin">
					<span>Subtotal:</span>
					<span>{numberWithCurrency(subtotal)}</span>
				</div>
				<div class="text-md mb-1 flex justify-between font-thin">
					<span>Tax:</span>
					<span>{numberWithCurrency(tax)}</span>
				</div>
				<div class="text-md mb-1 flex justify-between font-thin">
					<span>Discount:</span>
					<span>{numberWithCurrency(discount)}</span>
				</div>
				<div class="flex justify-between text-xl font-bold">
					<span>Total:</span>
					<span>{numberWithCurrency(total)}</span>
				</div>
			</div>
		</Card.Footer>
	</Card.Root>
</div>

<style>
	/* use dynamic --vh value to control height */
	.full-height {
		height: calc(var(--vh, 1vh) * 100);
	}
</style>
