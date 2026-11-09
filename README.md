# Salonko

Salonko je spletna aplikacija za rezervacijo terminov v frizerskem salonu. Stranke termine rezervirajo, prekličejo in prestavijo prek spleta kadar koli, sistem pa izračuna proste začetne ure iz delovnega časa posameznega frizerja, storitev, ki jih opravlja, trajanja izbrane storitve in obstoječih terminov, zato se termini nikoli ne prekrivajo. Frizerji vidijo svoj dnevni urnik in beležijo, ali je stranka prišla, administrator pa upravlja storitve, frizerje, delovni čas in stranke.

## Tehnologije

| Področje | Tehnologije |
|---|---|
| Odjemalec (frontend) | React, TypeScript, Vite, React Router, Tailwind CSS |
| Zaledje (backend) | Node.js, Express, TypeScript, Zod |
| Podatkovna baza | MongoDB, Mongoose |
| Avtentikacija | JWT v piškotku httpOnly, bcrypt |
| Lokalni razvoj | npm, ESLint, Prettier |
| Testiranje | Vitest, Supertest |

## Lokalni zagon

### Predpogoji

- Node.js 20 ali novejši in npm
- MongoDB 7 (Community Server), nameščen lokalno

### 1. MongoDB kot replica set (samo enkrat)

Rezervacija uporablja transakcije, ki delujejo samo na replica setu.

1. Odprite konfiguracijsko datoteko MongoDB (Windows: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`) in dodajte:
   ```yaml
   replication:
     replSetName: rs0
   ```
2. Ponovno zaženite storitev MongoDB (Windows: *Services* → *MongoDB Server* → *Restart*).
3. V `mongosh` enkrat izvedite:
   ```js
   rs.initiate()
   ```

### 2. Nastavitve zaledja

Kopirajte `backend/.env.example` v `backend/.env` in po želji spremenite `JWT_SECRET`.

### 3. Namestitev in zagon

V korenski mapi projekta:

```bash
npm install
npm run db:seed   # vnese testne podatke (izbriše obstoječe!)
npm run dev
```

- Odjemalec: http://localhost:5173
- Zaledje: http://localhost:3000 (npr. http://localhost:3000/api/health)

### Testni računi

Geslo za vse račune je `geslo123`.

| Vloga | E-pošta |
|---|---|
| Administrator | admin@salonko.si |
| Frizerji | nina@salonko.si, marko@salonko.si, lea@salonko.si |
| Stranka | ana@primer.si |

## Dokumentacija

- [01 – Zasnova rešitve](docs/01-zasnova-resitve.md)
- [02 – Funkcionalnosti in obseg projekta](docs/02-funkcionalnosti-in-obseg.md)
- [03 – Podatkovni model](docs/03-podatkovni-model.md)
- [04 – Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [05 – Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [06 – Wireframes](docs/06-wireframes.md)
- [Arhitekturne odločitve (ADR)](docs/adr/)

## Struktura repozitorija

```
frontend/   aplikacija React (Vite)
backend/    REST API v Expressu
docs/       projektna dokumentacija, wireframi in ADR
```
