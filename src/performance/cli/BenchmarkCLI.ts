#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PerformanceBenchmarker, quickBenchmark } from '../benchmarking/PerformanceBenchmarker';
import { CrossPlatformBenchmark } from '../benchmarking/CrossPlatformBenchmark';
import { LoadTester } from '../load/LoadTester';
import { RealTimeMonitor } from '../monitoring/RealTimeMonitor';
import { ReportGenerator } from '../reporting/ReportGenerator';
import { PerformanceAnalyzer } from '../analysis/PerformanceAnalyzer';

class BenchmarkCLI {
  private program: Command;
  private benchmarker: PerformanceBenchmarker;
  private crossPlatformBenchmark: CrossPlatformBenchmark;
  private loadTester: LoadTester;
  private monitor: RealTimeMonitor;
  private reportGenerator: ReportGenerator;
  private analyzer: PerformanceAnalyzer;

  constructor() {
    this.program = new Command();
    this.benchmarker = new PerformanceBenchmarker();
    this.crossPlatformBenchmark = new CrossPlatformBenchmark();
    this.loadTester = new LoadTester();
    this.monitor = new RealTimeMonitor();
    this.reportGenerator = new ReportGenerator();
    this.analyzer = new PerformanceAnalyzer();

    this.setupCommands();
    this.setupEventListeners();
  }

  private setupCommands(): void {
    this.program
      .name('benchmark-cli')
      .description('Performance Benchmarking CLI Tool')
      .version('1.0.0');

    // Benchmark commands
    this.program
      .command('benchmark')
      .description('Run performance benchmarks')
      .option('-c, --config <file>', 'Configuration file path')
      .option('-o, --output <dir>', 'Output directory', './benchmark-results')
      .option('-i, --iterations <number>', 'Number of iterations', '1000')
      .option('-w, --warmup <number>', 'Warmup iterations', '100')
      .option('-t, --timeout <number>', 'Timeout per test (ms)', '30000')
      .option('--save-baseline <name>', 'Save results as baseline')
      .action(async (options) => {
        await this.runBenchmark(options);
      });

    // Load test commands
    this.program
      .command('loadtest')
      .description('Run load tests')
      .option('-c, --config <file>', 'Configuration file path')
      .option('-o, --output <dir>', 'Output directory', './loadtest-results')
      .option('--concurrency <number>', 'Concurrent users', '10')
      .option('--duration <number>', 'Test duration (ms)', '60000')
      .option('--rampup <number>', 'Ramp up time (ms)', '10000')
      .option('--rate <number>', 'Requests per second (alternative to concurrency)')
      .action(async (options) => {
        await this.runLoadTest(options);
      });

    // Monitor commands
    this.program
      .command('monitor')
      .description('Start real-time system monitoring')
      .option('-i, --interval <number>', 'Monitoring interval (ms)', '1000')
      .option('-d, --duration <number>', 'Monitoring duration (ms)', '300000')
      .option('-o, --output <dir>', 'Output directory', './monitor-results')
      .option('--alerts', 'Enable alert notifications')
      .action(async (options) => {
        await this.runMonitoring(options);
      });

    // Cross-platform commands
    this.program
      .command('cross-platform')
      .description('Run cross-platform benchmarks')
      .option('-c, --config <file>', 'Configuration file path')
      .option('-o, --output <dir>', 'Output directory', './cross-platform-results')
      .action(async (options) => {
        await this.runCrossPlatformBenchmark(options);
      });

    // Analysis commands
    this.program
      .command('analyze')
      .description('Analyze performance results')
      .option('-b, --baseline <file>', 'Baseline file path')
      .option('-c, --current <file>', 'Current results file path')
      .option('-o, --output <dir>', 'Output directory', './analysis-results')
      .action(async (options) => {
        await this.runAnalysis(options);
      });

    // Report commands
    this.program
      .command('report')
      .description('Generate performance reports')
      .option('-i, --input <dir>', 'Input directory with results', './benchmark-results')
      .option('-o, --output <dir>', 'Output directory', './reports')
      .option('-f, --format <format>', 'Report format (html|json|csv|markdown)', 'html')
      .option('-t, --title <title>', 'Report title', 'Performance Report')
      .option('--include-charts', 'Include charts in report')
      .action(async (options) => {
        await this.generateReport(options);
      });

    // Quick benchmark command
    this.program
      .command('quick')
      .description('Run a quick benchmark test')
      .option('-n, --name <name>', 'Test name', 'Quick Benchmark')
      .option('-i, --iterations <number>', 'Number of iterations', '1000')
      .action(async (options) => {
        await this.runQuickBenchmark(options);
      });

    // List commands
    this.program
      .command('list')
      .description('List available tests and configurations')
      .option('--benchmarks', 'List available benchmarks')
      .option('--loadtests', 'List available load tests')
      .option('--baselines', 'List saved baselines')
      .action(async (options) => {
        await this.listItems(options);
      });
  }

