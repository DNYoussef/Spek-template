import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkResult } from './PerformanceBenchmarker';
import { EventEmitter } from 'events';

export interface ReportConfig {
  results: BenchmarkResult[];
  analysis: any;
  regressions: any[];
  config: any;
  outputPath?: string;
}

export interface ReportOptions {
  format: 'json' | 'csv' | 'html' | 'markdown' | 'junit' | 'all';
  includeCharts: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  theme: 'light' | 'dark' | 'auto';
  customTemplate?: string;
  attachments: ReportAttachment[];
  metadata: ReportMetadata;
}

export interface ReportAttachment {
  name: string;
  type: 'chart' | 'data' | 'log' | 'profile';
  content: string | Buffer;
  encoding: 'utf8' | 'base64' | 'binary';
}

export interface ReportMetadata {
  title: string;
  description: string;
  author: string;
  timestamp: number;
  version: string;
  tags: string[];
  environment: {
    platform: string;
    arch: string;
    nodeVersion: string;
    memory: number;
    cpus: number;
  };
}

export interface ChartData {
  type: 'line' | 'bar' | 'scatter' | 'histogram' | 'pie';
  title: string;
  data: any[];
  options: any;
}

export class BenchmarkReporter extends EventEmitter {
  private outputDir: string;

  constructor(outputDir: string = './benchmark-reports') {
    super();
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(
    reportConfig: ReportConfig,
    options: Partial<ReportOptions> = {}
  ): Promise<string[]> {
    const defaultOptions: ReportOptions = {
      format: 'html',
      includeCharts: true,
      includeDetails: true,
      includeRecommendations: true,
      theme: 'light',
      attachments: [],
      metadata: this.generateDefaultMetadata(reportConfig)
    };

    const finalOptions = { ...defaultOptions, ...options };
    const reportPaths: string[] = [];

    console.log('Generating benchmark report...');
    this.emit('report-start', { config: reportConfig, options: finalOptions });

    try {
      if (finalOptions.format === 'all') {
        // Generate all formats
        const formats: Array<'json' | 'csv' | 'html' | 'markdown' | 'junit'> =
          ['json', 'csv', 'html', 'markdown', 'junit'];

        for (const format of formats) {
          const formatOptions = { ...finalOptions, format };
          const path = await this.generateSingleReport(reportConfig, formatOptions);
          if (path) reportPaths.push(path);
        }
      } else {
        const path = await this.generateSingleReport(reportConfig, finalOptions);
        if (path) reportPaths.push(path);
      }

      this.emit('report-complete', { paths: reportPaths });
      return reportPaths;

    } catch (error) {
      this.emit('report-error', error);
      throw error;
    }
  }

  private async generateSingleReport(
    config: ReportConfig,
    options: ReportOptions
  ): Promise<string | null> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `benchmark-report-${timestamp}`;

    switch (options.format) {
      case 'json':
        return this.generateJSONReport(config, options, baseName);
      case 'csv':
        return this.generateCSVReport(config, options, baseName);
      case 'html':
        return this.generateHTMLReport(config, options, baseName);
      case 'markdown':
        return this.generateMarkdownReport(config, options, baseName);
      case 'junit':
        return this.generateJUnitReport(config, options, baseName);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  private generateJSONReport(
    config: ReportConfig,
    options: ReportOptions,
    baseName: string
  ): string {
    const reportPath = path.join(this.outputDir, `${baseName}.json`);

    const report = {
      metadata: options.metadata,
      summary: this.generateSummary(config.results),
      results: config.results,
      analysis: config.analysis,
      regressions: config.regressions,
      recommendations: options.includeRecommendations ? this.generateRecommendations(config) : undefined,
      charts: options.includeCharts ? this.generateChartData(config.results) : undefined,
      attachments: options.attachments,
      generated: new Date().toISOString()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`JSON report generated: ${reportPath}`);

    return reportPath;
  }

  private generateCSVReport(
    config: ReportConfig,
    options: ReportOptions,
    baseName: string
  ): string {
    const reportPath = path.join(this.outputDir, `${baseName}.csv`);

    const headers = [
      'Suite',
      'Test',
      'Platform',
      'Architecture',
      'Node Version',
      'Timestamp',
      'Iterations',
      'Mean Duration (ms)',
      'Median Duration (ms)',
      'Min Duration (ms)',
      'Max Duration (ms)',
      'P95 Duration (ms)',
      'P99 Duration (ms)',
      'Standard Deviation',
      'Memory Heap Used (MB)',
      'Memory Heap Total (MB)',
      'Memory RSS (MB)',
      'CPU User (μs)',
      'CPU System (μs)',
      'CPU Percentage',
      'Load Average 1m',
      'Load Average 5m',
      'Load Average 15m',
      'Success',
      'Errors',
      'Warnings'
    ];

    const rows = config.results.map(result => [
      result.suite,
      result.test,
      result.platform,
      result.arch,
      result.nodeVersion,
      new Date(result.timestamp).toISOString(),
      result.iterations,
      result.duration.mean.toFixed(3),
      result.duration.median.toFixed(3),
      result.duration.min.toFixed(3),
      result.duration.max.toFixed(3),
      result.duration.p95.toFixed(3),
      result.duration.p99.toFixed(3),
      result.duration.stddev.toFixed(3),
      (result.memory.heapUsed / 1024 / 1024).toFixed(2),
      (result.memory.heapTotal / 1024 / 1024).toFixed(2),
      (result.memory.rss / 1024 / 1024).toFixed(2),
      result.cpu.user,
      result.cpu.system,
      result.cpu.percentage.toFixed(2),
      result.system.loadAverage[0]?.toFixed(2) || '0',
      result.system.loadAverage[1]?.toFixed(2) || '0',
      result.system.loadAverage[2]?.toFixed(2) || '0',
      result.success ? 'PASS' : 'FAIL',
      result.error || '',
      result.warnings.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    fs.writeFileSync(reportPath, csvContent);
    console.log(`CSV report generated: ${reportPath}`);

    return reportPath;
  }

  private generateHTMLReport(
    config: ReportConfig,
    options: ReportOptions,
    baseName: string
  ): string {
    const reportPath = path.join(this.outputDir, `${baseName}.html`);

    const html = this.buildHTMLReport(config, options);
    fs.writeFileSync(reportPath, html);
    console.log(`HTML report generated: ${reportPath}`);

    return reportPath;
  }

  private buildHTMLReport(config: ReportConfig, options: ReportOptions): string {
    const summary = this.generateSummary(config.results);
    const charts = options.includeCharts ? this.generateChartData(config.results) : [];
    const recommendations = options.includeRecommendations ? this.generateRecommendations(config) : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.metadata.title}</title>
    <style>
        ${this.getHTMLStyles(options.theme)}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>${options.metadata.title}</h1>
            <p class="subtitle">${options.metadata.description}</p>
            <div class="metadata">
                <span>Generated: ${new Date().toLocaleString()}</span>
                <span>Platform: ${options.metadata.environment.platform}</span>
                <span>Node.js: ${options.metadata.environment.nodeVersion}</span>
            </div>
        </header>

        <section class="summary">
            <h2>Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Tests</h3>
                    <div class="stat-value">${summary.totalTests}</div>
                </div>
                <div class="stat-card">
                    <h3>Passed</h3>
                    <div class="stat-value success">${summary.passedTests}</div>
                </div>
                <div class="stat-card">
                    <h3>Failed</h3>
                    <div class="stat-value ${summary.failedTests > 0 ? 'error' : ''}">${summary.failedTests}</div>
                </div>
                <div class="stat-card">
                    <h3>Average Duration</h3>
                    <div class="stat-value">${summary.averageDuration.toFixed(2)}ms</div>
                </div>
                <div class="stat-card">
                    <h3>Total Iterations</h3>
                    <div class="stat-value">${summary.totalIterations}</div>
                </div>
                <div class="stat-card">
                    <h3>Success Rate</h3>
                    <div class="stat-value">${(summary.successRate * 100).toFixed(1)}%</div>
                </div>
            </div>
        </section>

        ${options.includeCharts ? this.generateChartsHTML(charts) : ''}

        <section class="results">
            <h2>Detailed Results</h2>
            ${this.generateResultsTable(config.results, options.includeDetails)}
        </section>

        ${config.regressions.length > 0 ? this.generateRegressionsHTML(config.regressions) : ''}

        ${options.includeRecommendations ? this.generateRecommendationsHTML(recommendations) : ''}

        <section class="environment">
            <h2>Environment</h2>
            <table class="env-table">
                <tr><td>Platform</td><td>${options.metadata.environment.platform}</td></tr>
                <tr><td>Architecture</td><td>${options.metadata.environment.arch}</td></tr>
                <tr><td>Node.js Version</td><td>${options.metadata.environment.nodeVersion}</td></tr>
                <tr><td>Memory</td><td>${(options.metadata.environment.memory / 1024 / 1024 / 1024).toFixed(2)} GB</td></tr>
                <tr><td>CPU Cores</td><td>${options.metadata.environment.cpus}</td></tr>
            </table>
        </section>
    </div>

    ${options.includeCharts ? this.generateChartsScript(charts) : ''}
</body>
</html>`;
  }

  private getHTMLStyles(theme: 'light' | 'dark' | 'auto'): string {
    const lightTheme = `
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --border-color: #e1e5e9;
            --card-bg: #f8f9fa;
            --success-color: #28a745;
            --error-color: #dc3545;
            --warning-color: #ffc107;
            --primary-color: #007bff;
        }
    `;

    const darkTheme = `
        :root {
            --bg-color: #1a1a1a;
            --text-color: #e1e1e1;
            --border-color: #333333;
            --card-bg: #2d2d2d;
            --success-color: #4caf50;
            --error-color: #f44336;
            --warning-color: #ff9800;
            --primary-color: #2196f3;
        }
    `;

    const baseStyles = `
        ${theme === 'dark' ? darkTheme : lightTheme}

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--border-color);
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: var(--primary-color);
        }

        .subtitle {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 20px;
        }

        .metadata {
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 0.9em;
            color: #888;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            text-align: center;
        }

        .stat-card h3 {
            font-size: 0.9em;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 10px;
        }

        .stat-value {
            font-size: 2em;
            font-weight: bold;
        }

        .stat-value.success {
            color: var(--success-color);
        }

        .stat-value.error {
            color: var(--error-color);
        }

        .chart-container {
            margin: 30px 0;
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }

        .chart-container h3 {
            margin-bottom: 20px;
            text-align: center;
        }

        .chart-canvas {
            max-height: 400px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: var(--card-bg);
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background: var(--primary-color);
            color: white;
            font-weight: 600;
        }

        tr:hover {
            background-color: rgba(0, 123, 255, 0.1);
        }

        .success-badge {
            background: var(--success-color);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .error-badge {
            background: var(--error-color);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .recommendation {
            background: var(--card-bg);
            border-left: 4px solid var(--primary-color);
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 4px 4px 0;
        }

        .recommendation h4 {
            color: var(--primary-color);
            margin-bottom: 8px;
        }

        section {
            margin: 40px 0;
        }

        h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: var(--primary-color);
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 10px;
        }

        .env-table {
            max-width: 500px;
        }

        .env-table td:first-child {
            font-weight: 600;
            width: 150px;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .metadata {
                flex-direction: column;
                gap: 10px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            table {
                font-size: 0.9em;
            }

            th, td {
                padding: 8px;
            }
        }
    `;

    return baseStyles;
  }

  private generateChartsHTML(charts: ChartData[]): string {
    if (charts.length === 0) return '';

    return `
        <section class="charts">
            <h2>Performance Charts</h2>
            ${charts.map((chart, index) => `
                <div class="chart-container">
                    <h3>${chart.title}</h3>
                    <canvas id="chart-${index}" class="chart-canvas"></canvas>
                </div>
            `).join('')}
        </section>
    `;
  }

  private generateChartsScript(charts: ChartData[]): string {
    return `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                ${charts.map((chart, index) => `
                    const ctx${index} = document.getElementById('chart-${index}').getContext('2d');
                    new Chart(ctx${index}, ${JSON.stringify({
                      type: chart.type,
                      data: chart.data,
                      options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        ...chart.options
                      }
                    })});
                `).join('')}
            });
        </script>
    `;
  }

  private generateResultsTable(results: BenchmarkResult[], includeDetails: boolean): string {
    const headers = includeDetails
      ? ['Suite', 'Test', 'Iterations', 'Mean (ms)', 'P95 (ms)', 'P99 (ms)', 'Memory (MB)', 'CPU %', 'Status']
      : ['Suite', 'Test', 'Mean (ms)', 'Status'];

    const rows = results.map(result => {
      const baseRow = [
        result.suite,
        result.test,
        includeDetails ? result.iterations.toString() : '',
        result.duration.mean.toFixed(2),
        includeDetails ? result.duration.p95.toFixed(2) : '',
        includeDetails ? result.duration.p99.toFixed(2) : '',
        includeDetails ? (result.memory.heapUsed / 1024 / 1024).toFixed(2) : '',
        includeDetails ? result.cpu.percentage.toFixed(1) : '',
        result.success
          ? '<span class="success-badge">PASS</span>'
          : '<span class="error-badge">FAIL</span>'
      ].filter(cell => cell !== '');

      return `<tr>${baseRow.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');

    return `
        <table>
            <thead>
                <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  private generateRegressionsHTML(regressions: any[]): string {
    if (regressions.length === 0) return '';

    return `
        <section class="regressions">
            <h2>Performance Regressions</h2>
            ${regressions.map(regression => `
                <div class="recommendation">
                    <h4>${regression.test} - ${regression.metric}</h4>
                    <p>Change: ${regression.change > 0 ? '+' : ''}${regression.change.toFixed(2)}%
                       (${regression.current.toFixed(2)} vs ${regression.baseline.toFixed(2)})</p>
                    <p>Severity: ${regression.severity}</p>
                </div>
            `).join('')}
        </section>
    `;
  }

  private generateRecommendationsHTML(recommendations: any[]): string {
    if (recommendations.length === 0) return '';

    return `
        <section class="recommendations">
            <h2>Optimization Recommendations</h2>
            ${recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Expected Impact:</strong> ${rec.impact}</p>
                    <p><strong>Priority:</strong> ${rec.priority}</p>
                </div>
            `).join('')}
        </section>
    `;
  }

  private generateMarkdownReport(
    config: ReportConfig,
    options: ReportOptions,
    baseName: string
  ): string {
    const reportPath = path.join(this.outputDir, `${baseName}.md`);

    const summary = this.generateSummary(config.results);
    const recommendations = options.includeRecommendations ? this.generateRecommendations(config) : [];

    const markdown = `# ${options.metadata.title}

${options.metadata.description}

**Generated:** ${new Date().toLocaleString()}
**Platform:** ${options.metadata.environment.platform}
**Node.js:** ${options.metadata.environment.nodeVersion}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passedTests} |
| Failed | ${summary.failedTests} |
| Success Rate | ${(summary.successRate * 100).toFixed(1)}% |
| Average Duration | ${summary.averageDuration.toFixed(2)}ms |
| Total Iterations | ${summary.totalIterations} |

## Detailed Results

| Suite | Test | Iterations | Mean (ms) | P95 (ms) | P99 (ms) | Memory (MB) | CPU % | Status |
|-------|------|------------|-----------|----------|----------|-------------|-------|--------|
${config.results.map(result =>
  `| ${result.suite} | ${result.test} | ${result.iterations} | ${result.duration.mean.toFixed(2)} | ${result.duration.p95.toFixed(2)} | ${result.duration.p99.toFixed(2)} | ${(result.memory.heapUsed / 1024 / 1024).toFixed(2)} | ${result.cpu.percentage.toFixed(1)} | ${result.success ? '✅ PASS' : '❌ FAIL'} |`
).join('\n')}

${config.regressions.length > 0 ? `
## Performance Regressions

${config.regressions.map(reg =>
  `### ${reg.test} - ${reg.metric}
- **Change:** ${reg.change > 0 ? '+' : ''}${reg.change.toFixed(2)}%
- **Current:** ${reg.current.toFixed(2)}
- **Baseline:** ${reg.baseline.toFixed(2)}
- **Severity:** ${reg.severity}
`).join('\n')}
` : ''}

${options.includeRecommendations && recommendations.length > 0 ? `
## Optimization Recommendations

${recommendations.map(rec =>
  `### ${rec.title}
${rec.description}

**Expected Impact:** ${rec.impact}
**Priority:** ${rec.priority}
`).join('\n')}
` : ''}

## Environment

- **Platform:** ${options.metadata.environment.platform}
- **Architecture:** ${options.metadata.environment.arch}
- **Node.js Version:** ${options.metadata.environment.nodeVersion}
- **Memory:** ${(options.metadata.environment.memory / 1024 / 1024 / 1024).toFixed(2)} GB
- **CPU Cores:** ${options.metadata.environment.cpus}

---
*Report generated by Performance Benchmarker*
`;

    fs.writeFileSync(reportPath, markdown);
    console.log(`Markdown report generated: ${reportPath}`);

    return reportPath;
  }

  private generateJUnitReport(
    config: ReportConfig,
    options: ReportOptions,
    baseName: string
  ): string {
    const reportPath = path.join(this.outputDir, `${baseName}.xml`);

    const summary = this.generateSummary(config.results);
    const totalTime = config.results.reduce((sum, result) => sum + result.duration.mean, 0) / 1000; // seconds

    const testCases = config.results.map(result => {
      const timeInSeconds = (result.duration.mean / 1000).toFixed(3);

      if (result.success) {
        return `    <testcase classname="${this.escapeXml(result.suite)}" name="${this.escapeXml(result.test)}" time="${timeInSeconds}"/>`;
      } else {
        return `    <testcase classname="${this.escapeXml(result.suite)}" name="${this.escapeXml(result.test)}" time="${timeInSeconds}">
      <failure message="${this.escapeXml(result.error || 'Test failed')}">${this.escapeXml(result.error || 'Unknown error')}</failure>
    </testcase>`;
      }
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Performance Benchmarks"
           tests="${summary.totalTests}"
           failures="${summary.failedTests}"
           errors="0"
           time="${totalTime.toFixed(3)}"
           timestamp="${new Date().toISOString()}">
  <properties>
    <property name="platform" value="${options.metadata.environment.platform}"/>
    <property name="arch" value="${options.metadata.environment.arch}"/>
    <property name="node.version" value="${options.metadata.environment.nodeVersion}"/>
    <property name="memory.total" value="${options.metadata.environment.memory}"/>
    <property name="cpu.cores" value="${options.metadata.environment.cpus}"/>
  </properties>
${testCases}
</testsuite>`;

    fs.writeFileSync(reportPath, xml);
    console.log(`JUnit report generated: ${reportPath}`);

    return reportPath;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private generateSummary(results: BenchmarkResult[]) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    const totalIterations = results.reduce((sum, r) => sum + r.iterations, 0);
    const averageDuration = results.length > 0
      ? results.reduce((sum, r) => sum + r.duration.mean, 0) / results.length
      : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      totalIterations,
      averageDuration
    };
  }

  private generateChartData(results: BenchmarkResult[]): ChartData[] {
    const charts: ChartData[] = [];

    // Duration chart
    charts.push({
      type: 'bar',
      title: 'Test Duration Comparison',
      data: {
        labels: results.map(r => `${r.suite}.${r.test}`),
        datasets: [{
          label: 'Mean Duration (ms)',
          data: results.map(r => r.duration.mean),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Duration (ms)'
            }
          }
        }
      }
    });

    // Memory usage chart
    charts.push({
      type: 'line',
      title: 'Memory Usage by Test',
      data: {
        labels: results.map(r => `${r.suite}.${r.test}`),
        datasets: [{
          label: 'Heap Used (MB)',
          data: results.map(r => r.memory.heapUsed / 1024 / 1024),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Memory (MB)'
            }
          }
        }
      }
    });

    // CPU usage chart
    charts.push({
      type: 'bar',
      title: 'CPU Usage by Test',
      data: {
        labels: results.map(r => `${r.suite}.${r.test}`),
        datasets: [{
          label: 'CPU Percentage',
          data: results.map(r => r.cpu.percentage),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'CPU Usage (%)'
            }
          }
        }
      }
    });

    return charts;
  }

  private generateRecommendations(config: ReportConfig): any[] {
    const recommendations: any[] = [];
    const results = config.results;

    // Slow tests recommendation
    const slowTests = results.filter(r => r.duration.mean > 1000);
    if (slowTests.length > 0) {
      recommendations.push({
        title: 'Optimize Slow Tests',
        description: `${slowTests.length} tests are taking longer than 1 second to execute. Consider optimizing these tests or the code they're testing.`,
        impact: `Potential ${(slowTests.reduce((sum, t) => sum + (t.duration.mean - 1000), 0) / 1000).toFixed(1)}s reduction in test suite runtime`,
        priority: 'High'
      });
    }

    // High memory usage recommendation
    const highMemoryTests = results.filter(r => r.memory.heapUsed > 100 * 1024 * 1024);
    if (highMemoryTests.length > 0) {
      recommendations.push({
        title: 'Reduce Memory Usage',
        description: `${highMemoryTests.length} tests are using more than 100MB of memory. Review memory allocation patterns.`,
        impact: 'Reduced memory pressure and potential GC improvements',
        priority: 'Medium'
      });
    }

    // Failed tests recommendation
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      recommendations.push({
        title: 'Fix Failed Tests',
        description: `${failedTests.length} tests are failing. Address these issues to improve overall reliability.`,
        impact: 'Improved test reliability and confidence',
        priority: 'Critical'
      });
    }

    // High CPU usage recommendation
    const highCPUTests = results.filter(r => r.cpu.percentage > 80);
    if (highCPUTests.length > 0) {
      recommendations.push({
        title: 'Optimize CPU-Intensive Tests',
        description: `${highCPUTests.length} tests are using more than 80% CPU. Consider algorithmic optimizations.`,
        impact: 'Reduced CPU usage and improved system responsiveness',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  private generateDefaultMetadata(config: ReportConfig): ReportMetadata {
    return {
      title: 'Performance Benchmark Report',
      description: 'Comprehensive performance analysis of benchmark results',
      author: 'Performance Benchmarker',
      timestamp: Date.now(),
      version: '1.0.0',
      tags: ['performance', 'benchmark', 'analysis'],
      environment: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: require('os').totalmem(),
        cpus: require('os').cpus().length
      }
    };
  }

  async generateComparisonReport(
    current: BenchmarkResult[],
    baseline: BenchmarkResult[],
    outputPath?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = outputPath || path.join(this.outputDir, `comparison-report-${timestamp}.html`);

    const comparisons = this.compareResults(current, baseline);
    const regressions = comparisons.filter(c => c.isRegression);
    const improvements = comparisons.filter(c => c.isImprovement);

    const html = this.buildComparisonHTML(comparisons, regressions, improvements);
    fs.writeFileSync(reportPath, html);

    console.log(`Comparison report generated: ${reportPath}`);
    return reportPath;
  }

  private compareResults(current: BenchmarkResult[], baseline: BenchmarkResult[]): any[] {
    const comparisons: any[] = [];

    current.forEach(currentResult => {
      const baselineResult = baseline.find(b =>
        b.suite === currentResult.suite && b.test === currentResult.test
      );

      if (baselineResult) {
        const durationChange = ((currentResult.duration.mean - baselineResult.duration.mean) / baselineResult.duration.mean) * 100;
        const memoryChange = ((currentResult.memory.heapUsed - baselineResult.memory.heapUsed) / baselineResult.memory.heapUsed) * 100;

        comparisons.push({
          suite: currentResult.suite,
          test: currentResult.test,
          current: currentResult,
          baseline: baselineResult,
          durationChange,
          memoryChange,
          isRegression: durationChange > 10 || memoryChange > 20,
          isImprovement: durationChange < -10 || memoryChange < -20
        });
      }
    });

    return comparisons;
  }

  private buildComparisonHTML(comparisons: any[], regressions: any[], improvements: any[]): string {
    // Implementation would be similar to buildHTMLReport but focused on comparisons
    return `<!DOCTYPE html>
<html>
<head>
    <title>Performance Comparison Report</title>
    <style>${this.getHTMLStyles('light')}</style>
</head>
<body>
    <div class="container">
        <h1>Performance Comparison Report</h1>

        <section class="summary">
            <h2>Summary</h2>
            <p>Total Comparisons: ${comparisons.length}</p>
            <p>Regressions: ${regressions.length}</p>
            <p>Improvements: ${improvements.length}</p>
        </section>

        <section class="regressions">
            <h2>Performance Regressions</h2>
            ${regressions.map(r => `
                <div class="comparison-item regression">
                    <h3>${r.suite}.${r.test}</h3>
                    <p>Duration: ${r.durationChange > 0 ? '+' : ''}${r.durationChange.toFixed(2)}%</p>
                    <p>Memory: ${r.memoryChange > 0 ? '+' : ''}${r.memoryChange.toFixed(2)}%</p>
                </div>
            `).join('')}
        </section>

        <section class="improvements">
            <h2>Performance Improvements</h2>
            ${improvements.map(i => `
                <div class="comparison-item improvement">
                    <h3>${i.suite}.${i.test}</h3>
                    <p>Duration: ${i.durationChange.toFixed(2)}%</p>
                    <p>Memory: ${i.memoryChange.toFixed(2)}%</p>
                </div>
            `).join('')}
        </section>
    </div>
</body>
</html>`;
  }

  getOutputDirectory(): string {
    return this.outputDir;
  }

  setOutputDirectory(dir: string): void {
    this.outputDir = dir;
    this.ensureOutputDir();
  }

  destroy(): void {
    this.removeAllListeners();
  }
}

export default BenchmarkReporter;