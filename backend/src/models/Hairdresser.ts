import { Schema, model } from 'mongoose';

const workingHoursSchema = new Schema(
  {
    weekday: { type: Number, required: true, min: 1, max: 7 }, // 1 = ponedeljek ... 7 = nedelja
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "13:00"
  },
  { _id: false },
);

const hairdresserSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  active: { type: Boolean, default: true },
  serviceIds: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
  workingHours: { type: [workingHoursSchema], default: [] },
  // Tehnično polje: rezervacija ga v transakciji poveča, da dve hkratni
  // rezervaciji pri istem frizerju pišeta v isti dokument (ADR-0009).
  bookingVersion: { type: Number, default: 0 },
});

export const Hairdresser = model('Hairdresser', hairdresserSchema, 'hairdressers');
