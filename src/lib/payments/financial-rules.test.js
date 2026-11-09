import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decimalMicros, validatePayoutAmount } from './amount.ts';

test('$49.99 is below the $50 payout minimum', () => assert.throws(() => validatePayoutAmount('49.99', '50', '100'), /minimum/));
test('$50 is eligible at the $50 boundary', () => assert.equal(validatePayoutAmount('50', '50', '50'), '50'));
test('a payout cannot exceed finalized funds', () => assert.throws(() => validatePayoutAmount('50.01', '50', '50'), /available/));
test('tiny provider earnings of $0.0001 retain precision', () => assert.equal(decimalMicros('0.0001'), 100n));
test('a verified $50 adjustment on $500 leaves $450 exactly', () => assert.equal(decimalMicros('500') - decimalMicros('50'), 450000000n));
test('negative financial input is rejected', () => assert.throws(() => decimalMicros('-1'), /valid/));