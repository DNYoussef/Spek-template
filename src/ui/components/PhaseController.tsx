/**
 * PhaseController Component
 * Unified control interface for all Agent Forge phases
 */

import React from 'react';
import { PhaseStatus } from '../types/phases';

interface PhaseControllerProps {
  status: PhaseStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const PhaseController: React.FC<PhaseControllerProps> = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop
}) => {
  return (
    <div className="phase-controller" data-testid="phase-controller">
      <div className="status-indicator">
        <div className={`status-dot status-${status}`} data-testid="status-indicator" />
        <span className="status-text">{status.toUpperCase()}</span>
      </div>

      <div className="control-buttons">
        {status === 'idle' && (
          <button
            className="control-btn start-btn"
            onClick={onStart}
            data-testid="start-button"
          >
            Start
          </button>
        )}

        {status === 'running' && (
          <>
            <button
              className="control-btn pause-btn"
              onClick={onPause}
              data-testid="pause-button"
            >
              Pause
            </button>
            <button
              className="control-btn stop-btn"
              onClick={onStop}
              data-testid="stop-button"
            >
              Stop
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              className="control-btn resume-btn"
              onClick={onResume}
              data-testid="resume-button"
            >
              Resume
            </button>
            <button
              className="control-btn stop-btn"
              onClick={onStop}
              data-testid="stop-button"
            >
              Stop
            </button>
          </>
        )}
      </div>

      <style>{`
        .phase-controller {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-dot.status-idle {
          background: #999;
          animation: none;
        }

        .status-dot.status-running {
          background: #00cc00;
        }

        .status-dot.status-paused {
          background: #ffaa00;
          animation: none;
        }

        .status-dot.status-completed {
          background: #0066cc;
          animation: none;
        }

        .status-dot.status-error {
          background: #cc0000;
          animation: none;
        }

        .status-text {
          font-weight: 600;
          color: #333;
          letter-spacing: 0.5px;
        }

        .control-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .control-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .control-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .control-btn:active {
          transform: translateY(0);
        }

        .start-btn, .resume-btn {
          background: #00cc00;
          color: white;
        }

        .start-btn:hover, .resume-btn:hover {
          background: #00aa00;
        }

        .pause-btn {
          background: #ffaa00;
          color: white;
        }

        .pause-btn:hover {
          background: #ff9900;
        }

        .stop-btn {
          background: #cc0000;
          color: white;
        }

        .stop-btn:hover {
          background: #aa0000;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};