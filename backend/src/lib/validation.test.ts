import { describe, expect, it } from 'vitest';
import { personSchema } from './validation';

const valid = {
  firstName: 'Ana',
  lastName: 'Novak',
  email: 'ana@primer.si',
  phone: '+386 40 123 456',
  password: 'geslo123',
};

describe('personSchema', () => {
  it('accepts valid data', () => {
    expect(personSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(personSchema.safeParse({ ...valid, email: 'ana.primer.si' }).success).toBe(false);
  });

  it('rejects a phone number with letters', () => {
    expect(personSchema.safeParse({ ...valid, phone: '040abc123' }).success).toBe(false);
  });

  it('rejects a password shorter than 6 characters', () => {
    expect(personSchema.safeParse({ ...valid, password: '12345' }).success).toBe(false);
  });

  it('rejects an empty first name', () => {
    expect(personSchema.safeParse({ ...valid, firstName: '   ' }).success).toBe(false);
  });
});
