const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function exploreAndScreenshot() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('=== EXPLORING AGENT FORGE PHASE NAVIGATION ===');

    // Navigate to main dashboard
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get page title and basic info
    const title = await page.title();
    console.log(`Main page title: ${title}`);

    // Take main page screenshot
    await page.screenshot({
      path: 'docs/screenshots/main-dashboard.png',
      fullPage: true
    });
    console.log('✓ Main dashboard screenshot saved');

    // Look for navigation elements and phase links
    const links = await page.$$eval('a',
      elements => elements.map(el => ({
        href: el.href,
        text: el.textContent ? el.textContent.trim() : '',
        visible: el.offsetParent !== null
      })).filter(link =>
        link.visible && (
          (link.text && link.text.toLowerCase().includes('phase')) ||
          (link.href && link.href.includes('phase')) ||
          (link.href && link.href.match(/\/[1-8]$/)) ||
          (link.text && link.text.match(/^(Phase\s+)?[1-8]$/))
        )
      )
    );

    console.log('Phase-related links found:', links);

    // Look for buttons and other interactive elements
    const buttons = await page.$$eval('button, [role="button"], .btn',
      elements => elements.map(el => ({
        text: el.textContent ? el.textContent.trim() : '',
        className: el.className,
        id: el.id,
        visible: el.offsetParent !== null
      })).filter(btn =>
        btn.visible && btn.text && btn.text.toLowerCase().includes('phase')
      )
    );

    console.log('Phase-related buttons found:', buttons);

    // Test common phase routes
    const routesToTest = [
      { route: '/phase1', name: 'Phase 1' },
      { route: '/phase2', name: 'Phase 2' },
      { route: '/phase3', name: 'Phase 3' },
      { route: '/phase4', name: 'Phase 4' },
      { route: '/phase5', name: 'Phase 5' },
      { route: '/phase6', name: 'Phase 6' },
      { route: '/phase7', name: 'Phase 7' },
      { route: '/phase8', name: 'Phase 8' },
      { route: '/phases', name: 'Phases Overview' },
      { route: '/dashboard', name: 'Dashboard' },
      { route: '/1', name: 'Route 1' },
      { route: '/2', name: 'Route 2' },
      { route: '/3', name: 'Route 3' },
      { route: '/4', name: 'Route 4' },
      { route: '/5', name: 'Route 5' },
      { route: '/6', name: 'Route 6' },
      { route: '/7', name: 'Route 7' },
      { route: '/8', name: 'Route 8' }
    ];

    const validPhases = [];

    for (const { route, name } of routesToTest) {
      try {
        console.log(`Testing route: ${route}`);

        const response = await page.goto(`http://localhost:3001${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        if (response && response.status() === 200) {
          await page.waitForTimeout(2000); // Wait for content to load

          const pageTitle = await page.title();
          const bodyText = await page.textContent('body');
          const hasContent = bodyText && bodyText.trim().length > 200;
          const isErrorPage = bodyText && (bodyText.includes('404') || bodyText.includes('Not Found') || bodyText.includes('Cannot GET'));

          if (hasContent && !isErrorPage) {
            console.log(`✓ ${name} found at ${route} - ${pageTitle}`);

            // Take screenshot
            const safeRouteName = route.replace(/\//g, '').replace(/[^a-zA-Z0-9]/g, '-') || 'root';
            const filename = `docs/screenshots/${safeRouteName}.png`;
            await page.screenshot({
              path: filename,
              fullPage: true
            });
            console.log(`✓ Screenshot saved: ${filename}`);

            validPhases.push({
              route,
              name,
              title: pageTitle,
              status: response.status(),
              contentLength: bodyText.length,
              screenshot: filename
            });

            // Get component information
            try {
              const components = await page.$$eval('[class*="component"], [data-component], .card, .panel, .section',
                elements => elements.length
              );
              console.log(`  - Components found: ${components}`);
            } catch (e) {
              console.log('  - Could not count components');
            }

            // Look for phase-specific content
            const phaseContent = await page.$eval('body', el => {
              const text = el.textContent || '';
              const hasPhaseNumber = /phase\s*[1-8]/i.test(text);
              const hasTraining = /training|train/i.test(text);
              const hasRisk = /risk|dashboard/i.test(text);
              const hasText = /text|flow|quiet/i.test(text);
              const hasCompression = /compression|bitnet/i.test(text);
              const hasInfrastructure = /infrastructure|deploy/i.test(text);

              return {
                hasPhaseNumber,
                hasTraining,
                hasRisk,
                hasText,
                hasCompression,
                hasInfrastructure,
                preview: text.substring(0, 300)
              };
            });

            console.log(`  - Content analysis:`, phaseContent);
          } else {
            console.log(`✗ ${name} not accessible at ${route} (empty or error page)`);
          }
        } else {
          console.log(`✗ ${name} not found at ${route} (${response ? response.status() : 'no response'})`);
        }
      } catch (error) {
        console.log(`✗ ${name} failed at ${route}: ${error.message}`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total valid phases found: ${validPhases.length}`);
    validPhases.forEach(phase => {
      console.log(`- ${phase.name}: ${phase.route} (${phase.title})`);
    });

    // Create a summary report
    const report = {
      timestamp: new Date().toISOString(),
      totalPhasesFound: validPhases.length,
      mainDashboard: {
        title: title,
        screenshot: 'docs/screenshots/main-dashboard.png'
      },
      phases: validPhases,
      navigationElements: {
        links: links,
        buttons: buttons
      }
    };

    fs.writeFileSync('docs/screenshots/phase-exploration-report.json', JSON.stringify(report, null, 2));
    console.log('\n✓ Detailed report saved to docs/screenshots/phase-exploration-report.json');

    return validPhases;

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  exploreAndScreenshot().catch(console.error);
}

module.exports = { exploreAndScreenshot };