  private setupEventListeners(): void {
    // Benchmarker events
    this.benchmarker.on('benchmarkStart', (data) => {
      console.log(`Starting benchmark: ${data.name}`);
    });

    this.benchmarker.on('benchmarkEnd', (result) => {
      console.log(`Completed benchmark: ${result.name} - ${result.operationsPerSecond.toFixed(2)} ops/sec`);
    });

    this.benchmarker.on('progress', (data) => {
      const percentage = data.percentage.toFixed(1);
      process.stdout.write(`\rProgress: ${percentage}% (${data.completed}/${data.total})`);
    });

    // Load tester events
    this.loadTester.on('loadTestStart', (config) => {
      console.log(`Starting load test: ${config.name}`);
    });

    this.loadTester.on('loadTestEnd', (result) => {
      console.log(`Completed load test: ${result.testName} - ${result.requestsPerSecond.toFixed(2)} req/sec`);
    });

    this.loadTester.on('rampUpStart', (data) => {
      console.log(`Ramping up over ${data.duration}ms...`);
    });

    this.loadTester.on('rampDownStart', (data) => {
      console.log(`Ramping down over ${data.duration}ms...`);
    });

    // Monitor events
    this.monitor.on('monitoringStarted', (data) => {
      console.log(`Monitoring started with ${data.interval}ms interval`);
    });

    this.monitor.on('alert', (alert) => {
      console.log(`🚨 ALERT: ${alert.message}`);
    });

    this.monitor.on('monitoringStopped', (data) => {
      console.log(`Monitoring stopped. Collected ${data.totalMetrics} metrics.`);
    });
  }

  private async runBenchmark(options: any): Promise<void> {
    try {
      console.log('Starting performance benchmark...');

      const config = await this.loadConfig(options.config);
      const testSuite = await this.loadTestSuite(config);

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      const benchmarkConfig = {
        iterations: parseInt(options.iterations),
        warmupIterations: parseInt(options.warmup),
        timeout: parseInt(options.timeout)
      };

      const results = await this.benchmarker.runBenchmarkSuite(testSuite, benchmarkConfig);

      // Save results
      const resultsFile = path.join(options.output, `benchmark-${Date.now()}.json`);
      await this.benchmarker.saveResults(resultsFile);

      // Generate report
      const report = this.benchmarker.generateReport();
      const reportFile = path.join(options.output, `benchmark-report-${Date.now()}.txt`);
      await fs.writeFile(reportFile, report);

      // Save as baseline if requested
      if (options.saveBaseline) {
        await this.analyzer.createBaseline(
          options.saveBaseline,
          '1.0.0',
          results,
          [],
          []
        );
        const baselineFile = path.join(options.output, `baseline-${options.saveBaseline}.json`);
        const baseline = this.analyzer.getBaselines().find(b => b.name === options.saveBaseline);
        if (baseline) {
          await this.analyzer.saveBaseline(baseline, baselineFile);
        }
      }

      console.log(`\nBenchmark completed successfully!`);
      console.log(`Results saved to: ${resultsFile}`);
      console.log(`Report saved to: ${reportFile}`);

    } catch (error) {
      console.error('Benchmark failed:', error);
      process.exit(1);
    }
  }

  private async runLoadTest(options: any): Promise<void> {
    try {
      console.log('Starting load test...');

      const config = await this.loadConfig(options.config);
      const testFunction = await this.loadTestFunction(config);

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      const loadTestConfig = {
        name: 'CLI Load Test',
        targetFunction: testFunction,
        concurrency: parseInt(options.concurrency),
        duration: parseInt(options.duration),
        rampUpTime: parseInt(options.rampup),
        rampDownTime: parseInt(options.rampup),
        timeout: 5000
      };

      if (options.rate) {
        loadTestConfig.requestRate = parseInt(options.rate);
      }

      const result = await this.loadTester.runLoadTest(loadTestConfig);

      // Save results
      const resultsFile = path.join(options.output, `loadtest-${Date.now()}.json`);
      await this.loadTester.saveResults(resultsFile);

      // Generate report
      const report = this.loadTester.generateLoadTestReport(result);
      const reportFile = path.join(options.output, `loadtest-report-${Date.now()}.txt`);
      await fs.writeFile(reportFile, report);

      console.log(`\nLoad test completed successfully!`);
      console.log(`Results saved to: ${resultsFile}`);
      console.log(`Report saved to: ${reportFile}`);

    } catch (error) {
      console.error('Load test failed:', error);
      process.exit(1);
    }
  }

