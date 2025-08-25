import { localStore, type LocalStorageType } from '$lib/localStore.svelte';

// We store the completed task IDs in an array in localStorage,
// but we use a Set in memory for efficient lookups.
const completedTasksFromStorage: LocalStorageType<string[]> = localStore('roadmap.completedTasks', []);

class RoadmapStore {
    completedTasks: Set<string> = $state(new Set(completedTasksFromStorage.current));

    toggleTask = (taskId: string) => {
        const newSet = new Set(this.completedTasks);
        if (newSet.has(taskId)) {
            newSet.delete(taskId);
        } else {
            newSet.add(taskId);
        }
        this.completedTasks = newSet;
        completedTasksFromStorage.current = Array.from(newSet);
    };

    isComplete = (taskId: string): boolean => {
        return this.completedTasks.has(taskId);
    };
}

export const roadmapStore = new RoadmapStore();
