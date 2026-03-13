# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Serveur web asynchrone ESP8266 (Wemos D1 mini) pour la gestion et supervision d'une piscine. Communique avec un contrôleur ESP32 via protocole ICSC (série). Interface web REST + SSE. Logging sur carte SD.

## Commandes

### Firmware (PlatformIO)
```bash
# Compilation
~/.platformio/penv/bin/platformio run

# Upload firmware
~/.platformio/penv/bin/platformio run -t upload

# Upload filesystem LittleFS (après build Gulp)
~/.platformio/penv/bin/platformio run -t uploadfs

# Moniteur série (115200 baud, avec décodeur d'exceptions)
~/.platformio/penv/bin/platformio device monitor

# Nettoyage complet
~/.platformio/penv/bin/platformio run -t clean && rm -rf .pio
```

### Frontend (Gulp / Node.js)
```bash
# Installer les dépendances
npm install

# Build : minifie et gzippe HTML/CSS/JS → data/*.lgz
npx gulp

# Watch (rebuild automatique)
npx gulp watch
```

Le build Gulp lit depuis `html/` et écrit dans `data/` (fichiers `.lgz` = gzip). Le filesystem doit être re-uploadé après chaque modification du frontend.

## Architecture

### Flux principal
```
Browser → HTTP/SSE → AsyncWebServer (port 80)
                          ↓
                    PiscineWeb (routes, SSE, auth)
                          ↓
          PiscineWebActionControler (NTP, refresh)
                          ↓
          PiscineWebTelecom ←→ Contrôleur ESP32 (ICSC / Serial)
                          ↓
                    Logger → Carte SD (CSV horodaté)
```

### Modules source (`src/`)

| Fichier | Rôle |
|---|---|
| `maPiscinev3Web.cpp` | `setup()`/`loop()`, WiFi, NTP, SD, timers SimpleTimer |
| `PiscineWeb.cpp` | Routes API REST, SSE broadcast, authentification sessions |
| `PiscineWebActionControler.cpp` | Synchro NTP périodique, envoi heure au contrôleur |
| `PiscineWebTelecom.cpp` | Protocole ICSC, buffers lecture/écriture, callbacks réception |
| `logger.cpp` | Enregistrement CSV horodaté SD Card, fonctions print/printf |
| `ManagerTelecom.cpp` | **DÉSACTIVÉ** — ESP-NOW expérimental (exclu du build) |

`ManagerTelecom.cpp` est exclu via `build_src_filter` dans `platformio.ini`.

### Headers clés (`include/`)

- `globalPiscine.h` — Codes messages ICSC et constantes `IND_*` (partagées avec 2 autres projets)
- `globalPiscineWeb.h` — Constantes web, tailles buffers, externs des variables globales
- `globalStructs.h` — Structures de données (`piscineParametres`, `struct_configuration`, etc.)
- `IndexNames.h` — Noms des paramètres piscine en PROGMEM (optimisation RAM)
- `PiscineWebStrings.h` — Chaînes constantes en PROGMEM

### Timers (SimpleTimer dans la loop)

Les callbacks périodiques sont enregistrés dans `setup()` :
- `doCheckMessages()` → `webTelecom.OnUpdate()` (lecture ICSC)
- `doLogger()` → `logger.OnUpdate()` (écriture CSV SD)
- `doAction()` → `webAction.OnUpdate()` (synchro NTP)
- `doCheckWIFIConnection()` / `doCheckNTPDate()` — surveillance connectivité

