from src.constants.base import NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD, NASA_POT10_TARGET_COMPLIANCE_THRESHOLD, QUALITY_GATE_MINIMUM_PASS_RATE
"""

Tests zero-performance-impact feature flag system with comprehensive
validation of feature states, dependencies, and NASA compliance requirements.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from dataclasses import dataclass
from enum import Enum

# Import feature flag modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'analyzer', 'enterprise', 'core'))
from feature_flags import (
    FeatureState, FeatureFlag, EnterpriseFeatureManager
)

class TestFeatureState:
    """Test FeatureState enum"""
    
    def test_feature_state_values(self):
        """Test feature state enum values"""
        assert FeatureState.DISABLED.value == "disabled"
        assert FeatureState.ENABLED.value == "enabled"
        assert FeatureState.BETA.value == "beta"
        assert FeatureState.DEPRECATED.value == "deprecated"

class TestFeatureFlag:
    """Test FeatureFlag dataclass"""
    
    def test_feature_flag_creation(self):
        """Test basic feature flag creation"""
        flag = FeatureFlag(
            name="test_feature",
            state=FeatureState.ENABLED,
            description="Test feature for unit testing"
        )
        
        assert flag.name == "test_feature"
        assert flag.state == FeatureState.ENABLED
        assert flag.description == "Test feature for unit testing"
        assert flag.dependencies == []  # Default empty list
        assert flag.performance_impact == "none"  # Default
        assert flag.min_nasa_compliance == NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD  # Default
    
    def test_feature_flag_with_all_fields(self):
        """Test feature flag creation with all fields"""
        flag = FeatureFlag(
            name="advanced_feature",
            state=FeatureState.BETA,
            description="Advanced feature in beta",
            dependencies=["basic_feature", "auth_module"],
            performance_impact="medium",
            min_nasa_compliance=NASA_POT10_TARGET_COMPLIANCE_THRESHOLD
        )
        
        assert flag.name == "advanced_feature"
        assert flag.state == FeatureState.BETA
        assert flag.description == "Advanced feature in beta"
        assert flag.dependencies == ["basic_feature", "auth_module"]
        assert flag.performance_impact == "medium"
        assert flag.min_nasa_compliance == 0.95
    
    def test_feature_flag_validation_valid_impact(self):
        """Test feature flag validation with valid performance impact"""
        # Should not raise exception
        flag = FeatureFlag(
            name="test",
            state=FeatureState.ENABLED,
            description="Test",
            performance_impact="low"
        )
        assert flag.performance_impact == "low"
    
    def test_feature_flag_validation_invalid_impact(self):
        """Test feature flag validation with invalid performance impact"""
        with pytest.raises(AssertionError, match="Invalid performance impact"):
            FeatureFlag(
                name="test",
                state=FeatureState.ENABLED,
                description="Test",
                performance_impact="invalid"
            )
    
    def test_feature_flag_validation_valid_nasa_compliance(self):
        """Test feature flag validation with valid NASA compliance"""
        flag = FeatureFlag(
            name="test",
            state=FeatureState.ENABLED,
            description="Test",
            min_nasa_compliance=0.9
        )
        assert flag.min_nasa_compliance == 0.9
    
    def test_feature_flag_validation_invalid_nasa_compliance_high(self):
        """Test feature flag validation with invalid NASA compliance (too high)"""
        with pytest.raises(AssertionError, match="NASA compliance must be between 0.0 and 1.0"):
            FeatureFlag(
                name="test",
                state=FeatureState.ENABLED,
                description="Test",
                min_nasa_compliance=1.1
            )
    
    def test_feature_flag_validation_invalid_nasa_compliance_low(self):
        """Test feature flag validation with invalid NASA compliance (too low)"""
        with pytest.raises(AssertionError, match="NASA compliance must be between 0.0 and 1.0"):
            FeatureFlag(
                name="test",
                state=FeatureState.ENABLED,
                description="Test",
                min_nasa_compliance=-0.1
            )

class TestEnterpriseFeatureManager:
    """Test EnterpriseFeatureManager main class"""
    
    def setup_method(self):
        """Setup test fixture"""
        # Mock config manager
        self.mock_config = Mock()
        self.mock_config.get_enterprise_config.return_value = {
            'features': {
                'sixsigma': {
                    'state': 'enabled',
                    'description': 'Six Sigma quality analysis',
                    'performance_impact': 'low',
                    'min_nasa_compliance': NASA_POT10_MINIMUM_COMPLIANCE_THRESHOLD
                },
                'dfars_compliance': {
                    'state': 'disabled',
                    'description': 'DFARS compliance checking',
                    'performance_impact': 'medium',
                    'min_nasa_compliance': 0.95
                },
                'supply_chain': {
                    'state': 'beta',
                    'description': 'Supply chain governance',
                    'dependencies': ['sixsigma'],
                    'performance_impact': 'high',
                    'min_nasa_compliance': 0.93
                }
            }
        }
        
        self.manager = EnterpriseFeatureManager(self.mock_config)
    
    def test_manager_initialization(self):
        """Test manager initialization"""
        assert self.manager.config == self.mock_config
        assert isinstance(self.manager.features, dict)
        assert len(self.manager.features) == 3
        assert self.manager._initialized is True
        
        # Verify features were loaded correctly
        assert 'sixsigma' in self.manager.features
        assert 'dfars_compliance' in self.manager.features
        assert 'supply_chain' in self.manager.features
        
        # Check feature states
        assert self.manager.features['sixsigma'].state == FeatureState.ENABLED
        assert self.manager.features['dfars_compliance'].state == FeatureState.DISABLED
        assert self.manager.features['supply_chain'].state == FeatureState.BETA
    
    def test_manager_initialization_none_config(self):
        """Test manager initialization with None config raises assertion"""
        with pytest.raises(AssertionError, match="config_manager cannot be None"):
            EnterpriseFeatureManager(None)
    
    def test_is_enabled_basic(self):
        """Test basic is_enabled functionality"""
        assert self.manager.is_enabled('sixsigma') is True
        assert self.manager.is_enabled('dfars_compliance') is False
        assert self.manager.is_enabled('supply_chain') is True  # BETA counts as enabled
    
    def test_is_enabled_caching(self):
        """Test is_enabled result caching for performance"""
        # First call should calculate result
        result1 = self.manager.is_enabled('sixsigma')
        
        # Second call should use cached result
        result2 = self.manager.is_enabled('sixsigma')
        
        assert result1 == result2 == True
        
        # Verify cache was populated
        assert 'sixsigma' in self.manager._feature_cache
        assert self.manager._feature_cache['sixsigma'] is True
    
    def test_is_enabled_nonexistent_feature(self):
        """Test is_enabled with nonexistent feature"""
        result = self.manager.is_enabled('nonexistent')
        assert result is False
        
        # Should be cached as False
        assert self.manager._feature_cache['nonexistent'] is False
    
    def test_is_enabled_none_input(self):
        """Test is_enabled with None input raises assertion"""
        with pytest.raises(AssertionError, match="feature_name cannot be None"):
            self.manager.is_enabled(None)
    
    def test_is_enabled_non_string_input(self):
        """Test is_enabled with non-string input raises assertion"""
        with pytest.raises(AssertionError, match="feature_name must be a string"):
            self.manager.is_enabled(123)
    
    def test_is_enabled_with_dependencies_satisfied(self):
        """Test is_enabled with satisfied dependencies"""
        # supply_chain depends on sixsigma, which is enabled
        result = self.manager.is_enabled('supply_chain')
        assert result is True
    
    def test_is_enabled_with_dependencies_unsatisfied(self):
        """Test is_enabled with unsatisfied dependencies"""
        # Create a feature that depends on a disabled feature
        self.manager.features['test_feature'] = FeatureFlag(
            name='test_feature',
            state=FeatureState.ENABLED,
            description='Test feature with dependency',
            dependencies=['dfars_compliance']  # This is disabled
        )
        
        # Clear cache to force recalculation
        self.manager.clear_cache()
        
        result = self.manager.is_enabled('test_feature')
        assert result is False  # Should be disabled due to unmet dependency
    
    def test_get_enabled_modules(self):
        """Test get_enabled_modules functionality"""
        enabled_modules = self.manager.get_enabled_modules()
        
        assert isinstance(enabled_modules, list)
        assert 'sixsigma' in enabled_modules
        assert 'supply_chain' in enabled_modules  # BETA counts as enabled
        assert 'dfars_compliance' not in enabled_modules  # DISABLED
    
    def test_get_feature_info(self):
        """Test get_feature_info functionality"""
        feature_info = self.manager.get_feature_info('sixsigma')
        
        assert isinstance(feature_info, FeatureFlag)
        assert feature_info.name == 'sixsigma'
        assert feature_info.state == FeatureState.ENABLED
        assert feature_info.description == 'Six Sigma quality analysis'
        assert feature_info.performance_impact == 'low'
        assert feature_info.min_nasa_compliance == 0.92
    
    def test_get_feature_info_nonexistent(self):
        """Test get_feature_info with nonexistent feature"""
        feature_info = self.manager.get_feature_info('nonexistent')
        assert feature_info is None
    
    def test_get_feature_info_none_input(self):
        """Test get_feature_info with None input raises assertion"""
        with pytest.raises(AssertionError, match="feature_name cannot be None"):
            self.manager.get_feature_info(None)

class TestNASAComplianceValidation:
    """Test NASA compliance validation functionality"""
    
    def setup_method(self):
        """Setup test fixture"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'low_compliance': {
                    'state': 'enabled',
                    'description': 'Low compliance requirement',
                    'min_nasa_compliance': QUALITY_GATE_MINIMUM_PASS_RATE
                },
                'high_compliance': {
                    'state': 'enabled',
                    'description': 'High compliance requirement',
                    'min_nasa_compliance': 0.98
                },
                'disabled_feature': {
                    'state': 'disabled',
                    'description': 'Disabled feature',
                    'min_nasa_compliance': 0.99
                }
            }
        }
        
        self.manager = EnterpriseFeatureManager(mock_config)
    
    def test_validate_nasa_compliance_all_pass(self):
        """Test NASA compliance validation when all features pass"""
        result = self.manager.validate_nasa_compliance(0.99)
        
        assert result['overall_valid'] is True
        assert result['current_compliance'] == 0.99
        assert len(result['feature_violations']) == 0
        assert len(result['recommendations']) == 0
    
    def test_validate_nasa_compliance_some_violations(self):
        """Test NASA compliance validation with some violations"""
        result = self.manager.validate_nasa_compliance(0.90)
        
        assert result['overall_valid'] is False
        assert result['current_compliance'] == 0.90
        assert len(result['feature_violations']) == 1  # high_compliance should violate
        
        violation = result['feature_violations'][0]
        assert violation['feature'] == 'high_compliance'
        assert violation['required_compliance'] == 0.98
        assert violation['current_compliance'] == 0.90
        assert violation['gap'] == 0.8
        
        assert len(result['recommendations']) == 1
        assert 'high_compliance' in result['recommendations'][0]
    
    def test_validate_nasa_compliance_all_violations(self):
        """Test NASA compliance validation with all violations"""
        result = self.manager.validate_nasa_compliance(0.80)
        
        assert result['overall_valid'] is False
        assert len(result['feature_violations']) == 2  # Both enabled features should violate
        assert len(result['recommendations']) == 2
    
    def test_validate_nasa_compliance_invalid_input_type(self):
        """Test NASA compliance validation with invalid input type"""
        with pytest.raises(AssertionError, match="current_compliance must be numeric"):
            self.manager.validate_nasa_compliance("0.9")
    
    def test_validate_nasa_compliance_invalid_range_high(self):
        """Test NASA compliance validation with value too high"""
        with pytest.raises(AssertionError, match="current_compliance must be between 0.0 and 1.0"):
            self.manager.validate_nasa_compliance(1.1)
    
    def test_validate_nasa_compliance_invalid_range_low(self):
        """Test NASA compliance validation with value too low"""
        with pytest.raises(AssertionError, match="current_compliance must be between 0.0 and 1.0"):
            self.manager.validate_nasa_compliance(-0.1)
    
    def test_validate_nasa_compliance_ignores_disabled_features(self):
        """Test NASA compliance validation ignores disabled features"""
        # disabled_feature has very high compliance requirement but should be ignored
        result = self.manager.validate_nasa_compliance(0.90)
        
        # Should only have violation for high_compliance, not disabled_feature
        violations = [v['feature'] for v in result['feature_violations']]
        assert 'high_compliance' in violations
        assert 'disabled_feature' not in violations

