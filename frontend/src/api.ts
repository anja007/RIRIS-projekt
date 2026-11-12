export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${url}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? 'Prišlo je do napake', data.fieldErrors ?? {});
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body ?? {}),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body ?? {}),
  delete: <T>(url: string) => request<T>('DELETE', url),
};

export type Role = 'CLIENT' | 'HAIRDRESSER' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number; // centi
  active: boolean;
}

export interface WorkingHours {
  weekday: number; // 1 = ponedeljek ... 7 = nedelja
  startTime: string;
  endTime: string;
}

export interface AdminHairdresser {
  id: string;
  active: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceIds: string[];
  workingHours: WorkingHours[];
}

export interface BookingHairdresser {
  id: string;
  name: string;
  offers: boolean; // ali opravlja izbrano storitev
}

export interface BookingDay {
  date: string; // LLLL-MM-DD
  working: boolean; // vsaj en frizer ta dan dela
  slots: number; // število prostih začetnih ur
}

export interface Slot {
  time: string; // "11:00"
  startsAt: string;
  hairdresserIds: string[];
}

export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  price: number;
  clientNote: string;
  cancellationReason: string;
  serviceId: string;
  serviceName: string;
  hairdresserId: string;
  hairdresserName: string;
  canChange: boolean;
}

export interface ScheduleAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  clientName: string;
  clientPhone: string;
  clientNoShowCount: number;
  serviceName: string;
  clientNote: string;
  cancellationReason: string;
}

export interface Schedule {
  date: string;
  workingHours: { startTime: string; endTime: string }[];
  appointments: ScheduleAppointment[];
}

export interface HairdresserProfile {
  workingHours: WorkingHours[];
  services: { id: string; name: string; durationMin: number }[];
}

export interface NoShow {
  id: string;
  startsAt: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  noShowCount: number;
  hairdresserName: string;
}

/** Javni cenik za korak 1 čarovnika (GET /api/services/catalog). */
export interface Catalog {
  services: (Service & { hairdressers: string[] })[];
  hairdressers: { id: string; name: string; services: string[] }[];
}
