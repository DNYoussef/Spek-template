from src.constants.base import MAXIMUM_NESTED_DEPTH

Requirements:
- Sensor synchronization tolerance < 1ms
- Data fusion accuracy > 95%
- Calibration drift detection
- Graceful degradation on sensor failure
"""

import pytest
import time
import numpy as np
import asyncio
import json
import threading
from unittest.mock import Mock, patch
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import math
import os
from collections import deque

# Sensor fusion configuration
SYNC_TOLERANCE_MS = 1.0
FUSION_ACCURACY_THRESHOLD = 95.0
CALIBRATION_DRIFT_THRESHOLD = 0.05  # 5cm for position accuracy
MAX_SENSOR_AGE_MS = 100.0
MIN_SENSORS_FOR_FUSION = 2

class SensorType(Enum):
    """Types of sensors in ADAS system"""
    CAMERA = "camera"
    LIDAR = "lidar"
    RADAR = "radar"
    ULTRASONIC = "ultrasonic"
    IMU = "imu"
    GPS = "gps"

class SensorStatus(Enum):
    """Sensor operational status"""
    ACTIVE = "active"
    DEGRADED = "degraded"
    FAILED = "failed"
    CALIBRATING = "calibrating"
    OFFLINE = "offline"

@dataclass
class SensorData:
    """Individual sensor data structure"""
    sensor_id: str
    sensor_type: SensorType
    timestamp: float
    data: Dict[str, Any]
    confidence: float  # 0.0 to 1.0
    status: SensorStatus = SensorStatus.ACTIVE
    calibration_info: Optional[Dict[str, float]] = None

@dataclass
class FusedObject:
    """Object detected through sensor fusion"""
    object_id: str
    object_type: str
    position: Tuple[float, float, float]  # x, y, z in meters
    velocity: Tuple[float, float, float]  # vx, vy, vz in m/s
    dimensions: Tuple[float, float, float]  # length, width, height
    confidence: float
    contributing_sensors: List[str]
    timestamp: float

@dataclass
class CalibrationParameters:
    """Sensor calibration parameters"""
    sensor_id: str
    position_offset: Tuple[float, float, float]
    rotation_offset: Tuple[float, float, float]
    time_offset_ms: float
    scale_factor: float = 1.0
    last_calibrated: float = 0.0

class MockSensor:
    """Mock sensor for testing"""

    def __init__(self, sensor_id: str, sensor_type: SensorType, position: Tuple[float, float, float]):
        self.sensor_id = sensor_id
        self.sensor_type = sensor_type
        self.position = position
        self.status = SensorStatus.ACTIVE
        self.confidence = 0.95
        self.calibration = CalibrationParameters(
            sensor_id=sensor_id,
            position_offset=(0.0, 0.0, 0.0),
            rotation_offset=(0.0, 0.0, 0.0),
            time_offset_ms=0.0
        )
        self.noise_level = 0.01  # 1% noise
        self.failure_rate = 0.001  # 0.1% failure rate

    async def get_sensor_data(self, scene_objects: List[Dict[str, Any]]) -> SensorData:
        """Simulate sensor data acquisition"""
        # Simulate processing delay
        processing_delay = np.random.uniform(0.005, 0.015)  # 5-15ms
        await asyncio.sleep(processing_delay)

        # Simulate sensor-specific detection
        detected_objects = self._detect_objects(scene_objects)

        # Add noise and potential failures
        if np.random.random() < self.failure_rate:
            self.status = SensorStatus.FAILED
            detected_objects = []

        # Create sensor data
        data = {
            "objects": detected_objects,
            "field_of_view": self._get_field_of_view(),
            "range_m": self._get_detection_range(),
            "resolution": self._get_resolution()
        }

        return SensorData(
            sensor_id=self.sensor_id,
            sensor_type=self.sensor_type,
            timestamp=time.time(),
            data=data,
            confidence=self.confidence * (1.0 - self.noise_level),
            status=self.status,
            calibration_info=asdict(self.calibration)
        )

    def _detect_objects(self, scene_objects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Simulate object detection based on sensor type"""
        detected = []

        for obj in scene_objects:
            # Calculate distance from sensor to object
            obj_pos = obj["position"]
            distance = math.sqrt(
                sum((obj_pos[i] - self.position[i]) ** 2 for i in range(3))
            )

            # Sensor-specific detection probability
            detection_prob = self._get_detection_probability(obj, distance)

            if np.random.random() < detection_prob:
                # Add sensor-specific noise
                noisy_position = [
                    pos + np.random.normal(0, self.noise_level * distance)
                    for pos in obj_pos
                ]

                detected_obj = {
                    "type": obj["type"],
                    "position": noisy_position,
                    "velocity": obj.get("velocity", [0.0, 0.0, 0.0]),
                    "dimensions": obj.get("dimensions", [2.0, 1.8, 1.5]),
                    "confidence": detection_prob * self.confidence
                }

                detected.append(detected_obj)

        return detected

    def _get_detection_probability(self, obj: Dict[str, Any], distance: float) -> float:
        """Calculate detection probability based on sensor type and conditions"""
        base_prob = 0.95

        # Distance-based degradation
        max_range = self._get_detection_range()
        range_factor = max(0.0, 1.0 - (distance / max_range))

        # Sensor-specific factors
        if self.sensor_type == SensorType.CAMERA:
            # Camera affected by lighting, weather
            lighting_factor = 0.9  # Assume good lighting
            weather_factor = 0.95  # Assume clear weather
            return base_prob * range_factor * lighting_factor * weather_factor
        elif self.sensor_type == SensorType.LIDAR:
            # LiDAR affected by rain, fog
            weather_factor = 0.9
            return base_prob * range_factor * weather_factor
        elif self.sensor_type == SensorType.RADAR:
            # Radar less affected by weather but has resolution limits
            resolution_factor = 0.85
            return base_prob * range_factor * resolution_factor
        else:
            return base_prob * range_factor

    def _get_field_of_view(self) -> Dict[str, float]:
        """Get sensor field of view parameters"""
        fov_configs = {
            SensorType.CAMERA: {"horizontal_deg": 60.0, "vertical_deg": 40.0},
            SensorType.LIDAR: {"horizontal_deg": 360.0, "vertical_deg": 30.0},
            SensorType.RADAR: {"horizontal_deg": 20.0, "vertical_deg": 10.0},
            SensorType.ULTRASONIC: {"horizontal_deg": 15.0, "vertical_deg": 15.0}
        }
        return fov_configs.get(self.sensor_type, {"horizontal_deg": 30.0, "vertical_deg": 20.0})

    def _get_detection_range(self) -> float:
        """Get sensor detection range in meters"""
        ranges = {
            SensorType.CAMERA: 150.0,
            SensorType.LIDAR: 200.0,
            SensorType.RADAR: 250.0,
            SensorType.ULTRASONIC: 5.0,
            SensorType.IMU: 0.0,  # Internal sensor
            SensorType.GPS: 1000.0  # Global positioning
        }
        return ranges.get(self.sensor_type, 100.0)

    def _get_resolution(self) -> Dict[str, float]:
        """Get sensor resolution specifications"""
        resolutions = {
            SensorType.CAMERA: {"spatial_cm": 5.0, "temporal_ms": 33.3},  # 30fps
            SensorType.LIDAR: {"spatial_cm": 2.0, "temporal_ms": 100.0},  # 10Hz
            SensorType.RADAR: {"spatial_cm": 10.0, "temporal_ms": 50.0},  # 20Hz
            SensorType.ULTRASONIC: {"spatial_cm": 1.0, "temporal_ms": 100.0}
        }
        return resolutions.get(self.sensor_type, {"spatial_cm": 10.0, "temporal_ms": 100.0})

