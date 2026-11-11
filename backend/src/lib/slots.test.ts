import { describe, expect, it } from 'vitest';
import { freeStartMinutes, minutesToTime } from './slots';

const t = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const times = (minutes: number[]) => minutes.map(minutesToTime);

describe('freeStartMinutes (US-07)', () => {
  it('ponudi ure na 15 minut, pri katerih celotna storitev ustreza prostemu času (primer iz kriterija 2)', () => {
    const result = freeStartMinutes({
      workingIntervals: [{ start: t('11:00'), end: t('13:00') }],
      busy: [],
      durationMin: 60,
    });
    expect(times(result)).toEqual(['11:00', '11:15', '11:30', '11:45', '12:00']);
  });

  it('ne ponudi ur, ki se prekrivajo s potrjenim terminom', () => {
    const result = freeStartMinutes({
      workingIntervals: [{ start: t('09:00'), end: t('12:00') }],
      busy: [{ start: t('10:00'), end: t('10:30') }],
      durationMin: 60,
    });
    expect(times(result)).toEqual(['09:00', '10:30', '10:45', '11:00']);
  });

  it('storitev ne sme segati čez odmor med intervaloma', () => {
    const result = freeStartMinutes({
      workingIntervals: [
        { start: t('09:00'), end: t('13:00') },
        { start: t('14:00'), end: t('15:00') },
      ],
      busy: [],
      durationMin: 90,
    });
    expect(times(result)).toContain('11:30');
    expect(times(result)).not.toContain('11:45');
    expect(times(result)).not.toContain('14:00');
  });

  it('ne ponudi ur, ki so danes že minile', () => {
    const result = freeStartMinutes({
      workingIntervals: [{ start: t('09:00'), end: t('11:00') }],
      busy: [],
      durationMin: 30,
      minStart: t('09:50'),
    });
    expect(times(result)).toEqual(['10:00', '10:15', '10:30']);
  });

  it('dan brez delovnega časa nima prostih ur', () => {
    expect(freeStartMinutes({ workingIntervals: [], busy: [], durationMin: 30 })).toEqual([]);
  });

  it('termin, ki se konča točno ob začetku, se ne prekriva', () => {
    const result = freeStartMinutes({
      workingIntervals: [{ start: t('09:00'), end: t('10:00') }],
      busy: [{ start: t('09:00'), end: t('09:30') }],
      durationMin: 30,
    });
    expect(times(result)).toEqual(['09:30']);
  });
});
