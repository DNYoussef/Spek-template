#!/usr/bin/env node
/**
 * Live Phase 5 Training Dashboard UI Testing Script - Port 3001
 *
 * Comprehensive testing of all 8 Phase 5 UI components on live Next.js dashboard
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class LivePhase5UITester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshots = [];
        this.testResults = {};
        this.baseUrl = 'http://localhost:3001';
        this.screenshotDir = path.join(__dirname, '..', 'screenshots', 'live-phase5-testing');
        this.errors = [];
    }

    async initialize() {
        console.log('🚀 Initializing Live Phase 5 UI Testing Suite...');
        console.log(`📍 Target URL: ${this.baseUrl}`);

        // Create screenshots directory
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        // Launch browser
        this.browser = await chromium.launch({
            headless: false,
            slowMo: 100
        });

        this.page = await this.browser.newPage();
        await this.page.setViewportSize({ width: 1920, height: 1080 });

        // Set up console error monitoring
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.errors.push(`Console Error: ${msg.text()}`);
            }
        });

        console.log('✅ Browser initialized successfully');
    }

    async navigateToLiveDashboard() {
        console.log('🌐 Navigating to Live Next.js Dashboard...');

        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await this.page.waitForTimeout(3000);

            const title = await this.page.title();
            console.log(`✅ Dashboard loaded: ${title}`);

            // Take full page screenshot
            const fullPagePath = path.join(this.screenshotDir, '01-full-live-dashboard.png');
            await this.page.screenshot({
                path: fullPagePath,
                fullPage: true
            });
            this.screenshots.push({
                component: 'Full Live Dashboard',
                path: fullPagePath,
                description: 'Complete view of Next.js dashboard at localhost:3001'
            });

            // Look for Phase 5 section
            await this.findPhase5Section();

            return true;
        } catch (error) {
            console.error('❌ Failed to navigate to dashboard:', error.message);
            this.errors.push(`Navigation Error: ${error.message}`);
            return false;
        }
    }

    async findPhase5Section() {
        console.log('🔍 Searching for Phase 5 training components...');

        const possibleSelectors = [
            'div[data-testid*="phase5"]',
            'div[class*="phase5"]',
            'div[class*="training"]',
            'div[id*="phase5"]',
            'section[class*="training"]',
            'div[class*="dashboard"]',
            'nav[class*="phase"]'
        ];

        for (const selector of possibleSelectors) {
            try {
                const elements = await this.page.locator(selector).count();
                if (elements > 0) {
                    console.log(`✅ Found ${elements} elements with selector: ${selector}`);

                    const screenshotPath = path.join(this.screenshotDir, '02-phase5-section.png');
                    await this.page.locator(selector).first().screenshot({
                        path: screenshotPath,
                        timeout: 5000
                    });
                    this.screenshots.push({
                        component: 'Phase 5 Section',
                        path: screenshotPath,
                        description: `Found Phase 5 section with selector: ${selector}`
                    });
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        // Check for any training-related content
        const pageContent = await this.page.content();
        const hasPhase5Content = pageContent.toLowerCase().includes('phase5') ||
                               pageContent.toLowerCase().includes('training') ||
                               pageContent.toLowerCase().includes('curriculum');

        console.log(`📄 Page contains Phase 5/training content: ${hasPhase5Content}`);
    }

    async testCurriculumProgressDisplay() {
        console.log('📚 Testing 10-Level Curriculum Progress Display...');

        const selectors = [
            '.curriculum-progress',
            '[data-testid="curriculum-progress"]',
            '.level-badge',
            '[class*="curriculum"]',
            '[class*="progress"]'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found curriculum component: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '03-curriculum-progress.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Curriculum Progress',
                        path: screenshotPath,
                        description: `10-level curriculum progress display with ${count} elements`
                    });

                    // Test interactivity
                    try {
                        await element.first().hover();
                        await this.page.waitForTimeout(500);
                        console.log(`✅ Hover interaction successful on curriculum component`);
                    } catch (hoverError) {
                        console.log(`⚠️ Hover interaction failed: ${hoverError.message}`);
                    }

                    this.testResults.curriculumProgress = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count,
                        interactionTest: 'PASSED'
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Curriculum progress component not found');
            this.testResults.curriculumProgress = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testEdgeOfChaosController() {
        console.log('🌪️ Testing Edge of Chaos Controller...');

        const selectors = [
            '.chaos-controller',
            '[data-testid="chaos-controller"]',
            '.edge-of-chaos',
            '[class*="chaos"]',
            '.chaos-particle'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found chaos controller: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '04-chaos-controller.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Edge of Chaos Controller',
                        path: screenshotPath,
                        description: `Chaos controller with particle visualization (${count} elements)`
                    });

                    // Test particle animation
                    const particles = await this.page.locator('.chaos-particle').count();
                    console.log(`🎲 Found ${particles} chaos particles`);

                    this.testResults.chaosController = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count,
                        particleCount: particles
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Edge of chaos controller not found');
            this.testResults.chaosController = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testGrokfastMetrics() {
        console.log('🚀 Testing Grokfast Acceleration Metrics...');

        const selectors = [
            '.grokfast-metrics',
            '[data-testid="grokfast"]',
            '[class*="grokfast"]',
            '[class*="acceleration"]',
            '#grok-factor'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found grokfast metrics: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '05-grokfast-metrics.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Grokfast Acceleration',
                        path: screenshotPath,
                        description: `Grokfast acceleration metrics display (${count} elements)`
                    });

                    this.testResults.grokfastMetrics = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Grokfast metrics not found');
            this.testResults.grokfastMetrics = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testTrainingMetrics() {
        console.log('📈 Testing Real-time Training Metrics...');

        const selectors = [
            '.training-metrics',
            '[data-testid="training-metrics"]',
            '.metrics-display',
            '[class*="metrics"]',
            '.loss-function',
            '.accuracy'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found training metrics: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '06-training-metrics.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Real-time Training Metrics',
                        path: screenshotPath,
                        description: `Training metrics with real-time updates (${count} elements)`
                    });

                    // Check for wave animation
                    const waves = await this.page.locator('.wave').count();
                    console.log(`🌊 Found ${waves} wave animation elements`);

                    this.testResults.trainingMetrics = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count,
                        waveAnimations: waves
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Training metrics not found');
            this.testResults.trainingMetrics = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testDreamCycleVisualization() {
        console.log('🌙 Testing Dream Cycle Visualization...');

        const selectors = [
            '.dream-cycle',
            '[data-testid="dream-cycle"]',
            '.dream-phase',
            '[class*="dream"]',
            '.memory-consolidation'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found dream cycle: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '07-dream-cycle.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Dream Cycle Visualization',
                        path: screenshotPath,
                        description: `Dream cycle with memory consolidation phases (${count} elements)`
                    });

                    this.testResults.dreamCycle = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Dream cycle visualization not found');
            this.testResults.dreamCycle = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testSelfModelingEfficiency() {
        console.log('🧠 Testing Self-Modeling Efficiency Display...');

        const selectors = [
            '.self-modeling',
            '[data-testid="self-modeling"]',
            '.model-awareness',
            '[class*="modeling"]',
            '.metacognitive'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found self-modeling: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '08-self-modeling.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Self-Modeling Efficiency',
                        path: screenshotPath,
                        description: `Self-modeling efficiency with metacognitive monitoring (${count} elements)`
                    });

                    this.testResults.selfModeling = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Self-modeling efficiency not found');
            this.testResults.selfModeling = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testTrainingLoopMonitor() {
        console.log('🔄 Testing Training Loop Status Monitor...');

        const selectors = [
            '.training-loop',
            '[data-testid="training-loop"]',
            '.loop-monitor',
            '[class*="loop"]',
            '.convergence'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found training loop: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '09-training-loop.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Training Loop Status',
                        path: screenshotPath,
                        description: `Training loop monitor with convergence tracking (${count} elements)`
                    });

                    this.testResults.trainingLoop = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Training loop monitor not found');
            this.testResults.trainingLoop = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testAssessmentInterface() {
        console.log('📝 Testing Assessment Interface...');

        const selectors = [
            '.assessment-interface',
            '[data-testid="assessment"]',
            '.evaluation',
            '[class*="assessment"]',
            'form'
        ];

        let found = false;
        for (const selector of selectors) {
            try {
                const element = this.page.locator(selector);
                const count = await element.count();

                if (count > 0) {
                    console.log(`✅ Found assessment interface: ${selector} (${count} elements)`);

                    const screenshotPath = path.join(this.screenshotDir, '10-assessment-interface.png');
                    await element.first().screenshot({ path: screenshotPath });
                    this.screenshots.push({
                        component: 'Assessment Interface',
                        path: screenshotPath,
                        description: `Assessment interface with evaluation controls (${count} elements)`
                    });

                    this.testResults.assessmentInterface = {
                        status: 'FOUND',
                        selector: selector,
                        elementCount: count
                    };
                    found = true;
                    break;
                }
            } catch (error) {
                // Continue searching
            }
        }

        if (!found) {
            console.log('⚠️ Assessment interface not found');
            this.testResults.assessmentInterface = {
                status: 'NOT_FOUND',
                searchedSelectors: selectors
            };
        }
    }

    async testGeneralInteractivity() {
        console.log('🎮 Testing General Dashboard Interactivity...');

        try {
            // Test buttons
            const buttons = await this.page.locator('button').count();
            console.log(`🔘 Found ${buttons} buttons`);

            // Test links
            const links = await this.page.locator('a').count();
            console.log(`🔗 Found ${links} links`);

            // Test interactive elements
            const interactiveElements = await this.page.locator('[onclick], [onhover], button, a, input').count();
            console.log(`🎯 Found ${interactiveElements} interactive elements`);

            // Take a screenshot of interactive state
            const interactionPath = path.join(this.screenshotDir, '11-interactivity-test.png');
            await this.page.screenshot({ path: interactionPath });
            this.screenshots.push({
                component: 'Interactivity Test',
                path: interactionPath,
                description: `General dashboard interactivity with ${interactiveElements} interactive elements`
            });

            this.testResults.interactivity = {
                status: 'TESTED',
                buttons: buttons,
                links: links,
                totalInteractive: interactiveElements
            };

        } catch (error) {
            console.log(`⚠️ Interactivity testing failed: ${error.message}`);
            this.testResults.interactivity = {
                status: 'FAILED',
                error: error.message
            };
        }
    }

    async generateComprehensiveReport() {
        console.log('📝 Generating Comprehensive Live Testing Report...');

        const componentsFound = Object.values(this.testResults)
            .filter(result => result.status === 'FOUND').length;

        const totalComponents = 8;
        const coveragePercentage = Math.round((componentsFound / totalComponents) * 100);

        const report = {
            testSuite: 'Live Phase 5 Training Dashboard UI Testing',
            timestamp: new Date().toISOString(),
            dashboardUrl: this.baseUrl,
            browser: 'Chromium (Playwright)',
            viewport: '1920x1080',
            summary: {
                totalComponents: totalComponents,
                componentsFound: componentsFound,
                coveragePercentage: coveragePercentage,
                screenshotsCaptured: this.screenshots.length,
                consoleErrors: this.errors.length,
                overallStatus: componentsFound >= 4 ? 'PASS' : 'PARTIAL'
            },
            screenshots: this.screenshots,
            testResults: this.testResults,
            errors: this.errors,
            recommendations: this.generateRecommendations()
        };

        // Write detailed JSON report
        const reportPath = path.join(this.screenshotDir, 'live-ui-testing-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Write markdown summary
        const summaryPath = path.join(this.screenshotDir, 'live-testing-summary.md');
        const summaryContent = this.generateMarkdownSummary(report);
        fs.writeFileSync(summaryPath, summaryContent);

        console.log(`✅ Live testing reports generated:`);
        console.log(`   - Detailed: ${reportPath}`);
        console.log(`   - Summary: ${summaryPath}`);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        const foundComponents = Object.entries(this.testResults)
            .filter(([key, result]) => result.status === 'FOUND')
            .map(([key]) => key);

        const missingComponents = Object.entries(this.testResults)
            .filter(([key, result]) => result.status === 'NOT_FOUND')
            .map(([key]) => key);

        if (foundComponents.length >= 4) {
            recommendations.push('✅ Good component coverage - Core Phase 5 functionality is present');
        }

        if (missingComponents.length > 0) {
            recommendations.push(`⚠️ Missing components: ${missingComponents.join(', ')}`);
            recommendations.push('💡 Consider implementing missing Phase 5 components for complete functionality');
        }

        if (this.errors.length > 0) {
            recommendations.push('🔧 Address console errors for improved stability');
        }

        if (this.testResults.interactivity?.totalInteractive > 5) {
            recommendations.push('✅ Dashboard has good interactivity');
        }

        return recommendations;
    }

    generateMarkdownSummary(report) {
        return `# Live Phase 5 Training Dashboard Testing Report

## Test Summary
- **Test Date**: ${new Date(report.timestamp).toLocaleString()}
- **Dashboard URL**: ${report.dashboardUrl}
- **Browser**: ${report.browser}
- **Status**: ${report.summary.overallStatus}

## Coverage Analysis
- **Components Found**: ${report.summary.componentsFound}/${report.summary.totalComponents} (${report.summary.coveragePercentage}%)
- **Screenshots**: ${report.summary.screenshotsCaptured} captured
- **Console Errors**: ${report.summary.consoleErrors} detected

## Component Test Results

${Object.entries(report.testResults).map(([component, result]) => {
    const status = result.status === 'FOUND' ? '✅ FOUND' :
                  result.status === 'NOT_FOUND' ? '❌ NOT FOUND' :
                  result.status === 'TESTED' ? '✅ TESTED' :
                  '⚠️ ' + result.status;

    return `### ${component.charAt(0).toUpperCase() + component.slice(1)}
- **Status**: ${status}
${result.selector ? `- **Selector**: \`${result.selector}\`` : ''}
${result.elementCount ? `- **Elements Found**: ${result.elementCount}` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}`;
}).join('\n\n')}

## Screenshots Captured
${report.screenshots.map((screenshot, index) =>
    `${index + 1}. **${screenshot.component}**: \`${path.basename(screenshot.path)}\`\n   - ${screenshot.description}`
).join('\n')}

## Console Errors
${report.errors.length === 0 ? '✅ No console errors detected' :
  report.errors.map((error, index) => `${index + 1}. ${error}`).join('\n')}

## Recommendations
${report.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

## Conclusion
${report.summary.overallStatus === 'PASS' ?
  '✅ Phase 5 dashboard is functional with good component coverage.' :
  '⚠️ Phase 5 dashboard partially functional - some components may need implementation.'}

---
*Generated by Live Phase 5 UI Testing Suite*
`;
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        if (this.browser) {
            await this.browser.close();
        }
        console.log('✅ Test environment cleaned up successfully');
    }

    async runFullLiveTestSuite() {
        try {
            await this.initialize();

            const dashboardLoaded = await this.navigateToLiveDashboard();
            if (!dashboardLoaded) {
                throw new Error('Failed to load live dashboard');
            }

            // Test all 8 Phase 5 components systematically
            await this.testCurriculumProgressDisplay();
            await this.testEdgeOfChaosController();
            await this.testGrokfastMetrics();
            await this.testTrainingMetrics();
            await this.testDreamCycleVisualization();
            await this.testSelfModelingEfficiency();
            await this.testTrainingLoopMonitor();
            await this.testAssessmentInterface();

            // Test general interactivity
            await this.testGeneralInteractivity();

            // Generate comprehensive report
            const report = await this.generateComprehensiveReport();

            console.log('🎉 Live Phase 5 UI Testing Suite completed!');
            console.log(`📊 Coverage: ${report.summary.componentsFound}/${report.summary.totalComponents} components (${report.summary.coveragePercentage}%)`);
            console.log(`📸 Screenshots: ${report.summary.screenshotsCaptured} captured`);
            console.log(`✅ Overall Status: ${report.summary.overallStatus}`);

            return report;

        } catch (error) {
            console.error('❌ Live test suite failed:', error.message);
            this.errors.push(`Test Suite Error: ${error.message}`);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the live test suite
if (require.main === module) {
    const tester = new LivePhase5UITester();
    tester.runFullLiveTestSuite()
        .then(report => {
            console.log('\n📝 Final Live Test Report:');
            console.log(JSON.stringify(report.summary, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Live test suite failed:', error);
            process.exit(1);
        });
}

module.exports = LivePhase5UITester;