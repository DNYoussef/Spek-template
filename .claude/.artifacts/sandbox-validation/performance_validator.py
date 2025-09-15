# NASA POT10 Rule 3: Minimize dynamic memory allocation
# Consider using fixed-size arrays or generators for large data processing
#!/usr/bin/env python3
"""
Performance Validation Test for Phase 1 Recommendations
Tests JSON generation timing, file size calculations, memory footprint
"""

import json
import os
import sys
import time
import psutil
from pathlib import Path
from typing import Dict, List, Any, Tuple
import traceback

class PerformanceValidator:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.artifacts_path = self.base_path / ".claude" / ".artifacts"
        self.results = {
            "test_name": "Performance Validation",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "json_generation_timing": {"status": "unknown", "results": []},
            "file_size_calculations": {"status": "unknown", "results": []},
            "memory_footprint": {"status": "unknown", "results": []},
            "scalability_projections": {"status": "unknown", "results": []},
            "performance_summary": {
                "total_files": 0,
                "total_size_mb": 0,
                "avg_generation_time": 0,
                "memory_efficiency": 0
            }
        }

    def measure_json_generation_timing(self) -> bool:
        """Test JSON generation performance"""
        timing_results = []
        
        # Test JSON creation for different data sizes
        test_sizes = [
            ("small", {"test": "small data", "items": list(range(10))}),
            ("medium", {"test": "medium data", "items": list(range(100)), "data": {f"key_{i}": f"value_{i}" for i in range(50)}}),
            ("large", {"test": "large data", "items": list(range(1000)), "data": {f"key_{i}": {"nested": f"value_{i}", "list": list(range(10))} for i in range(100)}})
        ]  # TODO: Consider limiting size with itertools.islice()
        
        for size_name, test_data in test_sizes:
            start_time = time.time()
            start_memory = psutil.virtual_memory().used
            
            try:
                # Serialize to JSON
                json_str = json.dumps(test_data, indent=2)
                serialization_time = time.time() - start_time
                
                # Parse back from JSON
                parse_start = time.time()
                parsed_data = json.loads(json_str)
                parse_time = time.time() - parse_start
                
                end_memory = psutil.virtual_memory().used
                memory_delta = end_memory - start_memory
                
                timing_results.append({
                    "size": size_name,
                    "data_size_bytes": len(json_str.encode('utf-8')),
                    "serialization_time": serialization_time,
                    "parse_time": parse_time,
                    "total_time": serialization_time + parse_time,
                    "memory_delta_bytes": memory_delta,
                    "throughput_mb_per_sec": (len(json_str.encode('utf-8')) / (1024 * 1024)) / (serialization_time + parse_time) if (serialization_time + parse_time) > 0 else 0
                })
                
            except Exception as e:
                timing_results.append({
                    "size": size_name,
                    "error": str(e),
                    "status": "failed"
                })
        
        self.results["json_generation_timing"]["results"] = timing_results
        
        # Check if all tests passed
        all_passed = all("error" not in result for result in timing_results)
        self.results["json_generation_timing"]["status"] = "passed" if all_passed else "failed"
        
        return all_passed

    def measure_file_size_calculations(self) -> bool:
        """Test file size calculation accuracy"""
        size_results = []
        
        try:
            # Analyze existing JSON files
            for json_file in self.artifacts_path.glob("*.json"):
                file_stat = json_file.stat()
                actual_size = file_stat.st_size
                
                # Calculate size from content
                with open(json_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    content_size = len(content.encode('utf-8'))
                
                # Load and re-serialize to measure compression efficiency
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Compact serialization
                    compact_json = json.dumps(data, separators=(',', ':'))
                    compact_size = len(compact_json.encode('utf-8'))
                    
                    # Pretty serialization
                    pretty_json = json.dumps(data, indent=2)
                    pretty_size = len(pretty_json.encode('utf-8'))
                    
                    size_results.append({
                        "file": json_file.name,
                        "actual_file_size": actual_size,
                        "content_size": content_size,
                        "compact_size": compact_size,
                        "pretty_size": pretty_size,
                        "size_accuracy": abs(actual_size - content_size) < 10,  # Allow for encoding differences
                        "compression_ratio": compact_size / pretty_size if pretty_size > 0 else 0,
                        "space_efficiency": (pretty_size - compact_size) / pretty_size if pretty_size > 0 else 0
                    })
                    
                except json.JSONDecodeError:
                    size_results.append({
                        "file": json_file.name,
                        "actual_file_size": actual_size,
                        "error": "JSON decode error",
                        "status": "failed"
                    })
            
            self.results["file_size_calculations"]["results"] = size_results
            
            # Check accuracy
            accurate_files = sum(1 for result in size_results if result.get("size_accuracy", False))
            total_files = len(size_results)
            
            self.results["file_size_calculations"]["status"] = "passed" if accurate_files == total_files else "partial"
            
            # Calculate summary statistics
            if size_results:
                self.results["performance_summary"]["total_files"] = total_files
                self.results["performance_summary"]["total_size_mb"] = sum(result.get("actual_file_size", 0) for result in size_results) / (1024 * 1024)
            
            return accurate_files == total_files
            
        except Exception as e:
            self.results["file_size_calculations"]["error"] = str(e)
            self.results["file_size_calculations"]["status"] = "failed"
            return False

    def measure_memory_footprint(self) -> bool:
        """Test memory usage during JSON operations"""
        memory_results = []
        
        try:
            # Get baseline memory
            baseline_memory = psutil.virtual_memory().used
            
            # Test memory usage with large JSON operations
            test_data = {
                "large_array": list(range(10000)),
                "nested_objects": {f"level_{i}": {f"sublevel_{j}": list(range(100)) for j in range(10)} for i in range(100)},
                "string_data": "x" * 100000
            }
            
            # Measure serialization memory
            pre_serialize = psutil.virtual_memory().used
            json_str = json.dumps(test_data)
            post_serialize = psutil.virtual_memory().used
            serialize_delta = post_serialize - pre_serialize
            
            # Measure parsing memory
            pre_parse = psutil.virtual_memory().used
            parsed_data = json.loads(json_str)
            post_parse = psutil.virtual_memory().used
            parse_delta = post_parse - pre_parse
            
            # Clean up
            del test_data, json_str, parsed_data
            
            memory_results.append({
                "operation": "large_json_operations",
                "baseline_memory_mb": baseline_memory / (1024 * 1024),
                "serialize_memory_delta_mb": serialize_delta / (1024 * 1024),
                "parse_memory_delta_mb": parse_delta / (1024 * 1024),
                "total_memory_delta_mb": (serialize_delta + parse_delta) / (1024 * 1024),
                "memory_efficient": (serialize_delta + parse_delta) < 100 * 1024 * 1024  # Less than 100MB
            })
            
            # Test memory usage with multiple file loads
            pre_multiload = psutil.virtual_memory().used
            loaded_files = []
            
            for json_file in list(self.artifacts_path.glob("*.json"))[:10]:  # Limit to first 10 files
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        loaded_files.append(data)
                except:
                    pass
            
            post_multiload = psutil.virtual_memory().used
            multiload_delta = post_multiload - pre_multiload
            
            memory_results.append({
                "operation": "multiple_file_loads",
                "files_loaded": len(loaded_files),
                "memory_delta_mb": multiload_delta / (1024 * 1024),
                "memory_per_file_mb": (multiload_delta / len(loaded_files)) / (1024 * 1024) if loaded_files else 0,
                "memory_efficient": multiload_delta < 50 * 1024 * 1024  # Less than 50MB
            })
            
            self.results["memory_footprint"]["results"] = memory_results
            
            # Check efficiency
            all_efficient = all(result.get("memory_efficient", False) for result in memory_results)
            self.results["memory_footprint"]["status"] = "passed" if all_efficient else "failed"
            
            # Calculate memory efficiency score
            if memory_results:
                efficiency_scores = [1.0 if result.get("memory_efficient", False) else 0.5 for result in memory_results]  # TODO: Consider limiting size with itertools.islice()
                self.results["performance_summary"]["memory_efficiency"] = sum(efficiency_scores) / len(efficiency_scores)
            
            return all_efficient
            
        except Exception as e:
            self.results["memory_footprint"]["error"] = str(e)
            self.results["memory_footprint"]["status"] = "failed"
            return False

    def project_scalability(self) -> bool:
        """Project scalability based on current performance"""
        scalability_results = []
        
        try:
            # Get current performance baselines
            json_timing = self.results["json_generation_timing"]["results"]
            file_sizes = self.results["file_size_calculations"]["results"]
            memory_usage = self.results["memory_footprint"]["results"]
            
            if json_timing and file_sizes:
                # Calculate average processing times
                avg_times = [result.get("total_time", 0) for result in json_timing if "total_time" in result]  # TODO: Consider limiting size with itertools.islice()
                avg_processing_time = sum(avg_times) / len(avg_times) if avg_times else 0
                
                # Calculate average file sizes
                avg_sizes = [result.get("actual_file_size", 0) for result in file_sizes if "actual_file_size" in result]  # TODO: Consider limiting size with itertools.islice()
                avg_file_size = sum(avg_sizes) / len(avg_sizes) if avg_sizes else 0
                
                # Project for different scales
                scales = [100, 1000, 10000]  # Number of files
                
                for scale in scales:
                    projected_time = avg_processing_time * scale
                    projected_storage = (avg_file_size * scale) / (1024 * 1024)  # MB
                    projected_memory = projected_storage * 2  # Assume 2x memory overhead
                    
                    scalability_results.append({
                        "scale_files": scale,
                        "projected_processing_time_sec": projected_time,
                        "projected_storage_mb": projected_storage,
                        "projected_memory_mb": projected_memory,
                        "acceptable_performance": projected_time < 300,  # Less than 5 minutes
                        "acceptable_storage": projected_storage < 1000,  # Less than 1GB
                        "acceptable_memory": projected_memory < 2000  # Less than 2GB
                    })
                
                self.results["scalability_projections"]["results"] = scalability_results
                
                # Check if all scales are acceptable
                all_acceptable = all(
                    result["acceptable_performance"] and 
                    result["acceptable_storage"] and 
                    result["acceptable_memory"]
                    for result in scalability_results
                )
                
                self.results["scalability_projections"]["status"] = "passed" if all_acceptable else "limited"
                
                return all_acceptable
            else:
                self.results["scalability_projections"]["error"] = "Insufficient baseline data for projections"
                self.results["scalability_projections"]["status"] = "failed"
                return False
                
        except Exception as e:
            self.results["scalability_projections"]["error"] = str(e)
            self.results["scalability_projections"]["status"] = "failed"
            return False

    def run_validation(self) -> Dict[str, Any]:
        """Execute comprehensive performance validation"""
        start_time = time.time()
        
        print("Running JSON generation timing tests...")
        timing_passed = self.measure_json_generation_timing()
        
        print("Measuring file size calculations...")
        size_passed = self.measure_file_size_calculations()
        
        print("Analyzing memory footprint...")
        memory_passed = self.measure_memory_footprint()
        
        print("Projecting scalability...")
        scalability_passed = self.project_scalability()
        
        # Calculate summary
        if self.results["json_generation_timing"]["results"]:
            avg_times = [r.get("total_time", 0) for r in self.results["json_generation_timing"]  # TODO: Consider limiting size with itertools.islice()["results"] if "total_time" in r]
            self.results["performance_summary"]["avg_generation_time"] = sum(avg_times) / len(avg_times) if avg_times else 0
        
        # Determine overall status
        all_passed = timing_passed and size_passed and memory_passed and scalability_passed
        if all_passed:
            self.results["status"] = "PASSED"
        elif timing_passed and size_passed:
            self.results["status"] = "PASSED_WITH_WARNINGS"
        else:
            self.results["status"] = "FAILED"
        
        return self.results

def main():
    if len(sys.argv) > 1:
        base_path = sys.argv[1]
    else:
        base_path = os.getcwd()
    
    validator = PerformanceValidator(base_path)
    results = validator.run_validation()
    
    # Output results
    print(f"\n=== Performance Validation Results ===")
    print(f"Status: {results['status']}")
    print(f"JSON generation: {results['json_generation_timing']['status']}")
    print(f"File size calculations: {results['file_size_calculations']['status']}")
    print(f"Memory footprint: {results['memory_footprint']['status']}")
    print(f"Scalability projections: {results['scalability_projections']['status']}")
    
    # Summary
    summary = results['performance_summary']
    print(f"\nPerformance Summary:")
    print(f"  Total files analyzed: {summary['total_files']}")
    print(f"  Total size: {summary['total_size_mb']:.2f} MB")
    print(f"  Average generation time: {summary['avg_generation_time']:.4f} sec")
    print(f"  Memory efficiency: {summary['memory_efficiency']:.2f}")
    
    # Save results
    output_file = os.path.join(base_path, ".claude", ".artifacts", "sandbox-validation", "performance_validation_results.json")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if results['status'] in ['PASSED', 'PASSED_WITH_WARNINGS'] else 1

if __name__ == "__main__":
    sys.exit(main())