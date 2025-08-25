import { goto } from '$app/navigation';
import type { Product, SavedCart } from './types';
import { toast } from 'svelte-sonner';
import { localStore, type LocalStorageType } from '$lib/localStore.svelte';
import { getCurrentTime } from '$lib/tools/time';
import { IsMobile } from '$lib/hooks/is-mobile.svelte.js';
import { isTrue } from '$lib/tools/numbering';
import { db, type Promotion } from '$lib/db';

export class CartStore {
	// Cart state variables
	localCart: LocalStorageType<{ product: Product; quantity: number }[]> = localStore(
		'pos.cart',
		[] as { product: Product; quantity: number }[]
	);
	cart: { product: Product; quantity: number }[] = $state(this.localCart.current);
	localSavedCarts: LocalStorageType<SavedCart[]> = localStore('pos.savedCarts', [] as SavedCart[]);
	savedCarts: SavedCart[] = $state(this.localSavedCarts.current);

	// Checkout state variables
	tax = $state(0);
	appliedPromotions = $state<{ name: string; discount: number }[]>([]);

	// Promotions state
	promotions = $state<Promotion[]>([]);

	// UI state variables
	searchQuery = $state('');
	newCartName = $state('');
	isSaving = $state(false);
	localGuestCount: LocalStorageType<number> = localStore('pos.guestCount', 1);
	guestCount = $state(this.localGuestCount.current);
	showSavedCarts = $state(false);
	showCartOnMobile = $state(false);
	#isMobile: IsMobile | null = $state(null);

	constructor() {
		this.loadPromotions();
		$effect.root(() => {
			this.#isMobile = new IsMobile();
			this.#applyPromotions();
		});
	}

	async loadPromotions() {
		this.promotions = await db.promotions.where('isActive').equals(1).toArray();
	}

	// Weight input state
	editingWeightItem: Product | null = $state(null);
	weightInputValue = $state('');

	// Computed values
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

	#applyPromotions = () => {
		const newAppliedPromotions: { name: string; discount: number }[] = [];

		for (const promo of this.promotions) {
			if (promo.type === 'BUNDLE') {
				const cartItem = this.cart.find((item) => item.product.id === promo.productId);

				if (cartItem && cartItem.quantity >= promo.buyQuantity) {
					const numberOfTimesPromoApplies = Math.floor(cartItem.quantity / promo.buyQuantity);
					const discountAmount =
						numberOfTimesPromoApplies * promo.getQuantity * cartItem.product.price;

					if (discountAmount > 0) {
						newAppliedPromotions.push({
							name: promo.name,
							discount: discountAmount
						});
					}
				}
			}
		}
		this.appliedPromotions = newAppliedPromotions;
	};

	get cartItemCount() {
		return this.cart.length;
	}

	// Cart management methods
	addToCart = (product: Product) => {
		if (isTrue(product.isWeight)) {
			this.editingWeightItem = product;
			const existingItem = this.cart.find((item) => item.product.id === product.id);
			this.weightInputValue = existingItem ? existingItem.quantity.toString() : '';
			return;
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

	removeFromCart = (productId: string) => {
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

	deleteFromCart = (productId: string) => {
		this.cart = this.cart.filter((item) => item.product.id !== productId);
		this.localCart.current = this.cart;
	};

	clearCart = () => {
		this.cart = [];
		this.localCart.current = [];
	};

	checkout = () => {
		this.clearCart();
		this.showCartOnMobile = false;
	};

	printReceipt = () => {
		toast.info('This is a stubbed feature.');
	};

	// Saved carts methods
	saveCurrentCart = () => {
		if (this.cart.length === 0) return;

		this.isSaving = true;

		const cartName = this.newCartName.trim() || `Guest ${this.guestCount}`;
		if (!this.newCartName.trim()) {
			this.guestCount++;
			this.localGuestCount.current = this.guestCount;
		}

		this.savedCarts = [
			...this.savedCarts,
			{
				id: Date.now(),
				name: cartName,
				items: [...this.cart],
				timestamp: getCurrentTime().toISOString()
			}
		];
		this.localSavedCarts.current = this.savedCarts;

		this.newCartName = '';
		this.isSaving = false;
		this.clearCart();
	};

	loadSavedCart = (savedCart: SavedCart) => {
		this.cart = [...savedCart.items];
		this.localCart.current = this.cart;
		this.deleteSavedCart(savedCart.id);
		if (this.#isMobile?.current) {
			this.showSavedCarts = false;
			this.showCartOnMobile = true;
		}
	};

	deleteSavedCart = (id: number) => {
		this.savedCarts = this.savedCarts.filter((cart) => cart.id !== id);
		this.localSavedCarts.current = this.savedCarts;
		if (this.savedCarts.length === 0) {
			this.guestCount = 1;
			this.localGuestCount.current = 1;
			this.showSavedCarts = false;
		}
	};

	// UI toggle methods
	toggleSavedCarts = () => {
		this.showSavedCarts = !this.showSavedCarts;
		if (this.showSavedCarts) this.showCartOnMobile = false;
	};

	toggleCartOnMobile = () => {
		this.showCartOnMobile = !this.showCartOnMobile;
		if (this.showCartOnMobile) this.showSavedCarts = false;
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
			toast.error('Invalid weight');
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
