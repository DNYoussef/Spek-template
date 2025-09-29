/**
 * Transaction Manager Component
 * NASA Rule 10 Compliant: Bounded transaction operations
 */

import { EventEmitter } from 'events';
import { Transaction, StateOperation } from '../types/StateStoreTypes';

export class TransactionManager extends EventEmitter {
  private activeTransactions: Map<string, Transaction> = new Map();
  private maxTransactionTime: number;
  private maxConcurrentTransactions: number;

  constructor(
    maxTransactionTime: number = 30000, // 30 seconds
    maxConcurrentTransactions: number = 10
  ) {
    super();
    console.assert(maxTransactionTime > 0, 'Max transaction time must be positive');
    console.assert(maxConcurrentTransactions > 0, 'Max concurrent transactions must be positive');

    this.maxTransactionTime = maxTransactionTime;
    this.maxConcurrentTransactions = maxConcurrentTransactions;
  }

  async beginTransaction(
    isolationLevel: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable' = 'read_committed'
  ): Promise<string> {
    console.assert(isolationLevel != null, 'Isolation level required');

    if (this.activeTransactions.size >= this.maxConcurrentTransactions) {
      throw new Error('Maximum concurrent transactions reached');
    }

    const transactionId = this.generateTransactionId();
    const transaction: Transaction = {
      id: transactionId,
      operations: [],
      status: 'pending',
      timestamp: new Date(),
      isolationLevel
    };

    this.activeTransactions.set(transactionId, transaction);
    this.scheduleTransactionTimeout(transactionId);

    this.emit('transaction_started', { transactionId, isolationLevel });
    return transactionId;
  }

  addOperation(transactionId: string, operation: StateOperation): boolean {
    console.assert(transactionId != null && operation != null, 'Transaction ID and operation required');

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      this.emit('transaction_not_found', { transactionId });
      return false;
    }

    if (transaction.status !== 'pending') {
      this.emit('transaction_not_pending', { transactionId, status: transaction.status });
      return false;
    }

    transaction.operations.push(operation);
    this.emit('operation_added', { transactionId, operation });
    return true;
  }

  async commitTransaction(transactionId: string): Promise<boolean> {
    console.assert(transactionId != null, 'Transaction ID required');

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      this.emit('transaction_not_found', { transactionId });
      return false;
    }

    if (transaction.status !== 'pending') {
      this.emit('transaction_not_pending', { transactionId, status: transaction.status });
      return false;
    }

    try {
      transaction.status = 'committed';
      this.emit('transaction_committed', { transactionId, operationCount: transaction.operations.length });
      this.activeTransactions.delete(transactionId);
      return true;
    } catch (error) {
      await this.rollbackTransaction(transactionId);
      this.emit('commit_failed', { transactionId, error });
      return false;
    }
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    console.assert(transactionId != null, 'Transaction ID required');

    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      this.emit('transaction_not_found', { transactionId });
      return false;
    }

    transaction.status = 'rolled_back';
    this.emit('transaction_rolled_back', { transactionId, operationCount: transaction.operations.length });
    this.activeTransactions.delete(transactionId);
    return true;
  }

  getTransaction(transactionId: string): Transaction | null {
    console.assert(transactionId != null, 'Transaction ID required');
    const transaction = this.activeTransactions.get(transactionId);
    return transaction ? { ...transaction } : null;
  }

  getActiveTransactions(): Transaction[] {
    return Array.from(this.activeTransactions.values()).map(t => ({ ...t }));
  }

  private scheduleTransactionTimeout(transactionId: string): void {
    console.assert(transactionId != null, 'Transaction ID required');

    setTimeout(async () => {
      const transaction = this.activeTransactions.get(transactionId);
      if (transaction && transaction.status === 'pending') {
        await this.rollbackTransaction(transactionId);
        this.emit('transaction_timeout', { transactionId });
      }
    }, this.maxTransactionTime);
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// === AGENT FOOTER ===
// Version & Run Log
// Version History

// Version: 1.0.0

// Receipt
// status: OK
// reason_if_blocked: --
// run_id: memory-terminator-011
// inputs: ["Transaction", "StateOperation"]
// tools_used: ["Write"]
// versions: {"model":"claude-sonnet-4","prompt":"FSM-First-v1.0"}
// === END FOOTER ===