# 05 – Uporabniške zgodbe

Uporabniške zgodbe za vse načrtovane funkcionalnosti iz `02-funkcionalnosti-in-obseg.md`. Zgodbe US-01 do US-11 pokrivajo funkcionalnosti MVP (F1–F7). Sporočila v narekovajih so besedila uporabniškega vmesnika, ki je v angleščini.

| Oznaka | Zgodba | Funkcionalnost | Vloga | MVP |
|---|---|---|---|---|
| US-01 | Registracija stranke | F1 | Gost | ✔ |
| US-02 | Prijava in odjava | F1 | Stranka, frizer, administrator | ✔ |
| US-03 | Ustvarjanje računa frizerja | F1 | Administrator | ✔ |
| US-04 | Upravljanje storitev | F2 | Administrator | ✔ |
| US-05 | Dodelitev storitev frizerju | F2 | Administrator | ✔ |
| US-06 | Nastavitev tedenskega delovnega časa | F3 | Administrator | ✔ |
| US-07 | Prikaz prostih začetnih ur | F4 | Stranka | ✔ |
| US-08 | Rezervacija termina brez prekrivanja | F5 | Stranka | ✔ |
| US-09 | Preklic ali prestavitev termina | F6 | Stranka | ✔ |
| US-10 | Preklic termina s strani frizerja | F6 | Frizer | ✔ |
| US-11 | Dnevni urnik in izid termina | F7 | Frizer | ✔ |
| US-12 | Pregled urnika salona | F8 | Administrator | |
| US-13 | Samodejna blokada po neprihodih | F9 | Administrator | |
| US-14 | E-poštna potrditev in opomnik | F10 | Stranka | |
| US-15 | Čakalni seznam | F11 | Stranka | |
| US-16 | Odsotnosti frizerjev | F12 | Frizer | |
| US-17 | Ponovna rezervacija | F13 | Stranka | |
| US-18 | Statistika za lastnika | F14 | Administrator | |

---

### US-01 – Registracija stranke
- **Funkcionalnost:** F1 Računi in vloge
- **Vloga:** Gost
- **Uporabniška zgodba:** Kot gost želim ustvariti račun stranke, da lahko termine rezerviram prek spleta.
- **Kriteriji sprejemljivosti:**
  1. Obrazec za registracijo vsebuje ime, priimek, e-pošto, telefon in geslo; račun se ustvari le, če so izpolnjena vsa polja.
  2. Če e-pošta ni veljavna, sistem prikaže »Enter a valid email address«; če račun s to e-pošto že obstaja, prikaže »An account with this email already exists« in ne ustvari ničesar.
  3. Telefonska številka je sprejeta le, če ima 6–20 znakov iz števk, presledkov in `+()-`, geslo pa le, če ima vsaj 6 znakov; sicer polje prikaže napako.
  4. Po uspešni registraciji se ustvarita dokument v `users` z vlogo `CLIENT` in profil v `clients` (`noShowCount` 0, `blocked` false), uporabnik je prijavljen in preusmerjen na stran za rezervacijo.
  5. Geslo je shranjeno samo kot zgoščena vrednost bcrypt; čisto geslo se v bazi nikoli ne pojavi.

### US-02 – Prijava in odjava
- **Funkcionalnost:** F1 Računi in vloge
- **Vloga:** Stranka, frizer, administrator
- **Uporabniška zgodba:** Kot registriran uporabnik se želim prijaviti z e-pošto in geslom, da vidim zaslone, ki pripadajo moji vlogi.
- **Kriteriji sprejemljivosti:**
  1. Ob pravilni e-pošti in geslu zaledje nastavi JWT v piškotku httpOnly ter stranko preusmeri na rezervacijo, frizerja na današnji urnik in administratorja na urnik salona.
  2. Ob napačni e-pošti ali geslu sistem prikaže »Incorrect email or password«, ne pove, kateri podatek je napačen, in ne nastavi piškotka.
  3. Zahteva na končno točko, ki je vloga uporabnika ne sme uporabljati, vrne 403 Forbidden, meni pa ne prikazuje zaslonov drugih vlog.
  4. Po »Log out« se piškotek izbriše, odpiranje katere koli zaščitene strani pa preusmeri na prijavo.

