export interface Product {
	id: number;
	name: string;
	image?: string;
	price: number;
	unit?: string;
	category: string;
	isWeighted: boolean; // Keep this to differentiate
}

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
