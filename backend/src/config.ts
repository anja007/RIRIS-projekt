import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Manjka spremenljivka okolja ${name}. Kopirajte backend/.env.example v backend/.env.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  isProduction: process.env.NODE_ENV === 'production',
};
