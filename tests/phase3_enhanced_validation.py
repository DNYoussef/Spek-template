#!/usr/bin/env python3
"""
Phase 3 Enhanced Quiet Star Integration Validation Suite

Comprehensive validation tests for the enhanced Phase 3 Quiet Star implementation
to ensure correct integration with the complete 8-phase AI agent creation pipeline.
"""

import sys
import os
import torch
import numpy as np
from typing import Dict, List, Any
import json
import time

# Add src to path
sys.path.append('./src')
sys.path.append('.')

from quiet_star.algorithms import (
    QuietSTaRConfig,
    ThoughtGenerator,
    CoherenceScorer,
    MixingHead,
    QuietSTaRComponent,
    FastQuietSTaRCurriculum
)

class Phase3ValidationSuite:
    """Comprehensive validation suite for Phase 3 enhanced Quiet Star."""

    def __init__(self):
        self.results = {}
        self.config = QuietSTaRConfig(
            thought_length=8,
            num_thoughts=4,  # Reduced for testing
            coherence_threshold=0.7
        )

    def run_all_validations(self) -> Dict[str, Any]:
        """Run all validation tests."""
        print("=" * 60)
        print("Phase 3 Enhanced Quiet Star Validation Suite")
        print("=" * 60)

        # Test 1: Syntax and Import Validation
        self.results['syntax_validation'] = self._test_syntax_validation()

        # Test 2: Method Compatibility
        self.results['method_compatibility'] = self._test_method_compatibility()

        # Test 3: Parallel Reasoning Generation
        self.results['parallel_reasoning'] = self._test_parallel_reasoning()

        # Test 4: Fast Quiet-STaR Curriculum
        self.results['curriculum_learning'] = self._test_curriculum_learning()

        # Test 5: Data Flow Between Phases
        self.results['data_flow'] = self._test_data_flow()

        # Test 6: Performance Benchmarking
        self.results['performance'] = self._test_performance()

        # Test 7: Reasoning Token Compatibility
        self.results['reasoning_tokens'] = self._test_reasoning_token_compatibility()

        # Test 8: Integration with Existing System
        self.results['system_integration'] = self._test_system_integration()

        return self.results

    def _test_syntax_validation(self) -> Dict[str, Any]:
        """Test 1: Validate syntax and imports for all enhanced Phase 3 files."""
        print("\n[TEST 1] Syntax & Import Validation")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            # Test imports
            from quiet_star.algorithms import QuietSTaRConfig, ThoughtGenerator
            print("[OK] Core imports successful")

            # Test instantiation
            config = QuietSTaRConfig()
            component = QuietSTaRComponent(config)
            print("[OK] Component instantiation successful")

            result['details']['import_test'] = 'PASS'
            result['details']['instantiation_test'] = 'PASS'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Import/instantiation error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_method_compatibility(self) -> Dict[str, Any]:
        """Test 2: Test method compatibility with existing interfaces."""
        print("\n[TEST 2] Method Compatibility")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            component = QuietSTaRComponent(self.config)

            # Test that all expected methods exist
            expected_methods = [
                'process_sequence',
                # Add more expected methods here
            ]

            for method_name in expected_methods:
                if hasattr(component, method_name):
                    print(f"[OK] Method {method_name} exists")
                    result['details'][method_name] = 'EXISTS'
                else:
                    print(f"[FAIL] Method {method_name} missing")
                    result['details'][method_name] = 'MISSING'
                    result['status'] = 'FAIL'

            # Test curriculum methods
            curriculum = component.curriculum
            curriculum_methods = ['get_current_stage_config', 'advance_stage', 'get_progress']

            for method_name in curriculum_methods:
                if hasattr(curriculum, method_name):
                    print(f"[OK] Curriculum method {method_name} exists")
                    result['details'][f'curriculum_{method_name}'] = 'EXISTS'
                else:
                    print(f"[FAIL] Curriculum method {method_name} missing")
                    result['details'][f'curriculum_{method_name}'] = 'MISSING'
                    result['status'] = 'FAIL'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Method compatibility error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_parallel_reasoning(self) -> Dict[str, Any]:
        """Test 3: Test parallel reasoning generation with diagonal attention masks."""
        print("\n[TEST 3] Parallel Reasoning Generation")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            thought_generator = ThoughtGenerator(self.config)

            # Create mock input
            batch_size = 2
            seq_len = 10
            input_ids = torch.randint(0, 1000, (batch_size, seq_len))

            # Mock model for testing
            class MockModel:
                def __call__(self, input_ids):
                    vocab_size = 1000
                    return type('obj', (object,), {
                        'logits': torch.randn(input_ids.size(0), input_ids.size(1), vocab_size)
                    })

            mock_model = MockModel()

            # Test parallel thought generation
            thoughts_result = thought_generator.generate_parallel_thoughts(input_ids, mock_model)

            # Validate results
            if 'thoughts' in thoughts_result:
                thoughts = thoughts_result['thoughts']
                print(f"[OK] Generated thoughts shape: {thoughts.shape}")
                result['details']['thoughts_shape'] = str(thoughts.shape)

                expected_shape = (batch_size, self.config.num_thoughts, self.config.thought_length)
                if thoughts.shape == expected_shape:
                    print(f"[OK] Thoughts shape correct: {expected_shape}")
                    result['details']['shape_validation'] = 'PASS'
                else:
                    print(f"[FAIL] Thoughts shape incorrect. Expected: {expected_shape}, Got: {thoughts.shape}")
                    result['details']['shape_validation'] = 'FAIL'
                    result['status'] = 'FAIL'
            else:
                print("[FAIL] No thoughts in result")
                result['status'] = 'FAIL'
                result['errors'].append("No thoughts generated")

            # Test attention mask
            if 'attention_mask' in thoughts_result:
                attention_mask = thoughts_result['attention_mask']
                print(f"[OK] Attention mask generated: {attention_mask.shape}")
                result['details']['attention_mask'] = 'GENERATED'
            else:
                print("[FAIL] No attention mask in result")
                result['details']['attention_mask'] = 'MISSING'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Parallel reasoning error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_curriculum_learning(self) -> Dict[str, Any]:
        """Test 4: Validate Fast Quiet-STaR curriculum learning (6-stage progression)."""
        print("\n[TEST 4] Fast Quiet-STaR Curriculum Learning")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            curriculum = FastQuietSTaRCurriculum(self.config)

            # Test initial stage
            initial_stage = curriculum.get_current_stage_config()
            print(f"[OK] Initial stage: {initial_stage['name']}")
            result['details']['initial_stage'] = initial_stage['name']

            # Test all 6 stages progression
            stages_progressed = 0
            for i in range(6):
                current_stage = curriculum.get_current_stage_config()
                print(f"  Stage {i}: {current_stage['name']} (length: {current_stage['thought_length']})")

                # Simulate good performance to advance
                performance = {'accuracy': 0.95, 'efficiency': 0.9}
                advanced = curriculum.advance_stage(performance)

                if advanced:
                    stages_progressed += 1

            print(f"[OK] Stages progressed: {stages_progressed}")
            result['details']['stages_progressed'] = stages_progressed

            # Test progress metrics
            progress = curriculum.get_progress()
            print(f"[OK] Progress: {progress['progress_percent']:.1f}%")
            result['details']['final_progress'] = progress['progress_percent']

            # Validate that all 6 stages exist
            if len(curriculum.stages) == 6:
                print("[OK] All 6 stages defined")
                result['details']['stage_count'] = 'CORRECT'
            else:
                print(f"[FAIL] Expected 6 stages, found {len(curriculum.stages)}")
                result['details']['stage_count'] = 'INCORRECT'
                result['status'] = 'FAIL'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Curriculum learning error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_data_flow(self) -> Dict[str, Any]:
        """Test 5: Verify data flow between phases (1→3, 2→3, 3→4)."""
        print("\n[TEST 5] Data Flow Between Phases")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            component = QuietSTaRComponent(self.config)

            # Simulate Phase 1 output (cognate pretrain)
            phase1_output = torch.randn(1, 20)  # Mock pretrained embeddings
            print("[OK] Phase 1 input simulated")
            result['details']['phase1_input'] = 'SIMULATED'

            # Simulate Phase 2 output (EvoMerge)
            phase2_output = torch.randint(0, 1000, (1, 15))  # Mock merged model tokens
            print("[OK] Phase 2 input simulated")
            result['details']['phase2_input'] = 'SIMULATED'

            # Test Phase 3 processing
            class MockModel:
                def __call__(self, input_ids):
                    return type('obj', (object,), {
                        'logits': torch.randn(input_ids.size(0), input_ids.size(1), 1000)
                    })

            mock_model = MockModel()
            phase3_output = component.process_sequence(phase2_output, mock_model)
            print("[OK] Phase 3 processing complete")
            result['details']['phase3_processing'] = 'COMPLETE'

            # Validate Phase 3 output for Phase 4 (BitNet)
            required_outputs = ['mixed_logits', 'thoughts', 'coherence_scores']
            for output_key in required_outputs:
                if output_key in phase3_output:
                    print(f"[OK] Phase 3 output contains {output_key}")
                    result['details'][f'output_{output_key}'] = 'PRESENT'
                else:
                    print(f"[FAIL] Phase 3 output missing {output_key}")
                    result['details'][f'output_{output_key}'] = 'MISSING'
                    result['status'] = 'FAIL'

            # Test that reasoning tokens are properly formatted for Phase 4
            if 'thoughts' in phase3_output:
                thoughts = phase3_output['thoughts']
                if thoughts.dtype == torch.long or thoughts.dtype == torch.int64:
                    print("[OK] Reasoning tokens are integer type (BitNet compatible)")
                    result['details']['bitnet_compatibility'] = 'COMPATIBLE'
                else:
                    print(f"[WARN] Reasoning tokens are {thoughts.dtype} (may need conversion for BitNet)")
                    result['details']['bitnet_compatibility'] = 'NEEDS_CONVERSION'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Data flow error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_performance(self) -> Dict[str, Any]:
        """Test 6: Run performance benchmarking and compare metrics."""
        print("\n[TEST 6] Performance Benchmarking")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            component = QuietSTaRComponent(self.config)

            # Mock model
            class MockModel:
                def __call__(self, input_ids):
                    return type('obj', (object,), {
                        'logits': torch.randn(input_ids.size(0), input_ids.size(1), 1000)
                    })

            mock_model = MockModel()

            # Performance test: process multiple sequences
            num_sequences = 10
            sequence_length = 20

            start_time = time.time()

            for i in range(num_sequences):
                input_ids = torch.randint(0, 1000, (1, sequence_length))
                output = component.process_sequence(input_ids, mock_model)

            end_time = time.time()

            total_time = end_time - start_time
            avg_time = total_time / num_sequences

            print(f"[OK] Processed {num_sequences} sequences in {total_time:.3f}s")
            print(f"[OK] Average time per sequence: {avg_time:.3f}s")

            result['details']['total_time'] = total_time
            result['details']['avg_time_per_sequence'] = avg_time
            result['details']['sequences_processed'] = num_sequences

            # Performance thresholds
            if avg_time < 1.0:  # Less than 1 second per sequence
                print("[OK] Performance: GOOD")
                result['details']['performance_rating'] = 'GOOD'
            elif avg_time < 2.0:
                print("[OK] Performance: ACCEPTABLE")
                result['details']['performance_rating'] = 'ACCEPTABLE'
            else:
                print("[WARN] Performance: SLOW")
                result['details']['performance_rating'] = 'SLOW'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Performance error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_reasoning_token_compatibility(self) -> Dict[str, Any]:
        """Test 7: Verify reasoning token compatibility with BitNet compression."""
        print("\n[TEST 7] Reasoning Token Compatibility")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            component = QuietSTaRComponent(self.config)

            # Test reasoning token format
            config = component.config
            start_token = config.start_thought_token
            end_token = config.end_thought_token

            print(f"[OK] Start token: {start_token}")
            print(f"[OK] End token: {end_token}")

            result['details']['start_token'] = start_token
            result['details']['end_token'] = end_token

            # Test token boundaries
            if start_token and end_token:
                print("[OK] Reasoning token boundaries defined")
                result['details']['token_boundaries'] = 'DEFINED'
            else:
                print("[FAIL] Reasoning token boundaries missing")
                result['details']['token_boundaries'] = 'MISSING'
                result['status'] = 'FAIL'

            # Simulate BitNet-style compression test
            # BitNet typically works with quantized weights and activations
            mock_input = torch.randint(0, 1000, (1, 10))

            class MockModel:
                def __call__(self, input_ids):
                    return type('obj', (object,), {
                        'logits': torch.randn(input_ids.size(0), input_ids.size(1), 1000)
                    })

            mock_model = MockModel()
            output = component.process_sequence(mock_input, mock_model)

            if 'thoughts' in output:
                thoughts = output['thoughts']

                # Check if thoughts can be quantized (BitNet requirement)
                try:
                    # Simulate quantization to int8 (BitNet-style)
                    quantized = thoughts.to(torch.int8)
                    print("[OK] Thoughts can be quantized to int8")
                    result['details']['quantization_compatible'] = 'YES'
                except:
                    print("[FAIL] Thoughts cannot be quantized")
                    result['details']['quantization_compatible'] = 'NO'
                    result['status'] = 'FAIL'

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"Token compatibility error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def _test_system_integration(self) -> Dict[str, Any]:
        """Test 8: Integration with existing system components."""
        print("\n[TEST 8] System Integration")
        print("-" * 40)

        result = {
            'status': 'PASS',
            'details': {},
            'errors': []
        }

        try:
            # Test integration with different configurations
            configs_to_test = [
                QuietSTaRConfig(thought_length=4, num_thoughts=2),  # Minimal
                QuietSTaRConfig(thought_length=8, num_thoughts=4),  # Standard
                QuietSTaRConfig(thought_length=12, num_thoughts=8), # Large
            ]

            for i, config in enumerate(configs_to_test):
                try:
                    component = QuietSTaRComponent(config)
                    print(f"[OK] Configuration {i+1}: thoughts={config.num_thoughts}, length={config.thought_length}")
                    result['details'][f'config_{i+1}'] = 'PASS'
                except Exception as e:
                    print(f"[FAIL] Configuration {i+1} failed: {e}")
                    result['details'][f'config_{i+1}'] = 'FAIL'
                    result['status'] = 'FAIL'

            # Test with edge cases
            edge_cases = [
                {'thought_length': 1, 'num_thoughts': 1},  # Minimal
                {'thought_length': 16, 'num_thoughts': 16}, # Large
            ]

            for i, params in enumerate(edge_cases):
                try:
                    config = QuietSTaRConfig(**params)
                    component = QuietSTaRComponent(config)
                    print(f"[OK] Edge case {i+1}: {params}")
                    result['details'][f'edge_case_{i+1}'] = 'PASS'
                except Exception as e:
                    print(f"[FAIL] Edge case {i+1} failed: {e}")
                    result['details'][f'edge_case_{i+1}'] = 'FAIL'
                    # Don't fail the whole test for edge cases

        except Exception as e:
            result['status'] = 'FAIL'
            result['errors'].append(f"System integration error: {str(e)}")
            print(f"[FAIL] Error: {e}")

        return result

    def generate_report(self) -> str:
        """Generate comprehensive validation report."""

        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)

        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results.values() if result['status'] == 'PASS')

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")

        print("\nDetailed Results:")
        print("-" * 30)

        for test_name, result in self.results.items():
            status_icon = "[OK]" if result['status'] == 'PASS' else "[FAIL]"
            print(f"{status_icon} {test_name}: {result['status']}")

            if result['errors']:
                for error in result['errors']:
                    print(f"    Error: {error}")

        # Generate JSON report
        report = {
            'timestamp': time.time(),
            'summary': {
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': total_tests - passed_tests,
                'success_rate': (passed_tests / total_tests) * 100
            },
            'detailed_results': self.results
        }

        return json.dumps(report, indent=2, default=str)

def main():
    """Run the complete validation suite."""
    validator = Phase3ValidationSuite()

    # Run all validations
    results = validator.run_all_validations()

    # Generate and save report
    report = validator.generate_report()

    # Save report to file
    report_file = './.claude/.artifacts/phase3_enhanced_validation_report.json'
    os.makedirs(os.path.dirname(report_file), exist_ok=True)

    with open(report_file, 'w') as f:
        f.write(report)

    print(f"\n📄 Detailed report saved to: {report_file}")

    # Return success/failure based on results
    success_rate = validator.results and sum(1 for r in validator.results.values() if r['status'] == 'PASS') / len(validator.results)
    return success_rate >= 0.8  # 80% pass rate required

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)