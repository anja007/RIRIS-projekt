# 02 – Funkcionalnosti in obseg projekta

## Uporabniške vloge

### Gost

**Lahko:**

- pregleduje cenik, frizerje in proste termine,
- se registrira kot stranka.

**Ne more:**

- rezervirati termina,
- videti osebnih podatkov ali terminov.

### Stranka

**Lahko:**

- rezervira termin za storitev pri izbranem ali katerem koli prostem frizerju,
- pregleduje prihodnje in pretekle termine,
- prekliče ali prestavi termin najpozneje 24 ur pred začetkom,
- ureja svoje kontaktne podatke.

**Ne more:**

- videti terminov drugih strank,
- preklicati ali prestaviti termina manj kot 24 ur pred začetkom,
- spreminjati storitev, cen, delovnega časa ali statusov terminov,
- rezervirati prek spleta, dokler je njen račun blokiran.

### Frizer

**Lahko:**

- pregleduje svoj dnevni in tedenski urnik s kontaktnimi podatki strank,
- svoje termine označi kot zaključene ali neprihod,
- prekliče svoj termin z navedbo razloga,
- pregleduje svoj delovni čas.

**Ne more:**

- videti ali spreminjati urnikov drugih frizerjev,
- spreminjati svojega delovnega časa,
- spreminjati storitev in cen,
- upravljati uporabniških računov.

### Administrator

**Lahko:**

- upravlja storitve (naziv, trajanje, cena, aktivnost),
- ustvarja račune frizerjev in nastavlja njihov delovni čas,
- pregleduje urnike vseh frizerjev in vse termine,
- prekliče kateri koli termin,
- popravi neprihod v zaključen termin,
- blokira in odblokira stranke.

**Ne more:**

- rezervirati terminov v imenu strank,
- videti gesel uporabnikov,
- brisati terminov, ki so že bili izvedeni.

## Načrtovane funkcionalnosti

| #   | Funkcionalnost                  | Opis                                                                                                                                                                                                                                               | MVP     |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| F1  | Računi in vloge                 | Registracija stranke s preverjanjem vnosa (obvezna polja, oblika e-pošte, oblika telefonske številke, geslo z vsaj 6 znaki), prijava in odjava; administrator ustvari račune frizerjev; dostop je odvisen od vloge.                                | **MVP** |
| F2  | Katalog storitev                | Storitve s trajanjem v minutah in ceno; trajanje določa, koliko časa traja termin.                                                                                                                                                                 | **MVP** |
| F3  | Delovni čas frizerjev           | Tedenski delovni čas za vsakega frizerja, z več intervali na dan (npr. 9–13 in 14–18).                                                                                                                                                             | **MVP** |
| F4  | Izračun prostih terminov        | Za izbrano storitev, frizerja in dan sistem prikaže vse začetne ure, pri katerih celotna storitev ustreza prostemu delovnemu času frizerja. Ponudijo se samo frizerji, ki izbrano storitev opravljajo. Podpira možnost „kateri koli prost frizer“. | **MVP** |
| F5  | Rezervacija brez prekrivanja    | Stranka potrdi prost termin; sistem ponovno preveri razpoložljivost in prepreči prekrivanje dveh terminov istega frizerja.                                                                                                                         | **MVP** |
| F6  | Preklic in prestavitev z rokom  | Stranka lahko termin prekliče ali prestavi le do 24 ur pred začetkom.                                                                                                                                                                              | **MVP** |
| F7  | Dnevni urnik in izid termina    | Frizer vidi svoj dan in vsak termin označi kot zaključen ali neprihod; neprihodi se štejejo za vsako stranko.                                                                                                                                      | **MVP** |
| F8  | Pregled urnika salona           | Administrator vidi termine vseh frizerjev za izbrani dan drug ob drugem.                                                                                                                                                                           |         |
| F9  | Samodejna blokada po neprihodih | Stranka s 3 neprihodi se samodejno blokira za spletno rezervacijo, dokler je administrator ne odblokira.                                                                                                                                           |         |
| F10 | E-poštna potrditev in opomnik   | Potrditev po rezervaciji in opomnik 24 ur pred terminom.                                                                                                                                                                                           |         |
| F11 | Čakalni seznam                  | Stranka se lahko vpiše na čakalni seznam za poln dan in prejme obvestilo, ko se termin sprosti.                                                                                                                                                    |         |
| F12 | Odsotnosti frizerjev            | Frizer vnese proste dni ali dopust, ki se izločijo iz prostih terminov.                                                                                                                                                                            |         |
| F13 | Ponovna rezervacija             | Nova rezervacija z isto storitvijo in frizerjem iz zgodovine terminov.                                                                                                                                                                             |         |
| F14 | Statistika za lastnika          | Zasedenost po frizerjih, prihodek po obdobjih, najbolj iskane storitve in delež neprihodov.                                                                                                                                                        |         |

Domensko specifične funkcionalnosti MVP: F3, F4, F5, F6, F7.

## Kasnejše nadgradnje

1. Več storitev v enem terminu.
2. Spletno plačilo are ob rezervaciji.
3. SMS opomniki.
4. Podpora več salonom.
5. Sinhronizacija z Google Koledarjem.
6. Program zvestobe.

## Izven obsega projekta

- Spletna plačila.
- Izdajanje računov in davčno potrjevanje računov.
- Upravljanje zalog frizerskih izdelkov.
- Obračun plač in provizij frizerjev.
- Native mobilne aplikacije.
- Prijava prek družbenih omrežij in dvostopenjsko preverjanje pristnosti.
