import Dexie, { type Table } from 'dexie';
import type { Product, WeightedProduct, Sale, CustomerTab } from '../routes/pos/types';

export class SveltePosDb extends Dexie {
	products!: Table<Product | WeightedProduct>;
	sales!: Table<Sale>;
	customerTabs!: Table<CustomerTab>;

	constructor() {
		super('svelte-pos-db');
		this.version(1).stores({
			products: '++id, name, category',
			sales: '++id, timestamp, cashierId',
			customerTabs: '++id, name, createdAt'
		});
	}
}

export const db = new SveltePosDb();
