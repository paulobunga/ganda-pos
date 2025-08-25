<script lang="ts">
    import { roadmapData } from '$lib/roadmap';
    import { roadmapStore } from '$lib/roadmapStore';
    import * as Card from '$lib/components/ui/card/index.js';
    // import { Checkbox } from '$lib/components/ui/checkbox/index.js'; // Removed
    import { Label } from '$lib/components/ui/label/index.js';
    import { CheckCircle2, Circle } from 'lucide-svelte';

    // Helper function to calculate phase completion
    const getPhaseProgress = (phase) => {
        const completedTasks = phase.tasks.filter(task => roadmapStore.isComplete(task.id)).length;
        const totalTasks = phase.tasks.length;
        return { completedTasks, totalTasks };
    };
</script>

<div class="container mx-auto p-4 sm:p-8">
    <header class="mb-8">
        <h1 class="text-4xl font-bold tracking-tight">Project Roadmap</h1>
        <p class="text-muted-foreground mt-2">
            A checklist of features to track our implementation progress.
        </p>
    </header>

    <div class="space-y-8">
        {#each roadmapData as phase, i}
            {@const progress = getPhaseProgress(phase)}
            <Card.Root>
                <Card.Header>
                    <Card.Title class="flex items-center gap-3">
                        {#if progress.completedTasks === progress.totalTasks}
                           <CheckCircle2 class="h-8 w-8 text-green-500" />
                        {:else}
                            <div class="relative">
                                <Circle class="h-8 w-8 text-muted-foreground" />
                                <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold">{i + 1}</span>
                            </div>
                        {/if}
                        <div>
                            {phase.title}
                            <p class="text-sm font-normal text-muted-foreground">{phase.subtitle}</p>
                        </div>
                    </Card.Title>
                    <Card.Description>
                        Progress: {progress.completedTasks} / {progress.totalTasks} tasks complete
                    </Card.Description>
                </Card.Header>
                <Card.Content class="space-y-4 pl-12">
                    {#each phase.tasks as task}
                        <div class="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id={task.id}
                                checked={roadmapStore.isComplete(task.id)}
                                on:click={() => roadmapStore.toggleTask(task.id)}
                                class="h-5 w-5"
                            />
                            <Label
                                for={task.id}
                                class="text-lg cursor-pointer {roadmapStore.isComplete(task.id) ? 'text-muted-foreground line-through' : ''}"
                            >
                                {task.title}
                            </Label>
                        </div>
                    {/each}
                </Card.Content>
            </Card.Root>
        {/each}
    </div>
</div>
