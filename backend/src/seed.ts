import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from './db';
import { User } from './models/User';
import { Client } from './models/Client';
import { Hairdresser } from './models/Hairdresser';
import { Service } from './models/Service';
import { Appointment } from './models/Appointment';

const PASSWORD = 'geslo123';

type Hours = { weekday: number; startTime: string; endTime: string }[];

function week(days: number[], intervals: [string, string][]): Hours {
  return days.flatMap((weekday) =>
    intervals.map(([startTime, endTime]) => ({ weekday, startTime, endTime })),
  );
}

async function main() {
  await connectDb();

  await Promise.all([
    Appointment.deleteMany({}),
    Client.deleteMany({}),
    Hairdresser.deleteMany({}),
    Service.deleteMany({}),
    User.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const services = await Service.insertMany([
    { name: 'Moško striženje', durationMin: 30, price: 1800 },
    { name: 'Žensko striženje in feniranje', durationMin: 60, price: 3500 },
    { name: 'Feniranje', durationMin: 30, price: 2000 },
    { name: 'Barvanje izrastka', durationMin: 90, price: 5500 },
    { name: 'Urejanje brade', durationMin: 15, price: 1000 },
    { name: 'Balayage', durationMin: 150, price: 11000 },
  ]);
  const byName = (name: string) => services.find((s) => s.name === name)!._id;

  await User.create({
    firstName: 'Maja',
    lastName: 'Petek',
    email: 'admin@salonko.si',
    phone: '040 000 000',
    passwordHash,
    role: 'ADMIN',
  });

  const hairdressers = [
    {
      firstName: 'Nina',
      lastName: 'Horvat',
      email: 'nina@salonko.si',
      services: ['Žensko striženje in feniranje', 'Feniranje', 'Barvanje izrastka', 'Balayage'],
      hours: [
        ...week([1, 2, 3, 4, 5], [['09:00', '13:00'], ['14:00', '18:00']]),
        ...week([6], [['08:00', '13:00']]),
      ],
    },
    {
      firstName: 'Marko',
      lastName: 'Zupan',
      email: 'marko@salonko.si',
      services: ['Moško striženje', 'Feniranje', 'Urejanje brade'],
      hours: week([2, 3, 4, 5, 6], [['11:00', '15:00'], ['15:30', '20:00']]),
    },
    {
      firstName: 'Lea',
      lastName: 'Novak',
      email: 'lea@salonko.si',
      services: ['Žensko striženje in feniranje', 'Feniranje'],
      hours: week([3, 4, 5, 6, 7], [['10:00', '18:00']]),
    },
  ];

  const created: Record<string, unknown> = {};
  for (const h of hairdressers) {
    const user = await User.create({
      firstName: h.firstName,
      lastName: h.lastName,
      email: h.email,
      phone: '041 111 111',
      passwordHash,
      role: 'HAIRDRESSER',
    });
    const hairdresser = await Hairdresser.create({
      userId: user._id,
      serviceIds: h.services.map(byName),
      workingHours: h.hours,
    });
    created[h.firstName] = hairdresser._id;
  }

  const clientUser = await User.create({
    firstName: 'Ana',
    lastName: 'Kovač',
    email: 'ana@primer.si',
    phone: '031 222 333',
    passwordHash,
    role: 'CLIENT',
  });
  const client = await Client.create({ userId: clientUser._id });

  // Nekaj terminov stranke Ana za preizkus urnika in »Moji termini«.
  const now = new Date();
  const at = (daysFromToday: number, hh: number, mm = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysFromToday, hh, mm);
  const quarter = (d: Date) => new Date(Math.floor(d.getTime() / 900000) * 900000);
  const service = (name: string) => services.find((s) => s.name === name)!;
  const appointment = (hairdresser: string, serviceName: string, startsAt: Date, status: 'CONFIRMED' | 'COMPLETED' = 'CONFIRMED') => {
    const s = service(serviceName);
    return {
      clientId: client._id,
      hairdresserId: created[hairdresser],
      serviceId: s._id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + s.durationMin * 60000),
      price: s.price,
      status,
    };
  };
  await Appointment.insertMany([
    // pretekli, zaključen termin
    appointment('Nina', 'Žensko striženje in feniranje', at(-7, 10), 'COMPLETED'),
    // današnji termin, ki se je že začel: frizerka Nina lahko označi izid
    appointment('Nina', 'Feniranje', quarter(new Date(now.getTime() - 15 * 60000))),
    // čez manj kot 24 ur: stranka ga ne more več spremeniti prek spleta
    appointment('Marko', 'Moško striženje', quarter(new Date(now.getTime() + 20 * 3600000))),
    // čez 3 dni: stranka ga lahko prekliče ali prestavi
    appointment('Nina', 'Žensko striženje in feniranje', at(3, 10)),
  ]);

  console.log('Testni podatki so vneseni. Geslo za vse račune:', PASSWORD);
  console.log('  administrator: admin@salonko.si');
  console.log('  frizerji:      nina@salonko.si, marko@salonko.si, lea@salonko.si');
  console.log('  stranka:       ana@primer.si');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
