---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# TypeScript na odjemalcu in zaledju

## Kontekst in opis problema

Odjemalec in zaledje si izmenjujeta podatke, kot so termini, datumi in cene. Napake v imenih polj ali oblikah podatkov se med njima hitro pojavijo. Izbrati moramo programski jezik za oba dela.

## Obravnavane možnosti

* TypeScript na obeh straneh
* JavaScript na obeh straneh

## Odločitev

Izbrana možnost: »TypeScript na obeh straneh«, ker je en jezik za celoten projekt, preverjanje tipov pa napake ujame že pred zagonom kode.

### Posledice

* Dobro, ker je manj napak pri delu s podatki iz API-ja.
* Dobro, ker urejevalnik bolje dopolnjuje kodo.
* Slabo, ker je potreben korak prevajanja in nekaj več pisanja.