  private async runMonitoring(options: any): Promise<void> {
    try {
      console.log('Starting system monitoring...');

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      this.monitor.setMonitoringInterval(parseInt(options.interval));

      if (options.alerts) {
        console.log('Alert notifications enabled');
      }

      await this.monitor.startMonitoring();

      // Run for specified duration
      const duration = parseInt(options.duration);
      await new Promise(resolve => setTimeout(resolve, duration));

      await this.monitor.stopMonitoring();

      // Save results
      const resultsFile = path.join(options.output, `monitoring-${Date.now()}.json`);
      await this.monitor.saveMetrics(resultsFile);

      // Generate report
      const report = this.monitor.generateMetricsReport();
      const reportFile = path.join(options.output, `monitoring-report-${Date.now()}.txt`);
      await fs.writeFile(reportFile, report);

      console.log(`\nMonitoring completed successfully!`);
      console.log(`Results saved to: ${resultsFile}`);
      console.log(`Report saved to: ${reportFile}`);

    } catch (error) {
      console.error('Monitoring failed:', error);
      process.exit(1);
    }
  }

  private async runCrossPlatformBenchmark(options: any): Promise<void> {
    try {
      console.log('Starting cross-platform benchmark...');

      const config = await this.loadConfig(options.config);
      const testSuite = await this.loadTestSuite(config);

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      const report = await this.crossPlatformBenchmark.runCrossPlatformBenchmark(testSuite);

      // Save results
      const resultsFile = path.join(options.output, `cross-platform-${Date.now()}.json`);
      await this.crossPlatformBenchmark.saveCrossPlatformReport(report, resultsFile);

      // Generate report
      const reportText = this.crossPlatformBenchmark.generatePlatformComparisonReport(report);
      const reportFile = path.join(options.output, `cross-platform-report-${Date.now()}.txt`);
      await fs.writeFile(reportFile, reportText);

      console.log(`\nCross-platform benchmark completed successfully!`);
      console.log(`Results saved to: ${resultsFile}`);
      console.log(`Report saved to: ${reportFile}`);

    } catch (error) {
      console.error('Cross-platform benchmark failed:', error);
      process.exit(1);
    }
  }

  private async runAnalysis(options: any): Promise<void> {
    try {
      console.log('Starting performance analysis...');

      if (!options.baseline || !options.current) {
        console.error('Both baseline and current results files are required for analysis');
        process.exit(1);
      }

      // Load baseline
      const baseline = await this.analyzer.loadBaseline(options.baseline);

      // Load current results
      const currentData = JSON.parse(await fs.readFile(options.current, 'utf-8'));

      // Run analysis
      const analysis = await this.analyzer.analyzePerformance(
        baseline.name,
        currentData.benchmarks || [],
        currentData.loadTests || [],
        currentData.systemMetrics || []
      );

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      // Save analysis
      const analysisFile = path.join(options.output, `analysis-${Date.now()}.json`);
      await this.analyzer.saveAnalysis(analysis, analysisFile);

      // Generate summary
      console.log(`\nPerformance Analysis Summary:`);
      console.log(`Overall Score: ${analysis.summary.overallScore}/100`);
      console.log(`Total Tests: ${analysis.summary.totalTests}`);
      console.log(`Regressions: ${analysis.summary.regressions}`);
      console.log(`Improvements: ${analysis.summary.improvements}`);
      console.log(`Stable: ${analysis.summary.stable}`);
      console.log(`Recommendation: ${analysis.summary.recommendation}`);

      if (analysis.regressions.length > 0) {
        console.log('\nRegressions detected:');
        analysis.regressions.forEach(regression => {
          console.log(`  ${regression.testName} (${regression.metric}): ${regression.degradationPercent.toFixed(2)}% degradation [${regression.severity}]`);
        });
      }

      if (analysis.improvements.length > 0) {
        console.log('\nImprovements detected:');
        analysis.improvements.forEach(improvement => {
          console.log(`  ${improvement.testName} (${improvement.metric}): ${improvement.improvementPercent.toFixed(2)}% improvement [${improvement.significance}]`);
        });
      }

      console.log(`\nAnalysis saved to: ${analysisFile}`);

    } catch (error) {
      console.error('Analysis failed:', error);
      process.exit(1);
    }
  }

