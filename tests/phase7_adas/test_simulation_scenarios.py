from src.constants.base import DAYS_RETENTION_PERIOD
"""

This module provides simulation-based testing for:
- Highway scenarios (high-speed, lane changes, merging)
- Urban scenarios (intersections, traffic lights, pedestrians)
- Adverse weather conditions (rain, fog, snow, night)
- Emergency scenarios (sudden braking, obstacle avoidance)
- Edge cases (sensor failures, occlusion, construction zones)
"""

import pytest
import numpy as np
import time
import json
import asyncio
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Tuple
from enum import Enum
import math
import os
from collections import defaultdict

# Import from other ADAS test modules
from . import (
    MockADASProcessor,
    SensorFusionEngine,
    MockSensor,
    SensorType,
    MockPerceptionSystem,
    ObjectType,
    WeatherCondition,
    ScenarioType
)

# Simulation parameters
SIMULATION_CONFIG = {
    "time_step_ms": 50,  # 20Hz simulation
    "simulation_duration_s": 60.0,
    "vehicle_dynamics": {
        "max_acceleration_mps2": 3.0,
        "max_deceleration_mps2": 8.0,
        "max_steering_angle_deg": 45.0,
        "wheelbase_m": 2.8
    },
    "sensor_ranges": {
        "camera": 150.0,
        "lidar": 200.0,
        "radar": 250.0,
        "ultrasonic": 5.0
    }
}

class TrafficLightState(Enum):
    """Traffic light states"""
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"
    FLASHING_RED = "flashing_red"
    FLASHING_YELLOW = "flashing_yellow"

class VehicleState(Enum):
    """Vehicle operational states"""
    NORMAL = "normal"
    BRAKING = "braking"
    ACCELERATING = "accelerating"
    TURNING_LEFT = "turning_left"
    TURNING_RIGHT = "turning_right"
    EMERGENCY_STOP = "emergency_stop"

@dataclass
class SimulatedVehicle:
    """Simulated vehicle in the scenario"""
    vehicle_id: str
    position: Tuple[float, float, float]  # x, y, z
    velocity: Tuple[float, float, float]  # vx, vy, vz
    heading: float  # radians
    length: float = 4.5
    width: float = 1.8
    height: float = 1.5
    state: VehicleState = VehicleState.NORMAL
    target_speed: float = 15.0  # m/s
    lane_id: Optional[str] = None

@dataclass
class SimulatedPedestrian:
    """Simulated pedestrian in the scenario"""
    pedestrian_id: str
    position: Tuple[float, float, float]
    velocity: Tuple[float, float, float]
    heading: float
    walking_speed: float = 1.4  # m/s
    crossing_intent: bool = False
    visibility: float = 1.0

@dataclass
class SimulatedObstacle:
    """Static obstacle in the scenario"""
    obstacle_id: str
    position: Tuple[float, float, float]
    dimensions: Tuple[float, float, float]  # length, width, height
    obstacle_type: str = "barrier"

@dataclass
class TrafficLight:
    """Traffic light in the scenario"""
    light_id: str
    position: Tuple[float, float, float]
    state: TrafficLightState
    cycle_time_s: float = 60.0
    green_duration_s: float = 30.0
    yellow_duration_s: float = 5.0
    red_duration_s: float = 25.0

@dataclass
class SimulationScenario:
    """Complete simulation scenario"""
    scenario_id: str
    scenario_type: ScenarioType
    weather: WeatherCondition
    time_of_day: str  # "day", "night", "dawn", "dusk"
    ego_vehicle: SimulatedVehicle
    other_vehicles: List[SimulatedVehicle]
    pedestrians: List[SimulatedPedestrian]
    obstacles: List[SimulatedObstacle]
    traffic_lights: List[TrafficLight]
    road_conditions: Dict[str, Any]

