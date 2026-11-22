import { describe, expect, it } from 'vitest';
import { addDays, isoWeekday, toDateKey, toMinutes } from './time';

describe('time helpers', () => {
  it('converts HH:MM to minutes', () => {
    expect(toMinutes('09:30')).toBe(570);
  });

  it('returns 1 for Monday and 7 for Sunday', () => {
    expect(isoWeekday(new Date(2026, 10, 16))).toBe(1);
    expect(isoWeekday(new Date(2026, 10, 22))).toBe(7);
  });

  it('adds days across the end of a month', () => {
    expect(toDateKey(addDays(new Date(2026, 10, 30), 1))).toBe('2026-12-01');
  });
});
