<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { cartStore } from '../CartStore.svelte';
    import { numberWithCurrency } from '$lib/tools/numbering';

    export let open = false;

    let openingBalanceInput = 0;

    const handleSetOpeningBalance = () => {
        cartStore.setOpeningBalance(openingBalanceInput);
        open = false; // Close dialog on save
    };
</script>

<Dialog.Root bind:open>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Cash Drawer Management</Dialog.Title>
            <Dialog.Description>
                Set the opening balance for the cash drawer at the start of a shift.
            </Dialog.Description>
        </Dialog.Header>

        <div class="py-4 space-y-4">
            <div>
                <h3 class="font-medium">Current State</h3>
                <p>Opening Balance: {numberWithCurrency(cartStore.openingBalance)}</p>
                <p>Cash Sales: {numberWithCurrency(cartStore.cashSalesTotal)}</p>
                <p>Expected in Drawer: {numberWithCurrency(cartStore.expectedCashInDrawer)}</p>
            </div>
            <div class="space-y-2">
                <Label for="opening-balance">Set New Opening Balance</Label>
                <Input id="opening-balance" type="number" bind:value={openingBalanceInput} />
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={() => open = false}>Cancel</Button>
            <Button onclick={handleSetOpeningBalance}>Set Balance & Start New Shift</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
