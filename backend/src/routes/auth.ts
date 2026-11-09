import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { asyncHandler, HttpError } from '../lib/errors';
import { personSchema } from '../lib/validation';
import { clearAuthCookie, requireAuth, setAuthCookie } from '../middleware/auth';

export const authRouter = Router();

export const EMAIL_TAKEN = 'Račun s to e-pošto že obstaja';

function publicUser(user: { _id: unknown; firstName: string; lastName: string; email: string; phone: string; role: string }) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

// US-01: javna registracija vedno ustvari stranko (CLIENT).
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const data = personSchema.parse(req.body);
    if (await User.exists({ email: data.email })) {
      throw new HttpError(409, EMAIL_TAKEN, { email: EMAIL_TAKEN });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);

    const session = await mongoose.startSession();
    let userId = '';
    try {
      await session.withTransaction(async () => {
        const [user] = await User.create(
          [
            {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              passwordHash,
              role: 'CLIENT',
            },
          ],
          { session },
        );
        await Client.create([{ userId: user._id }], { session });
        userId = String(user._id);
      });
    } finally {
      await session.endSession();
    }

    const user = await User.findById(userId).lean();
    setAuthCookie(res, { id: userId, role: 'CLIENT' });
    res.status(201).json({ user: publicUser(user!) });
  }),
);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

// US-02: prijava; ob napaki ne povemo, kateri podatek je napačen.
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) {
      throw new HttpError(401, 'Napačna e-pošta ali geslo');
    }
    setAuthCookie(res, { id: String(user._id), role: user.role });
    res.json({ user: publicUser(user) });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id).lean();
    if (!user) {
      clearAuthCookie(res);
      throw new HttpError(401, 'Prijavite se');
    }
    res.json({ user: publicUser(user) });
  }),
);
