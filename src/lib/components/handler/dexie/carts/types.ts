import type { Product } from '../products/types';

export interface CartItem {
	product: Product;
	quantity: number;
}

export interface Cart {
	id?: number;
	name: string;
	items: CartItem[];
	timestamp: string;
	customerId?: number;
}
