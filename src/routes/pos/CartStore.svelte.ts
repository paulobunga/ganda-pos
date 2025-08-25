import { goto } from '$app/navigation';
import type { Product, SavedCart } from './types';
import { toast } from 'svelte-sonner';
import { localStore } from '$lib/localStore.svelte';
import { getCurrentTime } from '$lib/tools/time';
import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
import { db, type Promotion } from '$lib/db';

export class CartStore {
	cart: { product: Product; quantity: number }[] = $state([]);
	savedCarts: SavedCart[] = $state([]);
	tax = $state(0);
	appliedPromotions = $state<{ name: string; discount: number }[]>([]);
	promotions = $state<Promotion[]>([]);
	searchQuery = $state('');
	newCartName = $state('');
	isSaving = $state(false);
	guestCount = $state(1);
	showSavedCarts = $state(false);
	showCartOnMobile = $state(false);
	editingWeightItem: Product | null = $state(null);
	weightInputValue = $state('');
	#isMobile: IsMobile | null = $state(null);

	constructor() {
		this.loadPromotions();
		const saved = localStore('pos.cart', []).current;
		this.cart = saved;

		const savedCartsData = localStore('pos.savedCarts', []).current;
		this.savedCarts = savedCartsData;

		const guestCountData = localStore('pos.guestCount', 1).current;
		this.guestCount = guestCountData;

		$effect.root(() => {
			this.#isMobile = new IsMobile();
			this.#applyPromotions();
			localStore('pos.cart', []).current = this.cart;
			localStore('pos.savedCarts', []).current = this.savedCarts;
			localStore('pos.guestCount', 1).current = this.guestCount;
		});
	}

	async loadPromotions() {
		this.promotions = await db.promotions.where('isActive').equals(1).toArray();
	}

	get subtotal() {
		return this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
	}
	get taxAmount() {
		return this.subtotal * (this.tax / 100);
	}
	get discount() {
		return this.appliedPromotions.reduce((sum, promo) => sum + promo.discount, 0);
	}
	get total() {
		return this.subtotal + this.taxAmount - this.discount;
	}
	get cartItemCount() {
		return this.cart.length;
	}

	#applyPromotions = () => {
		const newApplied: { name: string; discount: number }[] = [];
		for (const promo of this.promotions) {
			if (promo.type === 'BUNDLE') {
				const item = this.cart.find((i) => i.product.id === promo.productId);
				if (item && item.quantity >= promo.buyQuantity) {
					const times = Math.floor(item.quantity / promo.buyQuantity);
					const discount = times * promo.getQuantity * item.product.price;
					if (discount > 0) newApplied.push({ name: promo.name, discount });
				}
			}
		}
		this.appliedPromotions = newApplied;
	};

	addToCart = (product: Product) => {
		if (product.isWeight) {
			this.editingWeightItem = product;
			const existing = this.cart.find((i) => i.product.id === product.id);
			this.weightInputValue = existing ? existing.quantity.toString() : '';
			return;
		}
		const existing = this.cart.find((i) => i.product.id === product.id);
		if (existing) {
			this.cart = this.cart.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
		} else {
			this.cart = [...this.cart, { product, quantity: 1 }];
		}
	};

	removeFromCart = (productId: string) => {
		const existing = this.cart.find((i) => i.product.id === productId);
		if (existing && existing.quantity > 1) {
			this.cart = this.cart.map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i));
		} else {
			this.cart = this.cart.filter((i) => i.product.id !== productId);
		}
	};

	deleteFromCart = (productId: string) => {
		this.cart = this.cart.filter((i) => i.product.id !== productId);
	};

	clearCart = () => {
		this.cart = [];
	};

	checkout = () => {
		this.clearCart();
		this.showCartOnMobile = false;
	};

	saveCurrentCart = () => {
		if (this.cart.length === 0) return;
		this.isSaving = true;
		const name = this.newCartName.trim() || `Guest ${this.guestCount}`;
		if (!this.newCartName.trim()) this.guestCount++;
		this.savedCarts = [...this.savedCarts, { id: Date.now(), name, items: [...this.cart], timestamp: getCurrentTime().toISOString() }];
		this.newCartName = '';
		this.isSaving = false;
		this.clearCart();
	};

	loadSavedCart = (savedCart: SavedCart) => {
		this.cart = [...savedCart.items];
		this.deleteSavedCart(savedCart.id);
		if (this.#isMobile?.current) {
			this.showSavedCarts = false;
			this.showCartOnMobile = true;
		}
	};

	deleteSavedCart = (id: number) => {
		this.savedCarts = this.savedCarts.filter((c) => c.id !== id);
		if (this.savedCarts.length === 0) this.guestCount = 1;
	};

	toggleSavedCarts = () => {
		this.showSavedCarts = !this.showSavedCarts;
		if (this.showSavedCarts) this.showCartOnMobile = false;
	};

	toggleCartOnMobile = () => {
		this.showCartOnMobile = !this.showCartOnMobile;
		if (this.showCartOnMobile) this.showSavedCarts = false;
	};

	handleEditWeight = (product: Product, quantity: number) => {
		this.editingWeightItem = product;
		this.weightInputValue = quantity.toString();
	};

	confirmWeightInput = () => {
		if (!this.editingWeightItem) return;
		const weight = parseFloat(this.weightInputValue);
		if (isNaN(weight) || weight <= 0) {
			toast.error('Invalid weight');
			return;
		}
		const existing = this.cart.find((i) => i.product.id === this.editingWeightItem?.id);
		if (existing) {
			this.cart = this.cart.map((i) => (i.product.id === this.editingWeightItem?.id ? { ...i, quantity: weight } : i));
		} else {
			this.cart = [...this.cart, { product: this.editingWeightItem, quantity: weight }];
		}
		this.editingWeightItem = null;
		this.weightInputValue = '';
	};

	cancelWeightInput = () => {
		this.editingWeightItem = null;
		this.weightInputValue = '';
	};

	navigateToHome = () => {
		goto('/');
	};
}

export const cartStore = new CartStore();