class TestPerformanceImpactAnalysis:
    """Test performance impact analysis functionality"""
    
    def setup_method(self):
        """Setup test fixture"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'no_impact': {
                    'state': 'enabled',
                    'description': 'No performance impact',
                    'performance_impact': 'none'
                },
                'low_impact': {
                    'state': 'enabled',
                    'description': 'Low performance impact',
                    'performance_impact': 'low'
                },
                'medium_impact': {
                    'state': 'enabled',
                    'description': 'Medium performance impact',
                    'performance_impact': 'medium'
                },
                'high_impact': {
                    'state': 'disabled',  # Disabled to test filtering
                    'description': 'High performance impact',
                    'performance_impact': 'high'
                },
                'another_medium': {
                    'state': 'enabled',
                    'description': 'Another medium impact',
                    'performance_impact': 'medium'
                }
            }
        }
        
        self.manager = EnterpriseFeatureManager(mock_config)
    
    def test_performance_impact_summary_no_features(self):
        """Test performance impact summary with no enabled features"""
        # Create manager with no enabled features
        empty_config = Mock()
        empty_config.get_enterprise_config.return_value = {'features': {}}
        empty_manager = EnterpriseFeatureManager(empty_config)
        
        summary = empty_manager.get_performance_impact_summary()
        
        assert summary['total_features'] == 0
        assert summary['performance_impact'] == 'none'
        assert summary['impact_breakdown'] == {}
        assert 'No enterprise features enabled' in summary['recommendations'][0]
    
    def test_performance_impact_summary_mixed_impacts(self):
        """Test performance impact summary with mixed impact levels"""
        summary = self.manager.get_performance_impact_summary()
        
        assert summary['total_features'] == 4  # 4 enabled features
        assert summary['performance_impact'] == 'medium'  # Highest enabled impact
        
        # Check impact breakdown
        breakdown = summary['impact_breakdown']
        assert breakdown['no_impact'] == 'none'
        assert breakdown['low_impact'] == 'low'
        assert breakdown['medium_impact'] == 'medium'
        assert breakdown['another_medium'] == 'medium'
        assert 'high_impact' not in breakdown  # Should not include disabled features
        
        # Check impact counts
        counts = summary['impact_counts']
        assert counts['none'] == 1
        assert counts['low'] == 1
        assert counts['medium'] == 2
        assert counts['high'] == 0  # Disabled feature not counted
    
    def test_performance_impact_overall_high(self):
        """Test performance impact with high-impact feature enabled"""
        # Enable the high impact feature
        self.manager.features['high_impact'].state = FeatureState.ENABLED
        self.manager.clear_cache()
        
        summary = self.manager.get_performance_impact_summary()
        
        assert summary['performance_impact'] == 'high'
        assert summary['impact_counts']['high'] == 1
    
    def test_performance_recommendations_generation(self):
        """Test performance recommendations generation"""
        summary = self.manager.get_performance_impact_summary()
        
        recommendations = summary['recommendations']
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        
        # With 2 medium impact features, should have recommendation
        rec_text = ' '.join(recommendations)
        assert 'medium-impact' in rec_text.lower() or 'multiple' in rec_text.lower()
    
    def test_performance_recommendations_high_impact(self):
        """Test performance recommendations with high impact features"""
        # Enable high impact feature
        self.manager.features['high_impact'].state = FeatureState.ENABLED
        self.manager.clear_cache()
        
        summary = self.manager.get_performance_impact_summary()
        
        recommendations = summary['recommendations']
        rec_text = ' '.join(recommendations)
        assert 'high-impact' in rec_text.lower() or 'production' in rec_text.lower()
    
    def test_performance_recommendations_many_features(self):
        """Test performance recommendations with many features"""
        # Add many features to trigger quantity recommendation
        for i in range(10):
            self.manager.features[f'feature_{i}'] = FeatureFlag(
                name=f'feature_{i}',
                state=FeatureState.ENABLED,
                description=f'Feature {i}',
                performance_impact='low'
            )
        
        self.manager.clear_cache()
        
        summary = self.manager.get_performance_impact_summary()
        
        recommendations = summary['recommendations']
        rec_text = ' '.join(recommendations)
        assert 'number' in rec_text.lower() or 'monitor' in rec_text.lower()

class TestCacheManagement:
    """Test cache management functionality"""
    
    def setup_method(self):
        """Setup test fixture"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'test_feature': {
                    'state': 'enabled',
                    'description': 'Test feature'
                }
            }
        }
        
        self.manager = EnterpriseFeatureManager(mock_config)
    
    def test_cache_population(self):
        """Test cache is populated on first access"""
        assert len(self.manager._feature_cache) == 0
        
        result = self.manager.is_enabled('test_feature')
        
        assert result is True
        assert len(self.manager._feature_cache) == 1
        assert self.manager._feature_cache['test_feature'] is True
    
    def test_cache_usage(self):
        """Test cached results are used on subsequent calls"""
        # First call populates cache
        self.manager.is_enabled('test_feature')
        
        # Modify the underlying feature state
        self.manager.features['test_feature'].state = FeatureState.DISABLED
        
        # Second call should still return cached result
        result = self.manager.is_enabled('test_feature')
        assert result is True  # Still returns cached True value
    
    def test_cache_clearing(self):
        """Test cache clearing functionality"""
        # Populate cache
        self.manager.is_enabled('test_feature')
        assert len(self.manager._feature_cache) == 1
        
        # Clear cache
        self.manager.clear_cache()
        assert len(self.manager._feature_cache) == 0
        
        # Modify feature state
        self.manager.features['test_feature'].state = FeatureState.DISABLED
        
        # Next call should recalculate
        result = self.manager.is_enabled('test_feature')
        assert result is False  # Now returns actual state
    
    def test_cache_multiple_features(self):
        """Test cache with multiple features"""
        # Add another feature
        self.manager.features['another_feature'] = FeatureFlag(
            name='another_feature',
            state=FeatureState.DISABLED,
            description='Another test feature'
        )
        
        # Access both features
        result1 = self.manager.is_enabled('test_feature')
        result2 = self.manager.is_enabled('another_feature')
        
        assert result1 is True
        assert result2 is False
        assert len(self.manager._feature_cache) == 2
        assert self.manager._feature_cache['test_feature'] is True
        assert self.manager._feature_cache['another_feature'] is False

