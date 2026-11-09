---
status: "sprejeto"
date: 2026-11-09
decision-makers: Anja Popović
---

# MongoDB v Dockerju kot podatkovna baza

## Kontekst in opis problema

Aplikacija mora trajno hraniti uporabnike, storitve in termine. Projekt je napisan v JavaScriptu/TypeScriptu, baza pa naj teče lokalno na računalniku razvijalca. Izbrati moramo podatkovno bazo in način, kako jo vsak razvijalec zažene na enak način.

## Obravnavane možnosti

- MongoDB (dokumentna baza) v vsebniku Docker (Docker Compose)
- MongoDB (dokumentna baza), neposredno nameščen na računalnik

## Odločitev

Izbrana možnost: »MongoDB (dokumentna baza) v vsebniku Docker (Docker Compose)«, ker so dokumenti shranjeni v obliki, podobni JSON, kar ustreza projektu v JavaScriptu, delovni čas lahko shranimo kar v dokumentu frizerja, shemo pa razširjamo brez migracij. Docker Compose bazo zažene z enim ukazom (`docker compose up -d`), pri vseh razvijalcih v enaki različici (MongoDB 7) in že nastavljeno kot replica set z enim vozliščem (`rs0`), kar je potrebno za transakcije. Baza deluje brez interneta.

### Posledice

- Dobro, ker so podatki v bazi podobni objektom v kodi.
- Dobro, ker lahko nova polja dodamo brez migracij in za delo ne potrebujemo interneta.
- Dobro, ker se baza zažene z enim ukazom, brez ročne namestitve MongoDB in ročnega nastavljanja replica seta.
- Dobro, ker vsi razvijalci uporabljajo enako različico in nastavitve baze, zapisane v `docker-compose.yml`.
- Dobro, ker podatki ostanejo v imenovanem volumnu (`mongo-data`) tudi po ustavitvi vsebnika.
- Slabo, ker MongoDB ne preverja povezav med zbirkami in nima omejitve za prekrivanje terminov, zato to preverja zaledje (ADR-0009).
- Slabo, ker mora imeti vsak razvijalec nameščen in zagnan Docker Desktop (oziroma Docker Engine), ki porabi nekaj dodatnega pomnilnika.
