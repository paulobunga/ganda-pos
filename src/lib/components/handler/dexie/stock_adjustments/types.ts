export interface StockAdjustment {
	id?: number;
	productId: number;
	previousStock: number;
	newStock: number;
	variance: number;
	reason: string;
	timestamp: string;
}
