// Load balancing types - stub for TaskDistributor facade
export interface LoadBalancingStrategy {
  balance(): void;
}