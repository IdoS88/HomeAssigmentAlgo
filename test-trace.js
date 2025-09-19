import { readFileSync } from 'node:fs';
import { GreedyTraceStrategy } from './dist/strategies/greedy-trace.js';
import { parseDrivers, parseRides } from './dist/domain.js';

async function runTrace() {
  console.log('🔍 Loading smallest dataset for greedy strategy trace...\n');
  
  try {
    // Load sample data (smallest dataset)
    const rawDrivers = JSON.parse(readFileSync('data/sample-drivers.json', 'utf8'));
    const rawRides = JSON.parse(readFileSync('data/sample-rides.json', 'utf8'));
    
    console.log(`📊 Dataset loaded: ${rawDrivers.length} drivers, ${rawRides.length} rides`);
    
    // Parse data
    const drivers = parseDrivers(rawDrivers);
    const rides = parseRides(rawRides);
    
    console.log('✅ Data parsed successfully\n');
    
    // Run instrumented greedy strategy
    const strategy = new GreedyTraceStrategy(undefined, true);
    const assignments = await strategy.assign(rides, drivers, {
      includeDeadheadTime: true,
      includeDeadheadFuel: true
    });
    
    console.log('\n🎉 Trace completed successfully!');
    console.log(`📈 Final result: ${assignments.length} assignments made`);
    
  } catch (error) {
    console.error('❌ Error during trace:', error);
    process.exit(1);
  }
}

runTrace().catch(console.error);
