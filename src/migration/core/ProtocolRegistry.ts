/**
 * Protocol Registry for managing fallback protocols.
 * NASA Rule 10 compliant: functions ≤60 lines, single responsibility.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger';
import { FallbackProtocol } from './types/FallbackChainTypes';

export class ProtocolRegistry extends EventEmitter {
  private readonly logger: Logger;
  private readonly protocols: Map<string, FallbackProtocol>;
  private readonly maxProtocols = 1000; // NASA Rule 10 - fixed bounds

  constructor() {
    super();
    this.logger = new Logger('ProtocolRegistry');
    this.protocols = new Map();
  }

  /**
   * Register a new protocol.
   * NASA Rule 10 compliant: bounded registration with validation.
   */
  async registerProtocol(protocol: FallbackProtocol): Promise<void> {
    // Check bounds
    if (this.protocols.size >= this.maxProtocols) {
      throw new Error(`Maximum protocols reached: ${this.maxProtocols}`);
    }

    // Validate protocol
    this.validateProtocol(protocol);

    // Check for duplicates
    if (this.protocols.has(protocol.id)) {
      throw new Error(`Protocol already registered: ${protocol.id}`);
    }

    // Register protocol
    this.protocols.set(protocol.id, { ...protocol });

    this.logger.info('Protocol registered', {
      protocolId: protocol.id,
      type: protocol.type,
      priority: protocol.priority
    });

    this.emit('protocolRegistered', protocol);
  }

  /**
   * Unregister a protocol.
   * NASA Rule 10 compliant: safe removal.
   */
  async unregisterProtocol(protocolId: string): Promise<void> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }

    this.protocols.delete(protocolId);

    this.logger.info('Protocol unregistered', { protocolId });
    this.emit('protocolUnregistered', { protocolId });
  }

  /**
   * Get protocol by ID.
   * NASA Rule 10 compliant: simple lookup.
   */
  getProtocol(protocolId: string): FallbackProtocol | undefined {
    return this.protocols.get(protocolId);
  }

  /**
   * Get all available protocols.
   * NASA Rule 10 compliant: safe iteration.
   */
  getAvailableProtocols(): FallbackProtocol[] {
    return Array.from(this.protocols.values());
  }

  /**
   * Get protocols by type.
   * NASA Rule 10 compliant: filtered retrieval.
   */
  getProtocolsByType(type: string): FallbackProtocol[] {
    const filtered: FallbackProtocol[] = [];

    for (const protocol of this.protocols.values()) {
      if (protocol.type === type) {
        filtered.push(protocol);
      }
    }

    return filtered.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get protocol count.
   */
  getProtocolCount(): number {
    return this.protocols.size;
  }

  /**
   * Check if protocol exists.
   */
  hasProtocol(protocolId: string): boolean {
    return this.protocols.has(protocolId);
  }

  /**
   * Validate protocol structure.
   * NASA Rule 10 compliant: input validation.
   */
  private validateProtocol(protocol: FallbackProtocol): void {
    if (!protocol.id || typeof protocol.id !== 'string') {
      throw new Error('Protocol ID is required and must be a string');
    }

    if (!protocol.name || typeof protocol.name !== 'string') {
      throw new Error('Protocol name is required and must be a string');
    }

    if (typeof protocol.priority !== 'number' || protocol.priority < 0) {
      throw new Error('Protocol priority must be a non-negative number');
    }

    const validTypes = ['primary', 'secondary', 'tertiary', 'emergency', 'offline'];
    if (!validTypes.includes(protocol.type)) {
      throw new Error(`Invalid protocol type: ${protocol.type}`);
    }

    if (!protocol.activationCriteria) {
      throw new Error('Protocol activation criteria is required');
    }

    if (!protocol.configuration) {
      throw new Error('Protocol configuration is required');
    }

    this.logger.debug('Protocol validation passed', { protocolId: protocol.id });
  }
}

<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->
## Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-28T14:34:42-04:00 | coder@claude-sonnet-4 | Created protocol registry component | ProtocolRegistry.ts | OK | NASA Rule 10 focused component | 0.00 | 9d2e7f3 |

### Receipt
- status: OK
- reason_if_blocked: --
- run_id: fallback-fsm-refactor-005
- inputs: ["FallbackChainFacade.ts"]
- tools_used: ["Write"]
- versions: {"model":"claude-sonnet-4","prompt":"fsm-component-v1"}
<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->