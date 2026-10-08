# Granskning av tips utan target

Datum: 2026-10-07. Underlag: `locales/tips.ts` och svenska titel-/beskrivningstexter i `locales/sv/tips.json`.

92 tips totalt: 38 har minst ett icke-tomt targetfält, 54 saknar target. Inga tips har targetPeriod utan target eller target utan targetPeriod. Alla tio targetfält räknades, inklusive nutrientTargets. Befintliga 38 targets har inte medicinskt kvalitetsgranskats i denna genomgång.

Detta är en implementerbarhetsbedömning och förslag till produktmål. Inga targets eller doser har ändrats i appen. Siffror för rutiner är illustrativa startvärden som ska kunna anpassas; de är inte vetenskapligt fastställda optimala doser eller löften om hälsoeffekt. Befintliga hälsopåståenden i tipsbeskrivningarna är inte verifierade genom att ett target kan skapas.

| Bedömning | Antal |
|---|---:|
| A – tydligt mätbart mål | 13 |
| B – möjligt, behöver utökad modell | 7 |
| C – bara individuellt protokoll | 5 |
| D – följsamhet, inget generellt dosmål | 23 |
| E – behåll som kategori | 6 |

## Tekniska slutsatser

- `HabitTarget.trackingKey` tillåter endast sleep_duration, morning_light, meditation, tooth_brushing, nature_time och social_connection. Föreslagna nya vanor behöver nya nycklar och etiketter/UI-koppling. Återanvänd inte meditation för andning eller sleep_duration för sömnrytm: det kan felaktigt uppfylla flera olika tips.
- Habitloggen lagrar en numerisk value och kan summera per dag/vecka. `daily-check` passar ett genomfört beteende, `number` passar minuter. Samma registrering ska inte räknas som flera dagar, särskilt inte för HRV-mätningar.
- `getTargetProgress` använder alltid `current >= target.amount`. Det passar miniminivåer, men inte maxgränser, intervall, tidsfönster eller fasta som ska vara precis enligt upplägg. Lägg till jämförelse/semantik innan lågkolhydrat-/ketogenmål aktiveras.
- Training-targets matchar aktivitetskategori och summerar pass, minuter eller km. De verifierar inte fastande tillstånd eller träningszon enbart genom antal minuter.
- `TargetDefinition` har adaptrar för habit, training och nutrition. Metric nämns i TargetSource men saknar faktisk targetdefinition/resolver. HRV kan först loggas som daglig check; automatisk uppföljning kräver koppling till metric-loggen.
- E-vitamin har befintlig vitamin-tag. NutrientType innehåller endast caffeine; exempelvis creatine, nitrate, CoQ10, lutein och zeaxanthin behöver nya substansdefinitioner eller separat SupplementTarget.
- Befintlig näringsuppföljning kan läsa supplementintag när substans/tagg och mängd matchar. Det är inte en generell adapter för att räkna alla planerade supplementintag. `supplements: [{id: ...}]` skapar inte automatiskt ett target.

## Fullständig lista och bedömning

### A – tydligt mätbart mål (13)

