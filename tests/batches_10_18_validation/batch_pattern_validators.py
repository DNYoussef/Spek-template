#!/usr/bin/env python3
"""
Pattern-Specific Validators for Batches 10-18
Detailed pattern compliance checking and implementation verification
"""

from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set
import ast
import logging
import re

from abc import ABC, abstractmethod
from dataclasses import dataclass
import importlib.util
import inspect

logger = logging.getLogger(__name__)

@dataclass
class PatternValidationResult:
    """Result of pattern validation."""
    pattern_name: str
    is_implemented: bool
    implementation_quality: float  # 0.0 to 1.0
    found_elements: List[str]
    missing_elements: List[str]
    code_examples: List[str]
    recommendations: List[str]

class PatternValidator(ABC):
    """Abstract base class for pattern validators."""

    @abstractmethod
    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate pattern implementation in given files."""

class ConfigurationPatternValidator(PatternValidator):
    """Validator for Configuration Object and Factory patterns (Batch 10)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate configuration patterns."""
        result = PatternValidationResult(
            pattern_name="Configuration Factory + Validator",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "@dataclass",
            "ConfigBuilder",
            "Factory",
            "Validator",
            "build()",
            "validate()"
        ]

        found_elements = set()
        code_examples = []

        for file_path in file_paths:
            full_path = Path(base_path) / file_path
            if not full_path.exists():
                continue

            try:
                content = full_path.read_text(encoding='utf-8', errors='ignore')

                # Check for dataclass decorator
                if '@dataclass' in content:
                    found_elements.add('@dataclass')
                    # Extract dataclass examples
                    dataclass_matches = re.findall(r'@dataclass\s*\nclass\s+(\w+)', content)
                    for match in dataclass_matches:
                        code_examples.append(f"@dataclass Config: {match}")

                # Check for builder pattern
                if 'ConfigBuilder' in content or 'Builder' in content:
                    found_elements.add('ConfigBuilder')
                    builder_matches = re.findall(r'class\s+(\w*Builder\w*)', content)
                    for match in builder_matches:
                        code_examples.append(f"Builder class: {match}")

                # Check for factory pattern
                if re.search(r'(create_|factory|Factory)', content, re.IGNORECASE):
                    found_elements.add('Factory')

                # Check for validation methods
                if re.search(r'(validate|check_|verify)', content):
                    found_elements.add('Validator')

                # Check for build method
                if 'def build(' in content:
                    found_elements.add('build()')

                # Check for validate method
                if 'def validate(' in content:
                    found_elements.add('validate()')

            except Exception as e:
                logger.warning(f"Error analyzing {file_path}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.7

        # Generate recommendations
        if '@dataclass' not in found_elements:
            result.recommendations.append("Implement configuration objects using @dataclass")
        if 'ConfigBuilder' not in found_elements:
            result.recommendations.append("Implement Builder pattern for complex configurations")
        if 'Factory' not in found_elements:
            result.recommendations.append("Add Factory methods for configuration creation")
        if 'Validator' not in found_elements:
            result.recommendations.append("Add validation methods for configuration integrity")

        return result

class PipelinePatternValidator(PatternValidator):
    """Validator for Pipeline and Chain of Responsibility patterns (Batch 11)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate pipeline patterns."""
        result = PatternValidationResult(
            pattern_name="Pipeline + Chain of Responsibility",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Pipeline",
            "Processor",
            "process()",
            "chain",
            "next_handler",
            "handle()"
        ]

        found_elements = set()
        code_examples = []

        for file_path in file_paths:
            full_path = Path(base_path) / file_path
            if not full_path.exists():
                if full_path.is_dir():
                    # Check directory for pipeline implementations
                    for py_file in full_path.rglob("*.py"):
                        self._analyze_pipeline_file(py_file, found_elements, code_examples)
                continue

            self._analyze_pipeline_file(full_path, found_elements, code_examples)

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.6

        # Generate recommendations
        if 'Pipeline' not in found_elements:
            result.recommendations.append("Implement Pipeline class for data flow orchestration")
        if 'Processor' not in found_elements:
            result.recommendations.append("Create Processor interface for pluggable data processing")
        if 'chain' not in found_elements:
            result.recommendations.append("Implement Chain of Responsibility for request handling")

        return result

    def _analyze_pipeline_file(self, file_path: Path, found_elements: set, code_examples: list):
        """Analyze a single file for pipeline patterns."""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')

            # Check for pipeline class
            if re.search(r'class\s+\w*Pipeline\w*', content):
                found_elements.add('Pipeline')
                pipeline_matches = re.findall(r'class\s+(\w*Pipeline\w*)', content)
                for match in pipeline_matches:
                    code_examples.append(f"Pipeline class: {match}")

            # Check for processor interface
            if re.search(r'class\s+\w*Processor\w*', content):
                found_elements.add('Processor')

            # Check for process method
            if 'def process(' in content:
                found_elements.add('process()')

            # Check for chain pattern
            if re.search(r'(chain|next_handler)', content, re.IGNORECASE):
                found_elements.add('chain')

            # Check for handler pattern
            if 'next_handler' in content:
                found_elements.add('next_handler')

            if 'def handle(' in content:
                found_elements.add('handle()')

        except Exception as e:
            logger.warning(f"Error analyzing pipeline file {file_path}: {e}")

class StrategyPatternValidator(PatternValidator):
    """Validator for Strategy and Calculator Factory patterns (Batch 12)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate strategy patterns."""
        result = PatternValidationResult(
            pattern_name="Strategy + Calculator Factory",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Strategy",
            "calculate()",
            "Factory",
            "create_calculator",
            "algorithm",
            "ABC"
        ]

        found_elements = set()
        code_examples = []

        for file_path in file_paths:
            full_path = Path(base_path) / file_path
            if not full_path.exists():
                continue

            try:
                content = full_path.read_text(encoding='utf-8', errors='ignore')

                # Check for strategy pattern
                if re.search(r'class\s+\w*Strategy\w*', content):
                    found_elements.add('Strategy')

                # Check for calculate methods
                if 'def calculate(' in content:
                    found_elements.add('calculate()')

                # Check for factory pattern
                if re.search(r'(Factory|create_)', content):
                    found_elements.add('Factory')

                # Check for calculator creation
                if 'create_calculator' in content:
                    found_elements.add('create_calculator')

                # Check for algorithm implementations
                if re.search(r'(algorithm|method|kelly|position)', content, re.IGNORECASE):
                    found_elements.add('algorithm')

                # Check for abstract base class usage
                if 'ABC' in content or 'abstractmethod' in content:
                    found_elements.add('ABC')

                # Extract strategy examples
                strategy_matches = re.findall(r'class\s+(\w*Strategy\w*|\w*Calculator\w*)', content)
                for match in strategy_matches:
                    code_examples.append(f"Strategy implementation: {match}")

            except Exception as e:
                logger.warning(f"Error analyzing strategy file {file_path}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.6

        # Generate recommendations
        if 'Strategy' not in found_elements:
            result.recommendations.append("Implement Strategy pattern for different calculation algorithms")
        if 'Factory' not in found_elements:
            result.recommendations.append("Add Factory pattern for calculator creation")
        if 'ABC' not in found_elements:
            result.recommendations.append("Use abstract base classes for strategy interfaces")

        return result

class ObserverPatternValidator(PatternValidator):
    """Validator for Observer and State Machine patterns (Batch 13)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate observer patterns."""
        result = PatternValidationResult(
            pattern_name="Observer + State Machine",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Observer",
            "notify",
            "subscribe",
            "State",
            "transition",
            "state_machine"
        ]

        found_elements = set()
        code_examples = []

        for file_path in file_paths:
            full_path = Path(base_path) / file_path
            if not full_path.exists():
                continue

            try:
                content = full_path.read_text(encoding='utf-8', errors='ignore')

                # Check for observer pattern
                if re.search(r'(Observer|observer)', content):
                    found_elements.add('Observer')

                # Check for notification methods
                if re.search(r'(notify|update)', content):
                    found_elements.add('notify')

                # Check for subscription methods
                if re.search(r'(subscribe|listen|attach)', content):
                    found_elements.add('subscribe')

                # Check for state pattern
                if re.search(r'(State|state)', content):
                    found_elements.add('State')

                # Check for transition methods
                if re.search(r'(transition|change_state)', content):
                    found_elements.add('transition')

                # Check for state machine
                if re.search(r'(state_machine|StateMachine)', content):
                    found_elements.add('state_machine')

                # Extract observer examples
                observer_matches = re.findall(r'class\s+(\w*Observer\w*|\w*State\w*)', content)
                for match in observer_matches:
                    code_examples.append(f"Observer/State class: {match}")

            except Exception as e:
                logger.warning(f"Error analyzing observer file {file_path}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.6

        # Generate recommendations
        if 'Observer' not in found_elements:
            result.recommendations.append("Implement Observer pattern for event notifications")
        if 'State' not in found_elements:
            result.recommendations.append("Add State Machine pattern for trading state management")

        return result

class SafetyChainPatternValidator(PatternValidator):
    """Validator for Safety Chain of Responsibility and Observer patterns (Batch 14)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate safety chain patterns."""
        result = PatternValidationResult(
            pattern_name="Safety Chain of Responsibility + Observer",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "SafetyHandler",
            "escalate",
            "chain",
            "monitor",
            "emergency",
            "failover"
        ]

        found_elements = set()
        code_examples = []

        # Check safety directory and files
        safety_path = Path(base_path) / "src" / "safety"
        if safety_path.exists():
            for py_file in safety_path.rglob("*.py"):
                try:
                    content = py_file.read_text(encoding='utf-8', errors='ignore')

                    # Check for safety handler pattern
                    if re.search(r'(Handler|handler)', content):
                        found_elements.add('SafetyHandler')

                    # Check for escalation methods
                    if re.search(r'(escalate|escalation)', content, re.IGNORECASE):
                        found_elements.add('escalate')

                    # Check for chain pattern
                    if re.search(r'(chain|next)', content, re.IGNORECASE):
                        found_elements.add('chain')

                    # Check for monitoring
                    if re.search(r'(monitor|monitoring)', content, re.IGNORECASE):
                        found_elements.add('monitor')

                    # Check for emergency handling
                    if re.search(r'(emergency|critical)', content, re.IGNORECASE):
                        found_elements.add('emergency')

                    # Check for failover mechanisms
                    if re.search(r'(failover|fallback)', content, re.IGNORECASE):
                        found_elements.add('failover')

                    # Extract safety examples
                    safety_matches = re.findall(r'class\s+(\w*Safety\w*|\w*Handler\w*|\w*Monitor\w*)', content)
                    for match in safety_matches:
                        code_examples.append(f"Safety class: {match}")

                except Exception as e:
                    logger.warning(f"Error analyzing safety file {py_file}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.6

        # Generate recommendations
        if 'SafetyHandler' not in found_elements:
            result.recommendations.append("Implement SafetyHandler classes for escalation chains")
        if 'escalate' not in found_elements:
            result.recommendations.append("Add escalation methods for safety incidents")
        if 'monitor' not in found_elements:
            result.recommendations.append("Implement monitoring observers for safety systems")

        return result

class StreamingPatternValidator(PatternValidator):
    """Validator for Stream, Observer, and Buffer patterns (Batch 15)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate streaming patterns."""
        result = PatternValidationResult(
            pattern_name="Stream + Observer + Buffer",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Stream",
            "Buffer",
            "Observer",
            "process_stream",
            "buffer_data",
            "notify_observers"
        ]

        found_elements = set()
        code_examples = []

        # Check streaming directories
        streaming_paths = [
            Path(base_path) / "analyzer" / "streaming",
            Path(base_path) / "src" / "intelligence" / "data_pipeline" / "streaming"
        ]

        for streaming_path in streaming_paths:
            if streaming_path.exists():
                for py_file in streaming_path.rglob("*.py"):
                    try:
                        content = py_file.read_text(encoding='utf-8', errors='ignore')

                        # Check for stream pattern
                        if re.search(r'(Stream|stream)', content):
                            found_elements.add('Stream')

                        # Check for buffer pattern
                        if re.search(r'(Buffer|buffer|queue)', content):
                            found_elements.add('Buffer')

                        # Check for observer pattern
                        if re.search(r'(Observer|observer)', content):
                            found_elements.add('Observer')

                        # Check for stream processing
                        if re.search(r'(process_stream|stream_process)', content):
                            found_elements.add('process_stream')

                        # Check for buffering
                        if re.search(r'(buffer_data|buffering)', content):
                            found_elements.add('buffer_data')

                        # Check for observer notification
                        if re.search(r'(notify_observers|notify)', content):
                            found_elements.add('notify_observers')

                        # Extract streaming examples
                        streaming_matches = re.findall(r'class\s+(\w*Stream\w*|\w*Buffer\w*)', content)
                        for match in streaming_matches:
                            code_examples.append(f"Streaming class: {match}")

                    except Exception as e:
                        logger.warning(f"Error analyzing streaming file {py_file}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.5

        # Generate recommendations
        if 'Stream' not in found_elements:
            result.recommendations.append("Implement Stream processing classes")
        if 'Buffer' not in found_elements:
            result.recommendations.append("Add Buffer pattern for stream data management")

        return result

class EnterprisePatternValidator(PatternValidator):
    """Validator for Adapter and Bridge patterns (Batch 16)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate enterprise patterns."""
        result = PatternValidationResult(
            pattern_name="Adapter + Bridge",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Adapter",
            "Bridge",
            "adapt",
            "bridge",
            "Interface",
            "Integration"
        ]

        found_elements = set()
        code_examples = []

        # Check enterprise and adapter directories
        enterprise_paths = [
            Path(base_path) / "src" / "enterprise",
            Path(base_path) / "src" / "adapters"
        ]

        for enterprise_path in enterprise_paths:
            if enterprise_path.exists():
                for py_file in enterprise_path.rglob("*.py"):
                    try:
                        content = py_file.read_text(encoding='utf-8', errors='ignore')

                        # Check for adapter pattern
                        if re.search(r'(Adapter|adapter)', content):
                            found_elements.add('Adapter')

                        # Check for bridge pattern
                        if re.search(r'(Bridge|bridge)', content):
                            found_elements.add('Bridge')

                        # Check for adaptation methods
                        if re.search(r'(adapt|convert)', content):
                            found_elements.add('adapt')

                        # Check for bridging methods
                        if re.search(r'(bridge|connect)', content):
                            found_elements.add('bridge')

                        # Check for interface pattern
                        if re.search(r'(Interface|interface)', content):
                            found_elements.add('Interface')

                        # Check for integration pattern
                        if re.search(r'(Integration|integration)', content):
                            found_elements.add('Integration')

                        # Extract enterprise examples
                        enterprise_matches = re.findall(r'class\s+(\w*Adapter\w*|\w*Bridge\w*|\w*Integration\w*)', content)
                        for match in enterprise_matches:
                            code_examples.append(f"Enterprise class: {match}")

                    except Exception as e:
                        logger.warning(f"Error analyzing enterprise file {py_file}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.6

        # Generate recommendations
        if 'Adapter' not in found_elements:
            result.recommendations.append("Implement Adapter pattern for external system integration")
        if 'Bridge' not in found_elements:
            result.recommendations.append("Add Bridge pattern for abstraction decoupling")

        return result

class NeuralPatternValidator(PatternValidator):
    """Validator for Factory and Template Method patterns (Batch 17)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate neural patterns."""
        result = PatternValidationResult(
            pattern_name="Neural Factory + Template Method",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "NeuralFactory",
            "Template",
            "create_model",
            "train_template",
            "abstract_method",
            "lifecycle"
        ]

        found_elements = set()
        code_examples = []

        # Check neural networks directory
        neural_path = Path(base_path) / "src" / "intelligence" / "neural_networks"
        if neural_path.exists():
            for py_file in neural_path.rglob("*.py"):
                try:
                    content = py_file.read_text(encoding='utf-8', errors='ignore')

                    # Check for factory pattern
                    if re.search(r'(Factory|factory)', content):
                        found_elements.add('NeuralFactory')

                    # Check for template pattern
                    if re.search(r'(Template|template)', content):
                        found_elements.add('Template')

                    # Check for model creation
                    if re.search(r'(create_model|create_)', content):
                        found_elements.add('create_model')

                    # Check for training template
                    if re.search(r'(train|training)', content):
                        found_elements.add('train_template')

                    # Check for abstract methods
                    if re.search(r'(abstractmethod|abstract)', content):
                        found_elements.add('abstract_method')

                    # Check for lifecycle management
                    if re.search(r'(lifecycle|manager)', content, re.IGNORECASE):
                        found_elements.add('lifecycle')

                    # Extract neural examples
                    neural_matches = re.findall(r'class\s+(\w*Neural\w*|\w*Factory\w*|\w*Template\w*)', content)
                    for match in neural_matches:
                        code_examples.append(f"Neural class: {match}")

                except Exception as e:
                    logger.warning(f"Error analyzing neural file {py_file}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.5

        # Generate recommendations
        if 'NeuralFactory' not in found_elements:
            result.recommendations.append("Implement Factory pattern for neural network creation")
        if 'Template' not in found_elements:
            result.recommendations.append("Add Template Method pattern for training workflows")

        return result

class ByzantinePatternValidator(PatternValidator):
    """Validator for Command, State, and Observer patterns (Batch 18)."""

    def validate(self, file_paths: List[str], base_path: str) -> PatternValidationResult:
        """Validate byzantine patterns."""
        result = PatternValidationResult(
            pattern_name="Byzantine Command + State + Observer",
            is_implemented=False,
            implementation_quality=0.0,
            found_elements=[],
            missing_elements=[],
            code_examples=[],
            recommendations=[]
        )

        required_elements = [
            "Command",
            "execute",
            "State",
            "Observer",
            "consensus",
            "byzantine"
        ]

        found_elements = set()
        code_examples = []

        # Check byzantium directory
        byzantine_path = Path(base_path) / "src" / "byzantium"
        if byzantine_path.exists():
            for py_file in byzantine_path.rglob("*.py"):
                try:
                    content = py_file.read_text(encoding='utf-8', errors='ignore')

                    # Check for command pattern
                    if re.search(r'(Command|command)', content):
                        found_elements.add('Command')

                    # Check for execute methods
                    if re.search(r'(execute|run)', content):
                        found_elements.add('execute')

                    # Check for state pattern
                    if re.search(r'(State|state)', content):
                        found_elements.add('State')

                    # Check for observer pattern
                    if re.search(r'(Observer|observer)', content):
                        found_elements.add('Observer')

                    # Check for consensus mechanisms
                    if re.search(r'(consensus|agreement)', content, re.IGNORECASE):
                        found_elements.add('consensus')

                    # Check for byzantine handling
                    if re.search(r'(byzantine|fault)', content, re.IGNORECASE):
                        found_elements.add('byzantine')

                    # Extract byzantine examples
                    byzantine_matches = re.findall(r'class\s+(\w*Command\w*|\w*Byzantine\w*|\w*Consensus\w*)', content)
                    for match in byzantine_matches:
                        code_examples.append(f"Byzantine class: {match}")

                except Exception as e:
                    logger.warning(f"Error analyzing byzantine file {py_file}: {e}")

        result.found_elements = list(found_elements)
        result.missing_elements = [elem for elem in required_elements if elem not in found_elements]
        result.code_examples = code_examples

        # Calculate implementation quality
        result.implementation_quality = len(found_elements) / len(required_elements)
        result.is_implemented = result.implementation_quality >= 0.5

        # Generate recommendations
        if 'Command' not in found_elements:
            result.recommendations.append("Implement Command pattern for consensus operations")
        if 'consensus' not in found_elements:
            result.recommendations.append("Add consensus algorithms for byzantine fault tolerance")

        return result

class BatchPatternValidatorFactory:
    """Factory for creating batch-specific pattern validators."""

    @staticmethod
    def create_validator(batch_id: int) -> PatternValidator:
        """Create appropriate validator for batch ID."""
        validators = {
            10: ConfigurationPatternValidator(),
            11: PipelinePatternValidator(),
            12: StrategyPatternValidator(),
            13: ObserverPatternValidator(),
            14: SafetyChainPatternValidator(),
            15: StreamingPatternValidator(),
            16: EnterprisePatternValidator(),
            17: NeuralPatternValidator(),
            18: ByzantinePatternValidator()
        }

        validator = validators.get(batch_id)
        if not validator:
            raise ValueError(f"No validator available for batch {batch_id}")

        return validator

    @staticmethod
    def validate_all_batches(base_path: str, batch_configs: Dict[int, Dict[str, Any]]) -> Dict[int, PatternValidationResult]:
        """Validate all batch patterns."""
        results = {}

        for batch_id, config in batch_configs.items():
            try:
                validator = BatchPatternValidatorFactory.create_validator(batch_id)
                result = validator.validate(config.get('primary_paths', []), base_path)
                results[batch_id] = result

                logger.info(f"Batch {batch_id} pattern validation: {result.implementation_quality:.1%} quality")

            except Exception as e:
                logger.error(f"Failed to validate batch {batch_id}: {e}")
                # Create failed result
                results[batch_id] = PatternValidationResult(
                    pattern_name=f"Batch {batch_id}",
                    is_implemented=False,
                    implementation_quality=0.0,
                    found_elements=[],
                    missing_elements=["validation_failed"],
                    code_examples=[],
                    recommendations=[f"Fix validation error: {str(e)}"]
                )

        return results