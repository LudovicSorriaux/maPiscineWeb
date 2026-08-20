# Documentation technique — maPiscinev4.5Web-d1_mini

> Document de référence pour un développeur reprenant ce projet. Rédigé à partir d'une lecture intégrale du code source actuel (`src/*.cpp`, `include/*.h`, `html/js/*.js`, `html/main.html`). Les nombreux fichiers `.md` historiques présents à la racine (README.md, AUTOLOGIN_LOCAL_README.md, RESUME_IMPLEMENTATION.md, CHANGELOG_DYGRAPH_REFACTORING.md, IMPLEMENTATION_MULTIGRAPHS.md, etc.) sont des rapports d'implémentation ponctuels, potentiellement obsolètes : ils n'ont **pas** été utilisés comme source de vérité ici, seul le code fait foi. Voir aussi `TOCHECK.md` pour les zones d'ombre à valider.

## 1. Rôle du module dans le système global

`maPiscinev4.5Web-d1_mini` est la **passerelle web** de l'installation piscine. Il tourne sur un **Wemos D1 mini (ESP8266)** distinct du contrôleur principal :

```
Navigateur utilisateur  ◄──HTTP/REST + SSE──►  ESP8266 "Web" (ce projet)  ◄──UART/ICSC──►  ESP32 "Contrôleur" (maPiscinev4Controler-ESP32)
```

- Le **contrôleur ESP32** (projet séparé) porte toute la logique métier (régulation pH/redox, pompes, alertes, plages horaires) et est la source de vérité des paramètres.
- Ce module **ESP8266** :
  - sert l'interface web (fichiers statiques compilés depuis `html/` vers `data/` via Gulp, stockés en LittleFS),
  - expose une API REST + un flux SSE (`/piscineEvents`) pour piloter/superviser en temps réel depuis un navigateur,
  - relaie les commandes utilisateur vers le contrôleur et les données du contrôleur vers le navigateur, via le protocole série **ICSC** (`lib/ICSC-Telecom/`),
  - journalise les données (température, pH, redox, chlore, états pompes) sur **carte SD**, avec un tampon d'écriture sur **LittleFS** pour absorber les indisponibilités de la carte,
  - gère l'authentification web (sessions, mots de passe hashés, auto-login local),
  - assure la connexion WiFi (reconnexion auto, portail captif `WiFiManager` en secours), NTP et le mDNS (`mapiscine.local`).

Il n'existe **aucune logique de régulation** dans ce projet : température, pH, chlore, pompes, alertes sont *affichés et pilotés à distance*, jamais calculés ici.

## 2. Build & environnement PlatformIO

### 2.1 `platformio.ini`

```ini
[env:d1_mini]
platform = espressif8266
board = d1_mini
framework = arduino
monitor_speed = 115200
board_build.filesystem = littlefs
board_build.ldscript = eagle.flash.4m1m.ld   ; 3 Mo code / 1 Mo LittleFS
extra_scripts = pio-gulp.py
```

Dépendances (`lib_deps`) : `tzapu/WiFiManager@^2.0.17` (portail captif — **pas** `alanswx/ESPAsyncWiFiManager`, commentée/abandonnée), `bblanchon/ArduinoJson@^7.3.0`, `me-no-dev/ESP Async WebServer@^1.2.3`, `arduino-libraries/NTPClient@^3.2.1`, `paulstoffregen/Time@^1.6.1`. Build réel observé (`pio run`) : ArduinoJson 7.4.3, ESP Async WebServer 1.2.4.

Bibliothèque locale `lib/ICSC-Telecom/` (protocole série maison, partagé avec le contrôleur ESP32 et le clavier).

Résultat d'un `pio run` propre (référence, sans modification du code) :
```
RAM:   61.1% (50036 / 81920 bytes)
Flash: 55.7% (582255 / 1044464 bytes)
```

### 2.2 Partitionnement flash

Le partitionnement (`board_build.ldscript`) est choisi par commentaire/décommentage manuel dans `platformio.ini` — actuellement `eagle.flash.4m1m.ld` (3 Mo code / 1 Mo LittleFS). D'autres profils sont documentés en commentaire pour un usage avec carte SD (fichiers web plus volumineux) ou avec OTA (non utilisé ici).

### 2.3 Build du frontend (Gulp)

Sources dans `html/`, sortie dans `data/` (image LittleFS) :

- `gulp buildfs` = `clean` + `files` (copie images/JSON/cfg vers `data/html` et `data/cfg`) + `inline` (inline CSS/JS dans le HTML, minifie, gzippe, renomme en `.lgz`, sortie `data/html/main.html.lgz`).
- `pio-gulp.py` (`extra_scripts`) exécute automatiquement `npx gulp buildfs` **avant la construction de l'image LittleFS** (`AddPreAction` sur `$BUILD_DIR/littlefs.bin`) — donc `pio run -t uploadfs` régénère toujours les assets web à jour. **Attention** : un simple `pio run` (firmware seul) ne déclenche pas ce hook (il n'est attaché qu'à la cible littlefs), donc le firmware peut compiler sans qu'aucune vérification ne soit faite sur les assets web.
- `npm run build` / `npm run watch` disponibles via `package.json` (dépendances gulp : `gulp-htmlmin`, `gulp-clean-css`, `gulp-uglify`, `gulp-gzip`, `gulp-inline`, `gulp-useref`...).
- Procédure de déploiement alternative documentée dans `.copilot-upload-procedure.md` (à la racine, hors périmètre de ce document mais utile) : upload individuel des `.lgz` via `curl -X POST -F "file=@..." -F "adminPassword=manager" -F "path=/html" http://mapiscine.local/upload`, en s'appuyant sur la route `/upload` protégée par mot de passe admin (voir §4.7). Le fichier précise explicitement que `gulp upload` ne fonctionne pas pour ce projet.