class TestDefaultFeaturesConfiguration:
    """Test default features configuration"""
    
    def test_default_features_when_no_config(self):
        """Test default features are loaded when no config provided"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {'features': {}}
        
        manager = EnterpriseFeatureManager(mock_config)
        
        # Should have default features
        assert 'sixsigma' in manager.features
        assert 'dfars_compliance' in manager.features
        assert 'supply_chain_governance' in manager.features
        
        # All default features should be disabled
        for feature in manager.features.values():
            assert feature.state == FeatureState.DISABLED
    
    def test_default_feature_properties(self):
        """Test default feature properties"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {'features': {}}
        
        manager = EnterpriseFeatureManager(mock_config)
        
        # Check sixsigma default properties
        sixsigma = manager.features['sixsigma']
        assert sixsigma.state == FeatureState.DISABLED
        assert sixsigma.performance_impact == 'low'
        assert sixsigma.min_nasa_compliance == 0.92
        
        # Check DFARS compliance properties
        dfars = manager.features['dfars_compliance']
        assert dfars.state == FeatureState.DISABLED
        assert dfars.performance_impact == 'medium'
        assert dfars.min_nasa_compliance == NASA_POT10_TARGET_COMPLIANCE_THRESHOLD  # Higher for defense
        
        # Check supply chain governance properties
        supply_chain = manager.features['supply_chain_governance']
        assert supply_chain.state == FeatureState.DISABLED
        assert supply_chain.performance_impact == 'medium'
        assert supply_chain.min_nasa_compliance == 0.92

