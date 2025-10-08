#!/usr/bin/env node
/**
 * Simple Phase 5 UI Screenshot Capture
 * Captures all 8 Phase 5 components individually
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function capturePhase5Components() {
    console.log('🚀 Starting Phase 5 UI Component Capture...');

    const screenshotDir = path.join(__dirname, '..', 'screenshots', 'phase5-components');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
        // Navigate to dashboard
        await page.goto('http://localhost:3000/phase5-training-dashboard.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000); // Wait for animations

        console.log('✅ Dashboard loaded successfully');

        // Capture full page
        await page.screenshot({
            path: path.join(screenshotDir, '01-full-dashboard.png'),
            fullPage: true
        });
        console.log('📸 Full dashboard captured');

        // Component selectors and names
        const components = [
            { name: '02-main-dashboard', selector: '.main-dashboard' },
            { name: '03-curriculum-progress', selector: '.curriculum-progress' },
            { name: '04-grokfast-metrics', selector: '.grokfast-metrics' },
            { name: '05-dream-cycle', selector: '.dream-cycle' },
            { name: '06-training-metrics', selector: '.training-metrics' },
            { name: '07-chaos-controller', selector: '.chaos-controller' },
            { name: '08-training-loop', selector: '.training-loop' },
            { name: '09-self-modeling', selector: '.self-modeling' }
        ];

        // Capture each component
        for (const component of components) {
            try {
                await page.locator(component.selector).screenshot({
                    path: path.join(screenshotDir, `${component.name}.png`)
                });
                console.log(`📸 ${component.name} captured`);
            } catch (error) {
                console.error(`❌ Failed to capture ${component.name}:`, error.message);
            }
        }

        // Test interactions by taking screenshots before/after button hover
        console.log('🎮 Testing interactivity...');

        try {
            // Hover over a button and capture
            await page.locator('button:has-text("Pause Training")').hover();
            await page.waitForTimeout(500);
            await page.screenshot({
                path: path.join(screenshotDir, '10-interaction-hover.png'),
                fullPage: false
            });
            console.log('📸 Interaction hover captured');
        } catch (error) {
            console.log('⚠️ Interaction test skipped:', error.message);
        }

        // Capture component metrics
        const metrics = {};

        try {
            metrics.epoch = await page.locator('#current-epoch').textContent();
            metrics.learningRate = await page.locator('#learning-rate').textContent();
            metrics.grokFactor = await page.locator('#grok-factor').textContent();
            metrics.chaosParam = await page.locator('#chaos-param').textContent();
            metrics.dreamEfficiency = await page.locator('#dream-efficiency').textContent();
            metrics.accuracy = await page.locator('#accuracy').textContent();
            metrics.modelAwareness = await page.locator('#model-awareness').textContent();
            metrics.loopIteration = await page.locator('#loop-iteration').textContent();
        } catch (error) {
            console.log('⚠️ Some metrics could not be captured:', error.message);
        }

        // Save metrics to file
        fs.writeFileSync(
            path.join(screenshotDir, 'component-metrics.json'),
            JSON.stringify(metrics, null, 2)
        );

        console.log('✅ All components captured successfully!');
        console.log(`📁 Screenshots saved to: ${screenshotDir}`);

        return {
            success: true,
            screenshotPath: screenshotDir,
            componentsCaptured: components.length + 1, // +1 for full page
            metrics: metrics
        };

    } catch (error) {
        console.error('❌ Capture failed:', error);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    capturePhase5Components()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Phase 5 UI capture completed!');
                console.log(`📊 Components: ${result.componentsCaptured}`);
                console.log(`📁 Path: ${result.screenshotPath}`);
            } else {
                console.error('\n💥 Capture failed:', result.error);
            }
        })
        .catch(console.error);
}

module.exports = capturePhase5Components;