| Tips / id | Föreslaget mätbart mål | Vad krävs / begränsning |
|---|---|---|
| E-vitamin för antioxidantskydd — `vitamin_e_antioxidant_support` | Mät totalt E-vitaminintag i mg/dag mot ett källbaserat, individanpassat näringsmål. Det mäter intag, inte antioxidantskydd. | vitaminTargets har redan vitamin_e. Skilj alfa-tokoferol från blandade tokoferoler/tokotrienoler; produkterna kan inte summeras som likvärdiga mg. Verifiera innehåll och rekommenderat intag före aktivering. |
| Sömnrytm och cirkadisk timing — `sleep_timing_circadian` | Antal dagar per vecka då lägg- och uppstigningstid ligger inom användarens valda tidsfönster. Exempel: 5 av 7 dagar. | Ny habit trackingKey: sleep_schedule_consistency; tidsfönster eller daglig check. Registrering och etiketter behöver kopplas in. |
| Låda-andning — `box_breathing` | Loggade minuter låda-andning per dag, exempelvis 3 minuter. | Ny habit trackingKey: box_breathing; minutes. Registrering och etiketter behöver kopplas in. |
| 4-7-8-andning — `4_7_8_breathing` | En genomförd, självvald andningsövning per dag; inga extra poäng för längre andningshållning. | Ny habit trackingKey: breathing_4_7_8; daily-check. Registrering och etiketter behöver kopplas in. |
| Växlande näsborrs-andning — `alternate_nostril_breathing` | Loggade minuter per dag, exempelvis 3 minuter. | Ny habit trackingKey: alternate_nostril_breathing; minutes. Registrering och etiketter behöver kopplas in. |
| Diafragmal andning — `diaphragmatic_breathing` | Loggade minuter bukandning per dag, exempelvis 5 minuter. | Ny habit trackingKey: diaphragmatic_breathing; minutes. Registrering och etiketter behöver kopplas in. |
| Sömnmiljöoptimering — `sleep_environment_optimization` | Daglig check att vald sovmiljörutin är genomförd; exempelvis mörkläggning och störningsfri miljö. | Ny habit trackingKey: sleep_environment; daily-check. Registrering och etiketter behöver kopplas in. |
| Sömnhygieniska rutiner — `sleep_hygiene_practices` | Genomförd personligt vald kvällsrutin, exempelvis 5 dagar per vecka. Undvik att mäta samma rutin i flera tips. | Ny habit trackingKey: sleep_hygiene; daily-check. Registrering och etiketter behöver kopplas in. |
| Sömnförberedelse och nedvarvning — `pre_sleep_wind_down` | Loggade minuter nedvarvning före läggdags, exempelvis 30 minuter. | Ny habit trackingKey: pre_sleep_wind_down; minutes. Registrering och etiketter behöver kopplas in. |
| HRV och återhämtningsovervakning — `hrv_recovery_monitoring` | Antal dagar med registrerad HRV-mätning, exempelvis 5 per vecka. Målet är datainsamling, inte ett universellt HRV-värde. | Ny habit trackingKey: hrv_measurement_days; daily-check eller koppling till metric-logg. Registrering och etiketter behöver kopplas in. |
| Lugnande musik och ljudterapi — `calming_music_waves` | Loggade minuter lugn musik/ljud, exempelvis 10 minuter per dag. | Ny habit trackingKey: calming_music; minutes. Registrering och etiketter behöver kopplas in. |
| Näsandning och kväveoxid — `nasal_breathing_nitric_oxide` | Minuter med bekväm näsandning i en vald lugn övning, exempelvis 5 minuter per dag. | Ny habit trackingKey: nasal_breathing; minutes. Registrering och etiketter behöver kopplas in. |
| Blått och rött ljus på kvällen — `blue_light_evening` | Daglig check av vald kvällsbelysnings-/skärmrutin före läggdags. | Ny habit trackingKey: evening_light_routine; daily-check. Registrering och etiketter behöver kopplas in. |

### B – möjligt, behöver utökad modell (7)

| Tips / id | Föreslaget mätbart mål | Vad krävs / begränsning |
|---|---|---|
| Lågkolhydratkost — `low_carb_diet` | Kolhydratintag i g/dag jämfört med en personlig övre gräns. | Kolhydrater finns i näringssummeringen, men target behöver unit g och jämförelsen högst; dagens current >= amount ger fel resultat. |
| Ketogen kost — `ketogenic_diet` | Personligt övre kolhydratmål; eventuellt separat registrering av ketoner. | Behöver övre gräns och definition total/nettokolhydrater. Ett kolhydratmål verifierar inte ketos; ketonmätning kräver separat metric-target. |
| Intermittent fasta 12 timmar — `intermittent_fasting_12h` | Ett registrerat nattligt matuppehåll på 12 timmar mellan senaste och första energiintag. | Behöver fasting_duration, timmar och tillförlitliga tidsstämplar över dygnsgränsen. Ej längre fastetid som extra prestation. |
| Intermittent fasta 16:8 — `intermittent_fasting_16_8` | Registrerad 16-timmars fasta och ett högst 8-timmars ätfönster enligt användarens valda upplägg. | Behöver fasta-/ätfönstermodell. En daily-check kan logga följsamhet men verifierar inte tidslängden. |
| Kreatin — `creatine_atp_strength` | Registrerat kreatinintag per dag enligt valt upplägg; separat från prestationsmått. | Ny nutrient-tag creatine eller SupplementTarget för specifik aktiv substans. Kreatin är inte en befintlig AminoAcidType; koppla inte till protein/amino-acid-total. |
| Nüchtern aerob träning — `fasted_aerobic_training` | Antal genomförda aeroba pass enligt personligt fastande upplägg per vecka. | activityTargets kan räkna pass, men kräver fasted-flagga eller koppling till matintag; vanliga zone2_sessions verifierar inte fastande träning. |
| Nitrat och kväveoxid för kärlhälsa — `nitrate_no_efficiency` | Antal portioner av uttryckligen definierade nitratrika livsmedel, eller uppmätt nitratintag om produktdata finns. | Ny trackingKey med portionsdefinition eller nutrient-tag nitrate. Portionsantal är en proxy för kostvanan, inte verifierad NO-effekt. |