class TestConfigurationLoading:
    """Test configuration loading functionality"""
    
    def test_load_valid_configuration(self):
        """Test loading valid feature configuration"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'custom_feature': {
                    'state': 'enabled',
                    'description': 'Custom enterprise feature',
                    'performance_impact': 'high',
                    'min_nasa_compliance': 0.99,
                    'dependencies': ['base_feature']
                }
            }
        }
        
        manager = EnterpriseFeatureManager(mock_config)
        
        assert 'custom_feature' in manager.features
        feature = manager.features['custom_feature']
        assert feature.state == FeatureState.ENABLED
        assert feature.description == 'Custom enterprise feature'
        assert feature.performance_impact == 'high'
        assert feature.min_nasa_compliance == 0.99
        assert feature.dependencies == ['base_feature']
    
    def test_load_configuration_with_invalid_feature(self):
        """Test loading configuration with invalid feature data"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'valid_feature': {
                    'state': 'enabled',
                    'description': 'Valid feature'
                },
                'invalid_feature': {
                    'state': 'invalid_state',  # Invalid state
                    'description': 'Invalid feature'
                }
            }
        }
        
        # Should not raise exception but skip invalid feature
        manager = EnterpriseFeatureManager(mock_config)
        
        # Valid feature should be loaded
        assert 'valid_feature' in manager.features
        
        # Invalid feature should be skipped, defaults loaded instead
        assert len(manager.features) >= 3  # At least the default features
    
    def test_load_configuration_exception_handling(self):
        """Test configuration loading handles exceptions gracefully"""
        mock_config = Mock()
        mock_config.get_enterprise_config.side_effect = Exception("Config error")
        
        # Should fall back to default features without crashing
        manager = EnterpriseFeatureManager(mock_config)
        
        # Should have default features
        assert 'sixsigma' in manager.features
        assert 'dfars_compliance' in manager.features
        assert 'supply_chain_governance' in manager.features

