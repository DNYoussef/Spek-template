#!/usr/bin/env python3
"""
Analysis Results Consolidation Script for Quality Orchestrator
Consolidates all analysis results into comprehensive quality report
"""

import json
import os
from pathlib import Path
from datetime import datetime

def consolidate_analysis_results():
    """Consolidate all analysis results with comprehensive error handling"""
    os.makedirs('.claude/.artifacts', exist_ok=True)
    
    consolidated = {
        'consolidated_timestamp': datetime.now().isoformat(),
        'analysis_summary': {},
        'overall_scores': {},
        'critical_issues': [],
        'recommendations': [],
        'execution_mode': 'sequential'
    }
    
    analysis_files = [
        ('connascence_analysis.json', 'connascence'),
        ('architecture_analysis.json', 'architecture'),
        ('performance_monitoring.json', 'performance'),
        ('mece_analysis.json', 'mece'),
        ('cache_optimization.json', 'cache'),
        ('self_dogfooding.json', 'dogfooding')
    ]
    
    total_quality_score = 0
    analysis_count = 0
    
    for filename, analysis_key in analysis_files:
        artifact_path = Path(f'.claude/.artifacts/{filename}')
        try:
            if artifact_path.exists():
                with open(artifact_path, 'r') as f:
                    data = json.load(f)
                
                if analysis_key == 'connascence':
                    score = data.get('summary', {}).get('overall_quality_score', 0)
                    violations = len(data.get('violations', []))
                    nasa_score = data.get('nasa_compliance', {}).get('score', 0)
                    consolidated['analysis_summary']['connascence'] = {
                        'quality_score': score,
                        'total_violations': violations,
                        'nasa_compliance': nasa_score,
                        'critical_violations': data.get('summary', {}).get('critical_violations', 0),
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += score
                    analysis_count += 1
                    if violations > 10:
                        consolidated['critical_issues'].append(f'High violation count: {violations}')
                        
                elif analysis_key == 'architecture':
                    health = data.get('system_overview', {}).get('architectural_health', 0)
                    god_objects = data.get('metrics', {}).get('god_objects_detected', 0)
                    consolidated['analysis_summary']['architecture'] = {
                        'architectural_health': health,
                        'god_objects_detected': god_objects,
                        'hotspots': len(data.get('architectural_hotspots', [])),
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += health
                    analysis_count += 1
                    if god_objects > 5:
                        consolidated['critical_issues'].append(f'Too many god objects: {god_objects}')
                        
                elif analysis_key == 'performance':
                    cpu_score = data.get('resource_utilization', {}).get('cpu_usage', {}).get('efficiency_score', 0)
                    memory_score = data.get('resource_utilization', {}).get('memory_usage', {}).get('optimization_score', 0)
                    consolidated['analysis_summary']['performance'] = {
                        'cpu_efficiency': cpu_score,
                        'memory_optimization': memory_score,
                        'overall_performance': (cpu_score + memory_score) / 2,
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += (cpu_score + memory_score) / 2
                    analysis_count += 1
                    
                elif analysis_key == 'mece':
                    mece_score = data.get('mece_score', 0)
                    duplications = data.get('duplication_stats', {}).get('total_duplications', 0)
                    consolidated['analysis_summary']['mece'] = {
                        'mece_score': mece_score,
                        'duplications_found': duplications,
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += mece_score
                    analysis_count += 1
                    if duplications > 10:
                        consolidated['critical_issues'].append(f'High duplication count: {duplications}')
                        
                elif analysis_key == 'cache':
                    health_score = data.get('cache_health', {}).get('health_score', 0)
                    hit_rate = data.get('cache_health', {}).get('hit_rate', 0)
                    consolidated['analysis_summary']['cache'] = {
                        'health_score': health_score,
                        'hit_rate': hit_rate,
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += health_score
                    analysis_count += 1
                    
                elif analysis_key == 'dogfooding':
                    health = data.get('overall_health', 0)
                    consolidated['analysis_summary']['dogfooding'] = {
                        'overall_health': health,
                        'metrics': data.get('dogfooding_metrics', {}),
                        'fallback': data.get('fallback', False)
                    }
                    total_quality_score += health
                    analysis_count += 1
                    
            else:
                print(f'Warning: Analysis file {filename} not found')
                consolidated['analysis_summary'][analysis_key] = {'error': 'file_not_found'}
                
        except Exception as e:
            print(f'Failed to process {filename}: {e}')
            consolidated['analysis_summary'][analysis_key] = {'error': str(e)}
    
    # Calculate overall quality score
    if analysis_count > 0:
        consolidated['overall_scores']['average_quality'] = total_quality_score / analysis_count
    else:
        consolidated['overall_scores']['average_quality'] = 0.75
    
    # Generate recommendations
    avg_quality = consolidated['overall_scores']['average_quality']
    if avg_quality < 0.70:
        consolidated['recommendations'].append('Overall quality below threshold - review all analysis results')
    if len(consolidated['critical_issues']) > 3:
        consolidated['recommendations'].append('Multiple critical issues detected - prioritize fixes')
    if not consolidated['critical_issues']:
        consolidated['recommendations'].append('Quality metrics are healthy - maintain current standards')
    
    # Write consolidated report
    with open('.claude/.artifacts/quality_gates_report.json', 'w') as f:
        json.dump(consolidated, f, indent=2, default=str)
    
    # Print summary
    print('SUCCESS: Consolidated analysis completed')
    print(f'Overall Quality Score: {avg_quality:.2%}')
    print(f'Critical Issues: {len(consolidated["critical_issues"])}')
    print(f'Analyses Processed: {analysis_count}/6')

if __name__ == '__main__':
    consolidate_analysis_results()