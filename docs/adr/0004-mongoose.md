---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Mongoose za dostop do MongoDB

## Kontekst in opis problema

Zaledje mora dokumente brati, pisati in preverjati ter slediti povezavam, na primer od termina do stranke, frizerja in storitve. Odločiti se moramo, kako zaledje dostopa do baze.

## Obravnavane možnosti

- Mongoose
- Samo uradni gonilnik MongoDB

## Odločitev

Izbrana možnost: »Mongoose«, ker doda sheme, preverjanje podatkov in povezave med zbirkami ter je najbolj razširjena in dokumentirana knjižnica za MongoDB v Node.js.

### Posledice

- Dobro, ker je vsaka zbirka opisana na enem mestu.
- Dobro, ker populate naloži povezane dokumente, npr. frizerja termina.
- Slabo, ker je to dodatna plast, ki se jo je treba naučiti.
