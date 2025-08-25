<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Staff } from '$lib/db';
	import { sessionStore } from '$lib/sessionStore';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import bcrypt from 'bcrypt';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	let staffList = $state<Staff[]>([]);
	let selectedStaffId = $state<string | null>(null);
	let pin = $state('');
	let isLoading = $state(false);

	onMount(async () => {
		staffList = await db.staff.toArray();
		// If there are no staff, redirect to admin to create one
		if (staffList.length === 0) {
			toast.info('No staff found. Please create an admin user.');
			goto('/admin');
		}
	});

	async function handleLogin() {
		if (!selectedStaffId || pin.length !== 4) {
			toast.error('Please select a user and enter a 4-digit PIN.');
			return;
		}
		isLoading = true;
		const selectedStaff = staffList.find((s) => s.id === selectedStaffId);
		if (!selectedStaff) {
			toast.error('Selected staff member not found.');
			isLoading = false;
			return;
		}

		const pinMatch = await bcrypt.compare(pin, selectedStaff.pin);

		if (pinMatch) {
			// In a real app, we'd start a shift here and get a shiftId
			// For now, we'll use a placeholder shiftId
			const placeholderShiftId = 'active_shift';
			sessionStore.login(selectedStaff, placeholderShiftId);
			toast.success(`Welcome, ${selectedStaff.name}!`);
			goto('/pos/cashier');
		} else {
			toast.error('Invalid PIN');
			pin = '';
		}
		isLoading = false;
	}

	function handleUserSelect(staffId: string) {
		selectedStaffId = staffId;
		pin = '';
	}

	function appendPin(digit: string) {
		if (pin.length < 4) {
			pin += digit;
		}
	}

	function clearPin() {
		pin = '';
	}

	function backspace() {
		pin = pin.slice(0, -1);
	}
</script>

<div class="flex h-screen w-full items-center justify-center bg-muted">
	<div class="w-full max-w-md rounded-lg bg-card p-8 shadow-lg">
		{#if !selectedStaffId}
			<h1 class="text-2xl font-bold text-center mb-6">Select User</h1>
			<div class="grid grid-cols-2 gap-4">
				{#each staffList as staff}
					<Button variant="outline" class="h-20 text-lg" onclick={() => handleUserSelect(staff.id)}>
						{staff.name}
					</Button>
				{/each}
			</div>
		{:else}
			<div class="text-center">
				<Button variant="ghost" class="mb-4" onclick={() => selectedStaffId = null}>&larr; Back to users</Button>
				<h1 class="text-2xl font-bold mb-2">
					Welcome, {staffList.find((s) => s.id === selectedStaffId)?.name}
				</h1>
				<p class="text-muted-foreground mb-6">Enter your 4-digit PIN</p>
				<Input
					type="password"
					class="text-center text-2xl tracking-[1em] h-14 w-48 mx-auto"
					bind:value={pin}
					readonly
				/>

				<div class="grid grid-cols-3 gap-2 mt-6 max-w-xs mx-auto">
					{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as digit}
						<Button
							variant="outline"
							class="h-16 text-xl font-medium"
							onclick={() => appendPin(digit.toString())}
						>
							{digit}
						</Button>
					{/each}
					<Button variant="outline" class="h-16 text-xl font-medium" onclick={clearPin}>C</Button>
					<Button
						variant="outline"
						class="h-16 text-xl font-medium"
						onclick={() => appendPin('0')}
					>
						0
					</Button>
					<Button variant="outline" class="h-16 text-xl font-medium" onclick={backspace}>←</Button>
				</div>
				<Button class="w-full mt-6" onclick={handleLogin} disabled={isLoading || pin.length !== 4}>
					{isLoading ? 'Logging in...' : 'Login'}
				</Button>
			</div>
		{/if}
	</div>
</div>
