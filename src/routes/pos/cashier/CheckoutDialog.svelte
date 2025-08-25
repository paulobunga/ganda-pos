<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { CreditCard, Banknote, Printer, Check, Users } from 'lucide-svelte';
	import { cartStore } from '../CartStore.svelte';
	import { numberWithCurrency } from '$lib/tools/numbering';
	import { onDestroy } from 'svelte';

	// Default auto-close seconds
	const defaultAutoCloseSeconds = 3;

	// States
	let isOpen = $state(false);
	let selectedPaymentMethod = $state('cash');
	let isProcessing = $state(false);
	let isCompleted = $state(false);
	let paidAmount = $state(0);
	let enableCheckout = $derived(cartStore.cart.items.length > 0);
	let autoCloseTimer = $state<number | null>(null);
	let remainingSeconds = $state(defaultAutoCloseSeconds);

	interface PaymentMethod {
		id: string;
		name: string;
		icon: typeof Banknote;
		description: string;
	}

	// Payment methods with enhanced metadata
	const resetDialog = () => {
		isOpen = false;
		isProcessing = false;
		isCompleted = false;
		toast.dismiss();
		clearAutoCloseTimer();
	};

	const clearAutoCloseTimer = () => {
		if (autoCloseTimer !== null) {
			clearInterval(autoCloseTimer);
			autoCloseTimer = null;
		}
		remainingSeconds = defaultAutoCloseSeconds;
	};

	let paymentMethods: PaymentMethod[] = $state([]);

	$effect(() => {
		const methods: PaymentMethod[] = [
			{
				id: 'cash',
				name: 'Cash',
				icon: Banknote,
				description: 'Pay with physical cash'
			},
			{
				id: 'credit_card',
				name: 'Credit Card',
				icon: CreditCard,
				description: 'Debit or credit card payment'
			},
			{
				id: 'bsc_usdt',
				name: 'BSC-USDT',
				icon: Banknote,
				description: 'Pay with BSC-USDT'
			}
		];

		if (cartStore.selectedCustomer?.isTrusted) {
			methods.push({
				id: 'on_tab',
				name: 'Pay on Tab',
				icon: Users,
				description: `Add to ${cartStore.selectedCustomer.name}'s tab`
			});
		}

		paymentMethods = methods;
	});

	const processPayment = async () => {
		isProcessing = true;
		paidAmount = cartStore.grandTotal;

		if (selectedPaymentMethod === 'on_tab') {
			await cartStore.checkoutOnTab();
		} else {
			await cartStore.checkout();
		}

		isProcessing = false;
		isCompleted = true;

		// Start auto-close timer when payment is completed
		startAutoCloseTimer();
	};

	const startAutoCloseTimer = () => {
		clearAutoCloseTimer();

		autoCloseTimer = setInterval(() => {
			remainingSeconds -= 1;
			if (remainingSeconds <= 0) {
				clearAutoCloseTimer();
				paymentComplete();
			}
		}, 1000) as unknown as number;
	};

	const printReceipt = () => {
		toast.success('Receipt printed successfully!');
	};

	const paymentComplete = () => {
		resetDialog();
	};

	// Clean up timer when component is destroyed
	onDestroy(() => {
		resetDialog();
	});
</script>

<Dialog.Root bind:open={isOpen}>
	<Button
		class="flex w-full items-center justify-center rounded-lg bg-blue-700 py-2 text-white hover:bg-blue-800 {cartStore
			.cart.items.length === 0
			? 'opacity-50'
			: ''}"
		disabled={!enableCheckout}
		onclick={() => (isOpen = true)}
	>
		<CreditCard class="mr-2 h-5 w-5" />
		Checkout
	</Button>
	<Dialog.Content class="max-w-sm rounded-lg sm:max-w-xl">
		<Dialog.Header>
			<Dialog.Title class="text-2xl font-bold">Complete Purchase</Dialog.Title>
		</Dialog.Header>

		{#if !isCompleted}
			<div class="py-6">
				<div class="mb-8 rounded-lg bg-blue-500 p-4 dark:bg-blue-50/10">
					<div class="mb-1 text-sm text-white dark:text-muted-foreground">
						Total Amount
					</div>
					<div class="text-3xl font-bold text-white dark:text-green-500">
						{numberWithCurrency(cartStore.total)}
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="text-lg font-medium">Select Payment Method</h3>

					<RadioGroup value={selectedPaymentMethod} class="grid gap-4 md:grid-cols-3">
						{#each paymentMethods as method}
							<Button
								class="relative flex h-auto flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted
								{selectedPaymentMethod === method.id
									? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
									: 'hover:border-blue-500/30'}"
								onclick={() => (selectedPaymentMethod = method.id)}
							>
								<div class="flex w-full items-center gap-3">
									<div class="rounded-lg bg-blue-500/10 p-2">
										<method.icon
											class="h-6 w-6 {selectedPaymentMethod === method.id
												? 'text-blue-500'
												: 'text-muted-foreground'}"
										/>
									</div>
									<div class="flex-1 text-wrap">
										<Label for={method.id} class="cursor-pointer font-bold text-blue-500">
											{method.name}
										</Label>
										<p class="text-xs text-muted-foreground">{method.description}</p>
									</div>
								</div>
								<RadioGroupItem value={method.id} id={method.id} class="sr-only" />
							</Button>
						{/each}
					</RadioGroup>
				</div>
			</div>

			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button variant="outline" onclick={() => (isOpen = false)}>Cancel</Button>
				<Button
					onclick={processPayment}
					disabled={isProcessing}
					class="bg-blue-600 text-white transition-colors hover:bg-blue-700"
				>
					{#if isProcessing}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
						></div>
						Processing...
					{:else}
						Confirm Payment
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}

		{#if isCompleted}
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<div class="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
					<Check class="h-8 w-8 text-green-500" />
				</div>
				<h3 class="mb-2 text-2xl font-bold text-green-500">Payment Successful!</h3>
				<p class="mb-8 text-muted-foreground">
					{@html `Payment of <span class='font-semibold text-black dark:text-white'>${numberWithCurrency(paidAmount)}</span> has been processed successfully.`}
				</p>

				<div class="flex w-full gap-3">
					<Button
						variant="outline"
						class="flex-1 border-dashed hover:border-blue-500 hover:bg-blue-500/5"
						onclick={printReceipt}
					>
						<Printer class="mr-2 h-4 w-4" />
						Print Receipt
					</Button>
					<Button
						class="flex-1 bg-blue-600 text-white transition-colors hover:bg-blue-700"
						onclick={paymentComplete}
					>
						Complete ({remainingSeconds}s)
					</Button>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
