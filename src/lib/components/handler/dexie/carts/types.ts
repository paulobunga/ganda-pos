import type { Product, WeightedProduct } from '../products/types';

export interface CartItem {
	product: WeightedProduct | Product;
	quantity: number;
}

export interface Cart {
	id?: number;
	name: string;
	items: CartItem[];
	timestamp: string;
}
