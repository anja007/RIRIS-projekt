---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Prijava z JWT v piškotku httpOnly

## Kontekst in opis problema

Stranke, frizerji in administrator se prijavljajo, zaledje pa mora pri vsaki zahtevi vedeti, kdo jo pošilja in s katero vlogo. Odločiti se moramo, kako hraniti prijavo.

## Obravnavane možnosti

* JWT v piškotku httpOnly
* JWT v localStorage
* Seje, shranjene na strežniku

## Odločitev

Izbrana možnost: »JWT v piškotku httpOnly«, ker strežnik ne potrebuje tabele sej, ker žeton sam pove, kdo je uporabnik, JavaScript pa piškotka httpOnly ne more prebrati, zato ga napad XSS ne more ukrasti.

### Posledice

* Dobro, ker preverjanje vloge ne potrebuje dodatne poizvedbe v bazo.
* Dobro, ker je žeton zaščiten pred napadi XSS.
* Slabo, ker žetona ni mogoče preklicati pred iztekom brez dodatne logike.