### 2.4 CI (`.github/workflows/build.yml`)

Workflow minimal déclenché sur `push`/`pull_request` :
```yaml
- uses: actions/setup-python@v5
- run: pip install --upgrade platformio
- run: pio run
```
Il ne fait que compiler le firmware (`pio run`, cible par défaut = build seul). **Il ne construit ni ne vérifie les assets web** (pas d'appel Node/npm/gulp, pas de `pio run -t uploadfs`) — une régression dans `html/js/*.js` ou `html/main.html` ne casse donc jamais la CI.

## 3. Architecture logicielle

| Fichier | Rôle |
|---|---|
| `src/maPiscineWeb.cpp` (1468 lignes) | `setup()`/`loop()`, gestion WiFi (connexion directe → SSID stockés → portail captif), NTP + DST France, config JSON/LittleFS, SimpleTimer (tous les callbacks périodiques) |
| `src/PiscineWeb.cpp` (3415 lignes) + `include/PiscineWeb.h` | Classe `PiscineWebClass` : serveur `AsyncWebServer`, toutes les routes HTTP/API, SSE, sessions, mots de passe, upload de fichiers |
| `src/PiscineWebTelecom.cpp` (537 lignes) + `.h` | Classe `PiscineWebTelecomClass` : encapsulation du protocole ICSC (émission/réception vers le contrôleur ESP32) |
| `src/PiscineWebActionControler.cpp` (208 lignes) + `.h` | Classe `PiscineWebActionControlerClass` : couche applicative entre le buffer ICSC brut et `piscineParams[]`, synchro NTP → contrôleur |
| `src/logger.cpp` (744 lignes) + `include/Logger.h` | Classe `LoggerClass` : journalisation CSV horodatée, tampon LittleFS → flush SD, API "chunking" anti-watchdog pour les graphiques |
| `src/PiscineWifiPortal.cpp` + `.h` | Portail captif `WiFiManager` (tzapu), utilisé en dernier recours |
| `include/globalPiscine.h` | Constantes partagées avec les autres projets (contrôleur, clavier) : codes messages ICSC génériques, IDs systèmes, structures `struct_configuration`, `dataStruct`, `struct_Etalon_Data`, `struct_Tampons` |
| `include/globalPiscineWeb.h` | Constantes spécifiques web : table des index `IND_*` (paramètres piscine), macros utilitaires |
| `include/IndexNames.h` | Table PROGMEM des 84 noms de paramètres (`IND_*` → chaîne), utilisée pour sérialiser le JSON SSE sans consommer de RAM |

### 3.1 Boucle principale (`maPiscineWeb.cpp`, `SimpleTimer`)

| Timer | Période | Callback | Rôle |
|---|---|---|---|
| `timerWIFI_OK` | 1 h | `doCheckWIFIConnection` | Vérifie la connexion WiFi (état connecté) |
| `timerWIFI_NOK` | 1 s | `doCheckWIFIConnection` | Retente la connexion WiFi (état déconnecté) |
| `timerNTP_OK` | 1 h | `doCheckNTPDate` | Resynchro NTP périodique |
| `timerNTP_NOK` | 15 s | `doCheckNTPDate` | Retente NTP (minimum autorisé par pool.ntp.org) |
| `timerWebTelecom` | 100 ms | `doCheckMessages` → `webTelecom.OnUpdate()` | Traite les messages ICSC entrants/sortants |
| `timerWebAction` | 200 ms | `doAction` → `webAction.OnUpdate()` | Synchro NTP↔contrôleur, push params web→contrôleur |
| `timerSendWebParams` | 500 ms | `doSendWebParams` → `maPiscineWeb.OnUpdate()` | Pousse les paramètres modifiés vers les clients SSE |
| `timerWebLCD` | 10 s | `doUpdatePiscineLCD` | Rafraîchit l'affichage LCD virtuel (SSE) |
| `timerLogger` | 60 s | `doLogger` → `logger.OnUpdate()` | Cycle de journalisation |
| `timerFlush` | 15 min | `doFlushLogs` → `logger.flushLogsToSD()` | Vide les tampons LittleFS vers la carte SD |
| `timerHeartbeat` | 30 s | `doHeartbeat` → `maPiscineWeb.sendHeartbeat()` | Ping SSE (maintien des connexions proxy) |

Ordre de démarrage (`setup()`) : Serial, GPIO, `webTelecom.initTelecom()`, `webAction.initializePiscineParams()`, montage LittleFS (avec un `begin()+end()` "à vide" documenté comme nécessaire empiriquement *avant* `SD.begin()`, sinon la SD échoue à s'initialiser), `startSD()` (3 tentatives), remontage LittleFS définitif, `loadConfiguration()` (lit `/cfg/piscine.cfg`), démarrage WiFi (bloquant jusqu'à connexion ou passage en mode dégradé), NTP (10 tentatives), `maPiscineWeb.startup()`.

### 3.2 Connexion WiFi (`startWiFi()`)

Séquence en cascade :
1. `WiFiConnect(nullptr, nullptr)` — reconnexion au dernier réseau utilisé (`WiFi.begin()` sans paramètres, credentials en cache ESP8266).
2. `ConnectWithStoredCredentials()` — scan des réseaux visibles, tente uniquement les SSID présents dans `config.wifi[]` (max `MAX_WIFI=3`) *et* détectés par le scan.
3. `useWiFiManager()` (`PiscineWifiPortal.cpp`) — portail captif `WiFiManager` (AP `Piscine_Config_AP`), timeout de config **180 s**, sauvegarde automatique des nouveaux credentials via `saveNewConfiguration()`.

Chaque tentative pilote une LED d'état via `IND_BlinkWifiLed` (0=off, 1=on, -1=blink 3×, -2=blink rapide, -3=blink lent) transmis au contrôleur par ICSC (c'est le contrôleur/clavier qui pilote physiquement la LED, pas ce module).

