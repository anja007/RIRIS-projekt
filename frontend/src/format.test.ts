import { describe, expect, it } from 'vitest';
import { addDays, duration, freeCount, hhmm, toMinutes } from './format';

describe('format helpers', () => {
  it('formats minutes as HH:MM', () => {
    expect(hhmm(570)).toBe('09:30');
  });

  it('parses HH:MM to minutes', () => {
    expect(toMinutes('14:15')).toBe(855);
  });

  it('formats a duration in hours and minutes', () => {
    expect(duration(75)).toBe('1 h 15 min');
    expect(duration(0)).toBe('0 min');
  });

  it('moves a date key to the next year', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('uses the Slovenian dual and plural forms', () => {
    expect(freeCount(1)).toBe('1 prost');
    expect(freeCount(2)).toBe('2 prosta');
    expect(freeCount(5)).toBe('5 prostih');
  });
});
