---
status: "sprejeto"
date: 2026-10-14
decision-makers: Anja Popović
---

# Ločeni zbirki clients in hairdressers poleg users

## Kontekst in opis problema

Vsi uporabniki se prijavljajo z enakimi podatki, stranke pa imajo še število neprihodov in blokado, frizerji pa storitve in delovni čas. Administrator nima dodatnih podatkov. Odločiti se moramo, kako shraniti različne vrste uporabnikov.

## Obravnavane možnosti

* Ena zbirka users z vsemi polji
* Zbirka users za prijavo ter ločeni zbirki clients in hairdressers

## Odločitev

Izbrana možnost: »Zbirka users za prijavo ter ločeni zbirki clients in hairdressers«, ker users vsebuje samo skupne podatke za prijavo, vsaka vrsta uporabnika ima svoje podatke, termini pa so povezani neposredno s stranko in frizerjem, kot v resničnem salonu.

### Posledice

* Dobro, ker nobena zbirka nima polj, ki so pri polovici dokumentov prazna.
* Dobro, ker model jasno pokaže, da sta stranka in frizer vrsti uporabnika.
* Slabo, ker sta za prikaz imena na terminu potrebna dva koraka, ustvarjanje računa pa piše v dve zbirki.