class SimulationEngine:
    """ADAS simulation engine"""

    def __init__(self):
        self.current_time = 0.0
        self.time_step = SIMULATION_CONFIG["time_step_ms"] / 1000.0
        self.adas_processor = MockADASProcessor()
        self.sensor_fusion = SensorFusionEngine()
        self.perception_system = MockPerceptionSystem()
        self.scenario_results = []

        # Setup sensors
        self._setup_sensors()

    def _setup_sensors(self):
        """Setup standard sensor configuration for simulation"""
        sensors = [
            MockSensor("camera_front", SensorType.CAMERA, (0.0, 0.0, 1.5)),
            MockSensor("camera_rear", SensorType.CAMERA, (-2.0, 0.0, 1.5)),
            MockSensor("lidar_roof", SensorType.LIDAR, (0.0, 0.0, 2.0)),
            MockSensor("radar_front", SensorType.RADAR, (2.0, 0.0, 0.5)),
            MockSensor("radar_rear", SensorType.RADAR, (-2.0, 0.0, 0.5)),
            MockSensor("radar_left", SensorType.RADAR, (0.0, 1.0, 0.5)),
            MockSensor("radar_right", SensorType.RADAR, (0.0, -1.0, 0.5)),
            MockSensor("ultrasonic_fl", SensorType.ULTRASONIC, (1.5, 0.8, 0.3)),
            MockSensor("ultrasonic_fr", SensorType.ULTRASONIC, (1.5, -0.8, 0.3)),
            MockSensor("ultrasonic_rl", SensorType.ULTRASONIC, (-1.5, 0.8, 0.3)),
            MockSensor("ultrasonic_rr", SensorType.ULTRASONIC, (-1.5, -0.8, 0.3))
        ]

        for sensor in sensors:
            self.sensor_fusion.add_sensor(sensor)

    async def run_scenario(self, scenario: SimulationScenario, duration_s: float = 60.0) -> Dict[str, Any]:
        """Run a complete simulation scenario"""
        start_time = time.perf_counter()
        self.current_time = 0.0

        scenario_log = {
            "scenario_id": scenario.scenario_id,
            "start_time": start_time,
            "frames": [],
            "events": [],
            "metrics": {},
            "final_state": {}
        }

        # Initialize scenario
        await self._initialize_scenario(scenario)

        # Main simulation loop
        while self.current_time < duration_s:
            frame_start = time.perf_counter()

            # Update scenario state
            await self._update_scenario_state(scenario)

            # Collect sensor data
            scene_objects = self._extract_scene_objects(scenario)
            sensor_data = await self.sensor_fusion.collect_sensor_data(scene_objects)

            # Process ADAS pipeline
            adas_result = await self._process_adas_pipeline(sensor_data, scenario)

            # Log frame data
            frame_data = {
                "timestamp": self.current_time,
                "ego_position": scenario.ego_vehicle.position,
                "ego_velocity": scenario.ego_vehicle.velocity,
                "detected_objects": len(scene_objects),
                "adas_decision": adas_result.get("decision", "maintain"),
                "processing_time_ms": (time.perf_counter() - frame_start) * 1000
            }
            scenario_log["frames"].append(frame_data)

            # Check for critical events
            await self._check_safety_events(scenario, adas_result, scenario_log)

            # Advance simulation time
            self.current_time += self.time_step

            # Real-time simulation pacing
            await asyncio.sleep(max(0, self.time_step - (time.perf_counter() - frame_start)))

        # Calculate final metrics
        scenario_log["metrics"] = self._calculate_scenario_metrics(scenario_log)
        scenario_log["final_state"] = self._get_final_scenario_state(scenario)
        scenario_log["duration_s"] = time.perf_counter() - start_time

        self.scenario_results.append(scenario_log)
        return scenario_log

    async def _initialize_scenario(self, scenario: SimulationScenario):
        """Initialize scenario with starting conditions"""
        # Set weather conditions for sensors
        for sensor in self.sensor_fusion.sensors.values():
            if hasattr(sensor, 'weather_factor'):
                sensor.weather_factor = self._get_weather_factor(scenario.weather)

        # Initialize traffic lights
        for traffic_light in scenario.traffic_lights:
            # Set initial state based on scenario

        # Log initialization
            pass
        init_event = {
            "timestamp": self.current_time,
            "type": "scenario_start",
            "data": {
                "scenario_type": scenario.scenario_type.value,
                "weather": scenario.weather.value,
                "time_of_day": scenario.time_of_day,
                "num_vehicles": len(scenario.other_vehicles),
                "num_pedestrians": len(scenario.pedestrians)
            }
        }

    async def _update_scenario_state(self, scenario: SimulationScenario):
        """Update the state of all objects in the scenario"""
        # Update ego vehicle
        await self._update_ego_vehicle(scenario.ego_vehicle)

        # Update other vehicles
        for vehicle in scenario.other_vehicles:
            await self._update_vehicle_behavior(vehicle, scenario)

        # Update pedestrians
        for pedestrian in scenario.pedestrians:
            await self._update_pedestrian_behavior(pedestrian, scenario)

        # Update traffic lights
        for traffic_light in scenario.traffic_lights:
            self._update_traffic_light_state(traffic_light)

    async def _update_ego_vehicle(self, ego_vehicle: SimulatedVehicle):
        """Update ego vehicle state (simplified physics)"""
        # Apply simple motion model
        dt = self.time_step

        # Update position based on velocity
        new_position = (
            ego_vehicle.position[0] + ego_vehicle.velocity[0] * dt,
            ego_vehicle.position[1] + ego_vehicle.velocity[1] * dt,
            ego_vehicle.position[2] + ego_vehicle.velocity[2] * dt
        )

        ego_vehicle.position = new_position

        # Simple speed maintenance (cruise control simulation)
        current_speed = math.sqrt(ego_vehicle.velocity[0]**2 + ego_vehicle.velocity[1]**2)
        if current_speed < ego_vehicle.target_speed:
            # Gentle acceleration
            acceleration = min(1.0, ego_vehicle.target_speed - current_speed)
            ego_vehicle.velocity = (
                ego_vehicle.velocity[0] + acceleration * dt * math.cos(ego_vehicle.heading),
                ego_vehicle.velocity[1] + acceleration * dt * math.sin(ego_vehicle.heading),
                ego_vehicle.velocity[2]
            )

    async def _update_vehicle_behavior(self, vehicle: SimulatedVehicle, scenario: SimulationScenario):
        """Update behavior of other vehicles in the scenario"""
        dt = self.time_step

        # Simple lane-following behavior
        current_speed = math.sqrt(vehicle.velocity[0]**2 + vehicle.velocity[1]**2)

        # Maintain target speed
        if current_speed < vehicle.target_speed:
            acceleration = min(2.0, vehicle.target_speed - current_speed)
            vehicle.velocity = (
                vehicle.velocity[0] + acceleration * dt * math.cos(vehicle.heading),
                vehicle.velocity[1] + acceleration * dt * math.sin(vehicle.heading),
                vehicle.velocity[2]
            )

        # Update position
        vehicle.position = (
            vehicle.position[0] + vehicle.velocity[0] * dt,
            vehicle.position[1] + vehicle.velocity[1] * dt,
            vehicle.position[2] + vehicle.velocity[2] * dt
        )

        # Check for interactions with ego vehicle
        ego_distance = math.sqrt(
            sum((vehicle.position[i] - scenario.ego_vehicle.position[i])**2 for i in range(2))
        )

        # React to nearby ego vehicle
        if ego_distance < 20.0 and vehicle.position[1] > scenario.ego_vehicle.position[1]:
            # Vehicle ahead of ego - maintain safe distance
            if ego_distance < 10.0:
                # Apply braking
                deceleration = 2.0
                new_speed = max(0, current_speed - deceleration * dt)
                vehicle.velocity = (
                    new_speed * math.cos(vehicle.heading),
                    new_speed * math.sin(vehicle.heading),
                    vehicle.velocity[2]
                )
                vehicle.state = VehicleState.BRAKING

    async def _update_pedestrian_behavior(self, pedestrian: SimulatedPedestrian, scenario: SimulationScenario):
        """Update pedestrian behavior"""
        dt = self.time_step

        # Simple walking behavior
        if pedestrian.crossing_intent:
            # Pedestrian intends to cross - move toward road
            pedestrian.velocity = (
                pedestrian.walking_speed * math.cos(pedestrian.heading),
                pedestrian.walking_speed * math.sin(pedestrian.heading),
                0.0
            )
        else:
            # Random walking along sidewalk
            if np.random.random() < 0.1:  # 10% chance to change direction
                pedestrian.heading += np.random.uniform(-0.5, 0.5)

            pedestrian.velocity = (
                pedestrian.walking_speed * math.cos(pedestrian.heading) * 0.5,  # Slower sidewalk walking
                pedestrian.walking_speed * math.sin(pedestrian.heading) * 0.5,
                0.0
            )

        # Update position
        pedestrian.position = (
            pedestrian.position[0] + pedestrian.velocity[0] * dt,
            pedestrian.position[1] + pedestrian.velocity[1] * dt,
            pedestrian.position[2] + pedestrian.velocity[2] * dt
        )

        # Check if pedestrian should start crossing
        ego_distance = math.sqrt(
            sum((pedestrian.position[i] - scenario.ego_vehicle.position[i])**2 for i in range(2))
        )

        if not pedestrian.crossing_intent and ego_distance > 30.0:
            # Start crossing if ego vehicle is far enough
            if np.random.random() < 0.2:  # 2% chance per frame
                pedestrian.crossing_intent = True
                pedestrian.heading = math.pi / 2  # Cross perpendicular to road

    def _update_traffic_light_state(self, traffic_light: TrafficLight):
        """Update traffic light state based on timing"""
        cycle_position = self.current_time % traffic_light.cycle_time_s

        if cycle_position < traffic_light.green_duration_s:
            traffic_light.state = TrafficLightState.GREEN
        elif cycle_position < traffic_light.green_duration_s + traffic_light.yellow_duration_s:
            traffic_light.state = TrafficLightState.YELLOW
        else:
            traffic_light.state = TrafficLightState.RED

    def _extract_scene_objects(self, scenario: SimulationScenario) -> List[Dict[str, Any]]:
        """Extract scene objects for sensor simulation"""
        scene_objects = []

        # Add other vehicles
        for vehicle in scenario.other_vehicles:
            scene_objects.append({
                "type": "vehicle",
                "position": vehicle.position,
                "velocity": vehicle.velocity,
                "dimensions": [vehicle.length, vehicle.width, vehicle.height]
            })

        # Add pedestrians
        for pedestrian in scenario.pedestrians:
            scene_objects.append({
                "type": "pedestrian",
                "position": pedestrian.position,
                "velocity": pedestrian.velocity,
                "dimensions": [0.6, 0.4, 1.7]
            })

        # Add obstacles
        for obstacle in scenario.obstacles:
            scene_objects.append({
                "type": obstacle.obstacle_type,
                "position": obstacle.position,
                "velocity": [0.0, 0.0, 0.0],
                "dimensions": obstacle.dimensions
            })

        return scene_objects

    async def _process_adas_pipeline(self, sensor_data: Dict, scenario: SimulationScenario) -> Dict[str, Any]:
        """Process ADAS decision pipeline"""
        # Sensor fusion
        fused_objects = self.sensor_fusion.fuse_object_detections(sensor_data)

        # Threat assessment
        threats = self._assess_threats(fused_objects, scenario.ego_vehicle)

        # Decision making
        decision = self._make_adas_decision(threats, scenario)

        return {
            "fused_objects": len(fused_objects),
            "threats": threats,
            "decision": decision["action"],
            "confidence": decision["confidence"]
        }

    def _assess_threats(self, fused_objects: List, ego_vehicle: SimulatedVehicle) -> List[Dict[str, Any]]:
        """Assess potential threats from detected objects"""
        threats = []

        for obj in fused_objects:
            # Calculate time to collision (TTC)
            relative_position = [
                obj.position[i] - ego_vehicle.position[i] for i in range(3)
            ]
            relative_velocity = [
                obj.velocity[i] - ego_vehicle.velocity[i] for i in range(3)
            ]

            # Simple TTC calculation
            if relative_velocity[1] < 0:  # Approaching object
                ttc = -relative_position[1] / relative_velocity[1]
                distance = math.sqrt(sum(pos**2 for pos in relative_position))

                threat_level = "none"
                if ttc < 2.0 and distance < 50.0:
                    threat_level = "critical"
                elif ttc < 4.0 and distance < 100.0:
                    threat_level = "warning"
                elif distance < 150.0:
                    threat_level = "monitoring"

                if threat_level != "none":
                    threats.append({
                        "object_type": obj.object_type.value if hasattr(obj.object_type, 'value') else str(obj.object_type),
                        "distance": distance,
                        "ttc": ttc,
                        "threat_level": threat_level,
                        "confidence": obj.confidence
                    })

        return threats

    def _make_adas_decision(self, threats: List[Dict[str, Any]], scenario: SimulationScenario) -> Dict[str, Any]:
        """Make ADAS control decision based on threats"""
        critical_threats = [t for t in threats if t["threat_level"] == "critical"]
        warning_threats = [t for t in threats if t["threat_level"] == "warning"]

        if critical_threats:
            # Emergency braking
            return {
                "action": "emergency_brake",
                "confidence": 0.95,
                "reason": f"Critical threat detected: {critical_threats[0]['object_type']}"
            }
        elif warning_threats:
            # Moderate braking or warning
            return {
                "action": "moderate_brake",
                "confidence": 0.8,
                "reason": f"Warning threat detected: {warning_threats[0]['object_type']}"
            }
        else:
            # Maintain current state
            return {
                "action": "maintain",
                "confidence": 0.9,
                "reason": "No immediate threats detected"
            }

    async def _check_safety_events(self, scenario: SimulationScenario, adas_result: Dict[str, Any], scenario_log: Dict[str, Any]):
        """Check for safety-critical events"""
        # Check for collisions
        for vehicle in scenario.other_vehicles:
            distance = math.sqrt(
                sum((vehicle.position[i] - scenario.ego_vehicle.position[i])**2 for i in range(2))
            )
            if distance < 3.0:  # Collision threshold
                scenario_log["events"].append({
                    "timestamp": self.current_time,
                    "type": "collision",
                    "severity": "critical",
                    "object_type": "vehicle",
                    "distance": distance
                })

        # Check for near misses
        for pedestrian in scenario.pedestrians:
            distance = math.sqrt(
                sum((pedestrian.position[i] - scenario.ego_vehicle.position[i])**2 for i in range(2))
            )
            if distance < 5.0:  # Near miss threshold
                scenario_log["events"].append({
                    "timestamp": self.current_time,
                    "type": "near_miss",
                    "severity": "warning",
                    "object_type": "pedestrian",
                    "distance": distance
                })

        # Check for emergency braking events
        if adas_result.get("decision") == "emergency_brake":
            scenario_log["events"].append({
                "timestamp": self.current_time,
                "type": "emergency_brake",
                "severity": "info",
                "reason": adas_result.get("reason", "Unknown")
            })

    def _calculate_scenario_metrics(self, scenario_log: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive scenario metrics"""
        frames = scenario_log["frames"]
        events = scenario_log["events"]

        if not frames:
            return {}

        metrics = {
            "total_frames": len(frames),
            "avg_processing_time_ms": sum(f["processing_time_ms"] for f in frames) / len(frames),
            "max_processing_time_ms": max(f["processing_time_ms"] for f in frames),
            "total_events": len(events),
            "safety_events": {
                "collisions": len([e for e in events if e["type"] == "collision"]),
                "near_misses": len([e for e in events if e["type"] == "near_miss"]),
                "emergency_brakes": len([e for e in events if e["type"] == "emergency_brake"])
            },
            "adas_decisions": {
                "maintain": len([f for f in frames if f["adas_decision"] == "maintain"]),
                "moderate_brake": len([f for f in frames if f["adas_decision"] == "moderate_brake"]),
                "emergency_brake": len([f for f in frames if f["adas_decision"] == "emergency_brake"])
            }
        }

        # Calculate safety score
        collision_penalty = metrics["safety_events"]["collisions"] * 100
        near_miss_penalty = metrics["safety_events"]["near_misses"] * 10
        total_penalty = collision_penalty + near_miss_penalty

        metrics["safety_score"] = max(0, 100 - total_penalty)

        return metrics

    def _get_final_scenario_state(self, scenario: SimulationScenario) -> Dict[str, Any]:
        """Get final state of scenario objects"""
        return {
            "ego_vehicle": {
                "position": scenario.ego_vehicle.position,
                "velocity": scenario.ego_vehicle.velocity,
                "state": scenario.ego_vehicle.state.value
            },
            "other_vehicles": [
                {
                    "id": v.vehicle_id,
                    "position": v.position,
                    "state": v.state.value
                }
                for v in scenario.other_vehicles
            ],
            "pedestrians": [
                {
                    "id": p.pedestrian_id,
                    "position": p.position,
                    "crossing_intent": p.crossing_intent
                }
                for p in scenario.pedestrians
            ]
        }

    def _get_weather_factor(self, weather: WeatherCondition) -> float:
        """Get weather impact factor"""
        factors = {
            WeatherCondition.CLEAR: 1.0,
            WeatherCondition.CLOUDY: 0.95,
            WeatherCondition.RAIN: 0.8,
            WeatherCondition.FOG: 0.6,
            WeatherCondition.SNOW: 0.7,
            WeatherCondition.NIGHT: 0.75
        }
        return factors.get(weather, 0.9)

class ScenarioBuilder:
    """Builder for creating simulation scenarios"""

    @staticmethod
    def create_highway_scenario() -> SimulationScenario:
        """Create highway driving scenario"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 25.0, 0.0),  # 25 m/s = 90 km/h
            heading=math.pi/2,  # North
            target_speed=25.0
        )

        other_vehicles = [
            SimulatedVehicle(
                vehicle_id="vehicle_1",
                position=(0.0, 50.0, 0.0),
                velocity=(0.0, 20.0, 0.0),
                heading=math.pi/2,
                target_speed=20.0
            ),
            SimulatedVehicle(
                vehicle_id="vehicle_2",
                position=(3.5, -30.0, 0.0),  # Adjacent lane
                velocity=(0.0, 30.0, 0.0),
                heading=math.pi/2,
                target_speed=30.0
            ),
            SimulatedVehicle(
                vehicle_id="vehicle_3",
                position=(0.0, 100.0, 0.0),
                velocity=(0.0, 15.0, 0.0),
                heading=math.pi/2,
                target_speed=15.0
            )
        ]

        return SimulationScenario(
            scenario_id="highway_001",
            scenario_type=ScenarioType.HIGHWAY,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=other_vehicles,
            pedestrians=[],
            obstacles=[],
            traffic_lights=[],
            road_conditions={"surface": "dry", "visibility_km": 10.0}
        )

    @staticmethod
    def create_urban_intersection_scenario() -> SimulationScenario:
        """Create urban intersection scenario with traffic lights and pedestrians"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, -20.0, 0.0),
            velocity=(0.0, 10.0, 0.0),  # 10 m/s = 36 km/h
            heading=math.pi/2,
            target_speed=10.0
        )

        other_vehicles = [
            SimulatedVehicle(
                vehicle_id="crossing_vehicle",
                position=(20.0, 0.0, 0.0),
                velocity=(-8.0, 0.0, 0.0),
                heading=math.pi,
                target_speed=8.0
            )
        ]

        pedestrians = [
            SimulatedPedestrian(
                pedestrian_id="ped_1",
                position=(5.0, 5.0, 0.0),
                velocity=(0.0, 0.0, 0.0),
                heading=0.0,
                crossing_intent=True
            ),
            SimulatedPedestrian(
                pedestrian_id="ped_2",
                position=(-10.0, 15.0, 0.0),
                velocity=(1.0, 0.0, 0.0),
                heading=0.0,
                crossing_intent=False
            )
        ]

        traffic_lights = [
            TrafficLight(
                light_id="main_intersection",
                position=(0.0, 0.0, 4.0),
                state=TrafficLightState.GREEN,
                cycle_time_s=60.0
            )
        ]

        return SimulationScenario(
            scenario_id="urban_intersection_001",
            scenario_type=ScenarioType.URBAN,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=other_vehicles,
            pedestrians=pedestrians,
            obstacles=[],
            traffic_lights=traffic_lights,
            road_conditions={"surface": "dry", "visibility_km": 5.0}
        )

    @staticmethod
    def create_emergency_scenario() -> SimulationScenario:
        """Create emergency braking scenario"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 20.0, 0.0),  # 20 m/s = 72 km/h
            heading=math.pi/2,
            target_speed=20.0
        )

        # Stationary obstacle ahead
        obstacles = [
            SimulatedObstacle(
                obstacle_id="emergency_obstacle",
                position=(0.0, 40.0, 0.0),  # 40m ahead
                dimensions=(2.0, 1.5, 1.0),
                obstacle_type="debris"
            )
        ]

        return SimulationScenario(
            scenario_id="emergency_001",
            scenario_type=ScenarioType.EMERGENCY,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=[],
            pedestrians=[],
            obstacles=obstacles,
            traffic_lights=[],
            road_conditions={"surface": "dry", "visibility_km": 10.0}
        )

    @staticmethod
    def create_adverse_weather_scenario(weather: WeatherCondition) -> SimulationScenario:
        """Create scenario with adverse weather conditions"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 15.0, 0.0),  # Reduced speed for weather
            heading=math.pi/2,
            target_speed=15.0
        )

        other_vehicles = [
            SimulatedVehicle(
                vehicle_id="vehicle_1",
                position=(0.0, 60.0, 0.0),
                velocity=(0.0, 12.0, 0.0),
                heading=math.pi/2,
                target_speed=12.0
            )
        ]

        visibility_map = {
            WeatherCondition.RAIN: 3.0,
            WeatherCondition.FOG: 1.0,
            WeatherCondition.SNOW: 2.0,
            WeatherCondition.NIGHT: 8.0
        }

        return SimulationScenario(
            scenario_id=f"weather_{weather.value}_001",
            scenario_type=ScenarioType.HIGHWAY,
            weather=weather,
            time_of_day="day" if weather != WeatherCondition.NIGHT else "night",
            ego_vehicle=ego_vehicle,
            other_vehicles=other_vehicles,
            pedestrians=[],
            obstacles=[],
            traffic_lights=[],
            road_conditions={
                "surface": "wet" if weather == WeatherCondition.RAIN else "dry",
                "visibility_km": visibility_map.get(weather, 10.0)
            }
        )

class SimulationTester:
    """Simulation-based testing framework"""

    def __init__(self):
        self.simulation_engine = SimulationEngine()
        self.test_results = []

    async def run_scenario_test(self, scenario: SimulationScenario,
                                expected_outcomes: Dict[str, Any]) -> Dict[str, Any]:
        """Run a scenario test with expected outcomes"""
        result = await self.simulation_engine.run_scenario(scenario)

        # Validate against expected outcomes
        validation_results = {
            "scenario_id": scenario.scenario_id,
            "passed": True,
            "validations": {},
            "actual_metrics": result["metrics"]
        }

        # Check safety requirements
        if "max_collisions" in expected_outcomes:
            actual_collisions = result["metrics"]["safety_events"]["collisions"]
            expected_max = expected_outcomes["max_collisions"]
            validation_results["validations"]["collisions"] = {
                "expected_max": expected_max,
                "actual": actual_collisions,
                "passed": actual_collisions <= expected_max
            }
            if actual_collisions > expected_max:
                validation_results["passed"] = False

        # Check response time requirements
        if "max_response_time_ms" in expected_outcomes:
            actual_max_time = result["metrics"]["max_processing_time_ms"]
            expected_max_time = expected_outcomes["max_response_time_ms"]
            validation_results["validations"]["response_time"] = {
                "expected_max_ms": expected_max_time,
                "actual_max_ms": actual_max_time,
                "passed": actual_max_time <= expected_max_time
            }
            if actual_max_time > expected_max_time:
                validation_results["passed"] = False

        # Check safety score requirements
        if "min_safety_score" in expected_outcomes:
            actual_score = result["metrics"]["safety_score"]
            expected_min = expected_outcomes["min_safety_score"]
            validation_results["validations"]["safety_score"] = {
                "expected_min": expected_min,
                "actual": actual_score,
                "passed": actual_score >= expected_min
            }
            if actual_score < expected_min:
                validation_results["passed"] = False

        self.test_results.append(validation_results)
        return validation_results

# Test fixtures and classes
@pytest.fixture
def simulation_tester():
    """Simulation tester fixture"""
    return SimulationTester()

@pytest.fixture
def scenario_builder():
    """Scenario builder fixture"""
    return ScenarioBuilder()

class TestHighwayScenarios:
    """Test highway driving scenarios"""

    @pytest.mark.asyncio
    async def test_highway_normal_driving(self, simulation_tester, scenario_builder):
        """Test normal highway driving scenario"""
        scenario = scenario_builder.create_highway_scenario()

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 50.0,
            "min_safety_score": 90
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Highway scenario failed: {result['validations']}"
        assert result["actual_metrics"]["safety_events"]["collisions"] == 0, "Unexpected collisions in highway scenario"

        print(f"Highway scenario completed: Safety score {result['actual_metrics']['safety_score']}")

    @pytest.mark.asyncio
    async def test_highway_lane_change(self, simulation_tester):
        """Test highway lane change scenario"""
        # Create custom scenario with lane change situation
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 25.0, 0.0),
            heading=math.pi/2,
            target_speed=25.0
        )

        # Slower vehicle ahead in same lane
        other_vehicles = [
            SimulatedVehicle(
                vehicle_id="slow_vehicle",
                position=(0.0, 80.0, 0.0),
                velocity=(0.0, 15.0, 0.0),
                heading=math.pi/2,
                target_speed=15.0
            ),
            # Vehicle in adjacent lane
            SimulatedVehicle(
                vehicle_id="adjacent_vehicle",
                position=(3.5, 40.0, 0.0),
                velocity=(0.0, 20.0, 0.0),
                heading=math.pi/2,
                target_speed=20.0
            )
        ]

        scenario = SimulationScenario(
            scenario_id="highway_lane_change_001",
            scenario_type=ScenarioType.HIGHWAY,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=other_vehicles,
            pedestrians=[],
            obstacles=[],
            traffic_lights=[],
            road_conditions={"surface": "dry", "visibility_km": 10.0}
        )

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 50.0,
            "min_safety_score": 85
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Lane change scenario failed: {result['validations']}"

        print(f"Lane change scenario completed: {result['actual_metrics']['adas_decisions']}")

class TestUrbanScenarios:
    """Test urban driving scenarios"""

    @pytest.mark.asyncio
    async def test_urban_intersection(self, simulation_tester, scenario_builder):
        """Test urban intersection scenario"""
        scenario = scenario_builder.create_urban_intersection_scenario()

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 60.0,
            "min_safety_score": 80
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Urban intersection scenario failed: {result['validations']}"

        # Check for appropriate ADAS responses to pedestrians
        emergency_brakes = result["actual_metrics"]["adas_decisions"]["emergency_brake"]
        moderate_brakes = result["actual_metrics"]["adas_decisions"]["moderate_brake"]

        assert emergency_brakes + moderate_brakes > 0, "No braking responses detected for pedestrian scenario"

        print(f"Urban intersection completed: {emergency_brakes} emergency brakes, {moderate_brakes} moderate brakes")

    @pytest.mark.asyncio
    async def test_pedestrian_crossing(self, simulation_tester):
        """Test pedestrian crossing scenario"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, -15.0, 0.0),
            velocity=(0.0, 12.0, 0.0),
            heading=math.pi/2,
            target_speed=12.0
        )

        # Pedestrian crossing path of ego vehicle
        pedestrians = [
            SimulatedPedestrian(
                pedestrian_id="crossing_ped",
                position=(2.0, 10.0, 0.0),
                velocity=(-1.4, 0.0, 0.0),  # Walking toward road
                heading=math.pi,
                crossing_intent=True
            )
        ]

        scenario = SimulationScenario(
            scenario_id="pedestrian_crossing_001",
            scenario_type=ScenarioType.URBAN,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=[],
            pedestrians=pedestrians,
            obstacles=[],
            traffic_lights=[],
            road_conditions={"surface": "dry", "visibility_km": 5.0}
        )

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 50.0,
            "min_safety_score": 85
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Pedestrian crossing scenario failed: {result['validations']}"

        # Should have emergency braking response
        emergency_brakes = result["actual_metrics"]["adas_decisions"]["emergency_brake"]
        assert emergency_brakes > 0, "No emergency braking for pedestrian crossing"

        print(f"Pedestrian crossing completed: {emergency_brakes} emergency brake events")

