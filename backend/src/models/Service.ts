import { Schema, model } from 'mongoose';

const serviceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  durationMin: { type: Number, required: true, min: 1 }, // trajanje v minutah
  price: { type: Number, required: true, min: 0 }, // cena v centih
  active: { type: Boolean, default: true },
});

export const Service = model('Service', serviceSchema, 'services');