## 4. Serveur web (`PiscineWeb.cpp` / `PiscineWeb.h`)

### 4.1 Routes HTTP/API enregistrées (`startServer()`)

| Méthode | Chemin | Handler | Rôle |
|---|---|---|---|
| ANY | `/` | `handleRoot` | Sert `/html/main.html` (LittleFS), 404 sinon |
| ANY | `/jsonConfig` | `showJsonConfig` | Debug — dump JSON config (admin/users/wifi, y compris hash mots de passe), protégé par session |
| GET | `/checkLocalAuth` | `handleCheckLocalAuth` | Auto-login local + validation de session existante |
| GET | `/api/info` | `handleApiInfo` | `{"version": "v4.5.6"}` |
| POST | `/api/auth` | dispatcher sur paramètre `action` | `logon`→login, `register`, `changeAdmin`, `userProfile`, `getUsers`, `deleteUsers` |
| POST | `/setPiscine` | dispatcher sur paramètre `action` | `InitPagePrincipale`, `InitPageParams`, `Parametres`, `Debug`, `Maintenance`, `InitMaintenance`, `SetDateTime`, `setActivePage` |
| POST | `/setRouteurInfo` | `handleRouteurInfo` | Transmet au contrôleur l'état de pilotage PAC via le routeur solaire |
| POST | `/api/graph/plan` | `handleGraphPlan` | Étape 1 du système graphique "chunké" |
| GET | `/api/graph/file-info` | `handleGraphFileInfo` | Étape 2 |
| GET | `/api/graph/chunk` | `handleGraphChunk` | Étape 3 |
| GET/POST | `/upload` | page HTML + `handleFileUpload` | Upload de fichiers vers la **carte SD**, protégé par `adminPassword` |
| GET | `/listdir` | lambda | Liste un répertoire SD, protégé par `adminPassword` + `path` |
| notFound | * | `handleOtherFiles` | Sert un fichier statique LittleFS quelconque, 404 sinon |
| static | `/images/*`, `/*` | `serveStatic` LittleFS `/html` | Cache-Control 24h |
| SSE | `/piscineEvents` | `AsyncEventSource` | Flux unique (voir §4.5) |

Anciennes routes dédiées (`/logon`, `/register`, `/setPiscinePagePrincip`, etc.) et trois flux SSE additionnels (`piscineParamsEvents`, `piscineDebugEvents`, `piscineMaintenanceEvents`) existent encore **en commentaire** dans le code — remplacés par les dispatchers `action=` et le flux unique `piscineEvents`. Code mort inoffensif (non exécuté).

### 4.2 Authentification et sessions

- Pas de cookie HTTP posé par le serveur (`Set-Cookie` absent). L'authentification repose sur un paramètre `sess` transmis à **chaque requête protégée** (POST body ou query string), vérifié par `checkSessionParam()` / `isSessionValid()`.
- `activeSessions[10]` (tableau fixe, `include/PiscineWeb.h`) : `sessID` (15 caractères alphanumériques + `\0`), `ttl` (secondes), `timecreated` (epoch). Persisté sur **carte SD** dans `/sessions.json` (pas LittleFS), rechargé au boot (`loadSessionsFromSD`), limite de lecture 2048 octets.
- TTL exacts selon le contexte (`handleLogin`) :
  - client local + `enableLocalAutoLogin` actif : **365 jours**
  - client local sans auto-login : **30 jours**
  - client distant, case "rester connecté" cochée : **24 h**
  - client distant standard : **1 h**
- `generateKey()` : purge d'abord les sessions expirées, cherche un slot libre. Si les 10 slots sont occupés : éviction en priorité d'une session à TTL ≥ 1 an (les sessions "auto-login local", supposées nombreuses et longue durée), sinon éviction de la session la plus ancienne toutes durées confondues.
- Pas de renouvellement de TTL à l'usage (pas de session glissante) : une session dure exactement son TTL initial depuis sa création.

### 4.3 Auto-login local (`/checkLocalAuth`)

Détection "client local" (`isLocalClient()`) — comparaison du sous-réseau, avec prise en charge d'un reverse-proxy :

