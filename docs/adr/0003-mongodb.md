---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Lokalno nameščen MongoDB kot podatkovna baza

## Kontekst in opis problema

Aplikacija mora trajno hraniti uporabnike, storitve in termine. Projekt je napisan v JavaScriptu/TypeScriptu, baza pa naj teče lokalno na računalniku razvijalca. Izbrati moramo podatkovno bazo.

## Obravnavane možnosti

- MongoDB (dokumentna baza), lokalno nameščen
- MongoDB v oblaku (MongoDB Atlas)

## Odločitev

Izbrana možnost: »MongoDB (dokumentna baza), lokalno nameščen«, ker so dokumenti shranjeni v obliki, podobni JSON, kar ustreza projektu v JavaScriptu, delovni čas lahko shranimo kar v dokumentu frizerja, shemo pa razširjamo brez migracij. Lokalna namestitev deluje brez interneta in računa v oblaku.

### Posledice

- Dobro, ker so podatki v bazi podobni objektom v kodi.
- Dobro, ker lahko nova polja dodamo brez migracij in za delo ne potrebujemo interneta.
- Slabo, ker MongoDB ne preverja povezav med zbirkami in nima omejitve za prekrivanje terminov, zato to preverja zaledje (ADR-0009).
- Slabo, ker mora vsak razvijalec MongoDB namestiti in ga za transakcije enkrat nastaviti kot replica set z enim vozliščem (`replSetName` in `rs.initiate()`).
