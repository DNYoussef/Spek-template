const { chromium } = require('playwright');
const fs = require('fs');

async function captureAllPhases() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Set viewport for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('=== CAPTURING ALL 8 PHASE UI SCREENSHOTS ===');

    const phases = [
      {
        route: '/phases/cognate',
        name: 'Phase 1 - Cognate Model Creation',
        description: 'CognateModel Creation - AI model development and training setup'
      },
      {
        route: '/phases/evomerge',
        name: 'Phase 2 - EvoMerge Evolution',
        description: 'EvoMerge Evolution - Model evolution and optimization'
      },
      {
        route: '/phases/quietstar',
        name: 'Phase 3 - Quiet-STaR Reasoning',
        description: 'Quiet-STaR Reasoning - Advanced reasoning capabilities'
      },
      {
        route: '/phases/bitnet',
        name: 'Phase 4 - BitNet Compression',
        description: 'BitNet Compression - Model compression and optimization'
      },
      {
        route: '/phases/forge',
        name: 'Phase 5 - Forge Training',
        description: 'Forge Training - Advanced training methodologies'
      },
      {
        route: '/phases/baking',
        name: 'Phase 6 - Baking Tools',
        description: 'Baking Tools - Model deployment and tooling'
      },
      {
        route: '/phases/adas',
        name: 'Phase 7 - ADAS Architecture',
        description: 'ADAS Architecture - Advanced distributed architecture systems'
      },
      {
        route: '/phases/final',
        name: 'Phase 8 - Final Production',
        description: 'Final Production - Production deployment and monitoring'
      }
    ];

    const capturedPhases = [];
    const errors = [];

    // First, capture main dashboard
    try {
      await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const mainTitle = await page.title();
      await page.screenshot({
        path: 'docs/screenshots/00-main-dashboard.png',
        fullPage: true
      });
      console.log('✓ Main dashboard captured');

      capturedPhases.push({
        phase: 'Main Dashboard',
        route: '/',
        title: mainTitle,
        screenshot: 'docs/screenshots/00-main-dashboard.png',
        status: 'success'
      });
    } catch (error) {
      console.error('✗ Failed to capture main dashboard:', error.message);
      errors.push({ phase: 'Main Dashboard', error: error.message });
    }

    // Capture each phase
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseNumber = i + 1;

      try {
        console.log(`\\nCapturing ${phase.name}...`);

        const response = await page.goto(`http://localhost:3001${phase.route}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        if (response && response.status() === 200) {
          // Wait for page to fully load
          await page.waitForTimeout(3000);

          // Get page information
          const pageTitle = await page.title();
          const bodyText = await page.textContent('body');

          // Take full page screenshot
          const filename = `docs/screenshots/${phaseNumber.toString().padStart(2, '0')}-phase-${phaseNumber}.png`;
          await page.screenshot({
            path: filename,
            fullPage: true
          });

          // Also take viewport screenshot for better visibility
          const viewportFilename = `docs/screenshots/${phaseNumber.toString().padStart(2, '0')}-phase-${phaseNumber}-viewport.png`;
          await page.screenshot({
            path: viewportFilename,
            fullPage: false
          });

          console.log(`✓ ${phase.name} captured`);
          console.log(`  - Title: ${pageTitle}`);
          console.log(`  - Content length: ${bodyText ? bodyText.length : 0} characters`);
          console.log(`  - Full page: ${filename}`);
          console.log(`  - Viewport: ${viewportFilename}`);

          // Analyze page content
          const analysis = await page.evaluate(() => {
            const components = document.querySelectorAll('[class*="component"], .card, .panel, .section, [data-testid]');
            const buttons = document.querySelectorAll('button, [role="button"], .btn');
            const forms = document.querySelectorAll('form, input, textarea, select');
            const charts = document.querySelectorAll('[class*="chart"], [class*="graph"], canvas, svg');
            const tables = document.querySelectorAll('table, [class*="table"]');

            return {
              components: components.length,
              buttons: buttons.length,
              forms: forms.length,
              charts: charts.length,
              tables: tables.length,
              hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
              hasFooter: !!document.querySelector('footer'),
              hasHeader: !!document.querySelector('header, h1')
            };
          });

          console.log(`  - UI Elements: ${JSON.stringify(analysis)}`);

          capturedPhases.push({
            phase: phase.name,
            route: phase.route,
            description: phase.description,
            title: pageTitle,
            status: response.status(),
            contentLength: bodyText ? bodyText.length : 0,
            fullPageScreenshot: filename,
            viewportScreenshot: viewportFilename,
            uiAnalysis: analysis,
            timestamp: new Date().toISOString(),
            status: 'success'
          });

        } else {
          console.log(`✗ ${phase.name} failed: HTTP ${response ? response.status() : 'no response'}`);
          errors.push({
            phase: phase.name,
            route: phase.route,
            error: `HTTP ${response ? response.status() : 'no response'}`
          });
        }

      } catch (error) {
        console.error(`✗ ${phase.name} error:`, error.message);
        errors.push({
          phase: phase.name,
          route: phase.route,
          error: error.message
        });
      }
    }

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPhases: phases.length,
        successfulCaptures: capturedPhases.filter(p => p.status === 'success').length,
        errors: errors.length
      },
      navigation: {
        baseUrl: 'http://localhost:3001',
        routePattern: '/phases/{name}',
        discoveredRoutes: phases.map(p => p.route)
      },
      captures: capturedPhases,
      errors: errors,
      systemInfo: {
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: await page.viewportSize(),
        timestamp: new Date().toISOString()
      }
    };

    // Save detailed report
    fs.writeFileSync('docs/screenshots/comprehensive-phase-report.json', JSON.stringify(report, null, 2));

    // Generate markdown summary
    const markdownReport = generateMarkdownReport(report);
    fs.writeFileSync('docs/screenshots/PHASE-UI-DOCUMENTATION.md', markdownReport);

    console.log('\\n=== FINAL SUMMARY ===');
    console.log(`✓ Successfully captured: ${report.summary.successfulCaptures}/${report.summary.totalPhases} phases`);
    console.log(`✗ Errors encountered: ${report.summary.errors}`);
    console.log('\\n✓ Comprehensive report saved to docs/screenshots/comprehensive-phase-report.json');
    console.log('✓ Documentation saved to docs/screenshots/PHASE-UI-DOCUMENTATION.md');

    if (report.summary.successfulCaptures === report.summary.totalPhases) {
      console.log('\\n🎉 ALL 8 PHASE UIs SUCCESSFULLY DOCUMENTED!');
    } else {
      console.log(`\\n⚠️  ${report.summary.totalPhases - report.summary.successfulCaptures} phases need attention`);
    }

    return report;

  } catch (error) {
    console.error('Critical error:', error);
  } finally {
    await browser.close();
  }
}

function generateMarkdownReport(report) {
  let markdown = `# Agent Forge - 8 Phase UI Documentation\\n\\n`;
  markdown += `**Generated:** ${report.timestamp}\\n\\n`;
  markdown += `**Summary:** ${report.summary.successfulCaptures}/${report.summary.totalPhases} phases successfully captured\\n\\n`;

  markdown += `## Navigation Structure\\n\\n`;
  markdown += `- **Base URL:** ${report.navigation.baseUrl}\\n`;
  markdown += `- **Route Pattern:** ${report.navigation.routePattern}\\n\\n`;

  markdown += `## Phase UI Screenshots\\n\\n`;

  report.captures.forEach((capture, index) => {
    if (capture.status === 'success') {
      markdown += `### ${capture.phase}\\n\\n`;
      markdown += `- **Route:** ${capture.route}\\n`;
      markdown += `- **Description:** ${capture.description || 'N/A'}\\n`;
      markdown += `- **Page Title:** ${capture.title}\\n`;
      markdown += `- **Content Length:** ${capture.contentLength} characters\\n\\n`;

      if (capture.uiAnalysis) {
        markdown += `**UI Elements:**\\n`;
        markdown += `- Components: ${capture.uiAnalysis.components}\\n`;
        markdown += `- Buttons: ${capture.uiAnalysis.buttons}\\n`;
        markdown += `- Forms: ${capture.uiAnalysis.forms}\\n`;
        markdown += `- Charts: ${capture.uiAnalysis.charts}\\n`;
        markdown += `- Tables: ${capture.uiAnalysis.tables}\\n`;
        markdown += `- Has Navigation: ${capture.uiAnalysis.hasNavigation}\\n`;
        markdown += `- Has Header: ${capture.uiAnalysis.hasHeader}\\n\\n`;
      }

      if (capture.fullPageScreenshot) {
        markdown += `**Screenshots:**\\n`;
        markdown += `- Full Page: ![${capture.phase} Full](${capture.fullPageScreenshot})\\n`;
        if (capture.viewportScreenshot) {
          markdown += `- Viewport: ![${capture.phase} Viewport](${capture.viewportScreenshot})\\n`;
        }
        markdown += `\\n`;
      }
    }
  });

  if (report.errors.length > 0) {
    markdown += `## Issues Encountered\\n\\n`;
    report.errors.forEach(error => {
      markdown += `- **${error.phase}** (${error.route}): ${error.error}\\n`;
    });
    markdown += `\\n`;
  }

  markdown += `## System Information\\n\\n`;
  markdown += `- **User Agent:** ${report.systemInfo.userAgent}\\n`;
  markdown += `- **Viewport:** ${report.systemInfo.viewport.width}x${report.systemInfo.viewport.height}\\n`;
  markdown += `- **Capture Time:** ${report.systemInfo.timestamp}\\n\\n`;

  markdown += `---\\n*Generated by Agent Forge Phase UI Documentation System*\\n`;

  return markdown;
}

// Run if called directly
if (require.main === module) {
  captureAllPhases().catch(console.error);
}

module.exports = { captureAllPhases };