```cpp
bool PiscineWebClass::isLocalClient(AsyncWebServerRequest *request) {
    IPAddress clientIP;
    if (request->hasHeader("X-Forwarded-For")) {
        // prend la 1ère IP de la liste (client réel derrière le proxy)
        ...
    } else {
        clientIP = request->client()->remoteIP();
    }
    IPAddress serverIP = WiFi.localIP();
    IPAddress subnet = WiFi.subnetMask();
    for (int i = 0; i < 4; i++) {
        if ((clientIP[i] & subnet[i]) != (serverIP[i] & subnet[i])) return false;
    }
    return true;
}
```
Si le client passe par le reverse-proxy WAN (architecture OCI+Pi mentionnée dans la mémoire du projet), l'IP réelle transmise en `X-Forwarded-For` est distante → comparaison de sous-réseau échoue naturellement → traité comme non local. C'est le mécanisme qui distingue accès LAN (auto-login) et accès WAN (login requis).

`handleCheckLocalAuth` (`GET /checkLocalAuth[?sess=X]`) :
1. Si un `sess` valide est fourni → retourne `sessionValid:true` **sans régénérer de session** (évite de saturer les 10 slots à chaque rechargement de page).
2. Sinon, si client local **et** `config.enableLocalAutoLogin` (paramètre configurable, stocké dans `/cfg/piscine.cfg`) → nouvelle session `username="local_user"`, TTL 1 an, `autoLogin:true`.
3. Sinon → `sessionValid:false`, le frontend redirige vers la page de login.

Côté frontend, ce flux est piloté par `html/js/piscineScripts.js` (`checkLocalAuthOnStartup()`, appelée au chargement de la page) — voir §7.1.

### 4.4 Mots de passe

