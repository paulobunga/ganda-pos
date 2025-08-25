import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

export type Product = {
    id: string; // UUID
    name: string;
    price: number;
    categoryId: string;
    stock: number;
    image?: string;
    isWeight: boolean;
};

export type Category = {
    id:string; // UUID
    name: string;
};

export type Customer = {
    id: string; // UUID
    name: string;
    email?: string;
    phone?: string;
    isTrusted: boolean;
    notes?: string;
};

export type Sale = {
    id: string; // UUID
    customerId?: string;
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    paymentMethod: 'CASH' | 'CARD' | 'TAB';
    status: 'PAID' | 'UNPAID';
    createdAt: Date;
};

export type SaleItem = {
    id: string; // UUID
    saleId: string;
    productId: string;
    quantity: number;
    price: number; // Price at time of sale
};

export type Debt = {
    id: string; // UUID
    customerId: string;
    saleId?: string; // The sale that created/increased the debt
    paymentId?: string; // A payment that reduced the debt
    amount: number; // Positive for new debt, negative for payment
    createdAt: Date;
};

export type Promotion = {
    id: string; // UUID
    name: string;
    type: 'BUNDLE';
    // For BUNDLE type
    productId: string;
    buyQuantity: number;
    getQuantity: number; // e.g., buy 5, get 1 free
    isActive: boolean;
};


export class LocalDB extends Dexie {
    products!: Table<Product>;
    categories!: Table<Category>;
    customers!: Table<Customer>;
    sales!: Table<Sale>;
    saleItems!: Table<SaleItem>;
    debts!: Table<Debt>;
    promotions!: Table<Promotion>;

    constructor() {
        super('SveltePOSDB');
        this.version(1).stores({
            products: 'id, name, categoryId',
            categories: 'id, name',
            customers: 'id, name, email',
            sales: 'id, customerId, status, createdAt',
            saleItems: 'id, saleId, productId',
            debts: 'id, customerId, createdAt',
            promotions: 'id, type, productId, isActive',
        });
    }
}

export const db = new LocalDB();

// Hook to automatically generate UUIDs for all tables
db.tables.forEach(table => {
    table.hook('creating', (primKey, obj) => {
        if (!obj.id) obj.id = uuidv4();
    });
});
