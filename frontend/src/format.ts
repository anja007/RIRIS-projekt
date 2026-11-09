export function euro(cents: number) {
  return (cents / 100).toLocaleString('sl-SI', { style: 'currency', currency: 'EUR' });
}

export function time(iso: string | Date) {
  return new Date(iso).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
}

export function dateLong(iso: string | Date) {
  return new Date(iso).toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
}

/** Lokalni datum v obliki LLLL-MM-DD. */
export function toDateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

export const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Potrjen',
  CANCELLED: 'Preklican',
  COMPLETED: 'Zaključen',
  NO_SHOW: 'Neprihod',
};
