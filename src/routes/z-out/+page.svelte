<script lang="ts">
    import { onMount } from 'svelte';
    import { db } from '$lib/db';
    import type { Sale } from '../pos/types';
    import { cartStore } from '../pos/CartStore.svelte';
    import { Button } from '$lib/components/ui/button';
    import { numberWithCurrency } from '$lib/tools/numbering';
    import { goto } from '$app/navigation';
    import { ArrowLeft, Printer } from 'lucide-svelte';

    let sales: Sale[] = [];
    let totalSales = 0;
    let totalCashSales = 0;
    let totalTabSales = 0;

    onMount(async () => {
        // For a basic report, we fetch all sales.
        // A more advanced version would filter by date range or shift.
        sales = await db.sales.toArray();
        totalSales = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
        totalCashSales = sales
            .filter(s => s.paymentMethod === 'cash')
            .reduce((sum, sale) => sum + sale.grandTotal, 0);
        totalTabSales = sales
            .filter(s => s.paymentMethod === 'tab')
            .reduce((sum, sale) => sum + sale.grandTotal, 0);
    });

    const printReport = () => {
        window.print();
    };
</script>

<div class="container mx-auto p-4 max-w-2xl">
    <header class="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onclick={() => goto('/pos/cashier')}>
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <h1 class="text-2xl font-bold">Z-Out Report</h1>
        <Button variant="outline" onclick={printReport}>
            <Printer class="mr-2 h-4 w-4" />
            Print
        </Button>
    </header>

    <div class="bg-card p-6 rounded-lg border">
        <h2 class="text-xl font-semibold mb-4 border-b pb-2">Shift Summary</h2>
        <div class="space-y-2 text-lg">
            <div class="flex justify-between">
                <span>Opening Balance:</span>
                <span class="font-mono">{numberWithCurrency(cartStore.openingBalance)}</span>
            </div>
            <div class="flex justify-between">
                <span>Total Cash Sales:</span>
                <span class="font-mono">{numberWithCurrency(totalCashSales)}</span>
            </div>
             <div class="flex justify-between">
                <span>Total Tab Sales:</span>
                <span class="font-mono">{numberWithCurrency(totalTabSales)}</span>
            </div>
            <div class="flex justify-between font-bold text-xl border-t pt-2 mt-2">
                <span>Total All Sales:</span>
                <span class="font-mono">{numberWithCurrency(totalSales)}</span>
            </div>
            <div class="flex justify-between font-bold text-xl border-t pt-2 mt-2">
                <span>Expected Cash in Drawer:</span>
                <span class="font-mono">{numberWithCurrency(cartStore.expectedCashInDrawer)}</span>
            </div>
            <div class="flex justify-between">
                <span>Number of Transactions:</span>
                <span class="font-mono">{sales.length}</span>
            </div>
        </div>
    </div>
</div>

<style>
    @media print {
        header {
            display: none;
        }
        .container {
            padding: 0;
        }
    }
</style>
