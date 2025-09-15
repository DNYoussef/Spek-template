#!/usr/bin/env node
/**
 * Risk Dashboard Server Entry Point
 * Starts the WebSocket server and serves the risk monitoring dashboard
 */

import { createRiskWebSocketServer } from './RiskWebSocketServer';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const WS_PORT = parseInt(process.env.RISK_WS_PORT || '8080');
const HTTP_PORT = parseInt(process.env.RISK_HTTP_PORT || '3000');
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start Risk Monitoring Dashboard Server
 */
async function startRiskDashboardServer() {
  console.log(' Starting GaryTaleb Risk Monitoring Dashboard Server...');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`WebSocket Port: ${WS_PORT}`);
  console.log(`HTTP Port: ${HTTP_PORT}`);
  console.log('='.repeat(60));
  
  try {
    // Start WebSocket server for real-time data
    console.log(' Starting WebSocket server...');
    const wsServer = createRiskWebSocketServer(WS_PORT);
    
    // Setup WebSocket server event handlers
    wsServer.on('started', () => {
      console.log(' WebSocket server started successfully');
    });
    
    wsServer.on('clientConnected', ({ clientId, clientIp }) => {
      console.log(` Client connected: ${clientId} (${clientIp})`);
    });
    
    wsServer.on('clientDisconnected', ({ clientId, code, reason }) => {
      console.log(` Client disconnected: ${clientId} (${code}: ${reason})`);
    });
    
    wsServer.on('healthCheck', ({ connectedClients }) => {
      if (connectedClients > 0) {
        console.log(` Health check: ${connectedClients} connected clients`);
      }
    });
    
    wsServer.on('error', (error) => {
      console.error(' WebSocket server error:', error);
    });
    
    // Start HTTP server for dashboard UI (if in development)
    if (NODE_ENV === 'development') {
      console.log(' Starting development HTTP server...');
      const app = express();
      
      // Serve static files
      app.use(express.static(path.join(__dirname, 'public')));
      
      // API endpoints
      app.get('/api/status', (req, res) => {
        const stats = wsServer.getServerStats();
        const clients = wsServer.getConnectedClients();
        
        res.json({
          status: 'running',
          server: stats,
          clients,
          timestamp: Date.now()
        });
      });
      
      app.get('/api/health', (req, res) => {
        res.json({
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: Date.now()
        });
      });
      
      // Serve dashboard HTML
      app.get('/', (req, res) => {
        res.send(generateDashboardHTML());
      });
      
      app.listen(HTTP_PORT, () => {
        console.log(` HTTP server started on port ${HTTP_PORT}`);
        console.log(`Dashboard: http://localhost:${HTTP_PORT}`);
      });
    }
    
    console.log('\n Risk Monitoring Dashboard Server is running!');
    console.log(`WebSocket: ws://localhost:${WS_PORT}`);
    if (NODE_ENV === 'development') {
      console.log(`Dashboard: http://localhost:${HTTP_PORT}`);
    }
    console.log('\nPress Ctrl+C to stop the server');
    
  } catch (error) {
    console.error(' Failed to start Risk Dashboard Server:', error);
    process.exit(1);
  }
}

/**
 * Generate basic dashboard HTML for development
 */
function generateDashboardHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GaryTaleb Risk Monitoring Dashboard</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/recharts@2.8.0/umd/Recharts.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        .risk-critical { background-color: #dc2626; color: white; }
        .risk-high { background-color: #ea580c; color: white; }
        .risk-medium { background-color: #d97706; color: white; }
        .risk-low { background-color: #65a30d; color: white; }
        .connecting { opacity: 0.6; }
    </style>
</head>
<body class="bg-gray-100">
    <div id="root">
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div class="text-lg font-semibold text-gray-700">Loading Risk Dashboard...</div>
            </div>
        </div>
    </div>

    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        
        function RiskDashboard() {
            const [wsConnection, setWsConnection] = useState(null);
            const [connectionStatus, setConnectionStatus] = useState('connecting');
            const [riskData, setRiskData] = useState(null);
            const [alerts, setAlerts] = useState([]);
            const [performance, setPerformance] = useState({
                updateLatency: 0,
                calculationTime: 0,
                renderTime: 0
            });
            
            const wsRef = useRef(null);
            
            useEffect(() => {
                connectWebSocket();
                return () => {
                    if (wsRef.current) {
                        wsRef.current.close();
                    }
                };
            }, []);
            
            const connectWebSocket = () => {
                const wsUrl = \`ws://localhost:${WS_PORT}\`;
                console.log('Connecting to:', wsUrl);
                
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;
                
                ws.onopen = () => {
                    console.log('Connected to risk data stream');
                    setConnectionStatus('connected');
                    setWsConnection(ws);
                };
                
                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    handleMessage(message);
                };
                
                ws.onclose = () => {
                    console.log('Disconnected from risk data stream');
                    setConnectionStatus('disconnected');
                    setWsConnection(null);
                    // Try to reconnect after 3 seconds
                    setTimeout(connectWebSocket, 3000);
                };
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setConnectionStatus('error');
                };
            };
            
            const handleMessage = (message) => {
                switch (message.type) {
                    case 'connected':
                        console.log('Successfully connected with client ID:', message.clientId);
                        break;
                    case 'risk_update':
                        // Simulate risk calculations (simplified)
                        const { data } = message;
                        const pRuinValue = Math.min(0.20, Math.random() * 0.15); // Simulate P(ruin)
                        const volatility = 0.15 + (Math.random() * 0.10); // 15-25% volatility
                        
                        const simulatedRisk = {
                            pRuin: {
                                value: pRuinValue,
                                confidence: 0.85 + (Math.random() * 0.10),
                                calculationTime: Date.now(),
                                factors: {
                                    portfolioValue: data.portfolioValue || 1000000,
                                    volatility: volatility,
                                    drawdownThreshold: data.drawdownThreshold || 0.20,
                                    timeHorizon: data.timeHorizon || 252
                                }
                            },
                            volatility,
                            sharpeRatio: (Math.random() - 0.5) * 2, // -1 to 1
                            maxDrawdown: Math.random() * 0.15, // 0-15%
                            valueAtRisk: Math.random() * 0.08, // 0-8%
                            timestamp: Date.now()
                        };
                        
                        setRiskData(simulatedRisk);
                        
                        // Generate alerts for high risk
                        if (pRuinValue > 0.05) {
                            const alert = {
                                id: \`alert_\${Date.now()}\`,
                                type: pRuinValue > 0.10 ? 'CRITICAL' : 'HIGH',
                                message: \`High probability of ruin: \${(pRuinValue * 100).toFixed(2)}%\`,
                                metric: 'pRuin',
                                value: pRuinValue,
                                threshold: 0.05,
                                timestamp: Date.now(),
                                acknowledged: false
                            };
                            
                            setAlerts(prev => {
                                const newAlerts = [alert, ...prev.slice(0, 4)]; // Keep last 5 alerts
                                return newAlerts;
                            });
                        }
                        
                        setPerformance({
                            updateLatency: Math.random() * 10 + 5, // 5-15ms
                            calculationTime: Math.random() * 20 + 10, // 10-30ms
                            renderTime: Math.random() * 5 + 2 // 2-7ms
                        });
                        break;
                }
            };
            
            const getConnectionColor = () => {
                switch (connectionStatus) {
                    case 'connected': return 'text-green-600';
                    case 'connecting': return 'text-yellow-600';
                    case 'disconnected': return 'text-red-600';
                    case 'error': return 'text-red-800';
                    default: return 'text-gray-600';
                }
            };
            
            const getRiskLevelColor = (value, thresholds) => {
                if (value >= thresholds.critical) return 'risk-critical';
                if (value >= thresholds.high) return 'risk-high';
                if (value >= thresholds.medium) return 'risk-medium';
                return 'risk-low';
            };
            
            if (!riskData) {
                return (
                    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <div className="text-lg font-semibold text-gray-700">Connecting to Risk Stream...</div>
                            <div className={\`text-sm mt-2 \${getConnectionColor()}\`}>
                                Status: {connectionStatus}
                            </div>
                        </div>
                    </div>
                );
            }
            
            return (
                <div className="min-h-screen bg-gray-100">
                    {/* Header */}
                    <header className="bg-white shadow-sm border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                <div className="flex items-center">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        GaryTaleb Risk Monitor
                                    </h1>
                                    <div className="ml-4 text-sm text-gray-500">
                                        Phase 2 Division 4: Real-Time Risk Monitoring
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-sm">
                                        <div className={\`w-2 h-2 rounded-full mr-2 \${
                                            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                                        }\`}></div>
                                        <span className={getConnectionColor()}>
                                            {connectionStatus}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    {/* Main Dashboard */}
                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="space-y-6">
                            
                            {/* P(ruin) Display */}
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Probability of Ruin</h3>
                                    <div className={\`px-3 py-1 rounded-full text-sm font-medium text-white \${
                                        getRiskLevelColor(riskData.pRuin.value, { critical: 0.10, high: 0.05, medium: 0.02 })
                                    }\`}>
                                        {riskData.pRuin.value >= 0.10 ? 'CRITICAL' : 
                                         riskData.pRuin.value >= 0.05 ? 'HIGH' : 
                                         riskData.pRuin.value >= 0.02 ? 'MEDIUM' : 'LOW'}
                                    </div>
                                </div>
                                
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-bold mb-2 text-red-600">
                                        {(riskData.pRuin.value * 100).toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Confidence: {(riskData.pRuin.confidence * 100).toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-600">Portfolio Value</div>
                                        <div className="font-semibold">
                                            ${riskData.pRuin.factors.portfolioValue.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Volatility</div>
                                        <div className="font-semibold">
                                            {(riskData.pRuin.factors.volatility * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Drawdown Threshold</div>
                                        <div className="font-semibold">
                                            {(riskData.pRuin.factors.drawdownThreshold * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Time Horizon</div>
                                        <div className="font-semibold">
                                            {riskData.pRuin.factors.timeHorizon} days
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Risk Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg shadow-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Volatility</div>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {(riskData.volatility * 100).toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {riskData.sharpeRatio.toFixed(2)}
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
                                    <div className="text-2xl font-bold text-red-600">
                                        {(riskData.maxDrawdown * 100).toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-lg shadow-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Value at Risk</div>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {(riskData.valueAtRisk * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            
                            {/* Alerts and Performance */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Alerts */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Alerts</h3>
                                    {alerts.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="text-2xl mb-2"></div>
                                            <div>No active alerts</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {alerts.map((alert) => (
                                                <div key={alert.id} className={\`border-l-4 p-4 rounded-r-lg bg-white border-\${
                                                    alert.type === 'CRITICAL' ? 'red' : 'orange'
                                                }-500\`}>
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center mb-1">
                                                                <span className={\`px-2 py-1 text-xs font-medium text-white rounded-full mr-2 bg-\${
                                                                    alert.type === 'CRITICAL' ? 'red' : 'orange'
                                                                }-500\`}>
                                                                    {alert.type}
                                                                </span>
                                                                <span className="text-sm font-medium">
                                                                    {alert.metric}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-700">
                                                                {alert.message}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {new Date(alert.timestamp).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Performance */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">System Performance</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-gray-600">Connection</div>
                                            <div className={\`font-medium \${getConnectionColor()}\`}>
                                                {connectionStatus}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-gray-600">Update Latency</div>
                                            <div className="font-medium text-gray-900">
                                                {performance.updateLatency.toFixed(1)}ms
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-gray-600">Calculation Time</div>
                                            <div className="font-medium text-gray-900">
                                                {performance.calculationTime.toFixed(1)}ms
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-gray-600">Render Time</div>
                                            <div className="font-medium text-gray-900">
                                                {performance.renderTime.toFixed(1)}ms
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </main>
                </div>
            );
        }
        
        ReactDOM.render(<RiskDashboard />, document.getElementById('root'));
    </script>
</body>
</html>
  `;
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startRiskDashboardServer();
}

export { startRiskDashboardServer };