#!/usr/bin/env node
/**
 * Compliance Drift Detection System
 * Monitors compliance scores over time and detects drift patterns
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ComplianceDriftDetector {
  constructor(config = {}) {
    this.config = {
      alertThreshold: 0.02,  // Alert if drift > 2%
      criticalThreshold: 0.05,  // Critical alert if drift > 5%
      historicalPeriod: 30,  // Days to consider for trend analysis
      outputDir: '.claude/.artifacts/compliance/',
      enableAlerts: true,
      ...config
    };

    this.driftPatterns = this._initializeDriftPatterns();
  }

  _initializeDriftPatterns() {
    return {
      'gradual_decline': {
        description: 'Gradual compliance decline over time',
        severity: 'medium',
        detection: (scores) => {
          if (scores.length < 3) return false;
          const recent = scores.slice(-3);
          return recent.every((score, i) => i === 0 || score < recent[i - 1]);
        },
        recommendations: [
          'Review recent changes for compliance impact',
          'Increase monitoring frequency',
          'Conduct compliance training refresh'
        ]
      },

      'sudden_drop': {
        description: 'Sudden compliance score drop',
        severity: 'high',
        detection: (scores, threshold = 0.05) => {
          if (scores.length < 2) return false;
          const latest = scores[scores.length - 1];
          const previous = scores[scores.length - 2];
          return (previous - latest) > threshold;
        },
        recommendations: [
          'Immediate investigation required',
          'Review recent code changes',
          'Check for configuration drift',
          'Validate compliance tools functioning'
        ]
      },

      'oscillation': {
        description: 'Compliance score oscillating significantly',
        severity: 'medium',
        detection: (scores) => {
          if (scores.length < 5) return false;
          const recent = scores.slice(-5);
          const variance = this._calculateVariance(recent);
          const mean = recent.reduce((a, b) => a + b) / recent.length;
          return variance / mean > 0.01; // High relative variance
        },
        recommendations: [
          'Stabilize compliance processes',
          'Review automation reliability',
          'Implement more consistent practices'
        ]
      },

      'plateau_at_low_level': {
        description: 'Compliance stuck at suboptimal level',
        severity: 'medium',
        detection: (scores, targetLevel = 0.95) => {
          if (scores.length < 5) return false;
          const recent = scores.slice(-5);
          const average = recent.reduce((a, b) => a + b) / recent.length;
          const isStable = this._calculateVariance(recent) < 0.001;
          return isStable && average < targetLevel;
        },
        recommendations: [
          'Review compliance improvement roadmap',
          'Identify systematic gaps',
          'Invest in process improvements'
        ]
      }
    };
  }

  _calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
  }

  async detectDrift(currentResults, framework) {
    console.log(`Analyzing compliance drift for ${framework}...`);

    const driftAnalysis = {
      framework,
      analysis_timestamp: new Date().toISOString(),
      current_score: currentResults.overall_score,
      previous_score: null,
      drift_amount: 0,
      drift_percentage: 0,
      drift_direction: 'stable',
      severity: 'low',
      patterns_detected: [],
      alerts: [],
      recommendations: [],
      historical_data: await this._loadHistoricalData(framework),
      trend_analysis: {}
    };

    // Load historical compliance data
    const historicalScores = await this._getHistoricalScores(framework);
    
    if (historicalScores.length === 0) {
      // First run - no drift to detect
      await this._saveComplianceHistory(framework, currentResults);
      driftAnalysis.alerts.push({
        type: 'info',
        message: 'First compliance run - establishing baseline'
      });
      return driftAnalysis;
    }

    // Calculate drift from most recent score
    const previousScore = historicalScores[historicalScores.length - 1].score;
    const currentScore = currentResults.overall_score;
    
    driftAnalysis.previous_score = previousScore;
    driftAnalysis.drift_amount = currentScore - previousScore;
    driftAnalysis.drift_percentage = driftAnalysis.drift_amount / previousScore;

    // Determine drift direction
    if (Math.abs(driftAnalysis.drift_amount) < 0.001) {
      driftAnalysis.drift_direction = 'stable';
    } else if (driftAnalysis.drift_amount > 0) {
      driftAnalysis.drift_direction = 'improving';
    } else {
      driftAnalysis.drift_direction = 'declining';
    }

    // Detect drift patterns
    const scores = historicalScores.map(h => h.score).concat(currentScore);
    driftAnalysis.patterns_detected = this._detectDriftPatterns(scores);

    // Generate alerts based on thresholds
    driftAnalysis.alerts = this._generateDriftAlerts(driftAnalysis);

    // Perform trend analysis
    driftAnalysis.trend_analysis = this._performTrendAnalysis(historicalScores, currentScore);

    // Generate recommendations
    driftAnalysis.recommendations = this._generateDriftRecommendations(driftAnalysis);

    // Determine overall severity
    driftAnalysis.severity = this._calculateOverallSeverity(driftAnalysis);

    // Save current results to history
    await this._saveComplianceHistory(framework, currentResults);

    return driftAnalysis;
  }

  async _getHistoricalScores(framework) {
    const historyFile = path.join(this.config.outputDir, framework, 'compliance-history.json');
    
    try {
      const historyData = JSON.parse(await fs.readFile(historyFile, 'utf8'));
      return historyData.compliance_history || [];
    } catch (error) {
      return [];
    }
  }

  async _loadHistoricalData(framework) {
    const historyFile = path.join(this.config.outputDir, framework, 'compliance-history.json');
    
    try {
      const historyData = JSON.parse(await fs.readFile(historyFile, 'utf8'));
      return {
        total_runs: historyData.compliance_history?.length || 0,
        first_run: historyData.compliance_history?.[0]?.timestamp || null,
        last_run: historyData.compliance_history?.slice(-1)[0]?.timestamp || null,
        best_score: Math.max(...(historyData.compliance_history?.map(h => h.score) || [0])),
        worst_score: Math.min(...(historyData.compliance_history?.map(h => h.score) || [1]))
      };
    } catch (error) {
      return {
        total_runs: 0,
        first_run: null,
        last_run: null,
        best_score: 0,
        worst_score: 1
      };
    }
  }

  async _saveComplianceHistory(framework, currentResults) {
    const historyFile = path.join(this.config.outputDir, framework, 'compliance-history.json');
    
    const newEntry = {
      timestamp: new Date().toISOString(),
      score: currentResults.overall_score,
      total_findings: currentResults.total_findings,
      audit_hash: currentResults.audit_hash,
      checksum: crypto.createHash('sha256')
        .update(JSON.stringify({
          score: currentResults.overall_score,
          findings: currentResults.total_findings,
          timestamp: new Date().toISOString()
        }))
        .digest('hex')
    };

    let historyData = {
      framework,
      last_updated: new Date().toISOString(),
      compliance_history: []
    };

    try {
      const existing = await fs.readFile(historyFile, 'utf8');
      historyData = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
    }

    historyData.compliance_history.push(newEntry);
    historyData.last_updated = new Date().toISOString();

    // Keep only recent history (last 100 entries)
    if (historyData.compliance_history.length > 100) {
      historyData.compliance_history = historyData.compliance_history.slice(-100);
    }

    await fs.mkdir(path.dirname(historyFile), { recursive: true });
    await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2));
  }

  _detectDriftPatterns(scores) {
    const detectedPatterns = [];

    for (const [patternName, pattern] of Object.entries(this.driftPatterns)) {
      if (pattern.detection(scores)) {
        detectedPatterns.push({
          name: patternName,
          description: pattern.description,
          severity: pattern.severity,
          recommendations: pattern.recommendations
        });
      }
    }

    return detectedPatterns;
  }

  _generateDriftAlerts(driftAnalysis) {
    const alerts = [];

    // Check for significant drift
    const absDriftPercentage = Math.abs(driftAnalysis.drift_percentage);
    
    if (absDriftPercentage > this.config.criticalThreshold) {
      alerts.push({
        type: 'critical',
        message: `Critical compliance drift detected: ${(driftAnalysis.drift_percentage * 100).toFixed(2)}% ${driftAnalysis.drift_direction}`,
        action_required: true
      });
    } else if (absDriftPercentage > this.config.alertThreshold) {
      alerts.push({
        type: 'warning',
        message: `Compliance drift alert: ${(driftAnalysis.drift_percentage * 100).toFixed(2)}% ${driftAnalysis.drift_direction}`,
        action_required: false
      });
    }

    // Add pattern-based alerts
    for (const pattern of driftAnalysis.patterns_detected) {
      if (pattern.severity === 'high') {
        alerts.push({
          type: 'critical',
          message: `Pattern detected: ${pattern.description}`,
          action_required: true,
          pattern: pattern.name
        });
      } else if (pattern.severity === 'medium') {
        alerts.push({
          type: 'warning',
          message: `Pattern detected: ${pattern.description}`,
          action_required: false,
          pattern: pattern.name
        });
      }
    }

    // Low compliance score alert
    if (driftAnalysis.current_score < 0.80) {
      alerts.push({
        type: 'critical',
        message: `Compliance score below 80%: ${(driftAnalysis.current_score * 100).toFixed(1)}%`,
        action_required: true
      });
    } else if (driftAnalysis.current_score < 0.90) {
      alerts.push({
        type: 'warning',
        message: `Compliance score below 90%: ${(driftAnalysis.current_score * 100).toFixed(1)}%`,
        action_required: false
      });
    }

    return alerts;
  }

  _performTrendAnalysis(historicalScores, currentScore) {
    if (historicalScores.length < 2) {
      return {
        trend: 'insufficient_data',
        slope: 0,
        confidence: 0,
        prediction: currentScore
      };
    }

    const scores = historicalScores.map(h => h.score).concat(currentScore);
    const n = scores.length;
    
    // Simple linear regression
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    // Predict next score
    const nextScore = slope * n + intercept;
    
    let trend;
    if (Math.abs(slope) < 0.001) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return {
      trend,
      slope: slope,
      confidence: Math.max(0, rSquared),
      prediction: Math.max(0, Math.min(1, nextScore)), // Clamp between 0 and 1
      r_squared: rSquared,
      trend_strength: Math.abs(slope) > 0.01 ? 'strong' : 
                     Math.abs(slope) > 0.005 ? 'moderate' : 'weak'
    };
  }

  _generateDriftRecommendations(driftAnalysis) {
    const recommendations = [];

    // Pattern-based recommendations
    for (const pattern of driftAnalysis.patterns_detected) {
      recommendations.push(...pattern.recommendations);
    }

    // Drift-based recommendations
    if (driftAnalysis.drift_direction === 'declining') {
      recommendations.push('Investigate recent changes that may have impacted compliance');
      recommendations.push('Review compliance monitoring processes');
      
      if (Math.abs(driftAnalysis.drift_percentage) > this.config.criticalThreshold) {
        recommendations.push('Immediate remediation required for critical compliance drift');
        recommendations.push('Consider rollback of recent changes if applicable');
      }
    } else if (driftAnalysis.drift_direction === 'improving') {
      recommendations.push('Document recent improvements for knowledge sharing');
      recommendations.push('Consider applying similar improvements to other areas');
    }

    // Trend-based recommendations
    if (driftAnalysis.trend_analysis.trend === 'declining' && 
        driftAnalysis.trend_analysis.confidence > 0.7) {
      recommendations.push('Declining trend detected - proactive intervention recommended');
      recommendations.push('Schedule compliance review meeting');
    }

    // Score-based recommendations
    if (driftAnalysis.current_score < 0.90) {
      recommendations.push('Implement compliance improvement plan');
      recommendations.push('Increase monitoring frequency');
    }

    // Remove duplicates and return
    return [...new Set(recommendations)];
  }

  _calculateOverallSeverity(driftAnalysis) {
    let severity = 'low';

    // Check for critical alerts
    if (driftAnalysis.alerts.some(alert => alert.type === 'critical')) {
      severity = 'high';
    }
    // Check for warning alerts
    else if (driftAnalysis.alerts.some(alert => alert.type === 'warning')) {
      severity = 'medium';
    }

    // Check for high-severity patterns
    if (driftAnalysis.patterns_detected.some(pattern => pattern.severity === 'high')) {
      severity = 'high';
    }
    // Check for medium-severity patterns
    else if (driftAnalysis.patterns_detected.some(pattern => pattern.severity === 'medium') && 
             severity === 'low') {
      severity = 'medium';
    }

    return severity;
  }

  async generateDriftReport(driftAnalyses) {
    const timestamp = new Date().toLocaleString();
    
    let report = `# Compliance Drift Analysis Report

**Generated:** ${timestamp}
**Frameworks Analyzed:** ${driftAnalyses.length}

## Executive Summary

`;

    // Overall summary
    const criticalDrifts = driftAnalyses.filter(d => d.severity === 'high').length;
    const warningDrifts = driftAnalyses.filter(d => d.severity === 'medium').length;
    const stableDrifts = driftAnalyses.filter(d => d.severity === 'low').length;

    if (criticalDrifts > 0) {
      report += `[ALERT] **CRITICAL**: ${criticalDrifts} framework(s) show critical compliance drift\n`;
    }
    if (warningDrifts > 0) {
      report += `[WARN] **WARNING**: ${warningDrifts} framework(s) show concerning drift patterns\n`;
    }
    if (stableDrifts > 0) {
      report += `[OK] **STABLE**: ${stableDrifts} framework(s) show stable compliance\n`;
    }

    report += `\n## Framework Analysis\n\n`;

    // Individual framework analysis
    for (const drift of driftAnalyses) {
      const statusIcon = drift.severity === 'high' ? '[ALERT]' : 
                        drift.severity === 'medium' ? '[WARN]' : '[OK]';
      
      report += `### ${statusIcon} ${drift.framework}\n\n`;
      report += `- **Current Score:** ${(drift.current_score * 100).toFixed(2)}%\n`;
      
      if (drift.previous_score !== null) {
        const change = drift.drift_percentage >= 0 ? '' : '';
        report += `- **Previous Score:** ${(drift.previous_score * 100).toFixed(2)}%\n`;
        report += `- **Drift:** ${change} ${(drift.drift_percentage * 100).toFixed(2)}%\n`;
      }
      
      report += `- **Direction:** ${drift.drift_direction}\n`;
      report += `- **Severity:** ${drift.severity.toUpperCase()}\n`;
      
      if (drift.trend_analysis.trend !== 'insufficient_data') {
        report += `- **Trend:** ${drift.trend_analysis.trend} (${drift.trend_analysis.trend_strength})\n`;
        report += `- **Trend Confidence:** ${(drift.trend_analysis.confidence * 100).toFixed(1)}%\n`;
      }

      if (drift.patterns_detected.length > 0) {
        report += `\n**Patterns Detected:**\n`;
        for (const pattern of drift.patterns_detected) {
          report += `- ${pattern.description} (${pattern.severity})\n`;
        }
      }

      if (drift.alerts.length > 0) {
        report += `\n**Alerts:**\n`;
        for (const alert of drift.alerts) {
          const alertIcon = alert.type === 'critical' ? '[ALERT]' : '[WARN]';
          report += `- ${alertIcon} ${alert.message}\n`;
        }
      }

      if (drift.recommendations.length > 0) {
        report += `\n**Recommendations:**\n`;
        for (const rec of drift.recommendations.slice(0, 3)) { // Top 3 recommendations
          report += `- ${rec}\n`;
        }
      }

      report += `\n---\n\n`;
    }

    // Overall recommendations
    const allRecommendations = driftAnalyses.flatMap(d => d.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];

    if (uniqueRecommendations.length > 0) {
      report += `## Overall Recommendations\n\n`;
      for (const rec of uniqueRecommendations.slice(0, 5)) { // Top 5 overall
        report += `1. ${rec}\n`;
      }
    }

    report += `\n---\n*Generated by Compliance Drift Detection System*\n`;

    return report;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Compliance Drift Detector

Usage: node compliance-drift-detector.js [options] <compliance-results-dir>

Options:
  --alert-threshold <n>     Alert threshold for drift percentage (default: 0.02)
  --critical-threshold <n>  Critical threshold for drift percentage (default: 0.05)
  --output-dir <path>       Output directory for reports
  --framework <name>        Analyze specific framework only

Examples:
  node compliance-drift-detector.js .claude/.artifacts/compliance/
  node compliance-drift-detector.js --framework SOC2 results/
    `);
    process.exit(0);
  }

  const config = {
    alertThreshold: parseFloat(args[args.indexOf('--alert-threshold') + 1]) || 0.02,
    criticalThreshold: parseFloat(args[args.indexOf('--critical-threshold') + 1]) || 0.05,
    outputDir: args[args.indexOf('--output-dir') + 1] || '.claude/.artifacts/compliance/',
    specificFramework: args[args.indexOf('--framework') + 1] || null
  };

  const complianceResultsDir = args[args.length - 1];

  try {
    const detector = new ComplianceDriftDetector(config);
    
    // Load current compliance results
    const resultsDir = path.resolve(complianceResultsDir);
    const frameworks = config.specificFramework ? [config.specificFramework] : ['SOC2', 'ISO27001', 'NIST-SSDF'];
    
    const driftAnalyses = [];
    
    for (const framework of frameworks) {
      const frameworkDir = path.join(resultsDir, framework);
      const scoreFile = path.join(frameworkDir, 'compliance-score.json');
      
      try {
        const currentResults = JSON.parse(await fs.readFile(scoreFile, 'utf8'));
        const driftAnalysis = await detector.detectDrift(currentResults, framework);
        driftAnalyses.push(driftAnalysis);
        
        console.log(`${framework}: ${driftAnalysis.drift_direction} (${(driftAnalysis.drift_percentage * 100).toFixed(2)}% drift)`);
        
        if (driftAnalysis.alerts.length > 0) {
          console.log(`  Alerts: ${driftAnalysis.alerts.length}`);
        }
        
      } catch (error) {
        console.warn(`Could not analyze drift for ${framework}: ${error.message}`);
      }
    }

    if (driftAnalyses.length === 0) {
      throw new Error('No compliance results to analyze');
    }

    // Generate drift report
    const driftReport = await detector.generateDriftReport(driftAnalyses);
    
    const reportFile = path.join(config.outputDir, `drift-analysis-${Date.now()}.md`);
    await fs.mkdir(path.dirname(reportFile), { recursive: true });
    await fs.writeFile(reportFile, driftReport);

    const analysisFile = path.join(config.outputDir, `drift-analysis-${Date.now()}.json`);
    await fs.writeFile(analysisFile, JSON.stringify(driftAnalyses, null, 2));

    console.log(`\nDrift analysis completed:`);
    console.log(`- Report: ${reportFile}`);
    console.log(`- Analysis: ${analysisFile}`);

    // Exit with error code if critical drift detected
    const hasCriticalDrift = driftAnalyses.some(d => d.severity === 'high');
    process.exit(hasCriticalDrift ? 1 : 0);

  } catch (error) {
    console.error('Drift detection failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComplianceDriftDetector };