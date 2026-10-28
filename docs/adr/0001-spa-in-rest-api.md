---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Odjemalec kot SPA v Reactu in ločen REST API

## Kontekst in opis problema

Aplikacijo v brskalniku uporabljajo štiri vloge, rezervacija pa je interaktivna: proste ure se morajo osvežiti takoj, ko stranka izbere storitev, frizerja ali dan. Odločiti se moramo, kako zgraditi uporabniški vmesnik in zaledje.

## Obravnavane možnosti

* SPA v Reactu in ločen REST API
* Strani, ki jih upodobi strežnik (npr. Express s predlogami)
* Ogrodje za celoten sklad (npr. Next.js)

## Odločitev

Izbrana možnost: »SPA v Reactu in ločen REST API«, ker ločuje uporabniški vmesnik od poslovne logike, rezervacija deluje brez ponovnega nalaganja strani, isti API pa lahko kasneje uporabi tudi mobilna aplikacija.

### Posledice

* Dobro, ker lahko odjemalca in zaledje razvijamo in testiramo ločeno.
* Dobro, ker je API mogoče ponovno uporabiti.
* Slabo, ker je treba zagnati in nastaviti dve aplikaciji.
