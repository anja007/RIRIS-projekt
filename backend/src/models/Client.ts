import { Schema, model } from 'mongoose';

const clientSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  noShowCount: { type: Number, default: 0, min: 0 },
  blocked: { type: Boolean, default: false },
});

export const Client = model('Client', clientSchema, 'clients');
