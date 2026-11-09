import { Schema, model } from 'mongoose';

export const APPOINTMENT_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const appointmentSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    hairdresserId: { type: Schema.Types.ObjectId, ref: 'Hairdresser', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true }, // startsAt + durationMin storitve
    price: { type: Number, required: true }, // cena v centih ob rezervaciji
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'CONFIRMED' },
    clientNote: { type: String, default: '' },
    cancellationReason: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

appointmentSchema.index({ hairdresserId: 1, startsAt: 1 });
appointmentSchema.index({ clientId: 1, startsAt: -1 });

export const Appointment = model('Appointment', appointmentSchema, 'appointments');
