import { goto } from '$app/navigation';
import type { WeightedProduct, Product, SavedCart, CustomerTab } from './types';
import { toast } from 'svelte-sonner';
import { db } from '$lib/db';
import * as m from '$lib/paraglide/messages.js';
import { localStore, type LocalStorageType } from '$lib/localStore.svelte';
import { getCurrentTime } from '$lib/tools/time';
import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
import { isTrue } from '$lib/tools/numbering';

export class CartStore {
	// Cart state variables
	localCart: LocalStorageType<{ product: WeightedProduct | Product; quantity: number }[]> =
		localStore('pos.cart', [] as { product: WeightedProduct | Product; quantity: number }[]);
	cart: { product: WeightedProduct | Product; quantity: number }[] = $state(this.localCart.current);
	savedCarts: CustomerTab[] = $state([]); // Will hold customer tabs from Dexie

	// Checkout state variables
	discount = $state(0);
	tax = $state(0);

	// UI state variables
	searchQuery = $state('');
	newCartName = $state(''); // Will be used for naming the tab
	isSaving = $state(false);
	loadedTab: CustomerTab | null = $state(null);

	// --- Cash Management ---
	localOpeningBalance: LocalStorageType<number> = localStore('pos.openingBalance', 0);
	openingBalance = $state(this.localOpeningBalance.current);

	localCashSales: LocalStorageType<number> = localStore('pos.cashSales', 0);
	cashSalesTotal = $state(this.localCashSales.current);

	localPettyCash: LocalStorageType<number> = localStore('pos.pettyCash', 0);
	pettyCash = $state(this.localPettyCash.current);

	get expectedCashInDrawer() {
		return this.openingBalance + this.cashSalesTotal - this.pettyCash;
	}
	showSavedCarts = $state(false);
	showCartOnMobile = $state(false);
	#isMobile: IsMobile | null = $state(null);

	constructor() {
		$effect.root(() => {
			this.#isMobile = new IsMobile();

			// Load tabs from Dexie on init
			db.customerTabs.toArray().then((tabs) => {
				this.savedCarts = tabs;
			});
		});
	}

	// Weight input state
	editingWeightItem: WeightedProduct | null = $state(null);
	weightInputValue = $state('');

	// Computed values
	get total() {
		return this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
	}

	get grandTotal() {
		const calculatedTax = this.total * (this.tax / 100);
		const calculatedDiscount = this.discount;

		return this.total + calculatedTax - calculatedDiscount;
	}

	get cartItemCount() {
		return this.cart.length;
	}

	// Cart management methods
	addToCart = (product: WeightedProduct | Product) => {
		if (isTrue(product.isWeighted)) {
			// For weighted item, open the weight input dialog
			this.editingWeightItem = product as WeightedProduct;

			// Check if the product already exists in the cart
			const existingItem = this.cart.find((item) => item.product.id === product.id);
			// Use existing weight if available, otherwise empty string for better UX
			this.weightInputValue = existingItem ? existingItem.quantity.toString() : '';
			return;
		} else {
			this.editingWeightItem = null;
		}

		const existingItem = this.cart.find((item) => item.product.id === product.id);

		if (existingItem) {
			this.cart = this.cart.map((item) =>
				item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
			);
		} else {
			this.cart = [...this.cart, { product, quantity: 1 }];
		}
		this.localCart.current = this.cart;
	};

	removeFromCart = (productId: number) => {
		const existingItem = this.cart.find((item) => item.product.id === productId);

		if (existingItem && existingItem.quantity > 1) {
			this.cart = this.cart.map((item) =>
				item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
			);
		} else {
			this.cart = this.cart.filter((item) => item.product.id !== productId);
		}
		this.localCart.current = this.cart;
	};

	deleteFromCart = (productId: number) => {
		this.cart = this.cart.filter((item) => item.product.id !== productId);
		this.localCart.current = this.cart;
	};

	clearCart = () => {
		this.cart = [];
		this.localCart.current = [];
		this.loadedTab = null; // Also clear the loaded tab
	};

