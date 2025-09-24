/**
 * GrokfastMonitor Component Tests
 * Tests for gradient history, lambda progress, phase badges, and metric formatting
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GrokfastMonitor } from '../../../src/components/GrokfastMonitor';

// Mock API responses
const mockMetricsResponse = {
  gradient_history: [
    { step: 0, value: 0.1 },
    { step: 100, value: 0.5 },
    { step: 200, value: 0.8 }
  ],
  lambda_progress: 0.75,
  current_phase: 'exploration',
  metrics: {
    loss: 0.234,
    accuracy: 0.892,
    convergence_rate: 0.045
  }
};

describe('GrokfastMonitor Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Gradient History Updates', () => {
    it('should render gradient history correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsResponse
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const gradientPoints = screen.getAllByTestId(/gradient-point-/);
        expect(gradientPoints).toHaveLength(3);
      });
    });

    it('should update gradient history on new data', async () => {
      const updatedResponse = {
        ...mockMetricsResponse,
        gradient_history: [
          ...mockMetricsResponse.gradient_history,
          { step: 300, value: 0.95 }
        ]
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetricsResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => updatedResponse });

      render(<GrokfastMonitor pollInterval={100} />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/gradient-point-/)).toHaveLength(3);
      });

      await waitFor(() => {
        expect(screen.getAllByTestId(/gradient-point-/)).toHaveLength(4);
      }, { timeout: 200 });
    });

    it('should handle empty gradient history', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, gradient_history: [] })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText(/no gradient data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Lambda Progress Bar', () => {
    it('should calculate progress bar width correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsResponse
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('lambda-progress-bar');
        expect(progressBar).toHaveStyle({ width: '75%' });
      });
    });

    it('should handle 0% progress', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, lambda_progress: 0 })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('lambda-progress-bar');
        expect(progressBar).toHaveStyle({ width: '0%' });
      });
    });

    it('should handle 100% progress', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, lambda_progress: 1.0 })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('lambda-progress-bar');
        expect(progressBar).toHaveStyle({ width: '100%' });
      });
    });

    it('should clamp values > 100%', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, lambda_progress: 1.5 })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('lambda-progress-bar');
        expect(progressBar).toHaveStyle({ width: '100%' });
      });
    });

    it('should handle negative values gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, lambda_progress: -0.5 })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const progressBar = screen.getByTestId('lambda-progress-bar');
        expect(progressBar).toHaveStyle({ width: '0%' });
      });
    });
  });

  describe('Phase Badge Rendering', () => {
    const phases = ['exploration', 'exploitation', 'convergence', 'grokking'];

    phases.forEach(phase => {
      it(`should render ${phase} phase badge with correct styling`, async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockMetricsResponse, current_phase: phase })
        });

        render(<GrokfastMonitor />);

        await waitFor(() => {
          const badge = screen.getByTestId('phase-badge');
          expect(badge).toHaveTextContent(phase);
          expect(badge).toHaveClass(`phase-${phase}`);
        });
      });
    });

    it('should handle unknown phase gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMetricsResponse, current_phase: 'unknown_phase' })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        const badge = screen.getByTestId('phase-badge');
        expect(badge).toHaveTextContent('unknown_phase');
        expect(badge).toHaveClass('phase-default');
      });
    });
  });

  describe('Metric Display Formatting', () => {
    it('should format decimal metrics to 3 places', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetricsResponse
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText('0.234')).toBeInTheDocument(); // loss
        expect(screen.getByText('0.892')).toBeInTheDocument(); // accuracy
        expect(screen.getByText('0.045')).toBeInTheDocument(); // convergence_rate
      });
    });

    it('should handle very small numbers with scientific notation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockMetricsResponse,
          metrics: { ...mockMetricsResponse.metrics, loss: 0.0000123 }
        })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText('1.23e-5')).toBeInTheDocument();
      });
    });

    it('should handle very large numbers with abbreviation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockMetricsResponse,
          metrics: { ...mockMetricsResponse.metrics, loss: 1234567.89 }
        })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText('1.23M')).toBeInTheDocument();
      });
    });

    it('should handle null metrics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockMetricsResponse,
          metrics: { loss: null, accuracy: null, convergence_rate: null }
        })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getAllByText('N/A')).toHaveLength(3);
      });
    });

    it('should handle undefined metrics', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockMetricsResponse,
          metrics: {}
        })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getAllByText('N/A')).toHaveLength(3);
      });
    });

    it('should handle division by zero', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockMetricsResponse,
          metrics: {
            loss: 5.0,
            accuracy: 0,
            convergence_rate: 5.0 / 0  // Infinity
          }
        })
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText('∞')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText(/error loading metrics/i)).toBeInTheDocument();
      });
    });

    it('should handle malformed JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      render(<GrokfastMonitor />);

      await waitFor(() => {
        expect(screen.getByText(/error parsing response/i)).toBeInTheDocument();
      });
    });

    it('should handle network timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<GrokfastMonitor timeout={50} />);

      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });
});