export interface Product {
	id: number;
	name: string;
	image?: string;
	price: number;
	unit?: string;
	category: string;
	isWeighted: false;
}

export interface WeightedProduct extends Omit<Product, 'isWeighted'> {
	isWeighted: true;
	unit: string;
}

export interface CartItem {
	product: WeightedProduct | Product;
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

// New type for customer tabs, which will replace SavedCart
export interface CustomerTab {
	id?: number; // Optional because it's auto-incremented by Dexie
	name: string;
	items: CartItem[];
	total: number;
	createdAt: string;
	updatedAt: string;
}

// New type for sales transactions
export interface Sale {
	id?: number; // Optional because it's auto-incremented by Dexie
	items: CartItem[];
	total: number;
	grandTotal: number; // Including tax and discount
	discount: number;
	tax: number;
	paymentMethod: 'cash' | 'credit_card' | 'bsc_usdt' | 'tab';
	timestamp: string;
	cashierId?: number; // Optional for now
}