### C – bara individuellt protokoll (5)

| Tips / id | Föreslaget mätbart mål | Vad krävs / begränsning |
|---|---|---|
| Köldexponering — `cold_exposure_ans` | Antal genomförda sessioner enligt ett valt protokoll. | Behöver protokoll, temperatur och varaktighet; längre/kallare ska inte automatiskt räknas som bättre. |
| Brunfett och sval inomhusmiljö — `brown_fat_cool_home` | Tid i ett individuellt valt temperaturintervall, om temperatur kan registreras. | Mäter exponering, inte brunfett. Kräver intervallmål, °C och tidslogg; inte ett generellt mål om lägsta temperatur. |
| Undvik hårda platta skor på platt mark — `avoid_flat_hard_shoes` | Daglig check av vald sko-/underlagsrutin. | Kan tekniskt loggas som vana, men den generella rekommendationen behöver sakgranskas innan target skapas. |
| Near Infrared / Rött ljus — `near_infrared_red_light` | Genomförd session enligt dokumenterat apparatprotokoll. | Behöver våglängd, irradians, exponeringstid och avstånd. Minuter ensamt är inte tillräckligt för dos. |
| Far Infrared — `far_infrared_light` | Genomförd session enligt dokumenterat värme-/apparatprotokoll. | Behöver temperatur, tid och individuell tolerans. Mäter användning, inte djupvävnadsåterhämtning. |

### D – följsamhet, inget generellt dosmål (23)

| Tips / id | Föreslaget mätbart mål | Vad krävs / begränsning |
|---|---|---|
| Berberin för blodsocker, blodfetter och metabolism — `berberine` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Berberin: följ vald dosering och period; använd inte ett allmänt blodsockermål som bevis på effekt. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Multivitamin — `multivitamin_general` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Multivitamin: logga planerad användning eller mät specifika brister/näringsämnen; aldrig ett summerat vitamin-mg-mål. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Koenzym Q10 — `coq10` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | CoQ10: produktens aktiva substans kan loggas; energinivå är ett separat utfall. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| NAD+ — `cellular_energy_nad` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | NAD+, NMN, NR och niacin är olika substanser; summera dem inte till ett gemensamt NAD-mg-mål. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| L-Theanin för lugn fokus — `calm_alertness_ltheanine` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | L-theanin saknas i AminoAcidType; mät valt intag eller planerad användning, inte alfa-hjärnvågor. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| L-Tyrosin för mental prestanda — `neurotransmitter_ltyrosine` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Tyrosine-taggen finns, men kosttyrosin och specifikt tillskottsintag behöver skiljas om target gäller tillskott. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Echinacea för immunförsvar — `echinacea_herbs` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Echinacea: följ produkt, tidsperiod och vald användning; inte ett generellt dagligt mål för alla. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Kollagen för bindväv — `collagen` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kollagenintag kan loggas i gram om mängden finns; totalt protein verifierar inte kollagenintag. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Glutation för antioxidantskydd — `glutathione` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Glutation, NAC, glycin och glutamat kan inte summeras som samma substans eller direkt glutationstatus. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Shilajit för prestation — `shilajit_performance` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Shilajit: produkt/protokoll krävs; mineralantal eller totalt mineralintag verifierar inte användningen. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Lactobacillus reuteri — `lactobacillus_reuteri` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver specifik stam, produkt och CFU; generiska probiotics eller mg verifierar inte L. reuteri. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Mjölktistel för leverhälsa — `milk_thistle_liver` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt och standardiserat silymarininnehåll om dos ska mätas. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Ashwagandha — `ashwagandha_adaptogen` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt/extrakt och vald period; stressskattning är ett separat utfall. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Rhodiola — `rhodiola_adaptogen` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt/extrakt och vald period. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Helig basilika (Tulsi) — `holy_basil_adaptogen` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt/extrakt och valt användningsschema. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Reishi — `reishi_mushroom` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt och innehåll; gram svamp och gram extrakt är inte likvärdiga. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Lion's Mane — `lions_mane_mushroom` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt och innehåll; ett kognitionsmål ska inte utlovas av intagsloggen. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Chaga — `chaga_mushroom` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt och valt protokoll; inget generellt dagligt dosmål föreslås. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Cordyceps — `cordyceps_adaptogen` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver produkt och innehåll; uthållighetsmått hålls separat. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| L-karnitin och fetttransport — `l_carnitine_fat_transport` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Kräver rätt substans/form och produkt; en intagslogg mäter inte fetttransport. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Astaxantin för återhämtning — `astaxanthin_recovery_antioxidant` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Astaxantin och olika E-vitaminformer ska få separata substansmål, inte en gemensam antioxidantdos. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| Lutein och Zeaxantin för ögonhälsa — `lutein_zeaxanthin_eye_health` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | Lutein och zeaxantin behöver två separata taggar/mängder; inte ett generellt mått på ögonhälsa. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |
| MSM för ledhälsa — `msm_joint_health` | Antal planerade intag som faktiskt registrerats, eller mängd av rätt aktiv substans enligt ett uttryckligen valt upplägg. | MSM kräver egen substans/tagg. Ledbesvär kan följas separat; intag verifierar inte ledeffekt. Befintliga takenDates kan återanvändas, men behöver en riktig SupplementTarget-adapter för följsamhet. |