class TestAdverseWeatherScenarios:
    """Test adverse weather scenarios"""

    @pytest.mark.asyncio
    async def test_rain_scenario(self, simulation_tester, scenario_builder):
        """Test driving in rain conditions"""
        scenario = scenario_builder.create_adverse_weather_scenario(WeatherCondition.RAIN)

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 70.0,  # Slightly higher due to reduced visibility
            "min_safety_score": 75
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Rain scenario failed: {result['validations']}"

        print(f"Rain scenario completed: Safety score {result['actual_metrics']['safety_score']}")

    @pytest.mark.asyncio
    async def test_fog_scenario(self, simulation_tester, scenario_builder):
        """Test driving in fog conditions"""
        scenario = scenario_builder.create_adverse_weather_scenario(WeatherCondition.FOG)

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 80.0,  # Higher due to poor visibility
            "min_safety_score": 70
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Fog scenario failed: {result['validations']}"

        # Fog should cause more cautious behavior
        moderate_brakes = result["actual_metrics"]["adas_decisions"]["moderate_brake"]
        assert moderate_brakes > 5, "Insufficient cautious behavior in fog"

        print(f"Fog scenario completed: {moderate_brakes} moderate brake events")

    @pytest.mark.asyncio
    async def test_night_driving(self, simulation_tester, scenario_builder):
        """Test night driving scenario"""
        scenario = scenario_builder.create_adverse_weather_scenario(WeatherCondition.NIGHT)

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 60.0,
            "min_safety_score": 80
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Night driving scenario failed: {result['validations']}"

        print(f"Night driving completed: Safety score {result['actual_metrics']['safety_score']}")