- Format stocké : `SSSSSSSS:HHHH...H` — 8 caractères hex de sel + `:` + 64 caractères hex SHA-256 (buffer `MAX_PW_HASH_SIZE=74`).
- `_hashPassword()` : sel pseudo-aléatoire 32 bits (`micros() ^ (random()<<8) ^ (millis()<<16)`), SHA-256 via BearSSL sur `sel+motdepasse`.
- `_checkPassword()` : si le stocké fait 73 caractères avec `:` en position 8 → recalcule et compare le hash ; sinon → comparaison directe en clair (`strcmp`), pour compatibilité ascendante avec d'anciens mots de passe non migrés.
- `_migratePasswords()` : appelée au démarrage (`startup()`), hash tout mot de passe (admin + jusqu'à 5 utilisateurs) qui n'est pas déjà au format hashé, puis sauvegarde si changement.
- Tous les handlers de gestion de mot de passe (`handleRegister`, `handleChangAdminPW`, `handleUserProfile`) hashent systématiquement via `_hashPassword()`, et toutes les comparaisons de mot de passe admin (`handleDeleteUsers`, `/upload`, `/listdir`) passent par `_checkPassword()`. `handleUserProfile` exige en plus une session valide et le mot de passe admin avant tout changement.

### 4.5 SSE (`/piscineEvents`)

Flux unique, événements poussés :

| Event SSE | Contenu | Déclencheur |
|---|---|---|
| `piscineData` | Paramètres page principale (`piscinePPSet` : temp., pH, redox, CL, pompes, mode auto, alerte) | `sendNewParamsPiscine()`, via `OnUpdate()` (boucle timer 500 ms) |
| `piscineParamsData` | Paramètres page paramètres (`piscineParamsSet` : plages horaires, seuils, alertes inversées...) + `localAutoLogin` | idem |
| `piscineLCDData` | Lignes d'affichage LCD virtuel (`ligne1/2/3`) | `OnUpdatePiscineLCD()` (10 s) |
| `piscineLCDDebug` | Messages debug (`lignes`) | idem, mode debug actif |
| `piscineMaintenance` | Données étalonnage pH/Redox, tampons | `setEtalonData()` / `sendCachedTampon()` (réception ICSC `'E'`/`'G'`) |
| `heartbeat` | `"ping"` | `sendHeartbeat()`, toutes les 30 s |

Un envoi **complet** de `piscineData`/`piscineParamsData` a lieu tous les ~20 appels d'`OnUpdate()` (`nbAppels`, soit ~10 s à 500 ms/appel) ; entre-temps, seuls les paramètres marqués `changedControler=true` sont poussés (delta). Reconnexion client : message `"hello! PiscineEvents Ready"`, `reconnect: 10000` (ms).

### 4.6 Système d'alertes côté web

`IND_Alerte` (index 1) est un **vrai bitmask 7 bits** (bit1 inondation, bit2 flux, bit3 PAC, bit4 pH vide, bit5 CL vide, bit6 ALG vide, bit7 filtration trop courte ; valeur = OR des bits actifs, 0 = pas d'alerte), envoyé tel quel par le contrôleur.

Ce module **ne fait aucun décodage/traitement** de cette valeur : elle est reçue du contrôleur via ICSC et retransmise telle quelle en SSE (`piscineData.Alerte`). Tout le décodage bitmask→message et la logique d'acquittement (ACK) sont côté **frontend JS** (voir §7.3, `updateAlertBanner()` dans `piscinePrincipale.js`, qui décode bien le vrai bitmask) et côté **contrôleur** (hors périmètre). `IND_ClearAlert` (52) est traité comme un paramètre générique : positionné par le frontend, transmis au contrôleur via le mécanisme `changedWeb` standard (aucune logique métier d'acquittement ici).

### 4.7 Fichiers statiques et upload

- **Fichiers web statiques → LittleFS** (`handleFileRead`, préfixe `/html`) : cherche d'abord `<chemin>.lgz` (gzip pré-compressé par Gulp), sinon sert le fichier brut. `Cache-Control: max-age=86400`.
- **Upload / listing de répertoire → carte SD** (`handleFileUpload`, `/upload`, `/listdir`), protégés par le paramètre `adminPassword` comparé via `_checkPassword()`.
- 404 : tente `/404.html` (LittleFS) puis fallback sur une page HTML embarquée en PROGMEM dans le firmware si absente.

## 5. Protocole ICSC côté web

### 5.1 Principe

Bibliothèque `lib/ICSC-Telecom/ICSC.h` : protocole série point-multipoint, trame délimitée SOH/STX/ETX/EOT avec adresse destination/source, une commande (1 caractère), une longueur et un checksum. `MAX_MESSAGE=250` (taille max buffer réception), `MAX_COMMANDS=10` callbacks enregistrables.

Ce module s'enregistre en tant que station **`'W'`** (Web) : `telecom.begin(Serial, 'W')`. Toutes les émissions ciblent la station **`'C'`** (Contrôleur ESP32) : `telecom.send('C', commande, longueur, données)`. Pas de relation maître/esclave stricte au sens ICSC, mais le contrôleur reste la source de vérité (le web ne fait que refléter/pousser).

### 5.2 Commandes (caractères) utilisées

| Cmd | Sens | Rôle |
|---|---|---|
| `V` | bidirectionnel | Valeur unitaire `dataStruct{index, destination, value}` |
| `T` | W→C | Horodatage (heure NTP, envoi binaire `time_t`) |
| `S` | bidirectionnel | Synchro en masse de `piscineParams[]` (types `'C'`=critique, `'W'`=web, `'F'`=full) |
| `H` | bidirectionnel | Hello / détection de présence |
| `A`/`B` | C→W / W→C | Demande / affectation des adresses de sondes DS18B20 |
| `E` | bidirectionnel | `struct_Etalon_Data` (étalonnage pH/Redox en cours) |
| `G` | bidirectionnel | `struct_Tampons` / `struct_SetTampon` (solutions tampons de calibration) |
| `R`/`C`/`D` | W→C | Statut/données routeur solaire (pilotage PAC via routeur) |

### 5.3 Structure de commande générique

```cpp
typedef struct data_t {
    uint8_t index;
    uint8_t destination;   // jamais renseigné côté web (voir TOCHECK.md)
    int16_t value;
} dataStruct;
```
Envoyée en binaire brut (`memcpy`, `sizeof(dataStruct)`) sur la commande `V`.

### 5.4 Table des index `IND_*` (extraits — voir `include/globalPiscineWeb.h` et `include/IndexNames.h` pour la liste complète des 56 index persistants + 27 index "info")

| Index | Nom | Sens | Usage |
|---|---|---|---|
| 1 | `Alerte` | C→W | Bitmask/énuméré d'alerte (§4.6) |
| 2-5 | `tempEau/tempAir/tempPAC/tempInt` | C→W | Températures |
| 6-8 | `phVal/redoxVal/clVal` | C→W | Mesures qualité d'eau |
| 13-17 | `PH/CL/P3/PP/PAC` | C→W | États pompes/relais |
| 18 | `autoMode` | C→W | Mode automatique |
| 30-42 | `strtTPP/stopTPP/...` | W↔C | Plages horaires (pompe principale, lampe, volet, PAC) |
| 45-51 | `dose_PH/dose_CL/.../debitPompe_*` | W↔C | Coefficients dosage/débit |
| 52 | `ClearAlert` | W→C | Acquittement alerte (paramètre générique, pas de logique métier ici) |
| 53 | `volumePiscine` | W↔C | Volume piscine (calcul de dosage) |
| 55 | `Set Debug` | C→W | Bascule mode debug web |
| 56 | `pacAutonome` | — | Défini mais **absent de toute logique** dans les fichiers analysés (voir `TOCHECK.md`) |
| 60 | `WifiStatus` | C→W (demande) puis W→C (réponse) | Piloté par `processAction()` |
| 61 | `EPOCH` | C→W (demande) puis W→C (réponse) | Le web répond avec l'heure si NTP synchronisé |
| 82 | `BlinkWifiLed` | W→C | État LED WiFi (0 off / 1 on / -1..-3 clignotements) |

Seuls `IND_EPOCH` et `IND_WifiStatus` déclenchent une **action logique immédiate** côté web (`processAction()`) plutôt qu'un simple stockage dans `piscineParams[]`.

### 5.5 Flux de synchronisation

- `sendWebValuesToControler()` (`PiscineWebActionControlerClass::OnUpdate()`, cadencé par `timerWebAction` = 200 ms) : parcourt `piscineParams[0..IND_MAX_PISCINE-1]`, pousse chaque paramètre `changedWeb==true` via `setWriteData()`.
- `setWriteData()` empile dans `writeData[MAX_WRITE_DATA=20]` ; `PiscineWebTelecomClass::OnUpdate()` (cadencé par `timerWebTelecom` = 100 ms) vide la pile en LIFO, avec déduplication (si deux entrées consécutives ont le même index, seule la plus récente est envoyée).
- Resynchronisation complète : toutes les **1 heure** (`TimeToSynch = 60*60*1000` ms), `refreshData()` demande une synchro critique (`sendAskSyncMess('C')`).
- Détection de présence contrôleur (`isControleurPresent()`) : `sendHelloMess()` relancé périodiquement tant que le contrôleur n'a pas répondu.

### 5.6 Étalonnage pH/Redox (page Maintenance)

- `struct_Etalon_Data` (44 octets) : `mesure`, `ajust`, `calculated` (float), `action[15]`, `PHRedox[10]` ("PH"/"Redox"), `type[7]`. Reçu du contrôleur (`'E'`) → poussé en SSE `piscineMaintenance`.
- `struct_Tampons` (20 octets, défauts PH4=4.0/PH7=7.0/PH9=9.0/RLow=468.0/RHigh=650.0) : cache local (`cachedTampons`) rempli après demande explicite (`sendGetTampons()`, commande `'G'` payload vide).
- `struct_SetTampon` (21 octets) : écriture d'une nouvelle valeur de tampon (même commande `'G'`, payload non-vide — la longueur du message distingue lecture/écriture côté contrôleur).
- Adresses sondes DS18B20 : jusqu'à 6 adresses sur 8 octets + 1 octet optionnel `foundMask` (rétrocompatibilité ancien firmware si absent).

## 6. Gestion des paramètres piscine (`piscineParams[]`)

`piscineParametres piscineParams[IND_MAX_PISCINE+1]` (`include/globalPiscine.h`) — tableau global, un élément par index :
```cpp
typedef struct piscineParametres {
    int16_t valeur;
    bool changedWeb = false;       // modifié par l'utilisateur web, à transmettre au contrôleur
    bool changedControler = false; // modifié par le contrôleur, à transmettre aux clients SSE
} struct_piscineParams;
```
Ce double flag (`changedWeb`/`changedControler`) est le mécanisme central de synchronisation bidirectionnelle : chaque camp (web ou contrôleur) marque ses propres changements, l'autre camp les consomme et réinitialise le flag. Toute valeur numérique décimale (température, pH, chlore) est stockée en **centièmes** (`int16_t`, divisée par 100 à l'affichage/logging).