### E – behåll som kategori (6)

| Tips / id | Föreslaget mätbart mål | Vad krävs / begränsning |
|---|---|---|
| Andningsövningar — `breathwork_parasympathetic` | Inget eget nytt target i första versionen. | Sammanställ genomförda övningar från box_breathing, 4_7_8_breathing, alternate_nostril_breathing och diaphragmatic_breathing. |
| Sömnoptimering för återhämtning — `sleep_optimization_recovery` | Inget eget nytt target i första versionen. | Sammanställ sömnvaraktighet, rytm och rutiner; undvik dubbla targets/XP för samma logg. |
| Adaptogena örter — `adaptogenic_herbs` | Inget eget nytt target i första versionen. | Kategori med olika substanser; ett gemensamt mg- eller antal-mål blir missvisande. |
| Medicinalsvampar — `medicinal_mushrooms` | Inget eget nytt target i första versionen. | Kategori med olika produkter och extrakt; inget generellt totalmål. |
| Probiotika och tarmflora — `probiotics_microbiota` | Inget eget nytt target i första versionen. | Kategori med stamspecifika produkter; inget generellt gemensamt CFU-/mg-mål. |
| Sulfat — `sulfate` | Inget eget nytt target i första versionen. | Kategori; MSM-intag eller svavelrika livsmedel verifierar inte ett sulfatbehov eller avgiftning. |

## Prioritering

1. Börja med de 12 konkreta vanorna i grupp A. De kräver nya habit-nycklar, men kan använda befintlig registrering och daglig/veckovis summering. Prioritera andning, kvällsrutin och nedvarvning. Säkerställ att varje rutin mäter något separat.
2. Granska E-vitaminets substans-/produktmappning före ett target; befintlig tagg gör det tekniskt nära, men olika E-former är inte utbytbara.
3. Utöka målmodellen med högst/intervall/tidsfönster för lågkolhydratkost och fasta. Lägg därefter till specifika substansmål, med kreatin som en tydlig kandidat för ett uttryckligen valt upplägg.
4. Låt kategori-tipsen vara kategorier. Lägg eventuella framtida aggregat i kategorivyn och undvik dubbla rewards för samma beteende.
5. För de 23 övriga tillskottstipsen: välj i första hand loggning av följsamhet till en vald plan, utan att skapa universella rekommenderade doser. Om faktiskt utfall ska mätas behövs ett separat, lämpligt utfallsmått och tidsperiod.

## Källor för avgränsningen

- [NHLBI: Healthy Sleep Habits](https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits) stödjer regelbundna sovtider och sömnrutiner. De föreslagna check-/minutvärdena ovan är produktförslag, inte doser hämtade därifrån.
- [NIH ODS: Vitamin E – Health Professional](https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/) skiljer rekommenderat intag av alfa-tokoferol från andra E-former. Välj relevant referens och målgrupp vid implementering.
- [Australian Institute of Sport: Creatine](https://www.ais.gov.au/__data/assets/pdf_file/0013/1001380/Creatine-InfographicFINAL.pdf) beskriver kreatinupplägg som kan mätas som substansintag. Någon dos har inte införts här.
- [NCCIH: Using Dietary Supplements Wisely](https://www.nccih.nih.gov/health/using-dietary-supplements-wisely) beskriver variation i evidens, produkter och möjliga interaktioner. Därför skiljer denna rapport intags-/följsamhetsmål från påstådda biologiska effekter och föreslår inte standarddoser för alla tillskott.
