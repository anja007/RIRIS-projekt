export function euro(cents: number) {
  return (cents / 100).toLocaleString('sl-SI', { style: 'currency', currency: 'EUR' });
}

export function time(iso: string | Date) {
  return new Date(iso).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
}

/** "tor, 20. 10." */
export function dateShort(iso: string | Date) {
  return new Date(iso).toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

/** "tor, 20. 10. 2026" */
export function dateLong(iso: string | Date) {
  return new Date(iso).toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
}

/** "torek, 20. oktober" */
export function dateWords(iso: string | Date) {
  return new Date(iso).toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Lokalni datum v obliki LLLL-MM-DD. */
export function toDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateKey: string, days: number) {
  const d = fromDateKey(dateKey);
  return toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** 570 -> "09:30" */
export function hhmm(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** "09:30" -> 570 */
export function toMinutes(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/** 75 -> "1 h 15 min" */
export function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** Slovenska dvojina in množina: 1 prost, 2 prosta, 3 prosti, 5 prostih */
export function freeCount(n: number) {
  const mod = n % 100;
  if (mod === 1) return `${n} prost`;
  if (mod === 2) return `${n} prosta`;
  if (mod === 3 || mod === 4) return `${n} prosti`;
  return `${n} prostih`;
}

export const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'potrjen',
  CANCELLED: 'preklican',
  COMPLETED: 'zaključen',
  NO_SHOW: 'neprihod',
};

/** Telefon salona za spremembe manj kot 24 ur pred terminom (US-09). */
export const SALON_PHONE = '+386 2 620 41 15';

export const DAY_NAMES = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];
