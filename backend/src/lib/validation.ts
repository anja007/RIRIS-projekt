import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

const required = (label: string) => z.string({ required_error: `${label} je obvezno polje` }).trim().min(1, `${label} je obvezno polje`);

/** Podatki osebe pri registraciji stranke in ustvarjanju frizerja (US-01, US-03). */
export const personSchema = z.object({
  firstName: required('Ime'),
  lastName: required('Priimek'),
  email: required('E-pošta').toLowerCase().email('Vnesite veljaven e-poštni naslov'),
  phone: required('Telefon').regex(
    /^[0-9 +()-]{6,20}$/,
    'Telefon mora imeti 6–20 znakov iz števk, presledkov in +()-',
  ),
  password: z.string({ required_error: 'Geslo je obvezno polje' }).min(6, 'Geslo mora imeti vsaj 6 znakov'),
});

export const objectId = z.string().refine(isValidObjectId, 'Neveljaven ID');

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum mora biti v obliki LLLL-MM-DD');

export const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Čas mora biti v obliki HH:MM');
