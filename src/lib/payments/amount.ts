export function decimalMicros(value: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(value)) throw new Error('Enter a valid positive USD amount');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
}
export function validatePayoutAmount(value: string, minimum: string, available: string) {
  const amount = decimalMicros(value);
  if (amount % 10_000n !== 0n) throw new Error('Payouts must use whole cents');
  if (amount < decimalMicros(minimum)) throw new Error('Payout is below the minimum threshold');
  if (amount > decimalMicros(available)) throw new Error('Payout exceeds available balance');
  return value;
}