	checkout = async (paymentMethod: 'cash' | 'credit_card' | 'bsc_usdt' | 'tab') => {
		if (this.cart.length === 0) return;

		if (paymentMethod === 'tab') {
			if (!this.loadedTab || !this.loadedTab.id) {
				toast.error('No tab is loaded to be paid.');
				return;
			}
		}

		const sale: Sale = {
			items: [...this.cart],
			total: this.total,
			grandTotal: this.grandTotal,
			discount: this.discount,
			tax: this.tax,
			paymentMethod: paymentMethod,
			timestamp: new Date().toISOString()
			// cashierId can be added later
		};

		try {
			await db.sales.add(sale);

			if (paymentMethod === 'cash') {
				this.cashSalesTotal += sale.grandTotal;
				this.localCashSales.current = this.cashSalesTotal;
			}

			if (paymentMethod === 'tab' && this.loadedTab?.id) {
				await db.customerTabs.delete(this.loadedTab.id);
				this.savedCarts = await db.customerTabs.toArray(); // Refresh list
			}

			toast.success(`Checkout successful with ${paymentMethod}.`);
			this.clearCart();
			this.showCartOnMobile = false;
		} catch (error) {
			toast.error('Checkout failed.');
			console.error(error);
		}
	};

	printReceipt = () => {
		toast.success(m.pos_print_receipt());
	};

	// Customer Tab methods
	saveOrUpdateTab = async () => {
		if (this.cart.length === 0) return;

		this.isSaving = true;

		let tabToSave: CustomerTab;

		if (this.loadedTab) {
			// Update existing tab
			tabToSave = {
				...this.loadedTab,
				items: [...this.cart],
				total: this.grandTotal,
				updatedAt: new Date().toISOString()
			};
		} else {
			// Create new tab
			const tabName = this.newCartName.trim() || `Guest ${this.savedCarts.length + 1}`;
			tabToSave = {
				name: tabName,
				items: [...this.cart],
				total: this.grandTotal,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
		}

		try {
			await db.customerTabs.put(tabToSave);
			this.savedCarts = await db.customerTabs.toArray(); // Refresh list
			this.newCartName = '';
			this.clearCart(); // This will also clear loadedTab
			toast.success(`Tab "${tabToSave.name}" saved.`);
		} catch (error) {
			toast.error('Failed to save tab.');
			console.error(error);
		} finally {
			this.isSaving = false;
		}
	};

	loadTab = (tab: CustomerTab) => {
		this.cart = [...tab.items];
		this.localCart.current = this.cart;
		this.loadedTab = tab; // Set the currently loaded tab
		// Note: We don't delete the tab on load. It persists until paid.

		if (this.#isMobile?.current) {
			this.showSavedCarts = false;
			this.showCartOnMobile = true;
		}
	};

	deleteTab = async (id: number | undefined) => {
		if (!id) return;
		try {
			await db.customerTabs.delete(id);
			this.savedCarts = await db.customerTabs.toArray(); // Refresh list
			toast.success(`Tab deleted.`);
		} catch (error) {
			toast.error('Failed to delete tab.');
			console.error(error);
		}

		if (this.savedCarts.length === 0) {
			this.showSavedCarts = false;
		}
	};

	// --- Cash Management Methods ---
	setOpeningBalance = (amount: number) => {
		this.openingBalance = amount;
		this.localOpeningBalance.current = amount;
		// Reset daily totals when setting opening balance
		this.cashSalesTotal = 0;
		this.localCashSales.current = 0;
		this.pettyCash = 0;
		this.localPettyCash.current = 0;
		toast.success('Opening balance has been set.');
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
	handleEditWeight = (product: WeightedProduct, quantity: number) => {
		this.editingWeightItem = product;
		this.weightInputValue = quantity.toString();
	};

	confirmWeightInput = () => {
		if (!this.editingWeightItem) return;

		const weight = parseFloat(this.weightInputValue);
		if (isNaN(weight) || weight <= 0) {
			toast.error(m.pos_invalid_weight());
			return;
		}

		const existingItem = this.cart.find((item) => item.product.id === this.editingWeightItem?.id);

		if (existingItem) {
			this.cart = this.cart.map((item) =>
				item.product.id === this.editingWeightItem?.id ? { ...item, quantity: weight } : item
			);
		} else {
			this.cart = [...this.cart, { product: this.editingWeightItem, quantity: weight }];
		}
		this.localCart.current = this.cart;

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
