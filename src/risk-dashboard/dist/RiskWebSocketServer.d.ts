/**
 * Risk WebSocket Server
 * Provides real-time risk data streaming for the dashboard
 */
import { EventEmitter } from 'events';
/**
 * WebSocket server for real-time risk data streaming
 */
export declare class RiskWebSocketServer extends EventEmitter {
    private port;
    private server;
    private clients;
    private dataGeneratorInterval;
    private healthCheckInterval;
    private isRunning;
    private riskDataState;
    constructor(port?: number);
    /**
     * Start the WebSocket server and data generation
     */
    start(): void;
    /**
     * Stop the WebSocket server
     */
    stop(): void;
    /**
     * Setup WebSocket server event handlers
     */
    private setupServerHandlers;
    /**
     * Setup individual client event handlers
     */
    private setupClientHandlers;
    /**
     * Handle messages from clients
     */
    private handleClientMessage;
    /**
     * Handle configuration updates from clients
     */
    private handleConfigUpdate;
    /**
     * Start generating and broadcasting risk data
     */
    private startDataGeneration;
    /**
     * Generate simulated risk data
     */
    private generateRiskData;
    /**
     * Broadcast risk update to all connected clients
     */
    private broadcastRiskUpdate;
    /**
     * Send risk update to specific client
     */
    private sendRiskUpdate;
    /**
     * Send message to specific client
     */
    private sendToClient;
    /**
     * Send error message to client
     */
    private sendError;
    /**
     * Start health checks for connected clients
     */
    private startHealthChecks;
    /**
     * Generate client ID
     */
    private generateClientId;
    /**
     * Generate normal random number (Box-Muller transformation)
     */
    private generateNormalRandom;
    /**
     * Get server statistics
     */
    getServerStats(): {
        isRunning: boolean;
        connectedClients: number;
        port: number;
        uptime: number;
        dataPoints: {
            returns: number;
            equity: number;
        };
        currentPortfolioValue: number;
    };
    /**
     * Get connected clients info
     */
    getConnectedClients(): {
        id: string;
        subscriptions: string[];
        lastPing: number;
        connected: boolean;
    }[];
}
/**
 * Factory function to create and start risk WebSocket server
 */
export declare const createRiskWebSocketServer: (port?: number) => RiskWebSocketServer;
export default RiskWebSocketServer;
//# sourceMappingURL=RiskWebSocketServer.d.ts.map