### Endpoints API REST (côté serveur C++)

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/status` | GET | État complet piscine JSON |
| `/api/command` | POST | Envoi commande au contrôleur |
| `/api/logs` | GET | Logs SD Card |
| `/api/config` | GET/POST | Configuration système |
| `/api/wifi` | POST | Configuration WiFi |
| `/piscineEvents` | SSE | Données temps réel |
| `/piscineParamsEvents` | SSE | Paramètres temps réel |
| `/piscineDebugEvents` | SSE | Messages debug |

### Endpoints API REST (appelés depuis le JS client)

| Méthode | URL | Action |
|---|---|---|
| GET | `/checkLocalAuth` | Vérifie si auto-login local activé |
| POST | `/api/auth?action=logon` | Login |
| POST | `/api/auth?action=register` | Inscription nouvel utilisateur |
| POST | `/api/auth?action=changeAdmin` | Changement mot de passe admin |
| POST | `/api/auth?action=userProfile` | Mise à jour profil utilisateur |
| POST | `/api/auth?action=deleteUsers` | Suppression utilisateurs |
| POST | `/setPiscine?action=InitPagePrincipale` | Init page principale (déclenche SSE hello) |
| POST | `/setPiscine?action=Parametres` | Envoi commande (lampe, volet, PP, PAC…) |
| POST | `/setPiscine?action=getGraphDatas` | Données historiques CSV (plage dates) |

### Stockage

- **LittleFS** : fichiers web compressés (`data/html/*.lgz`) servis par AsyncWebServer
- **Carte SD** (pin D8, SPI, FAT32) : logs CSV dans `/log/YYYY/MM/DD/`
- **EEPROM** : config admin/user (adminPassword, user, password, wifi x3)
- **SD Card** : config JSON `piscine.cfg`

---

## Interface Web (Frontend)

### Architecture SPA

`html/main.html` est une **Single Page Application jQuery Mobile** — tout le HTML est dans un seul fichier, la navigation se fait via hash (`#pagePiscinePrincipale`, etc.). Le fichier est minifié, gzippé et renommé en `.lgz` par Gulp avant upload LittleFS.

### Pages jQuery Mobile

| ID page | Rôle |
|---|---|
| `#pageLogin` | Formulaire de connexion |
| `#pageRegisterLogin` | Inscription / ajout utilisateur (dialog) |
| `#pageChangeAdminPW` | Changement mot de passe admin (dialog) |
| `#pageUserProfile` | Profil utilisateur (dialog) |
| `#pageDeleteUser` | Suppression utilisateurs (dialog) |
| `#dlg-login` | Dialog de statut du processus login |
| `#dlg-EndSessionAlert` | Dialog session expirée (auto-redirect 10s) |
| `#pagePiscinePrincipale` | **Dashboard principal** |
| `#pagePiscineParametres` | **Configuration & plannings** |
| `#pagePiscineMaintenance` | **Calibration PH, Redox, sondes temp** |
| `#pagePiscineAlertes` | Alertes (en construction) |
| `#pagePiscineDebug` | Flux logs SSE en temps réel |
| `#pagePiscineGraphs` | Graphiques historiques (Dygraph) |
| `#leftpanel` | Panel menu navigation gauche |
| `#optionsPiscineManager` | Panel options droit (logoff, profil, users) |

Navigation par swipe gauche/droite via attributs `nextLeft`/`nextRight` sur chaque page (`swipPage.js`).

### Dashboard principal (`#pagePiscinePrincipale`)

- **8 LEDs d'état** : Lampe (orange), Volet (rose), P.P. (bleu), PAC (jaune), PH (vert), CL (cyan), P3 (violet), Auto (blanc)
- **Écran LCD simulé** : 3 lignes de texte, mode Alerte avec clignotement
- **3 jauges circulaires** (gauge.js) : PH (4–10.4), CL (0–2.4), Redox (500–900 mV) — tap sur zone pour basculer CL↔Redox
- **4 températures** : Air (rose), Eau (cyan), Int (vert), PAC (orange)
- **3 interrupteurs custom** : Lampe, Power (contrôle SSE), Volet

### Page Paramètres (`#pagePiscineParametres`)

Sections collapsibles :
- **Paramètres divers** : PAC via Router, Local Auto Login
- **Mode Manuel** : Mode Manuel + 5 pompes (PP, PAC, PmpPH, PmpCL, PmpALG)
- **Pompe Principale** : horaires start/stop (clockpicker)
- **Horaire PAC** : start/stop
- **Temperature PAC** : fixe ou relative (slider −20 à +20°C)
- **Lampe Automatique** : on/off + horaires
- **Volet Automatique** : on/off + horaires

### Page Maintenance (`#pagePiscineMaintenance`)

- **Calibration PH** : sélection étalon pH4/pH7/pH9, lecture mesure brute / référence / calculée, LEDs scan
- **Calibration Redox** : étalon Low/High, mesure brute / ajust / calculée
- **Sondes Température** : scan jusqu'à 3 sondes DS18B20, identification type, validation affectation

### Page Graphiques (`#pagePiscineGraphs`)

Graphiques Dygraph **responsive** avec 3 modes :
- **Mobile** (< 768px) : 1 graphe sélectionnable via `#graphSelector` (all / chemistry / temperature / equipment)
- **Tablette** (768–1023px) : 2 graphes synchronisés sélectionnables
- **Desktop** (≥ 1024px) : 3 graphes fixes synchronisés + sélecteurs d'axes multi-select

Graphes disponibles :

| Graphe | Axes Y1 | Axes Y2 |
|---|---|---|
| Chemistry | pH (3–10), Pompes (on/off) | Redox (150–1050 mV) |
| Temperature | Températures 0–55°C | — |
| Equipment | PP/PAC/Auto avec offset vertical | — |

**Données** : `POST /setPiscine?action=getGraphDatas` → CSV semicolon `DD/MM/YY HH:mm:ss;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto`
**Cache Map** par jour (clé `YYYY-MM-DD`) — seuls les jours manquants sont téléchargés.
**Debounce 300ms** sur les requêtes lors du scroll temporel.

### SSE — Données temps réel

Abonnement via `$.SSE('/piscineEvents')` (library `jquery.sse.min.js`).

| Event SSE | Champs JSON | Mise à jour UI |
|---|---|---|
| `piscineData` | `phVal` (×100), `redoxVal`, `clVal` (×100), `tempAir/Eau/Int/PAC` (×100), `lampe`, `volet`, `PP`, `PAC`, `PH`, `CL`, `P3`, `autoMode` (0/1) | Jauges, temperatures, LEDs, switches |
| `piscineLCDData` | `ligne1`, `ligne2`, `ligne3`, `Alerte` (presence) | Écran LCD simulé (clignotement si Alerte) |
| message `hello!` | — | Déclenche `InitPagePrincipale` POST |

### Authentification (client)

- **Session** : `localStorage` clé `maPiscine-session` → `{username, password, roles, sessionId, theExpirationDate, mainPage}`
- **Cookie** : `maPiscine` = sessionID (durée = TTL serveur en heures)
- **Auto-login local** : `GET /checkLocalAuth` au démarrage — si `autoLogin=true`, session 1 an sans saisie de mot de passe
- **Rôles** : Piscine, Arrosage, Chauffage, Lampes, Volets (checkboxes à l'inscription)
- **Validation formulaires** : jQuery Validate — username min 5 chars max 15, password min 5 max 10
- **Expiration** : vérifiée à chaque changement de page + alerte toast 5 min avant + dialog auto-redirect 10s

### Bibliothèques JS locales (`html/js/`)

| Fichier | Usage |
|---|---|
| `piscineScripts.js` | Script principal (auth, SSE, graphes, commandes) |
| `jquery.sse.min.js` | Client SSE basé jQuery |
| `gauge.js` | Jauges circulaires animées |
| `jquery-clockpicker.js` | Sélecteur d'heure circulaire |
| `moment.min.js` | Manipulation dates (requis par daterangepicker) |
| `daterangepicker.js` | Sélection plage de dates pour graphes |
| `swipPage.js` | Navigation swipe gauche/droite entre pages |
| `switch.js` | Composant interrupteur on/off CSS custom |
| `wow.min.js` | Animations CSS au scroll (WOW.js) |

### Bibliothèques CDN

- jQuery 1.11.3, jQuery Mobile 1.4.5, jQuery Validate 1.19.1
- dayjs + plugins (customParseFormat, localeData, isoWeek, arraySupport)
- PapaParse 5.4.1 (parsing CSV)
- Dygraphs 2.2.0 + synchronizer
- Material Design Iconic Font 2.2.0
- Font Awesome 5 (kit personnel `e8b296d778.js`)

### CSS (`html/css/`)

| Fichier | Usage |
|---|---|
| `mystyles.css` | Thème sombre principal, media queries responsive, classes couleur (`.vert`, `.cyan`, `.rose`…) |
| `switch.css` | Interrupteur custom (remplace les flip switch JQM) |
| `led.css` | LEDs d'état (8 couleurs : ledOrange, ledRose, ledBleu, ledJaune, ledVert, ledCyan, ledViolet, ledBlanc) |
| `gauge.css` | Jauges circulaires |
| `screen.css` | Écran LCD simulé |
| `jqm-fluid960.min.css` | Grille 960 fluide (grid_1..grid_12, prefix_*, suffix_*) |
| `wowanimate.css` | Animations WOW.js |
| `jquery-clockpicker.css` | Clockpicker |
| `daterangepicker.css` | Daterangepicker |
| `localAuth.css` | Styles formulaires auth |
| `404.css` | Page 404 |

### Responsive Design

| Breakpoint | Comportement |
|---|---|
| Mobile portrait (< 700px) | 1 graphe, layout compact |
| Tablette portrait (701–1100px) | Formulaires 2 colonnes, jauges ×1.1, 2 graphes |
| Desktop paysage (> 1100px) | max-width 1400px centré, panel 280px, 3 graphes |

### Build Gulp (`gulpfile.js`)

Pipeline `buildfs` (défaut) :
1. `clean` → vide `data/`
2. `files` → copie statiques : `html/*.{json,ico,png…}` → `data/html/`, `html/images/**` → `data/html/images/`, `cfg/**/*.cfg` → `data/cfg/`
3. `html` → `useref` (concatène CSS/JS selon commentaires `<!-- build:css -->` / `<!-- build:js -->`), minifie HTML/CSS/JS, gzip, renomme `.lgz` → `data/html/`

Variante `buildfs2` : `inline` au lieu de `useref` (tout le CSS/JS inliné dans le HTML).

Commentaires `<!-- build:css style.css -->…<!-- endbuild -->` et `<!-- build:js script.js -->…<!-- endbuild -->` dans `main.html` définissent les groupes Gulp.

### PWA (Progressive Web App)

- `html/manifest.json` : nom "Piscine Manager", short_name "Ma Piscine", display "fullscreen"
- Apple mobile web app capable, icône `images/maPiscine-apl.png`
- Icons : 192×192 et 512×512 dans `html/images/`
- Theme color : `#2f434e`