class TestPerformanceAndMemory:
    """Test performance and memory efficiency"""
    
    def setup_method(self):
        """Setup test fixture"""
        mock_config = Mock()
        
        # Create configuration with many features
        features_config = {}
        for i in range(100):
            features_config[f'feature_{i}'] = {
                'state': 'enabled' if i % 2 == 0 else 'disabled',
                'description': f'Feature {i}',
                'performance_impact': ['none', 'low', 'medium', 'high'][i % 4],
                'min_nasa_compliance': 0.9 + (i % 10) / 100  # Vary compliance requirements
            }
        
        mock_config.get_enterprise_config.return_value = {'features': features_config}
        self.manager = EnterpriseFeatureManager(mock_config)
    
    def test_initialization_performance(self):
        """Test initialization performance with many features"""
        import time
        
        start_time = time.time()
        
        # Create new manager with many features
        mock_config = Mock()
        features_config = {}
        for i in range(1000):
            features_config[f'feature_{i}'] = {
                'state': 'enabled',
                'description': f'Feature {i}'
            }
        
        mock_config.get_enterprise_config.return_value = {'features': features_config}
        manager = EnterpriseFeatureManager(mock_config)
        
        duration = time.time() - start_time
        
        assert len(manager.features) == 1000
        assert duration < 1.0  # Should initialize quickly
    
    def test_is_enabled_performance_with_cache(self):
        """Test is_enabled performance with caching"""
        import time
        
        # Test uncached performance (first calls)
        start_time = time.time()
        for i in range(100):
            self.manager.is_enabled(f'feature_{i}')
        uncached_duration = time.time() - start_time
        
        # Test cached performance (second calls)
        start_time = time.time()
        for i in range(100):
            self.manager.is_enabled(f'feature_{i}')
        cached_duration = time.time() - start_time
        
        # Cached calls should be much faster
        assert cached_duration < uncached_duration / 2
        assert cached_duration < 0.1  # Very fast for cached calls
    
    def test_performance_impact_summary_scalability(self):
        """Test performance impact summary scalability"""
        import time
        
        start_time = time.time()
        summary = self.manager.get_performance_impact_summary()
        duration = time.time() - start_time
        
        assert duration < 0.1  # Should be very fast even with many features
        assert summary['total_features'] == 50  # Half are enabled (even indices)
        assert isinstance(summary['impact_breakdown'], dict)
        assert len(summary['impact_breakdown']) == 50
    
    def test_nasa_compliance_validation_scalability(self):
        """Test NASA compliance validation scalability"""
        import time
        
        start_time = time.time()
        result = self.manager.validate_nasa_compliance(0.85)
        duration = time.time() - start_time
        
        assert duration < 0.1  # Should be fast even with many features
        assert isinstance(result['feature_violations'], list)
        assert result['current_compliance'] == 0.85
    
    def test_memory_usage_stability(self):
        """Test memory usage remains stable"""
        import gc
        
        # Get initial memory state
        gc.collect()
        initial_objects = len(gc.get_objects())
        
        # Perform many operations
        for i in range(1000):
            self.manager.is_enabled(f'feature_{i % 100}')
            if i % 100 == 0:
                self.manager.get_enabled_modules()
                self.manager.get_performance_impact_summary()
                self.manager.validate_nasa_compliance(0.9)
        
        # Clear cache periodically
        if hasattr(self.manager, 'clear_cache'):
            self.manager.clear_cache()
        
        # Check final memory state
        gc.collect()
        final_objects = len(gc.get_objects())
        
        # Object count should not grow excessively
        object_growth = final_objects - initial_objects
        assert object_growth < 5000  # Reasonable growth limit

