import { Router } from 'express';
import { z } from 'zod';
import { Service } from '../models/Service';
import { Hairdresser } from '../models/Hairdresser';
import { Appointment } from '../models/Appointment';
import { asyncHandler, HttpError } from '../lib/errors';
import { objectId } from '../lib/validation';
import { requireAuth, requireRole } from '../middleware/auth';

function toDto(s: { _id: unknown; name: string; description?: string | null; durationMin: number; price: number; active?: boolean | null }) {
  return {
    id: String(s._id),
    name: s.name,
    description: s.description ?? '',
    durationMin: s.durationMin,
    price: s.price,
    active: s.active ?? true,
  };
}

// Javni cenik: samo aktivne storitve (US-04, kriterij 3).
export const servicesRouter = Router();

servicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const services = await Service.find({ active: true }).sort({ name: 1 }).lean();
    res.json(services.map(toDto));
  }),
);

// Upravljanje storitev (US-04), samo administrator.
export const adminServicesRouter = Router();
adminServicesRouter.use(requireAuth, requireRole('ADMIN'));

const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Naziv je obvezen'),
  description: z.string().trim().optional().default(''),
  durationMin: z
    .number({ invalid_type_error: 'Trajanje mora biti število' })
    .int('Trajanje mora biti celo število minut')
    .positive('Trajanje mora biti večje od 0'),
  price: z
    .number({ invalid_type_error: 'Cena mora biti število' })
    .int('Cena mora biti v centih')
    .min(0, 'Cena ne sme biti negativna'),
  active: z.boolean().optional().default(true),
});

adminServicesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const services = await Service.find().sort({ active: -1, name: 1 }).lean();
    res.json(services.map(toDto));
  }),
);

adminServicesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = serviceSchema.parse(req.body);
    const service = await Service.create(data);
    res.status(201).json(toDto(service));
  }),
);

// Sprememba cene ali trajanja ne vpliva na obstoječe termine,
// ker termin hrani svoj endsAt in ceno ob rezervaciji (US-04, kriterij 2).
adminServicesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = objectId.parse(req.params.id);
    const data = serviceSchema.parse(req.body);
    const service = await Service.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!service) throw new HttpError(404, 'Storitev ne obstaja');
    res.json(toDto(service));
  }),
);

adminServicesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = objectId.parse(req.params.id);
    if (await Appointment.exists({ serviceId: id })) {
      throw new HttpError(409, 'Storitev se pojavi v terminih, zato je ni mogoče izbrisati. Lahko jo deaktivirate.');
    }
    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) throw new HttpError(404, 'Storitev ne obstaja');
    await Hairdresser.updateMany({ serviceIds: id }, { $pull: { serviceIds: id } });
    res.status(204).end();
  }),
);
