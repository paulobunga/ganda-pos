import type { Product } from '$lib/components/handler/dexie/products/types';

export type { Product };

export interface CartItem {
	product: Product;
	quantity: number;
}

export interface Cart {
	items: CartItem[];
	total: number;
}

export interface SavedCart {
	id: number;
	name: string;
	items: CartItem[];
	timestamp: string;
}
