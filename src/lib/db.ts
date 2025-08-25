import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// 1. Core Models
export type Product = {
	id: string;
	name: string;
	price: number;
	categoryId: string;
	stock: number;
	image?: string;
	isWeight: boolean;
};

export type Category = {
	id: string;
	name: string;
};

// 2. Customer & Debt Models
export type Customer = {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	isTrusted: boolean;
	notes?: string;
};

export type Sale = {
	id: string;
	customerId?: string;
	staffId: string;
	shiftId: string;
	total: number;
	subtotal: number;
	tax: number;
	discount: number;
	paymentMethod: 'CASH' | 'CARD' | 'TAB' | 'SPLIT';
	status: 'PAID' | 'UNPAID' | 'PARTIAL';
	createdAt: Date;
};

export type SaleItem = {
	id: string;
	saleId: string;
	productId: string;
	quantity: number;
	price: number; // Price at time of sale
};

export type Debt = {
	id: string;
	customerId: string;
	saleId?: string;
	amount: number; // Positive for new debt, negative for payment
	createdAt: Date;
};

// 3. Staff & Shift Models
export type Staff = {
	id: string;
	name: string;
	pin: string; // Hashed PIN
	role: 'Admin' | 'Manager' | 'Cashier';
};

export type Shift = {
	id: string;
	staffId: string;
	startCash: number;
	endCash?: number;
	startedAt: Date;
	endedAt?: Date;
};

// 4. Inventory & Purchase Models
export type PurchaseOrder = {
	id: string;
	supplierId: string;
	totalCost: number;
	status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
	createdAt: Date;
	receivedAt?: Date;
};

export type PurchaseOrderItem = {
	id: string;
	purchaseOrderId: string;
	productId: string;
	quantity: number;
	cost: number;
};

export type StockTake = {
	id: string;
	staffId: string;
	createdAt: Date;
	notes?: string;
};

export type StockTakeItem = {
	id: string;
	stockTakeId: string;
	productId: string;
	expectedCount: number;
	actualCount: number;
	discrepancy: number;
};

// 5. Accounting & Promotions
export type Expense = {
	id: string;
	shiftId: string;
	amount: number;
	reason: string;
	createdAt: Date;
};

export type Promotion = {
	id: string;
	name: string;
	type: 'BUNDLE';
	productId: string;
	buyQuantity: number;
	getQuantity: number;
	isActive: boolean;
};

// 6. Sync Queue
export type SyncQueue = {
	id?: number;
	entity: string;
	entityId: string;
	action: 'create' | 'update' | 'delete';
	payload: any;
	createdAt: Date;
};

export class LocalDB extends Dexie {
	products!: Table<Product>;
	categories!: Table<Category>;
	customers!: Table<Customer>;
	sales!: Table<Sale>;
	saleItems!: Table<SaleItem>;
	debts!: Table<Debt>;
	staff!: Table<Staff>;
	shifts!: Table<Shift>;
	purchaseOrders!: Table<PurchaseOrder>;
	purchaseOrderItems!: Table<PurchaseOrderItem>;
	stockTakes!: Table<StockTake>;
	stockTakeItems!: Table<StockTakeItem>;
	expenses!: Table<Expense>;
	promotions!: Table<Promotion>;
	syncQueue!: Table<SyncQueue>;

	constructor() {
		super('SveltePOSDB_v2');
		this.version(1).stores({
			products: 'id, name, categoryId',
			categories: 'id, name',
			customers: 'id, name, email',
			sales: 'id, customerId, staffId, shiftId, status, createdAt',
			saleItems: 'id, saleId, productId',
			debts: 'id, customerId, createdAt',
			staff: 'id, name',
			shifts: 'id, staffId, endedAt',
			purchaseOrders: 'id, supplierId, status, createdAt',
			purchaseOrderItems: 'id, purchaseOrderId, productId',
			stockTakes: 'id, staffId, createdAt',
			stockTakeItems: 'id, stockTakeId, productId',
			expenses: 'id, shiftId, createdAt',
			promotions: 'id, type, productId, isActive',
			syncQueue: '++id, entity, entityId, createdAt'
		});
	}
}

export const db = new LocalDB();

// Hook to automatically generate UUIDs for all tables
db.tables.forEach((table) => {
	if (table.name !== 'syncQueue') {
		table.hook('creating', (primKey, obj) => {
			if (!obj.id) obj.id = uuidv4();
		});
	}
});
