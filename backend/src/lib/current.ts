import type { Request } from 'express';
import { Client } from '../models/Client';
import { Hairdresser } from '../models/Hairdresser';
import { HttpError } from './errors';

/** Profil stranke prijavljenega uporabnika. */
export async function currentClient(req: Request) {
  const client = await Client.findOne({ userId: req.user!.id });
  if (!client) throw new HttpError(403, 'Dostop ni dovoljen');
  return client;
}

/** Profil frizerja prijavljenega uporabnika. */
export async function currentHairdresser(req: Request) {
  const hairdresser = await Hairdresser.findOne({ userId: req.user!.id });
  if (!hairdresser) throw new HttpError(403, 'Dostop ni dovoljen');
  return hairdresser;
}
