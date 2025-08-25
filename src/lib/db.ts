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

export async function enablePersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persisted();
            console.log(`Storage is persisted: ${isPersisted}`);
            if (!isPersisted) {
                const result = await navigator.storage.persist();
                console.log(`Storage persistence request result: ${result}`);
            }
        } catch (error) {
            console.error('Failed to request persistent storage:', error);
        }
    }
}