## 7. Frontend web (`html/`)

Application "single page" jQuery Mobile 1.4.5, une seule page `main.html` contenant toutes les pages internes (`data-role="page"`), navigation par changement de page JS (`$.mobile.changePage`) — `$.mobile.ajaxEnabled = false` car tout le DOM est déjà chargé au départ. Scripts métier chargés dans cet ordre (`main.html`) : `piscineUsers.js`, `piscinePrincipale.js`, `piscineParametres.js`, `piscineDebug.js`, `piscineMaintenance.js`, `piscineGraphs.js`, `piscineScripts.js` (ce dernier contient l'init globale et l'auto-login, exécutée en dernier).

### 7.1 Page de login et auto-login local

Le fichier actif est **`piscineScripts.js`** (fonctions `checkLocalAuthOnStartup()`, `checkExistingSessionOrAutoLogin()`, `checkSessionValidity()`, `showToast()`).

Flux exact au chargement de `main.html` :
1. `checkLocalAuthOnStartup()` (appelée en bas du fichier, hors tout `$(document).ready`) lit la session éventuellement en cache (`localStorage["maPiscine-session"]`) et l'ajoute en paramètre `sess` de l'appel.
2. `GET /checkLocalAuth?sess=<sessID>` (ou sans `sess`).
3. Trois branches selon la réponse serveur :
   - `autoLogin === true` → construit un objet `loginData` factice et appelle `onSuccess()` (la même fonction utilisée après un login manuel classique, définie dans `piscineUsers.js`) → session créée côté client, redirection page principale.
   - `sessionValid === true` → restaure les variables globales + cookie, redirige directement.
   - sinon → nettoie `localStorage`/cookie, affiche `#pageLogin`.
4. En cas d'échec réseau, fallback offline sur le cache local si non expiré.

Le paramètre serveur `enableLocalAutoLogin` est piloté depuis la page Paramètres (switch `#localAutoLoginSWitch`, `POST /setPiscine?action=Parametres&param=localAutoLogin&val=0|1`).

### 7.2 Écran principal (`piscinePrincipale.js`)

