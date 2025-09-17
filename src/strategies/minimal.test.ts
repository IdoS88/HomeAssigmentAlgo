import { test } from 'node:test';
import assert from 'node:assert';

test('minimal test', () => {
  assert.strictEqual(1 + 1, 2);
  console.log('Minimal test passed');
});
