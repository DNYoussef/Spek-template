/**
 * Six Sigma Telemetry - Working Example
 * Demonstrates real mathematical calculations and reporting
 */

const SixSigmaTelemetry = require('../src/telemetry/six-sigma');

async function demonstrateSixSigma() {
  console.log('=== Six Sigma Telemetry Demonstration ===\n');
  
  const telemetry = new SixSigmaTelemetry();
  
  // Example 1: Manufacturing Process Analysis
  console.log('1. Manufacturing Process Analysis:');
  console.log('----------------------------------');
  
  // Add realistic manufacturing data
  const manufacturingData = [
    { process: 'Welding', defects: 3, units: 1000, opportunities: 5 },
    { process: 'Machining', defects: 2, units: 800, opportunities: 3 },
    { process: 'Assembly', defects: 5, units: 1200, opportunities: 4 },
    { process: 'Quality Check', defects: 1, units: 1200, opportunities: 2 },
    { process: 'Packaging', defects: 0, units: 1200, opportunities: 1 }
  ];
  
  manufacturingData.forEach(data => {
    const processData = telemetry.addProcessData(
      data.process, 
      data.defects, 
      data.units, 
      data.opportunities
    );
    
    console.log(`${data.process}:`);
    console.log(`  - DPMO: ${processData.dpmo}`);
    console.log(`  - Sigma Level: ${processData.sigmaLevel}`);
    console.log(`  - First Time Yield: ${(processData.fty * 100).toFixed(2)}%`);
    console.log('');
  });
  
  // Generate comprehensive report
  const report = telemetry.generateReport();
  console.log('Overall Manufacturing Summary:');
  console.log('-----------------------------');
  console.log(`Total Processes: ${report.summary.totalProcesses}`);
  console.log(`Total Defects: ${report.summary.totalDefects}`);
  console.log(`Total Units: ${report.summary.totalUnits}`);
  console.log(`Overall DPMO: ${report.summary.overallDPMO}`);
  console.log(`Overall Sigma Level: ${report.summary.overallSigmaLevel}`);
  console.log(`Rolled Throughput Yield: ${(report.summary.overallRTY * 100).toFixed(2)}%`);
  console.log(`Average FTY: ${(report.summary.averageFTY * 100).toFixed(2)}%\n`);
  
  // Example 2: Service Process Analysis
  console.log('2. Service Process Analysis (Customer Support):');
  console.log('----------------------------------------------');
  
  const serviceTelemetry = new SixSigmaTelemetry();
  
  // Customer service metrics
  const serviceData = [
    { process: 'Call Answering', defects: 15, units: 5000, opportunities: 1 }, // 15 unanswered calls
    { process: 'Issue Resolution', defects: 8, units: 4800, opportunities: 1 }, // 8 unresolved issues
    { process: 'Follow-up Contact', defects: 3, units: 4800, opportunities: 1 }, // 3 missed follow-ups
    { process: 'Customer Satisfaction', defects: 25, units: 4800, opportunities: 1 } // 25 unsatisfied customers
  ];
  
  serviceData.forEach(data => {
    const processData = serviceTelemetry.addProcessData(
      data.process,
      data.defects,
      data.units,
      data.opportunities
    );
    
    console.log(`${data.process}:`);
    console.log(`  - DPMO: ${processData.dpmo}`);
    console.log(`  - Sigma Level: ${processData.sigmaLevel}`);
    console.log(`  - Success Rate: ${(processData.fty * 100).toFixed(2)}%`);
    console.log('');
  });
  
  const serviceReport = serviceTelemetry.generateReport();
  console.log('Service Process Summary:');
  console.log('----------------------');
  console.log(`Overall Service DPMO: ${serviceReport.summary.overallDPMO}`);
  console.log(`Overall Service Sigma Level: ${serviceReport.summary.overallSigmaLevel}`);
  console.log(`End-to-End Service RTY: ${(serviceReport.summary.overallRTY * 100).toFixed(2)}%\n`);
  
  // Example 3: Real-time Telemetry Collection
  console.log('3. Real-time Telemetry Collection:');
  console.log('----------------------------------');
  
  const realTimeTelemetry = new SixSigmaTelemetry();
  
  // Simulate real-time data collection
  for (let hour = 1; hour <= 8; hour++) {
    const defects = Math.floor(Math.random() * 3); // 0-2 defects per hour
    const units = 100 + Math.floor(Math.random() * 50); // 100-150 units per hour
    const opportunities = 3;
    
    const telemetryPoint = realTimeTelemetry.collectTelemetryPoint(
      `Production Hour ${hour}`,
      defects,
      units,
      opportunities,
      {
        shift: hour <= 4 ? 'Morning' : 'Afternoon',
        operator: `Operator ${Math.floor(Math.random() * 3) + 1}`,
        temperature: 68 + Math.floor(Math.random() * 8), // 68-76°F
        humidity: 45 + Math.floor(Math.random() * 10) // 45-55%
      }
    );
    
    console.log(`Hour ${hour} (${telemetryPoint.shift} Shift):`);
    console.log(`  - Units: ${telemetryPoint.units}, Defects: ${telemetryPoint.defects}`);
    console.log(`  - DPMO: ${telemetryPoint.dpmo}, Sigma: ${telemetryPoint.sigmaLevel}`);
    console.log(`  - Operator: ${telemetryPoint.operator}, Temp: ${telemetryPoint.temperature}°F`);
    console.log(`  - Telemetry ID: ${telemetryPoint.telemetryId}`);
    console.log('');
  }
  
  // Generate shift summary
  const shiftReport = realTimeTelemetry.generateReport();
  console.log('8-Hour Shift Summary:');
  console.log('-------------------');
  console.log(`Shift DPMO: ${shiftReport.summary.overallDPMO}`);
  console.log(`Shift Sigma Level: ${shiftReport.summary.overallSigmaLevel}`);
  console.log(`Shift RTY: ${(shiftReport.summary.overallRTY * 100).toFixed(2)}%\n`);
  
  // Example 4: Advanced Calculations
  console.log('4. Advanced Six Sigma Calculations:');
  console.log('----------------------------------');
  
  // Process capability analysis
  const mean = 75; // Process mean
  const stdDev = 2.5; // Standard deviation
  const upperLimit = 85; // Upper specification limit
  const lowerLimit = 65; // Lower specification limit
  
  const cpk = telemetry.calculateCpk(mean, stdDev, upperLimit, lowerLimit);
  console.log('Process Capability Analysis:');
  console.log(`Process Mean: ${mean}`);
  console.log(`Standard Deviation: ${stdDev}`);
  console.log(`Specification Limits: ${lowerLimit} - ${upperLimit}`);
  console.log(`Cpk: ${cpk} (${cpk >= 1.33 ? 'Capable' : cpk >= 1.0 ? 'Marginally Capable' : 'Not Capable'})`);
  console.log('');
  
  // RTY calculation for complex process
  const complexProcessYields = [0.99, 0.95, 0.98, 0.92, 0.97, 0.94];
  const rty = telemetry.calculateRTY(complexProcessYields);
  console.log('Complex Process Chain RTY:');
  console.log(`Individual Process Yields: ${complexProcessYields.map(y => (y * 100).toFixed(1) + '%').join(', ')}`);
  console.log(`Rolled Throughput Yield: ${(rty * 100).toFixed(2)}%`);
  console.log(`Yield Loss: ${((1 - rty) * 100).toFixed(2)}%\n`);
  
  console.log('=== Six Sigma Demonstration Complete ===');
}

// Run the demonstration
if (require.main === module) {
  demonstrateSixSigma().catch(console.error);
}

module.exports = { demonstrateSixSigma };