### US-03 – Ustvarjanje računa frizerja
- **Funkcionalnost:** F1 Računi in vloge
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim ustvariti račune za nove frizerje, da se lahko prijavijo in prejemajo rezervacije.
- **Kriteriji sprejemljivosti:**
  1. Administrator vnese ime, priimek, e-pošto, telefon in začetno geslo, z enakimi pravili preverjanja kot pri US-01.
  2. Shranjevanje v eni transakciji ustvari dokument v `users` z vlogo `HAIRDRESSER` in profil v `hairdressers` (`active` true); če kateri od zapisov ne uspe, se ne shrani nobeden.
  3. Novi frizer se lahko takoj prijavi in vidi svoj urnik.
  4. Frizer brez dodeljene storitve ali brez delovnega časa se strankam ne ponudi.
  5. Javna registracija vedno ustvari vlogo `CLIENT`; računa `HAIRDRESSER` ali `ADMIN` z njo ni mogoče ustvariti.

### US-04 – Upravljanje storitev
- **Funkcionalnost:** F2 Katalog storitev in storitve frizerjev
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim dodajati in urejati storitve s trajanjem in ceno, da stranke rezervirajo termin prave dolžine.
- **Kriteriji sprejemljivosti:**
  1. Storitev se shrani le z nazivom, trajanjem v celih minutah, večjim od 0, in ceno 0 ali več; cena se shrani v centih.
  2. Spremenjena cena ali trajanje velja le za nove rezervacije; obstoječi termini ohranijo svojo ceno, začetek in konec.
  3. Deaktivirana storitev se ne prikaže več v ceniku in čarovniku za rezervacijo, ostane pa vidna v preteklih terminih.
  4. Storitve, ki se pojavi v kateremkoli terminu, ni mogoče izbrisati, le deaktivirati.

### US-05 – Dodelitev storitev frizerju
- **Funkcionalnost:** F2 Katalog storitev in storitve frizerjev
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim izbrati, katere storitve opravlja posamezen frizer, da lahko stranka rezervira le frizerja, ki storitev zna opraviti.
- **Kriteriji sprejemljivosti:**
  1. Za vsakega frizerja administrator vidi vse aktivne storitve kot potrditvena polja in izbor shrani v `serviceIds`.
  2. Shranjevanje brez obkljukane storitve je zavrnjeno s sporočilom »Tick at least one service«.
  3. Po shranjevanju čarovnik za rezervacijo pri storitvi ponudi samo frizerje, ki jo imajo obkljukano.
  4. Odstranitev storitve pri frizerju ne prekliče njegovih obstoječih terminov za to storitev.

### US-06 – Nastavitev tedenskega delovnega časa
- **Funkcionalnost:** F3 Delovni čas frizerjev
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim nastaviti delovni čas vsakega frizerja za vse dni v tednu, da lahko stranke rezervirajo le takrat, ko je frizer v službi.
- **Kriteriji sprejemljivosti:**
  1. Za vsak dan v tednu lahko administrator vnese več intervalov (npr. 09:00–13:00 in 14:00–18:00); dan brez intervala je prost dan.
  2. Interval, ki se konča pred začetkom, ali dva intervala na isti dan, ki se prekrivata, sta zavrnjena s sporočilom o napaki.
  3. Proste začetne ure se ponujajo le znotraj shranjenih intervalov.
  4. Sprememba delovnega časa ne prestavi in ne prekliče obstoječih terminov.
  5. Frizer vidi svoj delovni čas, ne more pa ga spreminjati.

### US-07 – Prikaz prostih začetnih ur
- **Funkcionalnost:** F4 Izračun prostih terminov
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka želim videti le začetne ure, ki so za izbrano storitev res proste, da ne izberem ure, ki je salon ne more ponuditi.
- **Kriteriji sprejemljivosti:**
  1. Stranka izbere storitev, nato frizerja ali »Any available«, nato dan; izbrati je mogoče le aktivne frizerje, ki storitev opravljajo.
  2. Začetne ure se ponujajo na vsakih 15 minut, le tam, kjer celotna storitev ustreza pred koncem prostega intervala. Primer: prosto 11:00–13:00 in storitev 60 minut da 11:00, 11:15, 11:30, 11:45 in 12:00.
  3. Ure, ki se prekrivajo s potrjenim terminom, in ure, ki so danes že minile, se ne prikažejo.
  4. Pri »Any available« seznam vsebuje vsako začetno uro, ob kateri je prost vsaj en ustrezen frizer.
  5. Dan brez proste začetne ure je v izbirniku dni onemogočen.

