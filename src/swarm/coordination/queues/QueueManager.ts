// Queue management types - stub for TaskDistributor facade
export interface QueueManager {
  enqueue(task: any): void;
  dequeue(): any;
}