---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Preprečevanje prekrivanja terminov s transakcijo

## Kontekst in opis problema

Frizer ne sme imeti dveh terminov ob istem času, tudi če dve stranki potrdita isto uro v istem trenutku. MongoDB nima omejitve, ki bi prepovedala prekrivanje časov.

## Obravnavane možnosti

* Preverjanje samo v aplikaciji
* Transakcija, ki preveri prekrivanje, shrani termin in posodobi dokument frizerja

## Odločitev

Izbrana možnost: »Transakcija, ki preveri prekrivanje, shrani termin in posodobi dokument frizerja«, ker dve hkratni rezervaciji pri istem frizerju pišeta v isti dokument, zato ena ne uspe, se ponovi, vidi drugi termin in vrne napako 409. Samo preverjanje v aplikaciji ne zaščiti pred hkratnimi zahtevami.

### Posledice

* Dobro, ker dvojne rezervacije niso mogoče.
* Slabo, ker transakcije zahtevajo, da MongoDB teče kot replica set, zato lokalni MongoDB teče kot replica set z enim vozliščem (ADR-0011).
