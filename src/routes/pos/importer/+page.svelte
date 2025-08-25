<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { AlertCircle, Upload, Home, Trash } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import { v4 as uuidv4 } from 'uuid';

	let isImporting = $state(false);

	async function clearDatabase() {
		await Promise.all(db.tables.map((table) => table.clear()));
		toast.success('Database cleared');
	}

	async function importSampleData() {
		isImporting = true;
		try {
			const categories = [
				{ id: uuidv4(), name: 'Beers' },
				{ id: uuidv4(), name: 'Wines' },
				{ id: uuidv4(), name: 'Snacks' }
			];

			const products = [
				{
					id: uuidv4(),
					name: 'Lager',
					price: 5.0,
					categoryId: categories[0].id,
					stock: 100,
					isWeight: false
				},
				{
					id: uuidv4(),
					name: 'Stout',
					price: 6.0,
					categoryId: categories[0].id,
					stock: 100,
					isWeight: false
				},
                {
					id: uuidv4(),
					name: 'IPA',
					price: 6.5,
					categoryId: categories[0].id,
					stock: 100,
					isWeight: false
				},
				{
					id: uuidv4(),
					name: 'Red Wine',
					price: 8.0,
					categoryId: categories[1].id,
					stock: 50,
					isWeight: false
				},
				{
					id: uuidv4(),
					name: 'White Wine',
					price: 8.0,
					categoryId: categories[1].id,
					stock: 50,
					isWeight: false
				},
				{
					id: uuidv4(),
					name: 'Peanuts',
					price: 2.0,
					categoryId: categories[2].id,
					stock: 200,
					isWeight: false
				}
			];

			await db.categories.bulkAdd(categories);
			await db.products.bulkAdd(products);

			toast.success('Sample data imported successfully!');
		} catch (error) {
			console.error('Import error:', error);
			toast.error('Import Failed', {
				description: 'An error occurred during the import process.'
			});
		} finally {
			isImporting = false;
		}
	}

	const goToHome = () => {
		goto('/pos/cashier');
	};
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">Data Importer</h1>

	<Alert.Root variant="destructive" class="mb-8 bg-red-200">
		<AlertCircle class="mr-2 h-4 w-4" />
		<Alert.Title>Warning</Alert.Title>
		<Alert.Description>
			Using these tools can result in data loss. Use with caution.
		</Alert.Description>
	</Alert.Root>

	<Card.Root class="rounded-lg p-6 shadow-md">
		<Card.Header>
			<h2 class="mb-4 text-xl font-semibold">Import and Clear Data</h2>
		</Card.Header>
		<Card.Content>
			<p class="mb-6 text-gray-600">
				Use the buttons below to add sample data or clear the entire local database.
			</p>

			<div class="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
				<Button
					onclick={importSampleData}
					disabled={isImporting}
					class="w-full bg-blue-800 text-white hover:bg-blue-900 sm:w-auto"
				>
					<Upload class="mr-2 h-4 w-4" />
					{isImporting ? 'Importing...' : 'Import Sample Data'}
				</Button>

				<Button
					onclick={clearDatabase}
					variant="destructive"
					class="w-full sm:w-auto"
				>
					<Trash class="mr-2 h-4 w-4" />
					Clear Entire Database
				</Button>

				<Button onclick={goToHome} variant="outline" class="w-full sm:w-auto">
					<Home class="mr-2 h-4 w-4" />
					Back to POS
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
