import { test, expect } from 'bun:test';
import { execFileSync } from 'node:child_process';

test('database financial lifecycle enforces payment policy in a rollback-only transaction', () => {
  const output = execFileSync('lovable', ['supabase', 'query', 'select public.payment_regression_tests()', '--json'], { encoding: 'utf8' });
  expect(output).toContain('verified adjustment 500 - 50 = 450');
  expect(output).toContain('14-day backend hold enforced');
  expect(output).toContain('49.99 USD below minimum rejected');
  expect(output).toContain('50 USD payout and duplicate prevention');
  expect(output).toContain('failed payment returns 50 after reconciliation');
  expect(output).toContain('cross publisher adjustment blocked');
  expect(output).toContain('policy acknowledgement idempotent');
});
