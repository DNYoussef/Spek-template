/**
 * EvoMerge Enhanced Control Interface
 * Phase 2: Evolutionary optimization to merge multiple base models
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PhaseController } from '../components/PhaseController';
import {
  EvoMergeConfig,
  EvoMergeMetrics,
  PhaseStatus,
  MergeTechnique
} from '../types/phases';

interface EvoMergeEnhancedProps {
  pollInterval?: number;
}

const DEFAULT_CONFIG: EvoMergeConfig = {
  generations: 50,
  populationSize: 8,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  mergeTechniques: ['linear', 'slerp', 'ties', 'dare', 'frankenmerge', 'dfs'],
  eliteSize: 2,
  tournamentSize: 3,
  domainWeights: {
    code: 0.25,
    math: 0.25,
    multilingual: 0.25,
    structuredData: 0.25
  }
};

export const EvoMergeEnhanced: React.FC<EvoMergeEnhancedProps> = ({
  pollInterval = 2000
}) => {
  const [config, setConfig] = useState<EvoMergeConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<EvoMergeMetrics | null>(null);
  const [status, setStatus] = useState<PhaseStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics from API
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/phases/evomerge/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch status from API
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/phases/evomerge/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'running') {
        fetchMetrics();
        fetchStatus();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [status, pollInterval, fetchMetrics, fetchStatus]);

  // Phase control handlers
  const handleStart = async () => {
    try {
      const response = await fetch('/api/phases/evomerge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Failed to start phase');
      setStatus('running');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch('/api/phases/evomerge/pause', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to pause phase');
      setStatus('paused');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch('/api/phases/evomerge/resume', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to resume phase');
      setStatus('running');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume');
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/phases/evomerge/stop', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to stop phase');
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop');
    }
  };

  // Config update handlers
  const updateConfig = <K extends keyof EvoMergeConfig>(
    key: K,
    value: EvoMergeConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleMergeTechnique = (technique: MergeTechnique) => {
    setConfig(prev => ({
      ...prev,
      mergeTechniques: prev.mergeTechniques.includes(technique)
        ? prev.mergeTechniques.filter(t => t !== technique)
        : [...prev.mergeTechniques, technique]
    }));
  };

  return (
    <div className="evomerge-enhanced" data-testid="evomerge-enhanced-page">
      <header className="phase-header">
        <h1>Phase 2: EvoMerge - Evolutionary Model Optimization</h1>
        <p>Merge multiple base models using evolutionary techniques for optimal performance</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      {/* Phase Controller */}
      <PhaseController
        status={status}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
      />

      <div className="phase-content">
        {/* Configuration Panel */}
        <section className="config-panel" data-testid="config-panel">
          <h2>Configuration</h2>

          {/* Evolution Settings */}
          <div className="config-section">
            <h3>Evolution Settings</h3>

            <div className="control-group">
              <label htmlFor="generations">
                Generations: {config.generations}
              </label>
              <input
                id="generations"
                type="range"
                min="10"
                max="100"
                value={config.generations}
                onChange={(e) => updateConfig('generations', parseInt(e.target.value))}
                disabled={status === 'running'}
                data-testid="generations-slider"
              />
              <span className="range-labels">
                <span>10</span>
                <span>100</span>
              </span>
            </div>

            <div className="control-group">
              <label htmlFor="population-size">
                Population Size: {config.populationSize}
              </label>
              <input
                id="population-size"
                type="range"
                min="4"
                max="16"
                step="2"
                value={config.populationSize}
                onChange={(e) => updateConfig('populationSize', parseInt(e.target.value))}
                disabled={status === 'running'}
                data-testid="population-size-slider"
              />
              <span className="range-labels">
                <span>4</span>
                <span>16</span>
              </span>
            </div>

            <div className="control-group">
              <label htmlFor="mutation-rate">
                Mutation Rate: {config.mutationRate.toFixed(2)}
              </label>
              <input
                id="mutation-rate"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.mutationRate}
                onChange={(e) => updateConfig('mutationRate', parseFloat(e.target.value))}
                disabled={status === 'running'}
                data-testid="mutation-rate-slider"
              />
              <span className="range-labels">
                <span>0.0</span>
                <span>1.0</span>
              </span>
            </div>

            <div className="control-group">
              <label htmlFor="elite-size">
                Elite Size: {config.eliteSize}
              </label>
              <input
                id="elite-size"
                type="range"
                min="1"
                max="4"
                value={config.eliteSize}
                onChange={(e) => updateConfig('eliteSize', parseInt(e.target.value))}
                disabled={status === 'running'}
                data-testid="elite-size-slider"
              />
              <span className="range-labels">
                <span>1</span>
                <span>4</span>
              </span>
            </div>

            <div className="control-group">
              <label htmlFor="tournament-size">
                Tournament Size: {config.tournamentSize}
              </label>
              <input
                id="tournament-size"
                type="range"
                min="2"
                max="8"
                value={config.tournamentSize}
                onChange={(e) => updateConfig('tournamentSize', parseInt(e.target.value))}
                disabled={status === 'running'}
                data-testid="tournament-size-slider"
              />
              <span className="range-labels">
                <span>2</span>
                <span>8</span>
              </span>
            </div>
          </div>

          {/* Merge Techniques */}
          <div className="config-section">
            <h3>Merge Techniques</h3>
            <div className="technique-checkboxes" data-testid="merge-techniques">
              {(['linear', 'slerp', 'ties', 'dare', 'frankenmerge', 'dfs'] as MergeTechnique[]).map(
                (technique) => (
                  <label key={technique} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.mergeTechniques.includes(technique)}
                      onChange={() => toggleMergeTechnique(technique)}
                      disabled={status === 'running'}
                      data-testid={`technique-${technique}`}
                    />
                    <span className="technique-name">
                      {technique.toUpperCase()}
                    </span>
                  </label>
                )
              )}
            </div>
            {config.mergeTechniques.length < 2 && (
              <div className="validation-warning">
                At least 2 techniques must be selected
              </div>
            )}
          </div>
        </section>

        {/* Metrics Display */}
        <section className="metrics-panel" data-testid="metrics-panel">
          <h2>Real-time Metrics</h2>

          {metrics ? (
            <>
              {/* Current Generation */}
              <div className="metric-card" data-testid="generation-metric">
                <h3>Current Generation</h3>
                <div className="metric-value">{metrics.currentGeneration}</div>
                <div className="metric-subtitle">of {config.generations}</div>
              </div>

              {/* Fitness Metrics */}
              <div className="metric-card" data-testid="fitness-metrics">
                <h3>Fitness Scores</h3>
                <div className="fitness-grid">
                  <div className="fitness-item">
                    <span className="fitness-label">Best:</span>
                    <span className="fitness-value best">
                      {metrics.bestFitness.toFixed(4)}
                    </span>
                  </div>
                  <div className="fitness-item">
                    <span className="fitness-label">Average:</span>
                    <span className="fitness-value avg">
                      {metrics.avgFitness.toFixed(4)}
                    </span>
                  </div>
                  <div className="fitness-item">
                    <span className="fitness-label">Worst:</span>
                    <span className="fitness-value worst">
                      {metrics.worstFitness?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Diversity Score */}
              <div className="metric-card" data-testid="diversity-metric">
                <h3>Population Diversity</h3>
                <div className="diversity-gauge">
                  <div
                    className={`diversity-bar ${metrics.diversityScore < 0.1 ? 'warning' : ''}`}
                    style={{ width: `${metrics.diversityScore * 100}%` }}
                    data-testid="diversity-bar"
                  />
                </div>
                <div className="metric-value">{metrics.diversityScore.toFixed(3)}</div>
                {metrics.diversityScore < 0.1 && (
                  <div className="warning-text">
                    Warning: Low diversity - premature convergence risk
                  </div>
                )}
              </div>

              {/* Pareto Front Visualization */}
              <div className="metric-card pareto-card" data-testid="pareto-front">
                <h3>Pareto Front</h3>
                <div className="pareto-chart">
                  <svg width="400" height="300" viewBox="0 0 400 300">
                    {/* Axes */}
                    <line x1="50" y1="250" x2="350" y2="250" stroke="#333" strokeWidth="2" />
                    <line x1="50" y1="50" x2="50" y2="250" stroke="#333" strokeWidth="2" />

                    {/* Axis labels */}
                    <text x="200" y="280" textAnchor="middle" fill="#666">Performance</text>
                    <text x="20" y="150" textAnchor="middle" fill="#666" transform="rotate(-90 20 150)">
                      Efficiency
                    </text>

                    {/* Data points */}
                    {metrics.paretoFront?.map((point, idx) => (
                      <circle
                        key={idx}
                        cx={50 + point.performance * 300}
                        cy={250 - point.efficiency * 200}
                        r="5"
                        fill={point.isPareto ? '#00ff00' : '#999'}
                        data-testid={`pareto-point-${idx}`}
                      />
                    ))}

                    {/* Pareto line */}
                    {metrics.paretoFront && metrics.paretoFront.length > 1 && (
                      <polyline
                        points={metrics.paretoFront
                          .filter(p => p.isPareto)
                          .sort((a, b) => a.performance - b.performance)
                          .map(p => `${50 + p.performance * 300},${250 - p.efficiency * 200}`)
                          .join(' ')}
                        fill="none"
                        stroke="#00ff00"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )}
                  </svg>
                </div>
              </div>

              {/* Fitness History Chart */}
              <div className="metric-card chart-card" data-testid="fitness-history">
                <h3>Fitness Over Generations</h3>
                <div className="fitness-chart">
                  <svg width="500" height="200" viewBox="0 0 500 200">
                    {/* Chart background */}
                    <rect x="50" y="20" width="400" height="150" fill="#f5f5f5" />

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => (
                      <line
                        key={idx}
                        x1="50"
                        y1={20 + val * 150}
                        x2="450"
                        y2={20 + val * 150}
                        stroke="#ddd"
                        strokeDasharray="3,3"
                      />
                    ))}

                    {/* Fitness lines */}
                    {metrics.fitnessHistory && metrics.fitnessHistory.length > 1 && (
                      <>
                        {/* Best fitness line */}
                        <polyline
                          points={metrics.fitnessHistory
                            .map((gen, idx) => {
                              const x = 50 + (idx / (metrics.fitnessHistory!.length - 1)) * 400;
                              const y = 170 - gen.best * 150;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="#00ff00"
                          strokeWidth="2"
                          data-testid="best-fitness-line"
                        />

                        {/* Average fitness line */}
                        <polyline
                          points={metrics.fitnessHistory
                            .map((gen, idx) => {
                              const x = 50 + (idx / (metrics.fitnessHistory!.length - 1)) * 400;
                              const y = 170 - gen.avg * 150;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="#ffaa00"
                          strokeWidth="2"
                          data-testid="avg-fitness-line"
                        />
                      </>
                    )}

                    {/* Axes */}
                    <line x1="50" y1="170" x2="450" y2="170" stroke="#333" strokeWidth="2" />
                    <line x1="50" y1="20" x2="50" y2="170" stroke="#333" strokeWidth="2" />

                    {/* Legend */}
                    <circle cx="60" cy="195" r="3" fill="#00ff00" />
                    <text x="70" y="198" fontSize="12" fill="#666">Best</text>
                    <circle cx="120" cy="195" r="3" fill="#ffaa00" />
                    <text x="130" y="198" fontSize="12" fill="#666">Average</text>
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="no-metrics" data-testid="no-metrics">
              <p>No metrics available. Start the phase to see real-time data.</p>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .evomerge-enhanced {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .phase-header {
          margin-bottom: 2rem;
        }

        .phase-header h1 {
          font-size: 2rem;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .phase-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .error-banner {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: #c33;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-icon {
          font-weight: bold;
          font-size: 1.2rem;
        }

        .phase-content {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
        }

        .config-panel, .metrics-panel {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .config-section {
          margin-bottom: 2rem;
        }

        .config-section h3 {
          font-size: 1.2rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .control-group {
          margin-bottom: 1.5rem;
        }

        .control-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #555;
        }

        .control-group input[type="range"] {
          width: 100%;
          margin-bottom: 0.25rem;
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #999;
        }

        .technique-checkboxes {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"]:disabled {
          cursor: not-allowed;
        }

        .technique-name {
          font-size: 0.9rem;
          color: #555;
        }

        .validation-warning {
          margin-top: 0.5rem;
          color: #f80;
          font-size: 0.9rem;
        }

        .metrics-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .metric-card {
          background: #f9f9f9;
          border-radius: 6px;
          padding: 1.25rem;
        }

        .metric-card h3 {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 1rem;
        }

        .metric-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #0066cc;
        }

        .metric-subtitle {
          color: #999;
          font-size: 0.95rem;
        }

        .fitness-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .fitness-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .fitness-label {
          font-size: 0.85rem;
          color: #666;
        }

        .fitness-value {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .fitness-value.best { color: #00cc00; }
        .fitness-value.avg { color: #ffaa00; }
        .fitness-value.worst { color: #cc0000; }

        .diversity-gauge {
          width: 100%;
          height: 24px;
          background: #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .diversity-bar {
          height: 100%;
          background: linear-gradient(90deg, #00cc00, #00ff00);
          transition: width 0.3s ease;
        }

        .diversity-bar.warning {
          background: linear-gradient(90deg, #ff6600, #ffaa00);
        }

        .warning-text {
          color: #f80;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .pareto-chart, .fitness-chart {
          margin-top: 1rem;
        }

        .chart-card {
          grid-column: 1 / -1;
        }

        .no-metrics {
          text-align: center;
          padding: 3rem;
          color: #999;
        }

        @media (max-width: 1200px) {
          .phase-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};