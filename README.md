# Salonko

Salonko je spletna aplikacija za rezervacijo terminov v frizerskem salonu. Stranke termine rezervirajo, prekličejo in prestavijo prek spleta kadar koli, sistem pa izračuna proste začetne ure iz delovnega časa posameznega frizerja, storitev, ki jih opravlja, trajanja izbrane storitve in obstoječih terminov, zato se termini nikoli ne prekrivajo. Frizerji vidijo svoj dnevni urnik in beležijo, ali je stranka prišla, administrator pa upravlja storitve, frizerje, delovni čas in stranke.

## Tehnologije

| Področje | Tehnologije |
|---|---|
| Odjemalec (frontend) | React, TypeScript, Vite, React Router, Tailwind CSS |
| Zaledje (backend) | Node.js, Express, TypeScript, Zod |
| Podatkovna baza | MongoDB, Mongoose |
| Avtentikacija | JWT v piškotku httpOnly, bcrypt |
| Lokalni razvoj | Docker Compose, npm, ESLint, Prettier |
| Testiranje | Vitest, Supertest |

## Lokalni zagon

### Predpogoji

- Node.js 20 ali novejši in npm
- Docker Desktop (zagnan)

### 1. Zagon MongoDB v Dockerju

V korenski mapi projekta:

```bash
docker compose up -d
```

Ukaz zažene MongoDB 7 v vsebniku `salonko-mvp-mongo` kot replica set z enim vozliščem (`rs0`), ker rezervacija uporablja transakcije. Ob prvem zagonu počakajte približno 10 sekund, da `docker compose ps` pri vsebniku pokaže `healthy`. Podatki ostanejo v volumnu `mongo-data` tudi po `docker compose down`.

Če je na računalniku nameščen in zagnan tudi lokalni MongoDB, ga najprej ustavite (Windows: *Services* → *MongoDB Server* → *Stop*), ker uporablja ista vrata 27017.

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

### Testi

```bash
npm test
```

Testi enot preverjajo izračun prostih začetnih ur (US-07).

### Preizkus po vlogah

Skripta `npm run db:seed` vnese tudi nekaj terminov stranke Ana, zato je mogoče vse funkcionalnosti MVP preizkusiti takoj.

| Vloga | Prijava | Kaj preizkusiti |
|---|---|---|
| Gost | brez prijave | Cenik in prosti termini (korak 1 čarovnika: storitve s trajanjem, ceno in frizerji; nato proste ure); ob »Prijava in potrditev« prijava ali registracija in vrnitev na izbrani termin |
| Stranka | ana@primer.si | Rezervacija (storitev → frizer ali »Kdorkoli prost« → dan → ura → potrditev), Moji termini (preklic, prestavitev, termin v manj kot 24 urah) |
| Frizer | nina@salonko.si | Moj urnik: današnji termin označi kot »Zaključen« ali »Neprihod«, prekliči prihodnji termin z razlogom |
| Administrator | admin@salonko.si | Storitve, Frizerji (nov frizer, storitve, delovni čas), Neprihodi (popravek v zaključen) |

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
