/** Interval v minutah od polnoči, npr. 09:00–13:00 = { start: 540, end: 780 }. */
export interface Interval {
  start: number;
  end: number;
}

export const SLOT_STEP_MIN = 15;

/**
 * Proste začetne ure za en dan in enega frizerja (US-07).
 *
 * - začetne ure so na vsakih 15 minut,
 * - celotna storitev mora ustrezati delovnemu intervalu,
 * - storitev se ne sme prekrivati z zasedenim časom,
 * - ure pred `minStart` (npr. ure, ki so danes že minile) se ne ponudijo.
 *
 * Vrne minute od polnoči, npr. [660, 675] = 11:00, 11:15.
 */
export function freeStartMinutes(options: {
  workingIntervals: Interval[];
  busy: Interval[];
  durationMin: number;
  minStart?: number;
  step?: number;
}): number[] {
  const { workingIntervals, busy, durationMin, minStart = 0, step = SLOT_STEP_MIN } = options;
  const result: number[] = [];

  for (const work of [...workingIntervals].sort((a, b) => a.start - b.start)) {
    // prva začetna ura na mreži 15 minut znotraj intervala
    let start = Math.ceil(work.start / step) * step;
    for (; start + durationMin <= work.end; start += step) {
      if (start < minStart) continue;
      const end = start + durationMin;
      const overlaps = busy.some((b) => b.start < end && b.end > start);
      if (!overlaps) result.push(start);
    }
  }
  return result;
}

/** 660 -> "11:00" */
export function minutesToTime(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
