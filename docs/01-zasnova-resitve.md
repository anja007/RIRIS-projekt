# 01 – Zasnova rešitve

## Ime rešitve

**Salonko** – spletna aplikacija za spletno rezervacijo terminov v frizerskem salonu.

## Namen in problem

Manjši frizerski saloni termine običajno dogovarjajo po telefonu ali v papirnatem zvezku. Frizerji morajo prekinjati delo, da se oglasijo na klic, termini se podvajajo ali ne ustrezajo trajanju storitve, stranke lahko naročajo samo med delovnim časom, salon pa nima evidence o strankah, ki ne pridejo.

Salonko strankam omogoča spletno rezervacijo termina kadar koli. Sistem izračuna proste termine iz delovnega časa frizerjev, trajanja izbrane storitve in obstoječih terminov ter prepreči prekrivanje rezervacij.

## Ciljni uporabniki

| Uporabnik         | Kdo je                            | Kdaj in zakaj ga uporablja                                                                   |
| ----------------- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| **Gost**          | Obiskovalec, ki ni prijavljen     | Pred registracijo pregleda cenik, frizerje in proste termine.                                |
| **Stranka**       | Oseba, ki želi frizersko storitev | Rezervira, prekliče ali prestavi termin, običajno s telefonom izven delovnega časa.          |
| **Frizer**        | Zaposleni v salonu                | Pregleda dnevni urnik in termine označi kot zaključene ali neprihod.                         |
| **Administrator** | Lastnik ali vodja salona          | Upravlja storitve, cene, frizerje, delovni čas in stranke ter ima pregled nad vsemi termini. |

Rešitev je namenjena enemu manjšemu ali srednje velikemu salonu (1–10 frizerjev).

## Delovanje

1. Administrator vnese vsako storitev z nazivom, ceno in trajanjem v minutah (npr. „Moško striženje – 30 min – 18 €“). Iz tega trajanja sistem določi, koliko časa traja termin. Administrator ustvari tudi račune frizerjev, vsakemu frizerju določi storitve, ki jih opravlja, in nastavi njegov tedenski delovni čas.
2. Stranka izbere storitev, frizerja (ali „kateri koli prost“), dan in eno od ponujenih prostih začetnih ur ter potrdi rezervacijo.
3. Stranka lahko termin prekliče ali prestavi najpozneje 24 ur pred začetkom.
4. Po začetku termina ga frizer označi kot zaključen ali neprihod. Stranke s preveč neprihodi se blokirajo za spletno rezervacijo.
