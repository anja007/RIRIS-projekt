---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Storitve frizerja kot seznam referenc

## Kontekst in opis problema

Vsak frizer ne opravlja vseh storitev, zato mora sistem vedeti, katere storitve opravlja posamezen frizer. Storitve uporabljajo tudi termini.

## Obravnavane možnosti

* Seznam serviceIds v dokumentu frizerja
* Ločena vezna zbirka frizer–storitev

## Odločitev

Izbrana možnost: »Seznam serviceIds v dokumentu frizerja«, ker je seznam kratek in se bere skupaj s frizerjem, storitve pa ostanejo v svoji zbirki, da se na primer cena spremeni na enem mestu.

### Posledice

* Dobro, ker je iskanje frizerjev za izbrano storitev preprosto.
* Slabo, ker mora zaledje preveriti, da navedene storitve res obstajajo.
