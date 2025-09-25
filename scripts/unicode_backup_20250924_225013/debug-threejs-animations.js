const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugThreeJSAnimations() {
    console.log('🔍 Starting Three.js Animation Debug Session...\n');

    const browser = await chromium.launch({
        headless: false,
        devtools: true,
        slowMo: 1000 // Slow down for better observation
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`🟡 CONSOLE [${type.toUpperCase()}]: ${text}`);
    });

    // Enable error logging
    page.on('pageerror', error => {
        console.log(`🔴 PAGE ERROR: ${error.message}`);
        console.log(`Stack: ${error.stack}`);
    });

    // Enable request/response monitoring
    page.on('request', request => {
        if (request.url().includes('three') || request.url().includes('.js')) {
            console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
        }
    });

    page.on('response', response => {
        if (response.url().includes('three') || response.url().includes('.js')) {
            const status = response.status();
            const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
            console.log(`📥 RESPONSE: ${statusIcon} ${status} ${response.url()}`);
        }
    });

    try {
        console.log('🌐 Navigating to http://localhost:3001...');
        await page.goto('http://localhost:3001', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        console.log('📸 Taking initial screenshot...');
        await page.screenshot({
            path: 'C:\\Users\\17175\\Desktop\\spek template\\scripts\\debug-initial-view.png',
            fullPage: true
        });

        console.log('\n🔍 DIAGNOSTIC PHASE 1: Basic Page Structure');
        console.log('==========================================');

        // Check if Three.js loaded
        const threeJSAvailable = await page.evaluate(() => {
            return typeof THREE !== 'undefined';
        });
        console.log(`Three.js Available: ${threeJSAvailable ? '✅ YES' : '❌ NO'}`);

        if (threeJSAvailable) {
            const threeVersion = await page.evaluate(() => {
                return THREE.REVISION || 'Version unknown';
            });
            console.log(`Three.js Version: ${threeVersion}`);
        }

        // Check if UltraSolarpunkEcosystem class exists
        const ecosystemClassAvailable = await page.evaluate(() => {
            return typeof UltraSolarpunkEcosystem !== 'undefined';
        });
        console.log(`UltraSolarpunkEcosystem Class: ${ecosystemClassAvailable ? '✅ YES' : '❌ NO'}`);

        // Check if canvas elements exist
        const canvasCount = await page.evaluate(() => {
            return document.querySelectorAll('canvas').length;
        });
        console.log(`Canvas Elements Found: ${canvasCount}`);

        // Check main container
        const mainContainerExists = await page.evaluate(() => {
            return document.getElementById('ecosystem-container') !== null;
        });
        console.log(`Main Container (#ecosystem-container): ${mainContainerExists ? '✅ EXISTS' : '❌ MISSING'}`);

        console.log('\n🔍 DIAGNOSTIC PHASE 2: Network Resources');
        console.log('=======================================');

        // Wait a bit more for any lazy-loaded content
        await page.waitForTimeout(3000);

        // Check all script tags and their loading status
        const scriptInfo = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            return scripts.map(script => ({
                src: script.src,
                loaded: script.readyState === 'complete' || !script.readyState,
                hasError: script.onerror !== null
            }));
        });

        console.log('Script Loading Status:');
        scriptInfo.forEach(script => {
            const status = script.loaded ? '✅' : '❌';
            console.log(`  ${status} ${script.src}`);
        });

        console.log('\n🔍 DIAGNOSTIC PHASE 3: Manual Initialization Test');
        console.log('=================================================');

        if (threeJSAvailable && ecosystemClassAvailable) {
            console.log('Attempting manual ecosystem initialization...');

            const initResult = await page.evaluate(() => {
                try {
                    // Clear any existing content
                    const container = document.getElementById('ecosystem-container');
                    if (container) {
                        container.innerHTML = '';
                    }

                    // Try to create new ecosystem
                    const ecosystem = new UltraSolarpunkEcosystem();
                    return {
                        success: true,
                        message: 'Ecosystem initialized successfully',
                        canvasCount: document.querySelectorAll('canvas').length
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: error.message,
                        stack: error.stack
                    };
                }
            });

            console.log(`Manual Init Result: ${initResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`Message: ${initResult.message}`);
            if (!initResult.success && initResult.stack) {
                console.log(`Stack: ${initResult.stack}`);
            }
            if (initResult.success) {
                console.log(`Canvas Count After Init: ${initResult.canvasCount}`);

                // Take screenshot after manual init
                await page.waitForTimeout(2000);
                await page.screenshot({
                    path: 'C:\\Users\\17175\\Desktop\\spek template\\scripts\\debug-after-manual-init.png',
                    fullPage: true
                });
                console.log('📸 Screenshot taken after manual initialization');
            }
        }

        console.log('\n🔍 DIAGNOSTIC PHASE 4: DOM Analysis');
        console.log('===================================');

        // Analyze the current DOM state
        const domAnalysis = await page.evaluate(() => {
            const container = document.getElementById('ecosystem-container');
            const body = document.body;

            return {
                containerHTML: container ? container.innerHTML.substring(0, 500) : 'Container not found',
                bodyClasses: body.className,
                bodyChildren: body.children.length,
                documentReadyState: document.readyState,
                windowLoaded: document.readyState === 'complete'
            };
        });

        console.log('DOM Analysis:');
        console.log(`  Document Ready State: ${domAnalysis.documentReadyState}`);
        console.log(`  Window Loaded: ${domAnalysis.windowLoaded ? '✅' : '❌'}`);
        console.log(`  Body Classes: ${domAnalysis.bodyClasses || 'none'}`);
        console.log(`  Body Children Count: ${domAnalysis.bodyChildren}`);
        console.log(`  Container Content: ${domAnalysis.containerHTML.substring(0, 200)}...`);

        console.log('\n🔍 DIAGNOSTIC PHASE 5: CSS and Styling');
        console.log('=====================================');

        // Check for CSS that might be hiding content
        const stylingIssues = await page.evaluate(() => {
            const container = document.getElementById('ecosystem-container');
            if (!container) return { error: 'Container not found' };

            const styles = window.getComputedStyle(container);
            const canvas = container.querySelector('canvas');
            const canvasStyles = canvas ? window.getComputedStyle(canvas) : null;

            return {
                containerDisplay: styles.display,
                containerVisibility: styles.visibility,
                containerOpacity: styles.opacity,
                containerWidth: styles.width,
                containerHeight: styles.height,
                canvasDisplay: canvasStyles ? canvasStyles.display : 'no canvas',
                canvasVisibility: canvasStyles ? canvasStyles.visibility : 'no canvas',
                canvasWidth: canvasStyles ? canvasStyles.width : 'no canvas',
                canvasHeight: canvasStyles ? canvasStyles.height : 'no canvas'
            };
        });

        console.log('Styling Analysis:');
        Object.entries(stylingIssues).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        console.log('\n🔍 DIAGNOSTIC PHASE 6: JavaScript Errors & Warnings');
        console.log('===================================================');

        // Wait for any additional async operations
        await page.waitForTimeout(2000);

        // Take final screenshot
        await page.screenshot({
            path: 'C:\\Users\\17175\\Desktop\\spek template\\scripts\\debug-final-state.png',
            fullPage: true
        });
        console.log('📸 Final screenshot taken');

        console.log('\n📋 SUMMARY REPORT');
        console.log('================');
        console.log(`Three.js Available: ${threeJSAvailable ? '✅' : '❌'}`);
        console.log(`UltraSolarpunkEcosystem Available: ${ecosystemClassAvailable ? '✅' : '❌'}`);
        console.log(`Canvas Elements: ${canvasCount}`);
        console.log(`Main Container: ${mainContainerExists ? '✅' : '❌'}`);

        // Keep browser open for manual inspection
        console.log('\n🔍 Browser will remain open for manual inspection...');
        console.log('Press Ctrl+C to close when done investigating.');

        // Wait indefinitely until user closes
        await new Promise(() => {});

    } catch (error) {
        console.error('🔴 DEBUG SESSION ERROR:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        console.log('\n🔧 Cleaning up...');
        await browser.close();
    }
}

// Run the debug session
debugThreeJSAnimations().catch(console.error);