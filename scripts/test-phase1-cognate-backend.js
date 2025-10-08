const { chromium } = require('playwright');
const fs = require('fs');

async function testPhase1CognateBackend() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Set viewport for consistent testing
  await page.setViewportSize({ width: 1920, height: 1080 });

  const testResults = {
    timestamp: new Date().toISOString(),
    testName: 'Phase 1 Cognate UI Backend Integration Test',
    url: 'http://localhost:3001/phases/cognate',
    results: {},
    screenshots: [],
    errors: [],
    apiCalls: [],
    backendData: {}
  };

  try {
    console.log('=== TESTING PHASE 1 COGNATE UI WITH REAL BACKEND ===');

    // Step 1: Navigate to Phase 1 Cognate
    console.log('\n1. Navigating to Phase 1 Cognate UI...');
    await page.goto('http://localhost:3001/phases/cognate', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'docs/screenshots/phase1-cognate-backend-test.png',
      fullPage: true
    });
    testResults.screenshots.push('docs/screenshots/phase1-cognate-backend-test.png');

    console.log('✓ Page loaded successfully');
    testResults.results.pageLoad = 'SUCCESS';

    // Step 2: Verify page content and title
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`  - Title: ${pageTitle}`);
    console.log(`  - URL: ${pageUrl}`);

    testResults.results.pageTitle = pageTitle;
    testResults.results.pageUrl = pageUrl;

    // Step 3: Look for configuration form fields
    console.log('\n2. Testing configuration form fields...');

    const configFields = await page.evaluate(() => {
      // Look for specific input fields related to Cognate configuration
      const allInputs = Array.from(document.querySelectorAll('input'));
      const allLabels = Array.from(document.querySelectorAll('label'));

      const maxIterations = allInputs.find(input =>
        input.name?.includes('iteration') ||
        input.placeholder?.toLowerCase().includes('iteration') ||
        input.id?.includes('iteration')
      );

      const convergenceThreshold = allInputs.find(input =>
        input.name?.includes('convergence') ||
        input.placeholder?.toLowerCase().includes('convergence') ||
        input.id?.includes('convergence')
      );

      const parallelAgents = allInputs.find(input =>
        input.name?.includes('agent') ||
        input.placeholder?.toLowerCase().includes('agent') ||
        input.id?.includes('agent')
      );

      const timeout = allInputs.find(input =>
        input.name?.includes('timeout') ||
        input.placeholder?.toLowerCase().includes('timeout') ||
        input.id?.includes('timeout')
      );

      const debugging = allInputs.find(input =>
        input.type === 'checkbox' ||
        input.name?.includes('debug') ||
        input.id?.includes('debug')
      );

      return {
        maxIterations: !!maxIterations,
        convergenceThreshold: !!convergenceThreshold,
        parallelAgents: !!parallelAgents,
        timeout: !!timeout,
        debugging: !!debugging,
        totalInputs: document.querySelectorAll('input').length,
        totalForms: document.querySelectorAll('form').length,
        totalButtons: document.querySelectorAll('button, [role="button"]').length
      };
    });

    console.log('  Configuration fields found:');
    console.log(`    - Max Iterations: ${configFields.maxIterations}`);
    console.log(`    - Convergence Threshold: ${configFields.convergenceThreshold}`);
    console.log(`    - Parallel Agents: ${configFields.parallelAgents}`);
    console.log(`    - Timeout: ${configFields.timeout}`);
    console.log(`    - Enable Debugging: ${configFields.debugging}`);
    console.log(`    - Total Inputs: ${configFields.totalInputs}`);
    console.log(`    - Total Forms: ${configFields.totalForms}`);
    console.log(`    - Total Buttons: ${configFields.totalButtons}`);

    testResults.results.configFields = configFields;

    // Step 4: Look for Start Training button
    console.log('\n3. Testing Start Training button...');

    const startButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const startBtn = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('start') ||
        btn.textContent.toLowerCase().includes('train') ||
        btn.textContent.toLowerCase().includes('begin')
      );

      return {
        found: !!startBtn,
        text: startBtn ? startBtn.textContent.trim() : null,
        className: startBtn ? startBtn.className : null,
        disabled: startBtn ? startBtn.disabled : null
      };
    });

    console.log(`  - Start button found: ${startButton.found}`);
    if (startButton.found) {
      console.log(`    - Text: "${startButton.text}"`);
      console.log(`    - Disabled: ${startButton.disabled}`);
    }

    testResults.results.startButton = startButton;

    // Step 5: Monitor network requests for API calls
    console.log('\n4. Setting up API call monitoring...');

    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`  📡 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`  📡 API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Step 6: Try to trigger the Start Training functionality
    console.log('\n5. Testing Start Training functionality...');

    if (startButton.found) {
      try {
        // Click the start button using a more reliable selector
        const clicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const startBtn = buttons.find(btn =>
            btn.textContent.toLowerCase().includes('start') ||
            btn.textContent.toLowerCase().includes('train') ||
            btn.textContent.toLowerCase().includes('begin')
          );
          if (startBtn) {
            startBtn.click();
            return true;
          }
          return false;
        });

        if (clicked) {
          console.log('  ✓ Clicked Start Training button');
        } else {
          console.log('  ⚠️ Could not click Start Training button');
        }

        // Wait for potential API calls
        await page.waitForTimeout(5000);

        // Check for session ID or backend response
        const backendData = await page.evaluate(() => {
          const sessionElement = document.querySelector('[data-testid="session-id"], .session-id, #session-id');
          const statusElement = document.querySelector('[data-testid="status"], .status, #status');
          const metricsElement = document.querySelector('[data-testid="metrics"], .metrics, #metrics');

          return {
            sessionId: sessionElement ? sessionElement.textContent.trim() : null,
            status: statusElement ? statusElement.textContent.trim() : null,
            metrics: metricsElement ? metricsElement.textContent.trim() : null,
            bodyText: document.body.textContent.substring(0, 1000) // First 1000 chars for analysis
          };
        });

        console.log('  Backend data after clicking:');
        console.log(`    - Session ID: ${backendData.sessionId || 'Not found'}`);
        console.log(`    - Status: ${backendData.status || 'Not found'}`);
        console.log(`    - Metrics: ${backendData.metrics || 'Not found'}`);

        testResults.backendData = backendData;

        // Take screenshot after action
        await page.screenshot({
          path: 'docs/screenshots/phase1-cognate-after-start.png',
          fullPage: true
        });
        testResults.screenshots.push('docs/screenshots/phase1-cognate-after-start.png');

      } catch (error) {
        console.log(`  ✗ Error clicking Start Training: ${error.message}`);
        testResults.errors.push({
          step: 'Start Training Click',
          error: error.message
        });
      }
    } else {
      console.log('  ⚠️ Start Training button not found - cannot test backend integration');
    }

    // Step 7: Check console errors
    console.log('\n6. Checking for console errors...');

    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ❌ Console Error: ${msg.text()}`);
        consoleLogs.push({
          type: 'error',
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(3000);

    testResults.apiCalls = apiCalls;
    testResults.consoleLogs = consoleLogs;

    // Step 8: Final analysis
    console.log('\n7. Final analysis...');

    const finalAnalysis = await page.evaluate(() => {
      // Look for any elements that might indicate real backend integration
      const sessionElements = document.querySelectorAll('[class*="session"], [id*="session"], [data-testid*="session"]');
      const statusElements = document.querySelectorAll('[class*="status"], [id*="status"], [data-testid*="status"]');
      const metricsElements = document.querySelectorAll('[class*="metric"], [id*="metric"], [data-testid*="metric"]');
      const configElements = document.querySelectorAll('[class*="config"], [id*="config"], [data-testid*="config"]');

      return {
        sessionElements: sessionElements.length,
        statusElements: statusElements.length,
        metricsElements: metricsElements.length,
        configElements: configElements.length,
        totalApiRelatedElements: sessionElements.length + statusElements.length + metricsElements.length
      };
    });

    testResults.results.finalAnalysis = finalAnalysis;

    console.log('  Analysis results:');
    console.log(`    - Session-related elements: ${finalAnalysis.sessionElements}`);
    console.log(`    - Status-related elements: ${finalAnalysis.statusElements}`);
    console.log(`    - Metrics-related elements: ${finalAnalysis.metricsElements}`);
    console.log(`    - Config-related elements: ${finalAnalysis.configElements}`);

    // Generate summary
    testResults.summary = {
      pageLoaded: testResults.results.pageLoad === 'SUCCESS',
      configFieldsFound: Object.values(configFields).some(Boolean),
      startButtonFound: startButton.found,
      apiCallsDetected: apiCalls.length > 0,
      backendDataVisible: !!(testResults.backendData.sessionId || testResults.backendData.status),
      consoleErrors: consoleLogs.filter(log => log.type === 'error').length,
      overallSuccess: testResults.results.pageLoad === 'SUCCESS' && apiCalls.length > 0
    };

    console.log('\n=== TEST SUMMARY ===');
    console.log(`✓ Page loaded: ${testResults.summary.pageLoaded}`);
    console.log(`✓ Config fields found: ${testResults.summary.configFieldsFound}`);
    console.log(`✓ Start button found: ${testResults.summary.startButtonFound}`);
    console.log(`✓ API calls detected: ${testResults.summary.apiCallsDetected} (${apiCalls.length} calls)`);
    console.log(`✓ Backend data visible: ${testResults.summary.backendDataVisible}`);
    console.log(`✓ Console errors: ${testResults.summary.consoleErrors}`);
    console.log(`✓ Overall success: ${testResults.summary.overallSuccess}`);

  } catch (error) {
    console.error('Critical test error:', error);
    testResults.criticalError = error.message;
    testResults.errors.push({
      step: 'Critical Error',
      error: error.message
    });
  } finally {
    await browser.close();
  }

  // Save detailed test results
  fs.writeFileSync(
    'docs/screenshots/phase1-cognate-backend-test-results.json',
    JSON.stringify(testResults, null, 2)
  );

  console.log('\n✓ Test results saved to docs/screenshots/phase1-cognate-backend-test-results.json');

  return testResults;
}

// Run if called directly
if (require.main === module) {
  testPhase1CognateBackend().catch(console.error);
}

module.exports = { testPhase1CognateBackend };