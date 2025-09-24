"""
API Integration Tests for Grokfast Forge
Tests all endpoints with real HTTP requests
"""

import pytest
import requests
import json
from typing import Dict, Any
import time

BASE_URL = "http://localhost:8000"

@pytest.fixture
def api_client():
    """Create API client with proper headers"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    return session

class TestGrokfastMetricsEndpoint:
    """Tests for /api/grokfast/metrics endpoint"""

    def test_metrics_endpoint_response_structure(self, api_client):
        """Verify /api/grokfast/metrics returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")

        assert response.status_code == 200
        data = response.json()

        # Verify required fields
        assert 'gradient_history' in data
        assert 'lambda_progress' in data
        assert 'current_phase' in data
        assert 'metrics' in data

        # Verify data types
        assert isinstance(data['gradient_history'], list)
        assert isinstance(data['lambda_progress'], (int, float))
        assert isinstance(data['current_phase'], str)
        assert isinstance(data['metrics'], dict)

    def test_gradient_history_format(self, api_client):
        """Verify gradient_history has correct structure"""
        response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data = response.json()

        history = data['gradient_history']
        if len(history) > 0:
            first_entry = history[0]
            assert 'step' in first_entry
            assert 'value' in first_entry
            assert isinstance(first_entry['step'], int)
            assert isinstance(first_entry['value'], (int, float))

    def test_lambda_progress_range(self, api_client):
        """Verify lambda_progress is within valid range"""
        response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data = response.json()

        lambda_val = data['lambda_progress']
        assert 0.0 <= lambda_val <= 1.0, f"Lambda {lambda_val} out of range [0, 1]"

    def test_phase_values(self, api_client):
        """Verify current_phase contains valid values"""
        response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data = response.json()

        valid_phases = ['exploration', 'exploitation', 'convergence', 'grokking']
        assert data['current_phase'] in valid_phases

    def test_metrics_fields(self, api_client):
        """Verify metrics dictionary contains expected fields"""
        response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data = response.json()

        metrics = data['metrics']
        expected_fields = ['loss', 'accuracy', 'convergence_rate']

        for field in expected_fields:
            assert field in metrics
            assert isinstance(metrics[field], (int, float, type(None)))


class TestEdgeControllerEndpoint:
    """Tests for /api/forge/edge-controller/status endpoint"""

    def test_edge_controller_response_structure(self, api_client):
        """Verify edge controller status returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/forge/edge-controller/status")

        assert response.status_code == 200
        data = response.json()

        assert 'criticality' in data
        assert 'lambda' in data
        assert 'phase' in data

    def test_criticality_calculation(self, api_client):
        """Verify criticality value is calculated correctly"""
        response = api_client.get(f"{BASE_URL}/api/forge/edge-controller/status")
        data = response.json()

        criticality = data['criticality']
        assert isinstance(criticality, (int, float))
        assert 0.0 <= criticality <= 1.0

    def test_lambda_parameter(self, api_client):
        """Verify lambda parameter is within valid range"""
        response = api_client.get(f"{BASE_URL}/api/forge/edge-controller/status")
        data = response.json()

        lambda_val = data['lambda']
        assert isinstance(lambda_val, (int, float))
        assert 0.0 <= lambda_val <= 1.0

    def test_phase_classification(self, api_client):
        """Verify phase is correctly classified based on criticality"""
        response = api_client.get(f"{BASE_URL}/api/forge/edge-controller/status")
        data = response.json()

        criticality = data['criticality']
        phase = data['phase']

        # Verify phase matches criticality thresholds
        if criticality < 0.3:
            assert phase == 'ordered'
        elif criticality > 0.7:
            assert phase == 'chaotic'
        else:
            assert phase == 'critical'


class TestSelfModelEndpoint:
    """Tests for /api/forge/self-model/predictions endpoint"""

    def test_predictions_response_structure(self, api_client):
        """Verify self-model predictions returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/forge/self-model/predictions")

        assert response.status_code == 200
        data = response.json()

        assert 'predictions' in data
        assert 'accuracy' in data

    def test_predictions_data_shape(self, api_client):
        """Verify predictions array has valid shape"""
        response = api_client.get(f"{BASE_URL}/api/forge/self-model/predictions")
        data = response.json()

        predictions = data['predictions']
        assert isinstance(predictions, list)

        if len(predictions) > 0:
            # Verify it's a 2D array
            assert isinstance(predictions[0], list)

            # All rows should have same length
            row_lengths = [len(row) for row in predictions]
            assert len(set(row_lengths)) == 1, "Inconsistent row lengths"

    def test_prediction_value_ranges(self, api_client):
        """Verify prediction values are within valid range"""
        response = api_client.get(f"{BASE_URL}/api/forge/self-model/predictions")
        data = response.json()

        predictions = data['predictions']
        for row in predictions:
            for value in row:
                if value is not None:
                    assert 0.0 <= value <= 1.0, f"Value {value} out of range"

    def test_accuracy_metric(self, api_client):
        """Verify accuracy metric is valid"""
        response = api_client.get(f"{BASE_URL}/api/forge/self-model/predictions")
        data = response.json()

        accuracy = data['accuracy']
        assert isinstance(accuracy, (int, float))
        assert 0.0 <= accuracy <= 1.0


