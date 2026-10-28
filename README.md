# Salonko

Salonko je spletna aplikacija za rezervacijo terminov v frizerskem salonu. Stranke termine rezervirajo, prekličejo in prestavijo prek spleta kadar koli, sistem pa izračuna proste začetne ure iz delovnega časa posameznega frizerja, storitev, ki jih opravlja, trajanja izbrane storitve in obstoječih terminov, zato se termini nikoli ne prekrivajo. Frizerji vidijo svoj dnevni urnik in beležijo, ali je stranka prišla, administrator pa upravlja storitve, frizerje, delovni čas in stranke.

## Tehnologije

| Področje             | Tehnologije                                         |
| -------------------- | --------------------------------------------------- |
| Odjemalec (frontend) | React, TypeScript, Vite, React Router, Tailwind CSS |
| Zaledje (backend)    | Node.js, Express, TypeScript, Zod                   |
| Podatkovna baza      | MongoDB, Mongoose                                   |
| Avtentikacija        | JWT v piškotku httpOnly, bcrypt                     |
| Lokalni razvoj       | Docker Compose, npm, ESLint, Prettier               |
| Testiranje           | Vitest, Supertest                                   |

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
frontend/   aplikacija React (še ni začeta)
backend/    REST API v Expressu (še ni začet)
docs/       projektna dokumentacija, wireframi in ADR
```
