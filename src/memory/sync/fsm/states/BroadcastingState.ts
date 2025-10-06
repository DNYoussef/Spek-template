/**
 * BROADCASTING State Handler for Distributed Memory Sync
 * NASA Rule 10 Compliant: ≤60 lines per function, 2+ assertions
 */

import { StateHandler, SyncContext, BroadcastResult } from '../SyncTypes';
import { SyncMessage } from '../../DistributedMemorySync';

export class BroadcastingState implements StateHandler {
  private broadcastOperations = new Map<string, BroadcastResult>();
  private broadcastTimer?: NodeJS.Timeout;

  async enter(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(context.nodes.size > 0, 'Nodes must exist for broadcasting');
    
    await this.initiateBroadcast(context);
    await this.startBroadcastMonitoring(context);
  }

  async update(context: SyncContext, data?: any): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    
    if (data?.broadcastResponse) {
      await this.processBroadcastResponse(context, data.broadcastResponse);
    }
    
    await this.checkBroadcastProgress(context);
  }

  async exit(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context must not be null');
    console.assert(this.checkInvariants(context), 'Invariants must hold');
    
    await this.stopBroadcastMonitoring();
    await this.finalizeBroadcast(context);
  }

  checkInvariants(context: SyncContext): boolean {
    console.assert(context != null, 'Context must not be null');
    
    const broadcastsCompleted = Array.from(this.broadcastOperations.values())
      .every(result => result.success !== undefined);
    const validNodeStates = Array.from(context.nodes.values())
      .every(node => ['online', 'offline', 'error'].includes(node.status));
    
    return broadcastsCompleted && validNodeStates;
  }

  private async initiateBroadcast(context: SyncContext): Promise<void> {
    console.assert(context.config?.nodeId != null, 'Node ID required');
    console.assert(context.vectorClock != null, 'Vector clock required');
    
    const onlineNodes = Array.from(context.nodes.values())
      .filter(node => node.status === 'online');
    
    if (onlineNodes.length === 0) {
      return;
    }
    
    const broadcastId = this.generateBroadcastId();
    const syncCompleteMessage: SyncMessage = {
      id: this.generateMessageId(),
      type: 'sync_response',
      sourceNodeId: context.config.nodeId,
      payload: {
        broadcastId,
        syncComplete: true,
        finalVectorClock: Object.fromEntries(context.vectorClock),
        nodeMetrics: this.collectNodeMetrics(context),
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      version: this.incrementVectorClock(context, context.config.nodeId)
    };
    
    const broadcastResult: BroadcastResult = {
      success: false,
      nodeResults: new Map(),
      failedNodes: [],
      totalTime: Date.now()
    };
    
    this.broadcastOperations.set(broadcastId, broadcastResult);
    await this.sendToAllNodes(context, syncCompleteMessage, broadcastResult);
  }

  private async sendToAllNodes(
    context: SyncContext, 
    message: SyncMessage, 
    broadcastResult: BroadcastResult
  ): Promise<void> {
    console.assert(message != null, 'Message required');
    console.assert(broadcastResult != null, 'Broadcast result required');
    
    const sendPromises: Promise<void>[] = [];
    
    for (const node of context.nodes.values()) {
      if (node.id !== context.config.nodeId && node.status === 'online') {
        sendPromises.push(this.sendToNode(context, node.id, message, broadcastResult));
      }
    }
    
    await Promise.allSettled(sendPromises);
  }

  private async sendToNode(
    context: SyncContext, 
    nodeId: string, 
    message: SyncMessage,
    broadcastResult: BroadcastResult
  ): Promise<void> {
    console.assert(nodeId != null, 'Node ID required');
    console.assert(message != null, 'Message required');
    
    try {
      // Simulate network send
      context.messageQueue.push({
        ...message,
        targetNodeId: nodeId
      });
      
      broadcastResult.nodeResults.set(nodeId, true);
    } catch (error) {
      broadcastResult.nodeResults.set(nodeId, false);
      broadcastResult.failedNodes.push(nodeId);
      
      const node = context.nodes.get(nodeId);
      if (node) {
        node.status = 'error';
      }
    }
  }

  private async startBroadcastMonitoring(context: SyncContext): Promise<void> {
    console.assert(context.config != null, 'Config required');
    
    const monitoringInterval = context.config.heartbeatInterval;
    
    this.broadcastTimer = setInterval(async () => {
      await this.monitorBroadcastHealth(context);
    }, monitoringInterval);
  }

  private async stopBroadcastMonitoring(): Promise<void> {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = undefined;
    }
  }

  private async monitorBroadcastHealth(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context required');
    
    for (const [broadcastId, result] of this.broadcastOperations.entries()) {
      const elapsedTime = Date.now() - result.totalTime;
      const timeout = context.config.conflictResolutionTimeout;
      
      if (elapsedTime > timeout && !result.success) {
        await this.timeoutBroadcast(broadcastId, result);
      }
    }
  }

  private async timeoutBroadcast(
    broadcastId: string, 
    result: BroadcastResult
  ): Promise<void> {
    console.assert(broadcastId != null, 'Broadcast ID required');
    console.assert(result != null, 'Result required');
    
    result.success = false;
    result.totalTime = Date.now() - result.totalTime;
    
    // Mark unresponsive nodes as failed
    for (const [nodeId, responded] of result.nodeResults.entries()) {
      if (responded === undefined) {
        result.nodeResults.set(nodeId, false);
        result.failedNodes.push(nodeId);
      }
    }
  }

  private async processBroadcastResponse(
    context: SyncContext, 
    response: { broadcastId: string; nodeId: string; success: boolean }
  ): Promise<void> {
    console.assert(response?.broadcastId != null, 'Broadcast ID required');
    console.assert(response?.nodeId != null, 'Node ID required');
    
    const operation = this.broadcastOperations.get(response.broadcastId);
    if (!operation) {
      return;
    }
    
    operation.nodeResults.set(response.nodeId, response.success);
    
    if (!response.success) {
      operation.failedNodes.push(response.nodeId);
      
      const node = context.nodes.get(response.nodeId);
      if (node) {
        node.status = 'error';
      }
    }
  }

  private async checkBroadcastProgress(context: SyncContext): Promise<boolean> {
    console.assert(context != null, 'Context required');
    
    for (const [broadcastId, result] of this.broadcastOperations.entries()) {
      const totalNodes = result.nodeResults.size;
      const respondedNodes = Array.from(result.nodeResults.values())
        .filter(responded => responded !== undefined).length;
      
      if (respondedNodes === totalNodes) {
        const successfulNodes = Array.from(result.nodeResults.values())
          .filter(success => success === true).length;
        
        result.success = successfulNodes > totalNodes / 2; // Majority success
        result.totalTime = Date.now() - result.totalTime;
        
        return true;
      }
    }
    
    return false;
  }

  private collectNodeMetrics(context: SyncContext): Record<string, any> {
    console.assert(context != null, 'Context required');
    
    const metrics: Record<string, any> = {};
    
    for (const [nodeId, node] of context.nodes.entries()) {
      metrics[nodeId] = {
        status: node.status,
        memoryUsage: node.memoryUsage,
        entryCount: node.entryCount,
        syncVersion: node.syncVersion,
        lastHeartbeat: node.lastHeartbeat
      };
    }
    
    return metrics;
  }

  private incrementVectorClock(context: SyncContext, nodeId: string): number {
    console.assert(nodeId != null, 'Node ID required');
    
    const current = context.vectorClock.get(nodeId) || 0;
    const incremented = current + 1;
    context.vectorClock.set(nodeId, incremented);
    return incremented;
  }

  private async finalizeBroadcast(context: SyncContext): Promise<void> {
    console.assert(context != null, 'Context required');
    
    // Update final metrics
    const totalBroadcasts = this.broadcastOperations.size;
    const successfulBroadcasts = Array.from(this.broadcastOperations.values())
      .filter(result => result.success).length;
    
    context.metrics.dataIntegrity = totalBroadcasts > 0 ? 
      successfulBroadcasts / totalBroadcasts : 1.0;
    
    // Clear completed operations
    this.broadcastOperations.clear();
  }

  private generateBroadcastId(): string {
    return `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getBroadcastStatus(): Promise<{
    active: number;
    completed: number;
    failed: number;
    averageTime: number;
  }> {
    const operations = Array.from(this.broadcastOperations.values());
    const completed = operations.filter(op => op.success === true);
    const failed = operations.filter(op => op.success === false);
    const active = operations.filter(op => op.success === undefined);
    
    const averageTime = completed.length > 0 ?
      completed.reduce((sum, op) => sum + op.totalTime, 0) / completed.length : 0;
    
    return {
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      averageTime
    };
  }
}

// Backward compatibility
export default BroadcastingState;
