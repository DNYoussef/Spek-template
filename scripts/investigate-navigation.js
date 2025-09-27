const { chromium } = require('playwright');

async function investigateNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('=== INVESTIGATING NAVIGATION SYSTEM ===');

    // Navigate to main dashboard
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('✓ Main page loaded');

    // Check if this is a Single Page Application (SPA)
    const isReactApp = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.querySelector('#__next, [data-reactroot], #react-root'),
        hasReactDevTools: !!window.React || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        isNextJS: !!window.__NEXT_DATA__,
        hasRouter: !!window.next?.router || !!window.__NEXT_DATA__?.router
      };
    });

    console.log('React/Next.js detection:', isReactApp);

    // Get all phase links
    const phaseLinks = await page.$$eval('a[href*="/phases/"]',
      links => links.map(link => ({
        href: link.href,
        text: link.textContent.trim(),
        dataset: link.dataset
      }))
    );

    console.log('Phase links found:', phaseLinks);

    // Try clicking each phase link and capturing the result
    for (const linkInfo of phaseLinks) {
      try {
        console.log(`\\nTesting navigation to: ${linkInfo.text}`);

        // Click the link instead of navigating directly
        const linkSelector = `a[href="${linkInfo.href.replace('http://localhost:3001', '')}"]`;
        console.log(`Looking for selector: ${linkSelector}`);

        await page.click(linkSelector);
        await page.waitForTimeout(3000); // Wait for navigation/content change

        const currentUrl = page.url();
        const pageTitle = await page.title();
        const bodyContent = await page.textContent('body');

        console.log(`✓ Navigated to: ${currentUrl}`);
        console.log(`  Title: ${pageTitle}`);
        console.log(`  Content length: ${bodyContent ? bodyContent.length : 0}`);

        // Take screenshot
        const phaseName = linkInfo.href.split('/phases/')[1];
        const filename = `docs/screenshots/phase-${phaseName}.png`;
        await page.screenshot({
          path: filename,
          fullPage: true
        });
        console.log(`✓ Screenshot saved: ${filename}`);

        // Take viewport screenshot too
        const viewportFilename = `docs/screenshots/phase-${phaseName}-viewport.png`;
        await page.screenshot({
          path: viewportFilename,
          fullPage: false
        });
        console.log(`✓ Viewport screenshot saved: ${viewportFilename}`);

        // Check for phase-specific content
        const hasContent = bodyContent && bodyContent.length > 500;
        const hasPhaseContent = bodyContent && (
          bodyContent.toLowerCase().includes('phase') ||
          bodyContent.toLowerCase().includes(phaseName)
        );

        console.log(`  Has substantial content: ${hasContent}`);
        console.log(`  Has phase-specific content: ${hasPhaseContent}`);

        // Analyze UI components on this page
        const uiAnalysis = await page.evaluate(() => {
          return {
            buttons: document.querySelectorAll('button, [role="button"]').length,
            inputs: document.querySelectorAll('input, textarea, select').length,
            cards: document.querySelectorAll('.card, [class*="card"]').length,
            components: document.querySelectorAll('[class*="component"], [data-testid]').length,
            charts: document.querySelectorAll('canvas, svg, [class*="chart"]').length,
            tables: document.querySelectorAll('table, [class*="table"]').length,
            navigation: !!document.querySelector('nav, [role="navigation"]'),
            hasError: document.body.textContent.toLowerCase().includes('404') ||
                     document.body.textContent.toLowerCase().includes('not found'),
            mainContent: document.querySelector('main, .main, #main, .content')?.textContent?.substring(0, 200) || ''
          };
        });

        console.log(`  UI Analysis:`, uiAnalysis);

        // Go back to main page for next iteration
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

      } catch (error) {
        console.error(`✗ Failed to navigate to ${linkInfo.text}:`, error.message);
      }
    }

    // Also check the page source for any client-side routing clues
    console.log('\\n=== CHECKING FOR CLIENT-SIDE ROUTING ===');

    const routingInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s);
      const hasNextRouter = !!window.next?.router;
      const hasReactRouter = !!window.history?.pushState;

      return {
        scripts: scripts.slice(0, 5), // First 5 scripts
        hasNextRouter,
        hasReactRouter,
        nextData: window.__NEXT_DATA__ ? 'present' : 'absent'
      };
    });

    console.log('Routing information:', routingInfo);

  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (require.main === module) {
  investigateNavigation().catch(console.error);
}

module.exports = { investigateNavigation };