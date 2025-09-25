#!/usr/bin/env python3
"""Fix escaped newline corruption in ci_cd_accelerator.py"""

import re

file_path = r"C:\Users\17175\Desktop\spek template\analyzer\performance\ci_cd_accelerator.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing imports at the top
imports_to_add = """import statistics
import threading
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable
import logging
logger = logging.getLogger(__name__)

# Check if optimization components are available
try:
from analyzer.optimization.optimization_engine import get_global_optimization_engine
from analyzer.optimization.incremental_analysis_engine import get_global_incremental_engine
from analyzer.optimization.file_cache import get_global_cache
    OPTIMIZATION_COMPONENTS_AVAILABLE = True
except ImportError:
    OPTIMIZATION_COMPONENTS_AVAILABLE = False
"""

old_imports = """import asyncio
import json
import os
import time
import threading
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable
import logging
logger = logging.getLogger(__name__)"""

content = content.replace(old_imports, f"""import asyncio
import json
import os
{imports_to_add}""")

# Fix the escaped newlines - looking for literal \n followed by whitespace
content = re.sub(r'\\n\s+', '\n        ', content)

# Write the fixed content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Fixed {file_path}")
print("Corrupted escaped newlines have been replaced with actual newlines")