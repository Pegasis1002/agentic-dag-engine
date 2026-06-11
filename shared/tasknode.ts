export type TaskStatus = 'pending' | 'completed' | 'running' | 'failed' | 'stopped';

export interface TaskNode {
    id: string;
    label: string;
    status: TaskStatus;
    instruction?: string;
    children?: TaskNode[];
}
