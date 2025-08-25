/// <reference lib="webworker" />

import { goto } from '$app/navigation';
import type { Product } from './types';
import { toast } from 'svelte-sonner';
import { db, type Cart, type Customer } from '$lib/components/handler/dexie/db';
import { getCurrentTime } from '$lib/tools/time';
import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
import { isTrue } from '$lib/tools/numbering';

export class CartStore {
	// Cart state variables
	cart: Cart = $state({
		name: '__active__',
		items: [],
		timestamp: new Date().toISOString()
	});
	savedCarts: Cart[] = $state([]);
	selectedCustomer: Customer | null = $state(null);
	#channel = new BroadcastChannel('cart-channel');

	// Checkout state variables
	discount = $state(0);
	tax = $state(0);

	// UI state variables
	searchQuery = $state('');
	newCartName = $state('');
	isSaving = $state(false);
	guestCount = $state(1);
	showSavedCarts = $state(false);
	showCartOnMobile = $state(false);
	#isMobile: IsMobile | null = $state(null);

	constructor() {
		$effect.root(() => {
			this.#isMobile = new IsMobile();
		});
		this.loadCarts();
	}

	async loadCarts() {
		const activeCart = await db.carts.where({ name: '__active__' }).first();
		if (activeCart) {
			this.cart = activeCart;
			if (activeCart.customerId) {
				this.selectedCustomer = await db.customers.get(activeCart.customerId) || null;
			}
		} else {
			const newCartId = await db.carts.add({
				name: '__active__',
				items: [],
				timestamp: new Date().toISOString()
			});
			this.cart = (await db.carts.get(newCartId))!;
		}
		this.savedCarts = await db.carts.where('name').notEqual('__active__').toArray();
		this.guestCount = this.savedCarts.length + 1;
	}

	setCustomer = (customer: Customer) => {
		this.selectedCustomer = customer;
		this.cart.customerId = customer.id;
		this.updateCart();
	}

	clearCustomer = () => {
		this.selectedCustomer = null;
		delete this.cart.customerId;
		this.updateCart();
	}

	// Weight input state
	editingWeightItem: Product | null = $state(null);
	weightInputValue = $state('');

	// Computed values
	get total() {
		return this.cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
	}

	get grandTotal() {
		const calculatedTax = this.total * (this.tax / 100);
		const calculatedDiscount = this.discount;

		return this.total + calculatedTax - calculatedDiscount;
	}

	get cartItemCount() {
		return this.cart.items.length;
	}

	updateCart = async () => {
		await db.carts.put(this.cart);
		this.#channel.postMessage(this.cart);
	};

	// Cart management methods
	addToCart = (product: Product) => {
		if (isTrue(product.isWeighted)) {
			// For weighted item, open the weight input dialog
			this.editingWeightItem = product;

			// Check if the product already exists in the cart
			const existingItem = this.cart.items.find((item) => item.product.id === product.id);
			// Use existing weight if available, otherwise empty string for better UX
			this.weightInputValue = existingItem ? existingItem.quantity.toString() : '';
			return;
		} else {
			this.editingWeightItem = null;
		}

		const existingItem = this.cart.items.find((item) => item.product.id === product.id);

		if (existingItem) {
			this.cart.items = this.cart.items.map((item) =>
				item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
			);
		} else {
			this.cart.items = [...this.cart.items, { product, quantity: 1 }];
		}
		this.updateCart();
	};

	removeFromCart = (productId: number) => {
		const existingItem = this.cart.items.find((item) => item.product.id === productId);

		if (existingItem && existingItem.quantity > 1) {
			this.cart.items = this.cart.items.map((item) =>
				item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
			);
		} else {
			this.cart.items = this.cart.items.filter((item) => item.product.id !== productId);
		}
		this.updateCart();
	};

	deleteFromCart = (productId: number) => {
		this.cart.items = this.cart.items.filter((item) => item.product.id !== productId);
		this.updateCart();
	};

	clearCart = async () => {
		this.cart.items = [];
		await this.updateCart();
	};

