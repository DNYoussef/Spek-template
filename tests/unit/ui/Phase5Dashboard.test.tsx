/**
 * Phase 5 Dashboard Tests
 * Tests for metrics sections, edge-of-chaos gauge, self-modeling heatmap, and dream cycle quality
 */

import React from 'react';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Phase5Dashboard } from '../../../src/pages/Phase5Dashboard';
const { cleanupTestResources } = require('../../setup/test-environment');

const mockDashboardData = {
  edgeOfChaos: {
    criticality: 0.85,
    lambda: 0.72,
    phase: 'critical'
  },
  selfModeling: {
    predictions: [
      [0.1, 0.2, 0.3],
      [0.4, 0.5, 0.6],
      [0.7, 0.8, 0.9]
    ],
    accuracy: 0.87
  },
  dreamCycle: {
    buffer: [
      { experience_id: 1, quality: 0.9, timestamp: '2024-01-01T00:00:00Z' },
      { experience_id: 2, quality: 0.7, timestamp: '2024-01-01T00:01:00Z' }
    ],
    avg_quality: 0.8
  },
  weightTrajectory: {
    steps: [0, 100, 200, 300],
    weights: [0.1, 0.3, 0.6, 0.9]
  }
};

describe('Phase5Dashboard Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(async () => {
    cleanup();
    jest.restoreAllMocks();
    await cleanupTestResources();
  });

  describe('Metrics Sections Rendering', () => {
    it('should render all four main metrics sections', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('edge-of-chaos-section')).toBeInTheDocument();
        expect(screen.getByTestId('self-modeling-section')).toBeInTheDocument();
        expect(screen.getByTestId('dream-cycle-section')).toBeInTheDocument();
        expect(screen.getByTestId('weight-trajectory-section')).toBeInTheDocument();
      });
    });

    it('should render section titles correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Edge-of-Chaos Controller')).toBeInTheDocument();
        expect(screen.getByText('Self-Modeling')).toBeInTheDocument();
        expect(screen.getByText('Dream Cycle Buffer')).toBeInTheDocument();
        expect(screen.getByText('Weight Trajectory')).toBeInTheDocument();
      });
    });

    it('should handle missing sections gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          edgeOfChaos: mockDashboardData.edgeOfChaos
          // Other sections missing
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('edge-of-chaos-section')).toBeInTheDocument();
        expect(screen.queryByTestId('self-modeling-section')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge-of-Chaos Gauge Calculations', () => {
    it('should calculate gauge position correctly for criticality', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const gauge = screen.getByTestId('criticality-gauge');
        const needle = within(gauge).getByTestId('gauge-needle');
        // 0.85 criticality = 85% rotation (0-180 degrees) = 153 degrees
        expect(needle).toHaveStyle({ transform: 'rotate(153deg)' });
      });
    });

    it('should handle minimum criticality (0)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          edgeOfChaos: { ...mockDashboardData.edgeOfChaos, criticality: 0 }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const needle = screen.getByTestId('gauge-needle');
        expect(needle).toHaveStyle({ transform: 'rotate(0deg)' });
      });
    });

    it('should handle maximum criticality (1)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          edgeOfChaos: { ...mockDashboardData.edgeOfChaos, criticality: 1.0 }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const needle = screen.getByTestId('gauge-needle');
        expect(needle).toHaveStyle({ transform: 'rotate(180deg)' });
      });
    });

    it('should clamp values > 1.0', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          edgeOfChaos: { ...mockDashboardData.edgeOfChaos, criticality: 1.5 }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const needle = screen.getByTestId('gauge-needle');
        expect(needle).toHaveStyle({ transform: 'rotate(180deg)' });
      });
    });

    it('should color-code gauge zones correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const gauge = screen.getByTestId('criticality-gauge');
        // criticality 0.85 should be in "critical" zone (red)
        expect(gauge).toHaveClass('gauge-critical');
      });
    });

    it('should display lambda value correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(' = 0.720')).toBeInTheDocument();
      });
    });
  });

  describe('Self-Modeling Heatmap Generation', () => {
    it('should generate heatmap with correct dimensions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const heatmap = screen.getByTestId('self-modeling-heatmap');
        const cells = within(heatmap).getAllByTestId(/heatmap-cell-/);
        expect(cells).toHaveLength(9); // 3x3 matrix
      });
    });

    it('should apply correct color intensity based on values', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const cell_0_0 = screen.getByTestId('heatmap-cell-0-0');
        const cell_2_2 = screen.getByTestId('heatmap-cell-2-2');

        // Cell with value 0.1 should be lighter than cell with 0.9
        const opacity_0_0 = parseFloat(cell_0_0.style.opacity || '1');
        const opacity_2_2 = parseFloat(cell_2_2.style.opacity || '1');

        expect(opacity_2_2).toBeGreaterThan(opacity_0_0);
      });
    });

    it('should handle empty predictions array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          selfModeling: { predictions: [], accuracy: 0 }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no predictions available/i)).toBeInTheDocument();
      });
    });

    it('should handle null values in predictions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          selfModeling: {
            predictions: [[0.1, null, 0.3], [null, 0.5, null]],
            accuracy: 0.6
          }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const nullCells = screen.getAllByTestId(/heatmap-cell-.*-null/);
        nullCells.forEach(cell => {
          expect(cell).toHaveClass('heatmap-null');
        });
      });
    });

    it('should display accuracy metric', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Accuracy: 87.0%')).toBeInTheDocument();
      });
    });

    it('should handle non-square matrices', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          selfModeling: {
            predictions: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
            accuracy: 0.75
          }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const cells = screen.getAllByTestId(/heatmap-cell-/);
        expect(cells).toHaveLength(6); // 3x2 matrix
      });
    });
  });

  describe('Dream Cycle Quality Scoring', () => {
    it('should calculate average quality correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Avg Quality: 0.800')).toBeInTheDocument();
      });
    });

    it('should display individual experience quality scores', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q: 0.900')).toBeInTheDocument();
        expect(screen.getByText('Q: 0.700')).toBeInTheDocument();
      });
    });

    it('should handle empty dream buffer', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          dreamCycle: { buffer: [], avg_quality: 0 }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no dream experiences/i)).toBeInTheDocument();
      });
    });

    it('should color-code quality scores', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        const highQuality = screen.getByTestId('experience-1-quality');
        const mediumQuality = screen.getByTestId('experience-2-quality');

        expect(highQuality).toHaveClass('quality-high'); // 0.9
        expect(mediumQuality).toHaveClass('quality-medium'); // 0.7
      });
    });

    it('should handle quality > 1.0', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockDashboardData,
          dreamCycle: {
            buffer: [{ experience_id: 1, quality: 1.5, timestamp: '2024-01-01T00:00:00Z' }],
            avg_quality: 1.5
          }
        })
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q: 1.000')).toBeInTheDocument(); // Clamped
        expect(screen.getByText(/warning: quality exceeds maximum/i)).toBeInTheDocument();
      });
    });

    it('should format timestamps correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDashboardData
      });

      render(<Phase5Dashboard />);

      await waitFor(() => {
        // Check for formatted timestamp display
        expect(screen.getByText(/2024-01-01/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update metrics at 2s intervals', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => mockDashboardData
        });
      });

      render(<Phase5Dashboard pollInterval={2000} />);

      await waitFor(() => expect(callCount).toBe(1));

      await waitFor(() => expect(callCount).toBe(2), { timeout: 2500 });
    });

    it('should stop polling on unmount', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => mockDashboardData
        });
      });

      const { unmount } = render(<Phase5Dashboard pollInterval={1000} />);

      await waitFor(() => expect(callCount).toBe(1));

      unmount();

      const countBeforeWait = callCount;
      await waitFor(() => {
        expect(callCount).toBe(countBeforeWait);
      }, { timeout: 1500 });
    });
  });
});