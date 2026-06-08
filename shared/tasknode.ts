export type TaskStatus = 'pending' | 'completed' | 'running' | 'failed' | 'stopped';

interface TaskNode {
    id: string;
    label: string;
    status: TaskStatus;
    children?: TaskNode[];
}
