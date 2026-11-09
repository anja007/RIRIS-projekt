import { Schema, model, type InferSchemaType } from 'mongoose';

export const ROLES = ['CLIENT', 'HAIRDRESSER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema, 'users');
