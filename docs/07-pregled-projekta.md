# 07 – Pregled projekta

Vse funkcionalnosti MVP so uspešno implementirane in skladne s pripadajočimi uporabniškimi zgodbami:

- **F1 Računi in vloge:** registracija, prijava in odjava ter dostop glede na vlogo.
- **F2 Katalog storitev:** upravljanje storitev s trajanjem in ceno ter dodelitev storitev frizerjem.
- **F3 Delovni čas frizerjev:** tedenski delovni čas z več intervali na dan.
- **F4 Izračun prostih terminov:** proste začetne ure na vsakih 15 minut za izbranega frizerja ali možnost »Kdorkoli prost«.
- **F5 Rezervacija brez prekrivanja:** ponovno preverjanje razpoložljivosti v transakciji, ki prepreči dvojno rezervacijo.
- **F6 Preklic in prestavitev z rokom:** preklic in prestavitev s strani stranke do 24 ur pred terminom ter preklic s strani frizerja z razlogom.
- **F7 Dnevni urnik in izid termina:** dnevni urnik frizerja in označevanje terminov kot zaključen ali neprihod.

### US-06 – Nastavitev tedenskega delovnega časa

1. Za vsak dan je mogoče vnesti več intervalov, dan brez intervala je prost dan.
2. Interval, ki se konča pred začetkom, in prekrivajoča se intervala sta zavrnjena.
3. Proste začetne ure se ponujajo le znotraj shranjenih intervalov.
4. Sprememba delovnega časa ne vpliva na obstoječe termine.
5. Frizer vidi svoj delovni čas, ne more pa ga spreminjati.

**Izvedba:** Na strani »Frizerji« administrator za vsak dan vnese poljubno število intervalov, prazno polje pa pomeni prost dan. Funkcija validateWorkingHours v zaledju zavrne interval, ki se konča pred začetkom, in intervala, ki se prekrivata. Izračun prostih ur uporablja samo shranjene intervale izbranega dne. Shranjevanje posodobi samo podatke frizerja, zato obstoječi termini ostanejo nespremenjeni. Frizer svoj delovni čas vidi na strani »Moj urnik«, končna točka za spreminjanje pa je dostopna samo administratorju.

### US-07 – Prikaz prostih začetnih ur

1. Stranka izbere storitev, frizerja ali »Kdorkoli prost« in dan. Izbrati je mogoče le aktivne frizerje, ki storitev opravljajo.
2. Začetne ure so na vsakih 15 minut, celotna storitev mora ustrezati prostemu intervalu.
3. Ure, ki se prekrivajo s potrjenim terminom, in ure, ki so danes že minile, se ne prikažejo.
4. Pri »Kdorkoli prost« seznam vsebuje vsako uro, ob kateri je prost vsaj en frizer.
5. Dan brez proste začetne ure je v izbirniku onemogočen.

**Izvedba:** Čarovnik za rezervacijo vodi stranko skozi izbiro storitve, frizerja in dneva, frizerji, ki izbrane storitve ne opravljajo, pa so onemogočeni. Proste ure izračuna funkcija freeStartMinutes v lib/slots.ts, ki upošteva korak 15 minut, trajanje storitve, potrjene termine in trenutni čas. Primer iz drugega kriterija je pokrit z enotskim testom v lib/slots.test.ts. Pri »Kdorkoli prost« se proste ure vseh ustreznih frizerjev združijo v en seznam. Končna točka /booking/days za vsak dan vrne število prostih ur, dan brez njih pa je v izbirniku onemogočen.

### US-08 – Rezervacija termina brez prekrivanja

1. Pred potrditvijo stranka vidi povzetek s storitvijo, datumom, uro začetka in konca, frizerjem in ceno.
2. Če je bila ura medtem zasedena, zaledje vrne 409 in stranka vidi osvežen seznam ur.
3. Pri dveh hkratnih potrditvah iste ure pri istem frizerju se shrani natanko en termin.
4. Termin ima status CONFIRMED, endsAt = startsAt + trajanje in ceno ob rezervaciji.
5. Pri »Kdorkoli prost« se termin dodeli frizerju z najmanj termini na ta dan.

**Izvedba:** Povzetek rezervacije je prikazan ob čarovniku. Ob potrditvi zaledje ponovno preveri razpoložljivost in ob zasedeni uri vrne 409, odjemalec pa prikaže sporočilo in ponovno naloži proste ure. Rezervacija poteka v transakciji, ki poveča bookingVersion frizerja, zato pri dveh hkratnih rezervacijah druga vidi prvi termin in je zavrnjena. Termin se ustvari s statusom CONFIRMED, izračunanim endsAt in trenutno ceno storitve. Pri »Kdorkoli prost« zaledje kandidate razvrsti po številu terminov na izbrani dan in termin dodeli prvemu prostemu.

### US-09 – Preklic ali prestavitev termina

1. »Moji termini« prikazuje prihodnje in pretekle termine z datumom, uro, storitvijo, frizerjem, ceno in statusom.
2. Preklic in prestavitev sta mogoča le, če se termin začne čez vsaj 24 ur.
3. Preklic zahteva potrditev, nastavi status CANCELLED in takoj sprosti čas.
4. Prestavitev odpre čarovnik z isto storitvijo in frizerjem ter spremeni čas istega termina.
5. Zahteva za preklic termina druge stranke vrne 403.

**Izvedba:** Stran »Moji termini« ima razdelka »Prihodnji« in »Zgodovina«, ki prikazujeta vse zahtevane podatke. Rok 24 ur preverita odjemalec in zaledje, po roku pa stranka namesto gumbov vidi obvestilo s telefonom salona. Preklic stranka potrdi v pogovornem oknu, preklicani termini pa se pri izračunu prostih ur ne upoštevajo več. Prestavitev odpre čarovnik na koraku za izbiro dneva, zaledje pa posodobi čas obstoječega termina. Pri preklicu in prestavitvi zaledje preveri, ali termin pripada prijavljeni stranki.

### US-11 – Dnevni urnik in izid termina

1. Urnik prikazuje termine dne z uro, stranko, telefonom, storitvijo, opombo in statusom ter proste vrzeli. Frizer se lahko premakne na prejšnji in naslednji dan.
2. »Zaključen« in »Neprihod« sta na voljo šele po začetku termina.
3. »Neprihod« poveča noShowCount stranke za 1, »Zaključen« ga ne spremeni.
4. Frizer izida ne more spremeniti, administrator lahko neprihod popravi v zaključen termin, kar zmanjša noShowCount za 1.

**Izvedba:** Stran »Moj urnik« prikazuje termine izbranega dne z vsemi zahtevanimi podatki in proste vrzeli med njimi, s puščicama pa frizer zamenja dan. Gumba za izid se prikažeta šele po začetku termina, zaledje pa zahtevo pred tem zavrne. Status termina in noShowCount stranke se posodobita v isti transakciji. Izid je mogoče nastaviti samo potrjenemu terminu, zato ga frizer kasneje ne more spremeniti. Administrator ima za popravek neprihoda stran »Neprihodi«.