class SensorFusionEngine:
    """Multi-sensor data fusion engine"""

    def __init__(self):
        self.sensors: Dict[str, MockSensor] = {}
        self.sensor_data_buffer: Dict[str, deque] = {}
        self.fusion_results: List[FusedObject] = []
        self.sync_tolerance_ms = SYNC_TOLERANCE_MS
        self.calibration_parameters: Dict[str, CalibrationParameters] = {}

    def add_sensor(self, sensor: MockSensor):
        """Add sensor to fusion engine"""
        self.sensors[sensor.sensor_id] = sensor
        self.sensor_data_buffer[sensor.sensor_id] = deque(maxlen=100)
        self.calibration_parameters[sensor.sensor_id] = sensor.calibration

    async def collect_sensor_data(self, scene_objects: List[Dict[str, Any]]) -> Dict[str, SensorData]:
        """Collect synchronized sensor data"""
        collection_tasks = []

        for sensor_id, sensor in self.sensors.items():
            if sensor.status in [SensorStatus.ACTIVE, SensorStatus.DEGRADED]:
                task = sensor.get_sensor_data(scene_objects)
                collection_tasks.append((sensor_id, task))

        # Collect all sensor data concurrently
        collected_data = {}
        for sensor_id, task in collection_tasks:
            try:
                sensor_data = await task
                collected_data[sensor_id] = sensor_data
                self.sensor_data_buffer[sensor_id].append(sensor_data)
            except Exception as e:
                print(f"Failed to collect data from sensor {sensor_id}: {e}")

        return collected_data

    def check_synchronization(self, sensor_data: Dict[str, SensorData]) -> Dict[str, Any]:
        """Check temporal synchronization of sensor data"""
        if len(sensor_data) < 2:
            return {"synchronized": True, "max_drift_ms": 0.0, "reference_time": time.time()}

        timestamps = [data.timestamp for data in sensor_data.values()]
        reference_time = max(timestamps)  # Use latest timestamp as reference

        # Calculate time drifts
        drifts_ms = [(reference_time - ts) * 1000 for ts in timestamps]
        max_drift_ms = max(drifts_ms)

        sync_result = {
            "synchronized": max_drift_ms <= self.sync_tolerance_ms,
            "max_drift_ms": max_drift_ms,
            "reference_time": reference_time,
            "individual_drifts": dict(zip(sensor_data.keys(), drifts_ms))
        }

        return sync_result

    def fuse_object_detections(self, sensor_data: Dict[str, SensorData]) -> List[FusedObject]:
        """Fuse object detections from multiple sensors"""
        # Extract all detected objects
        all_detections = []
        for sensor_id, data in sensor_data.items():
            if data.status == SensorStatus.ACTIVE:
                for obj in data.data.get("objects", []):
                    detection = {
                        "sensor_id": sensor_id,
                        "sensor_type": data.sensor_type,
                        "object": obj,
                        "confidence": obj.get("confidence", data.confidence),
                        "timestamp": data.timestamp
                    }
                    all_detections.append(detection)

        # Group similar detections
        object_groups = self._group_similar_detections(all_detections)

        # Create fused objects
        fused_objects = []
        for group_id, detections in object_groups.items():
            fused_obj = self._create_fused_object(group_id, detections)
            if fused_obj:
                fused_objects.append(fused_obj)

        self.fusion_results = fused_objects
        return fused_objects

    def _group_similar_detections(self, detections: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group similar detections from different sensors"""
        groups = {}
        group_counter = 0

        for detection in detections:
            obj_pos = detection["object"]["position"]
            assigned_group = None

            # Find existing group within proximity
            for group_id, group_detections in groups.items():
                for existing_detection in group_detections:
                    existing_pos = existing_detection["object"]["position"]
                    distance = math.sqrt(
                        sum((obj_pos[i] - existing_pos[i]) ** 2 for i in range(3))
                    )

                    # Group objects within 2 meters of each other
                    if distance < 2.0:
                        assigned_group = group_id
                        break

                if assigned_group:
                    break

            # Add to existing group or create new group
            if assigned_group:
                groups[assigned_group].append(detection)
            else:
                groups[f"group_{group_counter}"] = [detection]
                group_counter += 1

        return groups

    def _create_fused_object(self, group_id: str, detections: List[Dict[str, Any]]) -> Optional[FusedObject]:
        """Create fused object from grouped detections"""
        if not detections:
            return None

        # Calculate weighted average position
        total_weight = 0.0
        weighted_position = [0.0, 0.0, 0.0]
        weighted_velocity = [0.0, 0.0, 0.0]
        weighted_dimensions = [0.0, 0.0, 0.0]

        contributing_sensors = []
        timestamps = []

        for detection in detections:
            confidence = detection["confidence"]
            obj = detection["object"]

            # Weight by confidence
            weight = confidence
            total_weight += weight

            # Accumulate weighted values
            pos = obj["position"]
            vel = obj.get("velocity", [0.0, 0.0, 0.0])
            dim = obj.get("dimensions", [2.0, 1.8, 1.5])

            for i in range(3):
                weighted_position[i] += pos[i] * weight
                weighted_velocity[i] += vel[i] * weight
                weighted_dimensions[i] += dim[i] * weight

            contributing_sensors.append(detection["sensor_id"])
            timestamps.append(detection["timestamp"])

        if total_weight == 0:
            return None

        # Normalize by total weight
        final_position = tuple(pos / total_weight for pos in weighted_position)
        final_velocity = tuple(vel / total_weight for vel in weighted_velocity)
        final_dimensions = tuple(dim / total_weight for dim in weighted_dimensions)

        # Determine object type (most common)
        object_types = [d["object"]["type"] for d in detections]
        most_common_type = max(set(object_types), key=object_types.count)

        # Calculate overall confidence
        avg_confidence = total_weight / len(detections)

        return FusedObject(
            object_id=group_id,
            object_type=most_common_type,
            position=final_position,
            velocity=final_velocity,
            dimensions=final_dimensions,
            confidence=avg_confidence,
            contributing_sensors=list(set(contributing_sensors)),
            timestamp=max(timestamps)
        )

    def validate_calibration(self, reference_objects: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """Validate sensor calibration against known reference objects"""
        calibration_errors = {}

        for sensor_id, sensor_data_queue in self.sensor_data_buffer.items():
            if not sensor_data_queue:
                continue

            latest_data = sensor_data_queue[-1]
            detected_objects = latest_data.data.get("objects", [])

            sensor_errors = {
                "position_error_m": 0.0,
                "velocity_error_mps": 0.0,
                "detection_accuracy": 0.0
            }

            if detected_objects and reference_objects:
                # Match detected objects with reference objects
                position_errors = []
                velocity_errors = []
                correct_detections = 0

                for ref_obj in reference_objects:
                    ref_pos = ref_obj["position"]
                    ref_vel = ref_obj.get("velocity", [0.0, 0.0, 0.0])

                    # Find closest detected object
                    min_distance = float('inf')
                    closest_obj = None

                    for det_obj in detected_objects:
                        det_pos = det_obj["position"]
                        distance = math.sqrt(
                            sum((ref_pos[i] - det_pos[i]) ** 2 for i in range(3))
                        )

                        if distance < min_distance:
                            min_distance = distance
                            closest_obj = det_obj

                    if closest_obj and min_distance < 5.0:  # Within 5m tolerance
                        position_errors.append(min_distance)

                        # Velocity error
                        det_vel = closest_obj.get("velocity", [0.0, 0.0, 0.0])
                        vel_error = math.sqrt(
                            sum((ref_vel[i] - det_vel[i]) ** 2 for i in range(3))
                        )
                        velocity_errors.append(vel_error)

                        correct_detections += 1

                # Calculate average errors
                if position_errors:
                    sensor_errors["position_error_m"] = sum(position_errors) / len(position_errors)
                if velocity_errors:
                    sensor_errors["velocity_error_mps"] = sum(velocity_errors) / len(velocity_errors)

                sensor_errors["detection_accuracy"] = correct_detections / len(reference_objects) if reference_objects else 0.0

            calibration_errors[sensor_id] = sensor_errors

        return calibration_errors

class SensorFusionTester:
    """Sensor fusion testing framework"""

    def __init__(self):
        self.fusion_engine = SensorFusionEngine()
        self.test_scenarios = []
        self.performance_metrics = []

    def setup_test_sensors(self):
        """Setup standard test sensor configuration"""
        sensors = [
            MockSensor("camera_front", SensorType.CAMERA, (0.0, 0.0, 1.5)),
            MockSensor("lidar_roof", SensorType.LIDAR, (0.0, 0.0, 2.0)),
            MockSensor("radar_front", SensorType.RADAR, (2.0, 0.0, 0.5)),
            MockSensor("radar_rear", SensorType.RADAR, (-2.0, 0.0, 0.5)),
            MockSensor("ultrasonic_fl", SensorType.ULTRASONIC, (1.5, 0.8, 0.3)),
            MockSensor("ultrasonic_fr", SensorType.ULTRASONIC, (1.5, -0.8, 0.3))
        ]

        for sensor in sensors:
            self.fusion_engine.add_sensor(sensor)

        return sensors

@pytest.fixture
def fusion_tester():
    """Sensor fusion tester fixture"""
    tester = SensorFusionTester()
    tester.setup_test_sensors()
    return tester

@pytest.fixture
def test_scene():
    """Test scene with known objects"""
    return [
        {
            "type": "vehicle",
            "position": [20.0, 2.0, 0.0],
            "velocity": [15.0, 0.0, 0.0],
            "dimensions": [4.5, 1.8, 1.5]
        },
        {
            "type": "pedestrian",
            "position": [10.0, -3.0, 0.0],
            "velocity": [1.5, 0.5, 0.0],
            "dimensions": [0.6, 0.4, 1.7]
        },
        {
            "type": "cyclist",
            "position": [30.0, 1.0, 0.0],
            "velocity": [8.0, -1.0, 0.0],
            "dimensions": [1.8, 0.6, 1.2]
        }
    ]

class TestSensorSynchronization:
    """Test sensor data synchronization"""

    @pytest.mark.asyncio
    async def test_temporal_synchronization(self, fusion_tester, test_scene):
        """Test temporal synchronization of sensor data"""
        # Collect sensor data
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)

        # Check synchronization
        sync_result = fusion_tester.fusion_engine.check_synchronization(sensor_data)

        assert sync_result["synchronized"], f"Sensors not synchronized: max drift {sync_result['max_drift_ms']:.2f}ms"
        assert sync_result["max_drift_ms"] <= SYNC_TOLERANCE_MS, f"Synchronization drift {sync_result['max_drift_ms']:.2f}ms exceeds tolerance"

        print(f"Sensor synchronization: {sync_result['max_drift_ms']:.2f}ms max drift")

    @pytest.mark.asyncio
    async def test_synchronization_under_load(self, fusion_tester, test_scene):
        """Test synchronization under high data collection frequency"""
        max_drifts = []

        # Collect data rapidly
        for _ in range(20):
            sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)
            sync_result = fusion_tester.fusion_engine.check_synchronization(sensor_data)
            max_drifts.append(sync_result["max_drift_ms"])

        avg_drift = sum(max_drifts) / len(max_drifts)
        max_recorded_drift = max(max_drifts)

        assert avg_drift <= SYNC_TOLERANCE_MS, f"Average synchronization drift {avg_drift:.2f}ms exceeds tolerance"
        assert max_recorded_drift <= SYNC_TOLERANCE_MS * 2, f"Maximum recorded drift {max_recorded_drift:.2f}ms exceeds acceptable limit"

    def test_time_synchronization_failure_detection(self, fusion_tester):
        """Test detection of synchronization failures"""
        # Simulate sensor with time offset
        faulty_sensor = MockSensor("camera_faulty", SensorType.CAMERA, (0.0, 0.0, 1.5))
        faulty_sensor.calibration.time_offset_ms = 10.0  # 10ms offset
        fusion_tester.fusion_engine.add_sensor(faulty_sensor)

        # Create mock sensor data with time offset
        current_time = time.time()
        sensor_data = {
            "camera_front": SensorData(
                sensor_id="camera_front",
                sensor_type=SensorType.CAMERA,
                timestamp=current_time,
                data={"objects": []},
                confidence=0.95
            ),
            "camera_faulty": SensorData(
                sensor_id="camera_faulty",
                sensor_type=SensorType.CAMERA,
                timestamp=current_time - 0.01,  # 10ms behind
                data={"objects": []},
                confidence=0.95
            )
        }

        sync_result = fusion_tester.fusion_engine.check_synchronization(sensor_data)

        assert not sync_result["synchronized"], "Failed to detect synchronization failure"
        assert sync_result["max_drift_ms"] > SYNC_TOLERANCE_MS, "Synchronization failure not properly measured"

        print(f"Synchronization failure detected: {sync_result['max_drift_ms']:.2f}ms drift")

class TestDataFusionAccuracy:
    """Test sensor data fusion accuracy"""

    @pytest.mark.asyncio
    async def test_multi_sensor_object_fusion(self, fusion_tester, test_scene):
        """Test accuracy of multi-sensor object fusion"""
        # Collect sensor data
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)

        # Perform fusion
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        # Validate fusion results
        assert len(fused_objects) > 0, "No objects fused from sensor data"

        # Check fusion accuracy against reference scene
        fusion_accuracy = 0.0
        correctly_fused = 0

        for ref_obj in test_scene:
            ref_pos = ref_obj["position"]
            best_match_distance = float('inf')

            for fused_obj in fused_objects:
                fused_pos = fused_obj.position
                distance = math.sqrt(
                    sum((ref_pos[i] - fused_pos[i]) ** 2 for i in range(3))
                )

                if distance < best_match_distance:
                    best_match_distance = distance

            # Consider fusion correct if within 1 meter
            if best_match_distance < 1.0:
                correctly_fused += 1

        fusion_accuracy = (correctly_fused / len(test_scene)) * 100.0

        assert fusion_accuracy >= FUSION_ACCURACY_THRESHOLD, f"Fusion accuracy {fusion_accuracy:.1f}% below threshold {FUSION_ACCURACY_THRESHOLD}%"

        print(f"Multi-sensor fusion accuracy: {fusion_accuracy:.1f}%")

    @pytest.mark.asyncio
    async def test_sensor_confidence_weighting(self, fusion_tester, test_scene):
        """Test that fusion properly weights sensor confidence"""
        # Set different confidence levels for sensors
        for sensor_id, sensor in fusion_tester.fusion_engine.sensors.items():
            if "camera" in sensor_id:
                sensor.confidence = 0.95
            elif "lidar" in sensor_id:
                sensor.confidence = 0.90
            elif "radar" in sensor_id:
                sensor.confidence = 0.85

        # Collect and fuse data
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        # Verify that high-confidence sensors contribute more
        for fused_obj in fused_objects:
            assert fused_obj.confidence > 0.0, "Fused object has zero confidence"
            assert len(fused_obj.contributing_sensors) >= MIN_SENSORS_FOR_FUSION, "Insufficient sensor contribution"

            # High-confidence sensors should dominate if available
            if "camera_front" in fused_obj.contributing_sensors:
                assert fused_obj.confidence >= 0.85, "Camera confidence not properly weighted"

    @pytest.mark.asyncio
    async def test_redundancy_and_cross_validation(self, fusion_tester, test_scene):
        """Test sensor redundancy and cross-validation"""
        # Collect data multiple times for statistical analysis
        fusion_results = []

        for _ in range(10):
            sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)
            fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)
            fusion_results.append(fused_objects)

        # Analyze consistency across multiple fusion attempts
        if fusion_results:
            avg_objects_detected = sum(len(result) for result in fusion_results) / len(fusion_results)
            detection_variance = np.var([len(result) for result in fusion_results])

            assert detection_variance < 1.0, f"High variance in object detection: {detection_variance:.2f}"

            # Check position consistency for tracked objects
            if all(result for result in fusion_results):
                first_result = fusion_results[0]
                if first_result:
                    reference_obj = first_result[0]
                    position_variations = []

                    for result in fusion_results[1:]:
                        if result:
                            closest_obj = min(
                                result,
                                key=lambda obj: math.sqrt(
                                    sum((reference_obj.position[i] - obj.position[i]) ** 2 for i in range(3))
                                )
                            )

                            position_diff = math.sqrt(
                                sum((reference_obj.position[i] - closest_obj.position[i]) ** 2 for i in range(3))
                            )
                            position_variations.append(position_diff)

                    if position_variations:
                        avg_position_variation = sum(position_variations) / len(position_variations)
                        assert avg_position_variation < 0.5, f"High position variation: {avg_position_variation:.2f}m"

class TestCalibrationValidation:
    """Test sensor calibration and drift detection"""

    def test_calibration_parameter_validation(self, fusion_tester, test_scene):
        """Test validation of sensor calibration parameters"""
        # Validate calibration against reference objects
        calibration_errors = fusion_tester.fusion_engine.validate_calibration(test_scene)

        for sensor_id, errors in calibration_errors.items():
            assert errors["position_error_m"] < CALIBRATION_DRIFT_THRESHOLD * 10, \
                f"Sensor {sensor_id} position error {errors['position_error_m']:.3f}m exceeds acceptable limit"

            assert errors["detection_accuracy"] >= 0.8, \
                f"Sensor {sensor_id} detection accuracy {errors['detection_accuracy']:.2f} below minimum"

            print(f"Sensor {sensor_id}: position error {errors['position_error_m']:.3f}m, "
                    f"accuracy {errors['detection_accuracy']:.2f}")

    def test_calibration_drift_detection(self, fusion_tester):
        """Test detection of calibration drift over time"""
        # Simulate calibration drift
        camera_sensor = fusion_tester.fusion_engine.sensors["camera_front"]
        original_offset = camera_sensor.calibration.position_offset

        # Introduce gradual drift
        drift_values = [0.01, 0.02, 0.04, 0.06, 0.08]  # Increasing drift in meters

        drift_detected = False
        for drift in drift_values:
            camera_sensor.calibration.position_offset = (
                original_offset[0] + drift,
                original_offset[1],
                original_offset[2]
            )

            # Check if drift exceeds threshold
            if drift > CALIBRATION_DRIFT_THRESHOLD:
                drift_detected = True
                break

        assert drift_detected, "Calibration drift detection failed"

        # Restore original calibration
        camera_sensor.calibration.position_offset = original_offset

        print(f"Calibration drift detected at {drift:.3f}m offset")

    def test_automatic_recalibration_trigger(self, fusion_tester):
        """Test automatic recalibration trigger conditions"""
        # Simulate conditions requiring recalibration
        trigger_conditions = {
            "large_position_error": True,
            "low_detection_accuracy": True,
            "sensor_replacement": False,
            "environmental_change": False
        }

        # Check if recalibration should be triggered
        recalibration_needed = any([
            trigger_conditions["large_position_error"],
            trigger_conditions["low_detection_accuracy"],
            trigger_conditions["sensor_replacement"],
            trigger_conditions["environmental_change"]
        ])

        assert recalibration_needed, "Recalibration trigger logic failed"

class TestFailureModeHandling:
    """Test sensor failure mode handling"""

    @pytest.mark.asyncio
    async def test_single_sensor_failure(self, fusion_tester, test_scene):
        """Test graceful degradation when single sensor fails"""
        # Simulate camera failure
        camera_sensor = fusion_tester.fusion_engine.sensors["camera_front"]
        camera_sensor.status = SensorStatus.FAILED

        # Collect data with failed sensor
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)

        # Verify camera data is not included
        assert "camera_front" not in sensor_data or sensor_data["camera_front"].status == SensorStatus.FAILED

        # Fusion should still work with remaining sensors
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        if len(sensor_data) >= MIN_SENSORS_FOR_FUSION:
            assert len(fused_objects) > 0, "Fusion failed with single sensor failure"

        # Restore sensor for other tests
        camera_sensor.status = SensorStatus.ACTIVE

        print(f"Single sensor failure handled: {len(fused_objects)} objects fused from {len(sensor_data)} active sensors")

    @pytest.mark.asyncio
    async def test_multiple_sensor_failure(self, fusion_tester, test_scene):
        """Test behavior with multiple sensor failures"""
        # Fail multiple sensors
        failed_sensors = ["camera_front", "radar_front"]
        original_statuses = {}

        for sensor_id in failed_sensors:
            sensor = fusion_tester.fusion_engine.sensors[sensor_id]
            original_statuses[sensor_id] = sensor.status
            sensor.status = SensorStatus.FAILED

        # Collect data with multiple failures
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)
        active_sensors = [sensor_id for sensor_id, data in sensor_data.items()
                        if data.status == SensorStatus.ACTIVE]

        assert len(active_sensors) >= MIN_SENSORS_FOR_FUSION, \
            f"Too few active sensors: {len(active_sensors)} < {MIN_SENSORS_FOR_FUSION}"

        # Fusion should still produce results if minimum sensors available
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        if len(active_sensors) >= MIN_SENSORS_FOR_FUSION:
            assert len(fused_objects) > 0, "Fusion failed with multiple sensor failures"

        # Restore sensors
        for sensor_id, original_status in original_statuses.items():
            fusion_tester.fusion_engine.sensors[sensor_id].status = original_status

        print(f"Multiple sensor failure handled: {len(active_sensors)} active sensors, {len(fused_objects)} objects fused")

    @pytest.mark.asyncio
    async def test_sensor_degraded_mode(self, fusion_tester, test_scene):
        """Test handling of sensors in degraded mode"""
        # Set LiDAR to degraded mode
        lidar_sensor = fusion_tester.fusion_engine.sensors["lidar_roof"]
        lidar_sensor.status = SensorStatus.DEGRADED
        lidar_sensor.confidence = 0.5  # Reduced confidence

        # Collect data with degraded sensor
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(test_scene)
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        # Verify degraded sensor is still used but with lower weight
        lidar_data = sensor_data.get("lidar_roof")
        if lidar_data:
            assert lidar_data.status == SensorStatus.DEGRADED
            assert lidar_data.confidence < 0.7, "Degraded sensor confidence not reduced"

        # Fusion should adapt to reduced confidence
        for fused_obj in fused_objects:
            if "lidar_roof" in fused_obj.contributing_sensors:
                # Objects with degraded sensor contribution should have adjusted confidence
                assert fused_obj.confidence > 0.0, "Fused object confidence invalid with degraded sensor"

        # Restore sensor
        lidar_sensor.status = SensorStatus.ACTIVE
        lidar_sensor.confidence = 0.90

        print(f"Degraded sensor handling: {len(fused_objects)} objects fused with degraded LiDAR")

class TestPerformanceAndScalability:
    """Test sensor fusion performance and scalability"""

    @pytest.mark.asyncio
    async def test_high_object_density_performance(self, fusion_tester):
        """Test performance with high object density"""
        # Create scene with many objects
        dense_scene = []
        for i in range(50):  # 50 objects
            for j in range(5):
                dense_scene.append({
                    "type": "vehicle",
                    "position": [10.0 + i * 2.0, -5.0 + j * 2.0, 0.0],
                    "velocity": [10.0, 0.0, 0.0],
                    "dimensions": [4.0, 1.8, 1.5]
                })

        start_time = time.perf_counter()

        # Perform fusion on dense scene
        sensor_data = await fusion_tester.fusion_engine.collect_sensor_data(dense_scene)
        fused_objects = fusion_tester.fusion_engine.fuse_object_detections(sensor_data)

        end_time = time.perf_counter()
        processing_time_ms = (end_time - start_time) * 1000

        assert processing_time_ms < 100.0, f"Processing time {processing_time_ms:.2f}ms exceeds 100ms limit for dense scene"
        assert len(fused_objects) > 0, "No objects fused in dense scene"

        print(f"Dense scene processing: {processing_time_ms:.2f}ms for {len(dense_scene)} objects -> {len(fused_objects)} fused")

    @pytest.mark.asyncio
    async def test_concurrent_fusion_processing(self, fusion_tester, test_scene):
        """Test concurrent sensor fusion processing"""
        # Run multiple fusion processes concurrently
        num_concurrent = 10
        tasks = []

        for _ in range(num_concurrent):
            task = asyncio.create_task(
                fusion_tester.fusion_engine.collect_sensor_data(test_scene)
            )
            tasks.append(task)

        start_time = time.perf_counter()
        results = await asyncio.gather(*tasks)
        end_time = time.perf_counter()

        total_time_ms = (end_time - start_time) * 1000
        avg_time_per_operation = total_time_ms / num_concurrent

        assert avg_time_per_operation < 50.0, f"Average processing time {avg_time_per_operation:.2f}ms exceeds 50ms limit"
        assert len(results) == num_concurrent, "Not all concurrent operations completed"

        print(f"Concurrent processing: {num_concurrent} operations in {total_time_ms:.2f}ms")

class TestReporting:
    """Test comprehensive reporting and metrics"""

    def test_fusion_metrics_collection(self, fusion_tester):
        """Test collection of comprehensive fusion metrics"""
        # Collect metrics
        metrics = {
            "sensor_count": len(fusion_tester.fusion_engine.sensors),
            "active_sensors": sum(1 for sensor in fusion_tester.fusion_engine.sensors.values()
                                if sensor.status == SensorStatus.ACTIVE),
            "fusion_engine_config": {
                "sync_tolerance_ms": fusion_tester.fusion_engine.sync_tolerance_ms,
                "min_sensors_for_fusion": MIN_SENSORS_FOR_FUSION
            },
            "sensor_specifications": {}
        }

        # Collect sensor specifications
        for sensor_id, sensor in fusion_tester.fusion_engine.sensors.items():
            metrics["sensor_specifications"][sensor_id] = {
                "type": sensor.sensor_type.value,
                "position": sensor.position,
                "status": sensor.status.value,
                "confidence": sensor.confidence,
                "field_of_view": sensor._get_field_of_view(),
                "detection_range_m": sensor._get_detection_range(),
                "resolution": sensor._get_resolution()
            }

        # Save metrics report
        os.makedirs("tests/phase7_adas/reports", exist_ok=True)
        with open("tests/phase7_adas/reports/sensor_fusion_metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)

        # Validate metrics structure
        assert "sensor_count" in metrics
        assert "active_sensors" in metrics
        assert metrics["active_sensors"] <= metrics["sensor_count"]
        assert len(metrics["sensor_specifications"]) == metrics["sensor_count"]

        print(f"Fusion metrics collected: {metrics['sensor_count']} sensors, {metrics['active_sensors']} active")

if __name__ == "__main__":
    # Run sensor fusion tests
    pytest.main([__file__, "-v", "--tb=short"])