class TestEmergencyScenarios:
    """Test emergency scenarios"""

    @pytest.mark.asyncio
    async def test_emergency_braking(self, simulation_tester, scenario_builder):
        """Test emergency braking scenario"""
        scenario = scenario_builder.create_emergency_scenario()

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 40.0,  # Fast response required
            "min_safety_score": 85
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Emergency braking scenario failed: {result['validations']}"

        # Must have emergency braking response
        emergency_brakes = result["actual_metrics"]["adas_decisions"]["emergency_brake"]
        assert emergency_brakes > 0, "No emergency braking detected for obstacle"

        print(f"Emergency braking completed: {emergency_brakes} emergency brake events")

    @pytest.mark.asyncio
    async def test_sudden_vehicle_cut_in(self, simulation_tester):
        """Test sudden vehicle cut-in scenario"""
        ego_vehicle = SimulatedVehicle(
            vehicle_id="ego",
            position=(0.0, 0.0, 0.0),
            velocity=(0.0, 25.0, 0.0),
            heading=math.pi/2,
            target_speed=25.0
        )

        # Vehicle that will cut in front
        other_vehicles = [
            SimulatedVehicle(
                vehicle_id="cutting_vehicle",
                position=(3.5, 20.0, 0.0),  # Adjacent lane, slightly ahead
                velocity=(-2.0, 20.0, 0.0),  # Moving into ego lane
                heading=math.pi/2 - 0.2,  # Slight angle toward ego lane
                target_speed=20.0
            )
        ]

        scenario = SimulationScenario(
            scenario_id="vehicle_cut_in_001",
            scenario_type=ScenarioType.EMERGENCY,
            weather=WeatherCondition.CLEAR,
            time_of_day="day",
            ego_vehicle=ego_vehicle,
            other_vehicles=other_vehicles,
            pedestrians=[],
            obstacles=[],
            traffic_lights=[],
            road_conditions={"surface": "dry", "visibility_km": 10.0}
        )

        expected_outcomes = {
            "max_collisions": 0,
            "max_response_time_ms": 45.0,
            "min_safety_score": 80
        }

        result = await simulation_tester.run_scenario_test(scenario, expected_outcomes)

        assert result["passed"], f"Vehicle cut-in scenario failed: {result['validations']}"

        # Should have braking response
        total_brakes = (result["actual_metrics"]["adas_decisions"]["emergency_brake"] +
                        result["actual_metrics"]["adas_decisions"]["moderate_brake"])
        assert total_brakes > 0, "No braking response to cut-in vehicle"

        print(f"Vehicle cut-in completed: {total_brakes} braking events")

