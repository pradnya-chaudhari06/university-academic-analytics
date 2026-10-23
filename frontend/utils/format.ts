/**
 * Deterministic number formatting utility to prevent React SSR hydration mismatches.
 * Always formats numbers using 'en-US' locale consistently on both server and client.
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('en-US');
}

export function formatGpa(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
}
