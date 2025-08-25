import type { Cart } from '../carts/types';

export interface PendingTransaction {
	id: string; // UUID
	cart: Cart;
	timestamp: string;
}