class TestErrorHandlingAndEdgeCases:
    """Test error handling and edge cases"""
    
    def setup_method(self):
        """Setup test fixture"""
        mock_config = Mock()
        mock_config.get_enterprise_config.return_value = {
            'features': {
                'test_feature': {
                    'state': 'enabled',
                    'description': 'Test feature'
                }
            }
        }
        
        self.manager = EnterpriseFeatureManager(mock_config)
    
    def test_circular_dependencies(self):
        """Test handling of circular dependencies"""
        # Create circular dependency: A -> B -> A
        self.manager.features['feature_a'] = FeatureFlag(
            name='feature_a',
            state=FeatureState.ENABLED,
            description='Feature A',
            dependencies=['feature_b']
        )
        
        self.manager.features['feature_b'] = FeatureFlag(
            name='feature_b',
            state=FeatureState.ENABLED,
            description='Feature B',
            dependencies=['feature_a']
        )
        
        self.manager.clear_cache()
        
        # Should handle gracefully without infinite recursion
        try:
            result_a = self.manager.is_enabled('feature_a')
            result_b = self.manager.is_enabled('feature_b')
            
            # Both should be disabled due to circular dependency
            assert isinstance(result_a, bool)
            assert isinstance(result_b, bool)
            
        except RecursionError:
            pytest.fail("Circular dependency caused infinite recursion")
    
    def test_deep_dependency_chain(self):
        """Test handling of deep dependency chains"""
        # Create chain: A -> B -> C -> D -> E
        dependencies = {
            'feature_a': ['feature_b'],
            'feature_b': ['feature_c'],
            'feature_c': ['feature_d'],
            'feature_d': ['feature_e'],
            'feature_e': []
        }
        
        for name, deps in dependencies.items():
            self.manager.features[name] = FeatureFlag(
                name=name,
                state=FeatureState.ENABLED,
                description=f'{name} description',
                dependencies=deps
            )
        
        self.manager.clear_cache()
        
        # All should be enabled since chain is satisfied
        for name in dependencies.keys():
            result = self.manager.is_enabled(name)
            assert result is True
        
        # Break the chain by disabling feature_d
        self.manager.features['feature_d'].state = FeatureState.DISABLED
        self.manager.clear_cache()
        
        # Now A, B, C should be disabled; D, E should be as per their state
        assert self.manager.is_enabled('feature_a') is False
        assert self.manager.is_enabled('feature_b') is False
        assert self.manager.is_enabled('feature_c') is False
        assert self.manager.is_enabled('feature_d') is False
        assert self.manager.is_enabled('feature_e') is True
    
    def test_invalid_dependency_references(self):
        """Test handling of invalid dependency references"""
        self.manager.features['feature_with_invalid_dep'] = FeatureFlag(
            name='feature_with_invalid_dep',
            state=FeatureState.ENABLED,
            description='Feature with invalid dependency',
            dependencies=['nonexistent_feature']
        )
        
        self.manager.clear_cache()
        
        # Should disable feature due to unmet dependency
        result = self.manager.is_enabled('feature_with_invalid_dep')
        assert result is False
    
    def test_empty_string_feature_names(self):
        """Test handling of empty string feature names"""
        with pytest.raises(AssertionError):
            self.manager.is_enabled('')
    
    def test_unicode_feature_names(self):
        """Test handling of unicode feature names"""
        # Add unicode feature name
        unicode_name = 'feature__[ROCKET]'
        self.manager.features[unicode_name] = FeatureFlag(
            name=unicode_name,
            state=FeatureState.ENABLED,
            description='Unicode test feature'
        )
        
        # Should handle unicode names properly
        result = self.manager.is_enabled(unicode_name)
        assert result is True
        
        # Should also work in other methods
        info = self.manager.get_feature_info(unicode_name)
        assert info is not None
        assert info.name == unicode_name
    
    def test_very_long_feature_names(self):
        """Test handling of very long feature names"""
        long_name = 'feature_' + 'x' * 1000  # Very long name
        self.manager.features[long_name] = FeatureFlag(
            name=long_name,
            state=FeatureState.ENABLED,
            description='Long name test feature'
        )
        
        # Should handle long names properly
        result = self.manager.is_enabled(long_name)
        assert result is True
    
    def test_concurrent_access_simulation(self):
        """Test simulation of concurrent access patterns"""
        import threading
        import time
        
        results = []
        
        def worker():
            for i in range(100):
                result = self.manager.is_enabled('test_feature')
                results.append(result)
                
                if i % 10 == 0:
                    enabled_modules = self.manager.get_enabled_modules()
                    results.append(len(enabled_modules))
                    
                time.sleep(0.1)  # Small delay
        
        # Start multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=worker)
            threads.append(thread)
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        # All results should be consistent
        feature_results = [r for r in results if isinstance(r, bool)]
        assert all(r is True for r in feature_results)  # All should be True
        assert len(feature_results) == 500  # 5 threads * 100 calls each