import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber, getRiskColor } from './utils';

describe('formatters', () => {
  it('formatCurrency formats USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formatPercent adds plus sign for positive', () => {
    expect(formatPercent(5.25)).toBe('+5.25%');
    expect(formatPercent(-2.5)).toBe('-2.50%');
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('formatNumber respects decimals', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
    expect(formatNumber(1234, 0)).toBe('1,234');
  });

  it('getRiskColor returns hex for known ratings', () => {
    expect(getRiskColor('Low')).toMatch(/^#/);
    expect(getRiskColor('Medium')).toMatch(/^#/);
    expect(getRiskColor('High')).toMatch(/^#/);
    expect(getRiskColor('Critical')).toMatch(/^#/);
  });
});