- **Jauges** (lib `gauge.js`) : pH (4 à 10.4, centré 7.2), Redox (500 à 900 mV, centré 700), Chlore (0 à 2.4, centré 1.2), avec seuils couleur rouge/orange/vert codés en dur. Un tap sur la zone bascule l'affichage entre jauge Chlore et jauge Redox (une seule visible à la fois).
- **Températures** : 4 champs (`tempAir`, `tempEau`, `tempInt`, `tempPAC`).
- **États pompes/relais** : LEDs CSS (classes `ledOn`/`ledOff`) pour Lampe, Volet, Pompe Principale, PAC, PH, CL, P3, mode Auto.
- **SSE** : client `jquery.sse.min.js` sur `/piscineEvents`, deux gestionnaires nommés `piscineData` → `piscineDataServer()` et `piscineLCDData` → `piscineDataLCDServer()` (simulation de l'écran OLED du contrôleur, 3 lignes + mode clignotant si alerte active). Le message spécial `"hello!"` envoyé à la connexion SSE déclenche un `POST /setPiscine?action=InitPagePrincipale` pour forcer un premier état complet. SSE démarré/arrêté sur `pagebeforeshow`/`pagebeforehide` de la page.
- Chaque réception SSE vérifie d'abord `expirationDate` (session) avant de traiter les données ; si expirée, ouvre le dialog de fin de session au lieu d'afficher les données.

### 7.3 Système d'alertes frontend

Bandeau `#alertBanner` + `#alertBannerText` + bouton `#alertBannerAck`, présent uniquement sur la page principale. Décodage bitmask **côté client** (`piscinePrincipale.js`) :

```js
var ALERT_LABELS = ["Inondation", "Absence de flux d'eau", "Problème PAC", "Plus de pH+",
                     "Plus de chlore", "Plus de produit pompe 3", "Fenêtre de filtration trop courte"];

function updateAlertBanner(valAlert){
    if(!valAlert || valAlert === 0){ $('#alertBanner').fadeOut(200); return; }
    var messages = [];
    for(var bit = 0; bit < ALERT_LABELS.length; bit++){
        if(valAlert & (1 << bit)){ messages.push(ALERT_LABELS[bit]); }
    }
    $('#alertBannerText').text('ALERTE : ' + messages.join(' — '));
    $('#alertBannerAck').show();
    $('#alertBanner').fadeIn(200);
}
```

Mapping bit→libellé : bit0=Inondation, bit1=Absence de flux d'eau, bit2=Problème PAC, bit3=Plus de pH+, bit4=Plus de chlore, bit5=Plus de produit pompe 3, bit6=Fenêtre de filtration trop courte. **Ce décodage bit à bit côté frontend est incompatible avec l'encodage énuméré `IND_Alerte` (0-15, §4.6) transmis tel quel par ce module côté backend** — voir `TOCHECK.md` point critique : soit le contrôleur envoie en réalité un vrai bitmask (et c'est le commentaire de `globalPiscineWeb.h` qui est trompeur/obsolète), soit le frontend décode incorrectement une valeur énumérée. À trancher avec le code du contrôleur.

Le bouton ACK envoie `POST /setPiscine?action=Parametres&param=clearAlert&val=1` — un acquittement global, pas d'ACK par alerte individuelle. La page Paramètres propose par ailleurs des switches pour désactiver certains types d'alerte côté configuration (inversion de polarité de capteur), à ne pas confondre avec un acquittement.

### 7.4 Page paramètres (`piscineParametres.js`, 1757 lignes)

Chaque contrôle (switch/slider/champ) poste individuellement `POST /setPiscine?action=Parametres&sess=...&param=<nom>&val=<valeur>` dès son changement — pas de formulaire global à valider/soumettre. Couvre notamment : commandes manuelles (lampe, volet, PP, PAC, PH, CL, P3), plages horaires (filtration, PAC, lampe, volet), type de consigne PAC (fixe/relative), pilotage PAC via routeur solaire, auto-login local, coefficients de dosage (avec remise à zéro), seuils/inversions d'alertes. Date/heure système via un endpoint dédié `POST /setPiscine?action=SetDateTime&epoch=<unix>`. Validation côté client minimale (essentiellement `isNaN()` et bornes HTML natives des `<input type="range">`) — aucune validation métier croisée.

### 7.5 Page maintenance (`piscineMaintenance.js`)

Toutes les actions passent par `POST /setPiscine?action=Maintenance&command=<action>&...`. Étalonnage pH (tampons 4/7/9) et Redox (tampons Low/High) avec scan, validation (`validEtalon`), annulation. Gestion des sondes de température DS18B20 : scan du bus (`scanSondes`), assignation manuelle du rôle de chaque sonde détectée (Eau/Air/PAC/Suppression) avec anti-doublon, validation (`validSondes`). À la fermeture de la page, deux `cancelScan` (PH et Redox) sont envoyés pour nettoyer l'état serveur.

### 7.6 Graphiques (`piscineGraphs.js`, 3183 lignes)

Bibliothèque **Dygraph 2.2.1** (CDN) + `synchronizer.min.js` (graphes multi-zones synchronisés) + `html2canvas` (export PNG) + parsing CSV maison. Chargement via le système "chunké" à 3 étapes décrit en §4.1 (`/api/graph/plan` → `/api/graph/file-info` → `/api/graph/chunk`), avec barre de progression si la période dépasse 7 jours. Sélecteur de période à **9 options** (aujourd'hui, hier, 3 derniers jours [défaut], 7 derniers jours, semaine dernière, cette semaine, 30 derniers jours, mois dernier, ce mois) + une plage personnalisée (date-range-picker) — ce n'est pas un simple Jour/Semaine/Mois. Séries : températures (eau/air/PAC/intérieur), pH, Redox, Chlore, plus séries booléennes d'état (pompes, mode auto).

### 7.7 Gestion utilisateurs (`piscineUsers.js`)

CRUD complet via l'endpoint unifié `POST /api/auth?action=<logon|register|changeAdmin|userProfile|deleteUsers|getUsers>`. Rôles gérés par utilisateur : Piscine, Arrosage, Chauffage, Lampes, Volets (5 rôles, cohérent avec les autres systèmes de la maison partageant l'identifiant ICSC). Validation via `jquery.validate` (longueurs min/max, confirmation de mot de passe) uniquement sur ces formulaires d'authentification — pas sur les paramètres piscine.

### 7.8 Expiration de session côté client

Triple mécanisme :
1. **Passif** : hook `pagecontainerbeforechange` — avant tout changement de page (hors pages de login), compare `expirationDate` à l'heure courante ; redirige vers le dialog de fin de session si dépassé.
2. **Actif** : `setInterval(checkSessionValidity, 60000)` — toutes les 60 s, avertit par toast 5 minutes avant expiration (une seule fois), déclenche le dialog si dépassé.
3. **Réactif** : la plupart des appels AJAX testent une réponse `400` contenant `"Invalid Session"` et déclenchent le même dialog.

Double stockage client : cookie `maPiscine` (le `sessID`) + `localStorage["maPiscine-session"]` (objet complet incluant date d'expiration et rôles), via un singleton `maPiscine.Session`.

## 8. Stockage

| Support | Contenu |
|---|---|
| **LittleFS** | Fichiers web statiques (`/html/*.lgz`), configuration (`/cfg/piscine.cfg`), tampons de logs (`/buf/log_buf.log`, `/buf/alert_buf.log`) avant flush SD |
| **Carte SD** (CS = `D8`, FAT) | Logs journaliers (`/log/{année}/logs/{mois}/...`), logs de moyennes horaires (`...-Moy.log`), logs d'alertes/debug (`/log/{année}/alerts/Alerts-{mois}.log`), sessions actives (`/sessions.json`), fichiers uploadés via `/upload` |

`startSD()` retente 3 fois (`SD.begin()`) avec 500 ms d'attente entre essais ; en cas d'échec, `cardPresent=false` et le logger bascule en mode "tampon LittleFS uniquement" (voir §9 Logger ci-dessous). `checkSD()` retente ensuite le montage à chaque flush (toutes les 15 min) tant que la carte reste absente, et recrée l'arborescence `/log/` dès qu'elle est (re)détectée.

## 9. Logger (`Logger.h` / `logger.cpp`)

Deux niveaux de stockage : un tampon **LittleFS** toujours actif (même sans carte SD) — `/buf/log_buf.log`, `/buf/alert_buf.log` — puis un flush périodique/rollover vers la **carte SD**.

**Colonnes CSV** (`logData()`, un enregistrement par changement de valeur "critique" reçue du contrôleur) :
`date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto`
(température/pH/CL divisés par 100 pour l'affichage décimal, redox brut).

**Trois familles de fichiers** :
- `logFile` : détail brut, `/log/{année}/logs/{mois}/{jourCourt}-{jour}.log`
- `logMoyFile` : moyennes horaires, `...-Moy.log`, écrit directement sur SD (pas de tampon LittleFS)
- `alertFile` : logs texte/debug, `/log/{année}/alerts/Alerts-{mois}.log`

**Flush** : `timerFlush` (15 min) + déclenché aussi lors des rollovers jour/mois (changement de `dayOfWeek`/`month()`). Si SD absente, `flushLogsToSD()` retente le montage via `checkSD()` avant de renoncer ; si elle reste indisponible, le tampon LittleFS continue de grossir mais est plafonné à 100 Ko par fichier (`capBufferFile()`, appelée avant chaque écriture) — au-delà, le buffer est vidé plutôt que de risquer de saturer LittleFS (partagée avec la config/sessions/assets web).

**API "chunking" anti-watchdog** (`getFileInfo`, `fetchChunk`) : lecture d'un fichier de log par blocs de taille paramétrable (défaut 1024 octets), pour éviter un reset watchdog matériel lors du chargement de gros historiques pour les graphiques web.

## 10. Points d'attention / pièges connus

1. **CI ne construit pas les assets web** — un firmware qui compile n'implique pas une interface web fonctionnelle (JS/HTML non vérifiés).
2. **Watchdog ESP8266** — deux garde-fous explicites dans le code (buffer log 256 octets/100 itérations max, puis API chunking dédiée) pour éviter les Soft WDT reset lors de la lecture de gros fichiers depuis la SD ; à respecter pour toute nouvelle fonctionnalité de lecture de fichiers volumineux.
3. **`MDNS.addServiceTxt(...)` désactivé** (commenté) avec la mention "Crash etharp_output" — bug connu de la stack réseau ESP8266 avec cette API.
4. **Mots de passe WiFi stockés en clair** dans `/cfg/piscine.cfg` et `data/cfg/piscine.cfg` (confirmé en lisant le fichier de config du dépôt) — cohérent avec le besoin (WiFiManager doit pouvoir s'y reconnecter), mais à garder en tête pour toute distribution du dépôt/de ses sauvegardes.

## 11. Aucune trace de RF24 / ESP-NOW / ManagerTelecom

Recherche exhaustive (`grep -rniE "RF24|ESP-?NOW|ManagerTelecom"` sur `src/`, `include/`, `html/`) : **aucune occurrence active**. Les deux seules correspondances sont des labels de commentaires historiques inoffensifs dans `src/maPiscineWeb.cpp` (`/* --- managerTelecom Callbacks --- */` et un commentaire de code mort mentionnant "managerTelecoms"). Confirmé : ce sous-système a bien été entièrement supprimé du code actuel.
