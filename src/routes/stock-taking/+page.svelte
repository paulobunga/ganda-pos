<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Product, type StockAdjustment } from '$lib/components/handler/dexie/db';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { toast } from 'svelte-sonner';

	let products = $state<Product[]>([]);
	let physicalCounts = $state<Record<number, number>>({});
	let isFinalizing = $state(false);

	async function loadProducts() {
		products = await db.products.toArray();
	}

	function getVariance(product: Product): number {
		const expectedStock = product.stock || 0;
		const physicalCount = physicalCounts[product.id!];
		if (physicalCount === undefined) return 0;
		return physicalCount - expectedStock;
	}

	async function finalizeStockTake() {
		isFinalizing = true;
		try {
			await db.transaction('rw', db.products, db.stock_adjustments, async () => {
				for (const product of products) {
					const physicalCount = physicalCounts[product.id!];
					if (physicalCount !== undefined) {
						const expectedStock = product.stock || 0;
						const variance = physicalCount - expectedStock;

						if (variance !== 0) {
							// Log the adjustment
							const adjustment: StockAdjustment = {
								productId: product.id!,
								previousStock: expectedStock,
								newStock: physicalCount,
								variance,
								reason: 'Stock-Take',
								timestamp: new Date().toISOString()
							};
							await db.stock_adjustments.add(adjustment);

							// Update the product's stock
							await db.products.update(product.id!, { stock: physicalCount });
						}
					}
				}
			});
			toast.success('Stock-take finalized successfully!');
			physicalCounts = {};
			await loadProducts();
		} catch (error) {
			console.error('Failed to finalize stock-take:', error);
			toast.error('Failed to finalize stock-take. Please try again.');
		} finally {
			isFinalizing = false;
		}
	}

	onMount(() => {
		loadProducts();
	});
</script>

<div class="p-8">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Stock-Taking</h2>
		<Button onclick={finalizeStockTake} disabled={isFinalizing}>
			{#if isFinalizing}
				<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
				Finalizing...
			{:else}
				Finalize Stock-Take
			{/if}
		</Button>
	</div>

	<div class="mt-4 rounded-md border">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Expected Stock</TableHead>
					<TableHead>Physical Count</TableHead>
					<TableHead>Variance</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if products.length > 0}
					{#each products as product}
						<TableRow>
							<TableCell>{product.name}</TableCell>
							<TableCell>{product.stock || 0}</TableCell>
							<TableCell>
								<Input
									type="number"
									bind:value={physicalCounts[product.id!]}
									class="w-24"
								/>
							</TableCell>
							<TableCell>
								{@const variance = getVariance(product)}
								<span class={variance > 0 ? 'text-green-500' : variance < 0 ? 'text-red-500' : ''}>
									{variance > 0 ? '+' : ''}{variance}
								</span>
							</TableCell>
						</TableRow>
					{/each}
				{:else}
					<TableRow>
						<TableCell colspan={4} class="text-center">No products found.</TableCell>
					</TableRow>
				{/if}
			</TableBody>
		</Table>
	</div>
</div>