### US-08 – Rezervacija termina brez prekrivanja
- **Funkcionalnost:** F5 Rezervacija brez prekrivanja
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka želim potrditi prosto začetno uro in dobiti zagotovljen termin, da nihče drug ne more ob istem času rezervirati istega frizerja.
- **Kriteriji sprejemljivosti:**
  1. Pred potrditvijo stranka vidi povzetek s storitvijo, datumom, uro začetka in konca, frizerjem in ceno.
  2. Ob potrditvi zaledje ponovno preveri razpoložljivost; če je bila ura medtem zasedena, vrne 409, stranka pa vidi »This slot was just taken. Pick another time.« in osvežen seznam.
  3. Če dve stranki istočasno potrdita istega frizerja ob isti uri, se shrani natanko en termin.
  4. Shranjen termin ima status `CONFIRMED`, `endsAt` = `startsAt` + trajanje storitve in ceno storitve ob rezervaciji.
  5. Pri »Any available« se termin dodeli ustreznemu frizerju z najmanj termini na ta dan.

### US-09 – Preklic ali prestavitev termina
- **Funkcionalnost:** F6 Preklic in prestavitev z rokom
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka želim termin preklicati ali prestaviti prek spleta, da mi ob spremembi načrtov ni treba klicati salona.
- **Kriteriji sprejemljivosti:**
  1. »My appointments« prikazuje prihodnje in pretekle termine z datumom, uro, storitvijo, frizerjem, ceno in statusom.
  2. Preklic in prestavitev sta na voljo le, če se termin začne čez vsaj 24 ur; sicer stranka vidi »Online changes close 24 hours before the appointment. Call the salon.«
  3. Preklic zahteva potrditev, nastavi status `CANCELLED` in čas takoj sprosti za druge stranke.
  4. Prestavitev odpre čarovnik za rezervacijo z isto storitvijo in frizerjem ter spremeni čas istega termina, ne da bi ustvarila novega.
  5. Zahteva za preklic termina druge stranke vrne 403 Forbidden.

### US-10 – Preklic termina s strani frizerja
- **Funkcionalnost:** F6 Preklic in prestavitev z rokom
- **Vloga:** Frizer
- **Uporabniška zgodba:** Kot frizer želim preklicati svoj termin z razlogom, da stranka ve, zakaj, kadar ne morem delati.
- **Kriteriji sprejemljivosti:**
  1. Frizer lahko prekliče katerikoli svoj prihodnji termin s statusom `CONFIRMED`, tudi manj kot 24 ur pred začetkom.
  2. Razlog je obvezen; preklic s praznim razlogom je zavrnjen.
  3. Stranka v »My appointments« vidi status Cancelled in razlog.
  4. Zahteva za preklic termina drugega frizerja vrne 403 Forbidden.

### US-11 – Dnevni urnik in izid termina
- **Funkcionalnost:** F7 Dnevni urnik in izid termina
- **Vloga:** Frizer
- **Uporabniška zgodba:** Kot frizer želim videti svoj dan in zabeležiti, ali je stranka prišla, da salon ve, kdo ne pride.
- **Kriteriji sprejemljivosti:**
  1. Urnik prikazuje termine izbranega dne po vrsti z uro, imenom stranke, telefonom, storitvijo, opombo stranke in statusom ter proste vrzeli; frizer se lahko premakne na prejšnji in naslednji dan.
  2. »Completed« in »No-show« sta na voljo šele, ko je čas začetka termina minil.
  3. Oznaka »No-show« poveča `noShowCount` stranke za 1; oznaka »Completed« ga ne spremeni.
  4. Ko je izid nastavljen, ga frizer ne more spremeniti; le administrator lahko neprihod popravi v zaključen termin, kar `noShowCount` zmanjša za 1.

### US-12 – Pregled urnika salona
- **Funkcionalnost:** F8 Pregled urnika salona
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim videti termine vseh frizerjev za en dan drug ob drugem, da vem, kako zaseden je salon.
- **Kriteriji sprejemljivosti:**
  1. Za izbrani dan pregled prikaže en stolpec na frizerja z njegovim delovnim časom in termini po vrsti; prost dan je označen z »off«.
  2. Vsak termin prikazuje uro, stranko, storitev in oznako statusa (potrjen, zaključen, neprihod, preklican).
  3. Administrator lahko iz pregleda prekliče katerikoli prihodnji termin z razlogom, ne glede na rok 24 ur.
  4. Pregled je mogoče premakniti en dan nazaj ali naprej in nazaj na danes.

