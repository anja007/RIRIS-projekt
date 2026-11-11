import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './lib/errors';
import { authRouter } from './routes/auth';
import { adminServicesRouter, servicesRouter } from './routes/services';
import { adminHairdressersRouter } from './routes/adminHairdressers';
import { bookingRouter } from './routes/booking';
import { appointmentsRouter } from './routes/appointments';
import { hairdresserRouter } from './routes/hairdresser';
import { adminAppointmentsRouter } from './routes/adminAppointments';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/admin/services', adminServicesRouter);
  app.use('/api/admin/hairdressers', adminHairdressersRouter);
  app.use('/api/booking', bookingRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/hairdresser', hairdresserRouter);
  app.use('/api/admin/appointments', adminAppointmentsRouter);

  app.use(errorHandler);
  return app;
}