class TestDreamBufferEndpoint:
    """Tests for /api/forge/dream/buffer endpoint"""

    def test_buffer_response_structure(self, api_client):
        """Verify dream buffer returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")

        assert response.status_code == 200
        data = response.json()

        assert 'buffer' in data
        assert 'avg_quality' in data

    def test_buffer_simulation(self, api_client):
        """Test buffer contains simulated experiences"""
        response = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        data = response.json()

        buffer = data['buffer']
        assert isinstance(buffer, list)

        if len(buffer) > 0:
            experience = buffer[0]
            assert 'experience_id' in experience
            assert 'quality' in experience
            assert 'timestamp' in experience

    def test_experience_quality_range(self, api_client):
        """Verify experience quality scores are valid"""
        response = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        data = response.json()

        buffer = data['buffer']
        for experience in buffer:
            quality = experience['quality']
            assert 0.0 <= quality <= 1.0, f"Quality {quality} out of range"

    def test_average_quality_calculation(self, api_client):
        """Verify average quality is calculated correctly"""
        response = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        data = response.json()

        buffer = data['buffer']
        avg_quality = data['avg_quality']

        if len(buffer) > 0:
            manual_avg = sum(exp['quality'] for exp in buffer) / len(buffer)
            assert abs(manual_avg - avg_quality) < 0.01, "Average quality mismatch"

    def test_timestamp_format(self, api_client):
        """Verify timestamps are in ISO format"""
        response = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        data = response.json()

        buffer = data['buffer']
        for experience in buffer:
            timestamp = experience['timestamp']
            # Should parse as ISO format
            from datetime import datetime
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))


class TestWeightTrajectoryEndpoint:
    """Tests for /api/forge/weight-trajectory endpoint"""

    def test_trajectory_response_structure(self, api_client):
        """Verify weight trajectory returns correct structure"""
        response = api_client.get(f"{BASE_URL}/api/forge/weight-trajectory")

        assert response.status_code == 200
        data = response.json()

        assert 'steps' in data
        assert 'weights' in data

    def test_trajectory_generation(self, api_client):
        """Verify trajectory data is properly generated"""
        response = api_client.get(f"{BASE_URL}/api/forge/weight-trajectory")
        data = response.json()

        steps = data['steps']
        weights = data['weights']

        # Same length
        assert len(steps) == len(weights)

        # Steps should be increasing
        assert all(steps[i] < steps[i+1] for i in range(len(steps)-1))

    def test_weight_value_ranges(self, api_client):
        """Verify weight values are reasonable"""
        response = api_client.get(f"{BASE_URL}/api/forge/weight-trajectory")
        data = response.json()

        weights = data['weights']
        for weight in weights:
            assert isinstance(weight, (int, float))
            # Weights typically between -1 and 1 or 0 and 1
            assert -10.0 <= weight <= 10.0


class TestErrorHandling:
    """Tests for error handling and edge cases"""

    def test_invalid_endpoint(self, api_client):
        """Test 404 for non-existent endpoint"""
        response = api_client.get(f"{BASE_URL}/api/invalid/endpoint")
        assert response.status_code == 404

    def test_malformed_request(self, api_client):
        """Test handling of malformed requests"""
        response = api_client.post(
            f"{BASE_URL}/api/grokfast/metrics",
            data="invalid json{{{",
            headers={'Content-Type': 'application/json'}
        )
        assert response.status_code in [400, 422, 405]

    def test_api_timeout(self, api_client):
        """Test API timeout handling"""
        with pytest.raises(requests.exceptions.Timeout):
            api_client.get(f"{BASE_URL}/api/grokfast/metrics", timeout=0.001)

    def test_api_unreachable(self):
        """Test handling when API is unreachable"""
        with pytest.raises(requests.exceptions.ConnectionError):
            requests.get("http://localhost:9999/api/test", timeout=1)


class TestRealTimeUpdates:
    """Tests for real-time update behavior"""

    def test_metrics_change_over_time(self, api_client):
        """Verify metrics change on subsequent requests"""
        response1 = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data1 = response1.json()

        time.sleep(1)

        response2 = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
        data2 = response2.json()

        # At least some values should change
        assert (data1['lambda_progress'] != data2['lambda_progress'] or
                data1['current_phase'] != data2['current_phase'] or
                len(data1['gradient_history']) != len(data2['gradient_history']))

    def test_buffer_updates(self, api_client):
        """Verify dream buffer updates over time"""
        response1 = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        buffer1 = response1.json()['buffer']

        time.sleep(2)

        response2 = api_client.get(f"{BASE_URL}/api/forge/dream/buffer")
        buffer2 = response2.json()['buffer']

        # Buffer should change (new experiences or updated quality)
        assert buffer1 != buffer2


class TestConcurrentRequests:
    """Tests for concurrent request handling"""

    def test_multiple_simultaneous_requests(self, api_client):
        """Test API handles concurrent requests correctly"""
        import concurrent.futures

        def make_request():
            response = api_client.get(f"{BASE_URL}/api/grokfast/metrics")
            return response.status_code

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All requests should succeed
        assert all(status == 200 for status in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])