## Règles de Développement

### CRITIQUE — Synchronisation `IND_*`
Les constantes `IND_*` dans `globalPiscine.h` sont **partagées entre 3 projets** :
- `maPiscinev4Controler-ESP32`
- `maPiscinev4.5Clavier-d1_mini`
- `maPiscinev4.5Web-d1_mini` (ce projet)

Toute modification d'un `IND_*` nécessite la recompilation et l'upload des 3 firmwares.

### Logging
Format standard : `[SOURCE] message` (voir `LOGS_STANDARDS.md`)
- Préfixes : `[SYSTEM]`, `[RAM]`, `[WIFI]`, `[MDNS]`, `[WEB]`, `[AUTH]`, `[TELECOM]`, `[LOGGER]`, `[SD]`
- Warnings : `⚠️ ALERTE :` — Erreurs : `❌ ERREUR :`
- Ne jamais ajouter `[INFO]` (implicite par défaut)
- Logger s'appelle via l'objet global `logger` (instance `LoggerClass`)

### Optimisation RAM (ESP8266 ~80KB RAM)
- Toujours utiliser `PROGMEM` pour les chaînes constantes
- Vérifier `cardPresent` avant toute opération SD
- Surveiller la heap libre aux 5 points de monitoring RAM (voir `LOGS_STANDARDS.md`)
- `ManagerTelecom.cpp` est exclu du build pour économiser la RAM

### Asynchrone
- Ne jamais appeler `delay()` dans les callbacks HTTP AsyncWebServer
- Utiliser `request->send()` pour envoyer les réponses
- Les SSE sont poussés depuis `OnUpdate()` via `sendNewParamsPiscine()`

### Style de code
- Français pour les commentaires et logs
- camelCase pour les variables, PascalCase pour les classes (suffixe `Class`)
- UPPER_CASE pour les constantes
- En-tête doxygen sur chaque fichier `.h`/`.cpp` (`@brief`, `@author`, `@date`)
- Commentaire `@brief` sur chaque fonction

### Mémoire Flash
Configuration actuelle : `eagle.flash.4m1m.ld` → 3 Mo code / 1 Mo LittleFS.
Options dans `platformio.ini` (commentées) pour d'autres répartitions.
