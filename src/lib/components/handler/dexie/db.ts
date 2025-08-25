import Dexie, { type EntityTable } from 'dexie';
// categories
import type { Category } from './categories/types';
import categorySchema from './categories/schema';
// products
import type { Product } from './products/types';
import productSchema from './products/schema';
// carts
import type { Cart } from './carts/types';
import cartSchema from './carts/schema';
// pending transactions
import type { PendingTransaction } from './pending_transactions/types';
import pendingTransactionSchema from './pending_transactions/schema';
// customers
import type { Customer } from './customers/types';
import customerSchema from './customers/schema';
// debts
import type { Debt } from './debts/types';
import debtSchema from './debts/schema';

const db = new Dexie('dPOSDatabase') as Dexie & {
	categories: EntityTable<
		Category,
		'id' // primary key "id" (for the typings only)
	>;
	products: EntityTable<
		Product,
		'id' // primary key "id" (for the typings only)
	>;
	carts: EntityTable<
		Cart,
		'id' // primary key "id" (for the typings only)
	>;
	pending_transactions: EntityTable<
		PendingTransaction,
		'id' // primary key "id" (for the typings only)
	>;
	customers: EntityTable<
		Customer,
		'id' // primary key "id" (for the typings only)
	>;
	debts: EntityTable<
		Debt,
		'id' // primary key "id" (for the typings only)
	>;
};

// Schema declaration:
db.version(1).stores({
	categories: categorySchema,
	products: productSchema
});

db.version(2).stores({
	categories: categorySchema,
	products: productSchema,
	carts: cartSchema
});

db.version(3).stores({
	categories: categorySchema,
	products: productSchema,
	carts: cartSchema,
	pending_transactions: pendingTransactionSchema
});

db.version(4).stores({
	categories: categorySchema,
	products: productSchema,
	carts: cartSchema,
	pending_transactions: pendingTransactionSchema,
	customers: customerSchema
});

db.version(5).stores({
	categories: categorySchema,
	products: productSchema,
	carts: cartSchema,
	pending_transactions: pendingTransactionSchema,
	customers: customerSchema
});

db.version(6).stores({
	categories: categorySchema,
	products: productSchema,
	carts: cartSchema,
	pending_transactions: pendingTransactionSchema,
	customers: customerSchema,
	debts: debtSchema
});

export type { Category, Product, Cart, PendingTransaction, Customer, Debt };
export { db };
