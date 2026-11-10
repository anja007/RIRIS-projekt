/** "09:30" -> 570 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "2026-11-03" -> lokalni datum ob 00:00 */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Dan v tednu po ISO: 1 = ponedeljek ... 7 = nedelja */
export function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Lokalni čas na danem dnevu, npr. (3. 11. 2026, 570) -> 3. 11. 2026 09:30 */
export function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}