### US-13 – Samodejna blokada po neprihodih
- **Funkcionalnost:** F9 Samodejna blokada po neprihodih
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot administrator želim, da se stranke s ponavljajočimi se neprihodi samodejno blokirajo, da nezanesljive stranke drugim ne jemljejo terminov.
- **Kriteriji sprejemljivosti:**
  1. Ko `noShowCount` stranke doseže 3, se `blocked` samodejno nastavi na true.
  2. Blokirana stranka vidi »Online booking is blocked after 3 no-shows. Call the salon.«, gumb za potrditev je onemogočen, API pa rezervacijo zavrne s 403.
  3. Seznam strank prikazuje število neprihodov vsake stranke in oznako »Blocked«; »Unblock« nastavi `blocked` nazaj na false.
  4. Obstoječi potrjeni termini blokirane stranke ostanejo.

### US-14 – E-poštna potrditev in opomnik
- **Funkcionalnost:** F10 E-poštna potrditev in opomnik
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka želim po rezervaciji prejeti e-pošto in dan prej opomnik, da termina ne pozabim.
- **Kriteriji sprejemljivosti:**
  1. V 1 minuti po rezervaciji stranka prejme e-pošto s storitvijo, datumom, uro, frizerjem, ceno in naslovom salona.
  2. Opomnik se pošlje 24 ur (±15 minut) pred začetkom in vsebuje povezavo za preklic.
  3. Povezava za preklic deluje le do 24 ur pred začetkom; potem prikaže telefonsko številko salona.
  4. Za preklican termin se opomnik ne pošlje.

### US-15 – Čakalni seznam
- **Funkcionalnost:** F11 Čakalni seznam
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka se želim vpisati na čakalni seznam za poln dan, da dobim priložnost, če kdo prekliče.
- **Kriteriji sprejemljivosti:**
  1. Če izbrani dan za storitev nima proste začetne ure, lahko stranka pritisne »Join waiting list«.
  2. Stranka je lahko na seznamu le enkrat za isti dan in storitev; vpisi se hranijo po vrstnem redu dodajanja.
  3. Ko preklic sprosti čas, ki ustreza storitvi, prva stranka na seznamu prejme e-pošto; čas se ne rezervira, zato ga dobi tisti, ki ga prvi rezervira.
  4. Stranka se lahko s seznama izpiše, vpisi za pretekle dni pa se odstranijo.

### US-16 – Odsotnosti frizerjev
- **Funkcionalnost:** F12 Odsotnosti frizerjev
- **Vloga:** Frizer
- **Uporabniška zgodba:** Kot frizer želim vnaprej vnesti proste dni in dopust, da me stranke ne morejo rezervirati, ko me ni.
- **Kriteriji sprejemljivosti:**
  1. Frizer vnese odsotnost z začetnim datumom, končnim datumom in razlogom (npr. »Letni dopust«).
  2. Na dneve odsotnosti se proste začetne ure ne ponujajo, tudi če so v tedenskem delovnem času.
  3. Odsotnost, ki se prekriva s potrjenimi termini, se ne shrani; sistem izpiše termine, ki so v sporu.
  4. Frizer lahko izbriše prihodnjo odsotnost; pretekle odsotnosti se ohranijo.

### US-17 – Ponovna rezervacija
- **Funkcionalnost:** F13 Ponovna rezervacija
- **Vloga:** Stranka
- **Uporabniška zgodba:** Kot stranka želim z enim klikom ponoviti preteklo rezervacijo, da mi ni treba znova izbirati iste storitve in frizerja.
- **Kriteriji sprejemljivosti:**
  1. Vsak zaključen termin v zgodovini ima gumb »Book again«.
  2. Gumb odpre čarovnik za rezervacijo z že izbrano isto storitvijo in frizerjem, na koraku za izbiro dneva.
  3. Če frizer ni več aktiven ali storitve ne opravlja več, je izbrano »Any available«, sporočilo pa pojasni zakaj.
  4. Če je storitev deaktivirana, gumb ni prikazan.

### US-18 – Statistika za lastnika
- **Funkcionalnost:** F14 Statistika za lastnika
- **Vloga:** Administrator
- **Uporabniška zgodba:** Kot lastnik salona želim videti zasedenost, prihodek in neprihode za obdobje, da lahko načrtujem osebje in cene.
- **Kriteriji sprejemljivosti:**
  1. Administrator izbere obdobje (ta teden, ta mesec ali dva datuma), vse vrednosti pa se izračunajo za to obdobje.
  2. Zasedenost po frizerju = rezervirane minute nepreklicanih terminov ÷ minute delovnega časa × 100, prikazano v odstotkih.
  3. Prihodek = vsota cen terminov s statusom `COMPLETED`; preklicani termini in neprihodi se ne štejejo.
  4. Prikazanih je pet storitev z največ zaključenimi termini in njihovo število.
  5. Delež neprihodov = neprihodi ÷ (zaključeni + neprihodi) × 100.