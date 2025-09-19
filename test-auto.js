import { readFileSync } from 'node:fs';
import { autoStrategy } from './dist/strategies/auto.js';

// Test auto strategy with sample data
const sampleInput = {
  drivers: JSON.parse(readFileSync('data/sample-drivers.json', 'utf8')),
  rides: JSON.parse(readFileSync('data/sample-rides.json', 'utf8'))
};

console.log('🚀 Testing Enhanced Auto Strategy');
console.log('==================================');
console.log(`📊 Dataset: ${sampleInput.drivers.length} drivers, ${sampleInput.rides.length} rides`);
console.log('');

try {
  const result = await autoStrategy.solve(sampleInput);
  
  console.log('\n🎉 Auto Strategy Test Complete!');
  console.log(`📈 Final Result: ${result.served} rides served`);
  console.log(`💰 Total Cost: ${result.objective} agorot (${(result.objective/100).toFixed(2)}₪)`);
  console.log(`⏱️  Execution Time: ${result.meta.timeMs.toFixed(0)}ms`);
  console.log(`🏆 Winning Strategy: ${result.meta.name}`);
  
} catch (error) {
  console.error('❌ Auto strategy test failed:', error);
  process.exit(1);
}
