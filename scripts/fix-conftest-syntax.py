#!/usr/bin/env python3
"""
Fix conftest.py syntax errors - systematic pattern replacement
Pattern: function() \\n args \\n ( ) -> function(args)
"""
import re

file_path = r"C:\Users\17175\Desktop\spek template\tests\phase7_adas\conftest.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: config.addinivalue_line() on wrong line (5 instances)
content = re.sub(
    r'config\.addinivalue_line\(\)\s+"markers",\s+"([^"]+)"\s+\(\s+\)',
    r'config.addinivalue_line(\n        "markers", "\1"\n    )',
    content
)

# Pattern 2: self.test_results.append({) on wrong line
content = re.sub(
    r'self\.test_results\.append\(\{\)\s+"test_name":\s+test_name,\s+"result":\s+result,\s+"timestamp":\s+time\.time\(\)\s+\(\s+\}\)',
    r'self.test_results.append({\n                "test_name": test_name,\n                "result": result,\n                "timestamp": time.time()\n            })',
    content
)

# Pattern 3: vehicles.append({) on wrong line
content = re.sub(
    r'vehicles\.append\(\{\)\s+"id":\s+f"vehicle_\{i\}",\s+"position":\s+\[i \* 10\.0,\s+50\.0 \+ i \* 20\.0,\s+0\.0\],\s+"velocity":\s+\[0\.0,\s+15\.0 \+ np\.random\.uniform\(-5,\s+5\),\s+0\.0\],\s+"dimensions":\s+\[4\.5,\s+1\.8,\s+1\.5\],\s+"type":\s+"vehicle"\s+\(\s+\}\)',
    r'vehicles.append({\n            "id": f"vehicle_{i}",\n            "position": [i * 10.0, 50.0 + i * 20.0, 0.0],\n            "velocity": [0.0, 15.0 + np.random.uniform(-5, 5), 0.0],\n            "dimensions": [4.5, 1.8, 1.5],\n            "type": "vehicle"\n        })',
    content
)

# Pattern 4: pedestrians.append({) on wrong line
content = re.sub(
    r'pedestrians\.append\(\{\)\s+"id":\s+f"pedestrian_\{i\}",\s+"position":\s+\[5\.0 \+ i \* 3\.0,\s+10\.0 \+ i \* 5\.0,\s+0\.0\],\s+"velocity":\s+\[1\.0,\s+0\.5,\s+0\.0\],\s+"dimensions":\s+\[0\.6,\s+0\.4,\s+1\.7\],\s+"type":\s+"pedestrian"\s+\(\s+\}\)',
    r'pedestrians.append({\n            "id": f"pedestrian_{i}",\n            "position": [5.0 + i * 3.0, 10.0 + i * 5.0, 0.0],\n            "velocity": [1.0, 0.5, 0.0],\n            "dimensions": [0.6, 0.4, 1.7],\n            "type": "pedestrian"\n        })',
    content
)

# Pattern 5: self.metrics.append({) on wrong line
content = re.sub(
    r'self\.metrics\.append\(\{\)\s+"name":\s+name,\s+"value":\s+value,\s+"unit":\s+unit,\s+"timestamp":\s+timestamp\s+\(\s+\}\)',
    r'self.metrics.append({\n            "name": name,\n            "value": value,\n            "unit": unit,\n            "timestamp": timestamp\n        })',
    content
)

# Pattern 6: parser.addoption() on wrong line (3 instances)
content = re.sub(
    r'parser\.addoption\(\)\s+"--run-slow",\s+action="store_true",\s+default=False,\s+help="Run slow tests"\s+\(\s+\)',
    r'parser.addoption(\n        "--run-slow",\n        action="store_true",\n        default=False,\n        help="Run slow tests"\n    )',
    content
)

content = re.sub(
    r'parser\.addoption\(\)\s+"--safety-only",\s+action="store_true",\s+default=False,\s+help="Run only safety-critical tests"\s+\(\s+\)',
    r'parser.addoption(\n        "--safety-only",\n        action="store_true",\n        default=False,\n        help="Run only safety-critical tests"\n    )',
    content
)

content = re.sub(
    r'parser\.addoption\(\)\s+"--performance-only",\s+action="store_true",\s+default=False,\s+help="Run only performance tests"\s+\(\s+\)',
    r'parser.addoption(\n        "--performance-only",\n        action="store_true",\n        default=False,\n        help="Run only performance tests"\n    )',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed conftest.py syntax errors")