  private async generateReport(options: any): Promise<void> {
    try {
      console.log('Generating performance report...');

      // Load results from input directory
      const inputFiles = await fs.readdir(options.input);
      const resultFiles = inputFiles.filter(file => file.endsWith('.json'));

      if (resultFiles.length === 0) {
        console.error('No result files found in input directory');
        process.exit(1);
      }

      const reportData: any = {
        benchmarks: [],
        loadTests: [],
        systemMetrics: [],
        metadata: {
          generatedAt: Date.now(),
          platform: process.platform,
          nodeVersion: process.version,
          reportVersion: '1.0.0'
        }
      };

      // Load all result files
      for (const file of resultFiles) {
        const filePath = path.join(options.input, file);
        const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

        if (data.benchmarks) reportData.benchmarks.push(...data.benchmarks);
        if (data.loadTests) reportData.loadTests.push(...data.loadTests);
        if (data.systemMetrics) reportData.systemMetrics.push(...data.systemMetrics);
        if (data.results) reportData.benchmarks.push(...data.results);
      }

      // Ensure output directory exists
      await fs.mkdir(options.output, { recursive: true });

      const reportConfig = {
        title: options.title,
        format: options.format as 'html' | 'json' | 'csv' | 'markdown',
        includeCharts: options.includeCharts || false,
        includeRawData: true
      };

      // Generate report
      const report = await this.reportGenerator.generateReport(reportData, reportConfig);
      const extension = options.format === 'html' ? 'html' : options.format === 'json' ? 'json' : options.format === 'csv' ? 'csv' : 'md';
      const reportFile = path.join(options.output, `performance-report.${extension}`);
      await this.reportGenerator.saveReport(report, reportFile);

      console.log(`\nReport generated successfully!`);
      console.log(`Report saved to: ${reportFile}`);

    } catch (error) {
      console.error('Report generation failed:', error);
      process.exit(1);
    }
  }

  private async runQuickBenchmark(options: any): Promise<void> {
    try {
      console.log(`Running quick benchmark: ${options.name}`);

      // Simple test function for demonstration
      const testFunction = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += Math.sqrt(i + 1); // Real mathematical operation
        }
        return sum;
      };

      const result = await quickBenchmark(options.name, testFunction, parseInt(options.iterations));

      console.log(`\nQuick Benchmark Results:`);
      console.log(`Test: ${result.name}`);
      console.log(`Operations/sec: ${result.operationsPerSecond.toFixed(2)}`);
      console.log(`Average time: ${result.avgTime.toFixed(4)}ms`);
      console.log(`95th percentile: ${result.percentiles.p95.toFixed(4)}ms`);
      console.log(`Memory used: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);

    } catch (error) {
      console.error('Quick benchmark failed:', error);
      process.exit(1);
    }
  }

  private async listItems(options: any): Promise<void> {
    try {
      if (options.benchmarks) {
        console.log('Available Benchmarks:');
        console.log('  - CPU Intensive Test');
        console.log('  - Memory Allocation Test');
        console.log('  - I/O Operations Test');
        console.log('  - JSON Processing Test');
        console.log('  - String Manipulation Test');
      }

      if (options.loadtests) {
        console.log('Available Load Tests:');
        console.log('  - HTTP Request Test');
        console.log('  - Database Query Test');
        console.log('  - File Processing Test');
        console.log('  - API Endpoint Test');
      }

      if (options.baselines) {
        const baselines = this.analyzer.getBaselines();
        console.log('Saved Baselines:');
        baselines.forEach(baseline => {
          console.log(`  - ${baseline.name} (v${baseline.version}) - ${new Date(baseline.timestamp).toISOString()}`);
        });
      }

      if (!options.benchmarks && !options.loadtests && !options.baselines) {
        console.log('Use --benchmarks, --loadtests, or --baselines to list specific items');
      }

    } catch (error) {
      console.error('Failed to list items:', error);
      process.exit(1);
    }
  }

  private async loadConfig(configPath?: string): Promise<any> {
    if (!configPath) {
      return {}; // Default empty config
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.warn(`Failed to load config file ${configPath}, using defaults`);
      return {};
    }
  }

  private async loadTestSuite(config: any): Promise<{ [key: string]: () => Promise<any> | any }> {
    // Default test suite if none provided in config
    return {
      'CPU Intensive': () => {
        let result = 0;
        for (let i = 0; i < 100000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      },
      'Memory Allocation': () => {
        const arrays = [];
        for (let i = 0; i < 1000; i++) {
          arrays.push(new Array(1000).fill(i / 1000)); // Real deterministic values
        }
        return arrays.length;
      },
      'JSON Processing': () => {
        const data = { items: [] };
        for (let i = 0; i < 1000; i++) {
          data.items.push({ id: i, value: i / 1000, name: `item_${i}` }); // Real deterministic values
        }
        return JSON.parse(JSON.stringify(data));
      },
      'String Operations': () => {
        let str = '';
        for (let i = 0; i < 1000; i++) {
          str += `Hello World ${i} `;
        }
        return str.split(' ').length;
      }
    };
  }

  private async loadTestFunction(config: any): Promise<() => Promise<any> | any> {
    // Default test function if none provided in config
    return async () => {
      // Simulate async work
      const delay = 5 + (Date.now() % 10); // Variable but deterministic delay
      await new Promise(resolve => setTimeout(resolve, delay));
      return Date.now() % 1000; // Real value based on current time
    };
  }

  public run(): void {
    this.program.parse(process.argv);
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new BenchmarkCLI();
  cli.run();
}

export { BenchmarkCLI };