class TestReportingAndAnalysis:
    """Test simulation reporting and analysis"""

    def test_comprehensive_simulation_report(self, simulation_tester):
        """Test generation of comprehensive simulation report"""
        # Collect all test results
        report_data = {
            "test_configuration": SIMULATION_CONFIG,
            "total_scenarios": len(simulation_tester.test_results),
            "passed_scenarios": len([r for r in simulation_tester.test_results if r["passed"]]),
            "failed_scenarios": len([r for r in simulation_tester.test_results if not r["passed"]]),
            "scenario_results": simulation_tester.test_results,
            "summary_metrics": {},
            "timestamp": time.time()
        }

        # Calculate summary metrics
        if simulation_tester.test_results:
            all_safety_scores = [r["actual_metrics"]["safety_score"]
                                for r in simulation_tester.test_results
                                if "safety_score" in r["actual_metrics"]]

            if all_safety_scores:
                report_data["summary_metrics"] = {
                    "average_safety_score": sum(all_safety_scores) / len(all_safety_scores),
                    "min_safety_score": min(all_safety_scores),
                    "max_safety_score": max(all_safety_scores),
                    "overall_pass_rate": report_data["passed_scenarios"] / report_data["total_scenarios"] * 100
                }

        # Save comprehensive report
        os.makedirs("tests/phase7_adas/reports", exist_ok=True)
        with open("tests/phase7_adas/reports/simulation_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)

        # Validate report structure
        assert "test_configuration" in report_data
        assert "scenario_results" in report_data
        assert report_data["total_scenarios"] >= 0

        print(f"Simulation report generated: {report_data['passed_scenarios']}/{report_data['total_scenarios']} scenarios passed")

if __name__ == "__main__":
    # Run simulation-based tests
    pytest.main([__file__, "-v", "--tb=short"])