	checkout = async () => {
		if (!navigator.onLine) {
			// Offline: queue the transaction
			const transaction: import('$lib/components/handler/dexie/db').PendingTransaction = {
				id: (await import('$lib/tools/uuid')).generateUUID(),
				cart: this.cart,
				timestamp: new Date().toISOString()
			};

			await db.pending_transactions.add(transaction);

			if ('serviceWorker' in navigator && 'SyncManager' in window) {
				const registration = await navigator.serviceWorker.ready;
				await registration.sync.register('checkout-sync');
			}

			toast.info('You are offline. Transaction is queued and will be processed when you are back online.');
		} else {
			// Online: process immediately
			toast.success(`Checkout successful! Total amount: ${this.total.toFixed(2)}`);
		}

		this.clearCart();
		this.showCartOnMobile = false;
	};

	checkoutOnTab = async () => {
		if (!this.selectedCustomer || !this.selectedCustomer.isTrusted) {
			toast.error('Please select a trusted customer to pay on tab.');
			return;
		}

		const debt: import('$lib/components/handler/dexie/db').Debt = {
			customerId: this.selectedCustomer.id!,
			amount: this.grandTotal,
			cartId: this.cart.id!,
			timestamp: new Date().toISOString()
		};

		await db.debts.add(debt);

		toast.success(`Successfully added to ${this.selectedCustomer.name}'s tab.`);

		this.clearCart();
		this.showCartOnMobile = false;
	};

	printReceipt = () => {
		toast.success('Receipt printed successfully!');
	};

	// Saved carts methods
	saveCurrentCart = async () => {
		if (this.cart.items.length === 0) return;

		this.isSaving = true;

		const cartName = this.newCartName.trim() || `Guest ${this.guestCount}`;

		const newCart: Cart = {
			name: cartName,
			items: [...this.cart.items],
			timestamp: getCurrentTime().toISOString()
		};

		await db.carts.add(newCart);

		this.newCartName = '';
		this.isSaving = false;
		await this.clearCart();
		await this.loadCarts();
	};

	loadSavedCart = async (savedCart: Cart) => {
		// load the saved cart into the cart
		this.cart.items = [...savedCart.items];
		await this.updateCart();

		// Remove the loaded cart from saved carts
		await this.deleteSavedCart(savedCart.id!);

		if (this.cart.items.length === 0) {
			this.showSavedCarts = false;
		}

		if (this.#isMobile?.current) {
			this.showSavedCarts = false;
			this.showCartOnMobile = true;
		}
	};

	deleteSavedCart = async (id: number) => {
		await db.carts.delete(id);
		await this.loadCarts();

		if (this.savedCarts.length === 0) {
			this.showSavedCarts = false;
		}
	};

	// UI toggle methods
	toggleSavedCarts = () => {
		this.showSavedCarts = !this.showSavedCarts;
		// If showing saved carts, hide cart on mobile
		if (this.showSavedCarts) {
			this.showCartOnMobile = false;
		}
	};

	toggleCartOnMobile = () => {
		this.showCartOnMobile = !this.showCartOnMobile;
		// If showing cart, hide saved carts
		if (this.showCartOnMobile) {
			this.showSavedCarts = false;
		}
	};

	// Weight input methods
	handleEditWeight = (product: Product, quantity: number) => {
		this.editingWeightItem = product;
		this.weightInputValue = quantity.toString();
	};

	confirmWeightInput = () => {
		if (!this.editingWeightItem) return;

		const weight = parseFloat(this.weightInputValue);
		if (isNaN(weight) || weight <= 0) {
			toast.error('Please enter a valid weight value');
			return;
		}

		const existingItem = this.cart.items.find(
			(item) => item.product.id === this.editingWeightItem?.id
		);

		if (existingItem) {
			this.cart.items = this.cart.items.map((item) =>
				item.product.id === this.editingWeightItem?.id ? { ...item, quantity: weight } : item
			);
		} else {
			this.cart.items = [...this.cart.items, { product: this.editingWeightItem, quantity: weight }];
		}
		this.updateCart();

		// Reset the state
		this.editingWeightItem = null;
		this.weightInputValue = '';
	};

	cancelWeightInput = () => {
		this.editingWeightItem = null;
		this.weightInputValue = '';
	};

	// Navigation
	navigateToHome = () => {
		goto('/');
	};
}

// Create and export a singleton instance
export const cartStore = new CartStore();
