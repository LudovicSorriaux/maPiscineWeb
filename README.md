# maPiscineWeb v4.0

## 📄 Description

Serveur web asynchrone ESP8266 pour la gestion et la supervision de la piscine. Interface web REST API avec Server-Sent Events (SSE) pour mise à jour temps réel. Enregistrement des données sur carte SD avec horodatage pour analyse historique.

**Plateforme :** Wemos D1 mini (ESP8266)  
**Framework :** Arduino  
**Version :** 4.0.0

---

## 🎯 Fonctionnalités

- **Serveur web asynchrone** (ESPAsyncWebServer)
- **API REST** complète (`/api/status`, `/api/command`, `/api/logs`, `/api/config`, `/api/wifi`)
- **Server-Sent Events (SSE)** pour mises à jour temps réel
- **Authentification** utilisateurs avec gestion des sessions
- **WiFi Manager** pour configuration sans fil (ESPAsyncWiFiManager)
- **Logging SD Card** avec horodatage NTP
- **Communication ICSC** avec contrôleur ESP32 (protocole série)
- **mDNS** (domaine `mapiscine.local`)
- **Interface web moderne** (HTML/CSS/JS, build Gulp)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigateur Web / Mobile                   │
│             (http://mapiscine.local ou IP ESP8266)           │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST API + SSE
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      ESP8266 (D1 mini)                       │
│                     maPiscinev4Web-d1_mini                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AsyncWebServer (port 80)                              │ │
│  │  - Routes API REST (/api/*)                            │ │
│  │  - SSE (/piscineEvents, /piscineParamsEvents, etc.)    │ │
│  │  - Serveur fichiers statiques (SPIFFS/LittleFS)        │ │
│  └───────────────┬────────────────────────────────────────┘ │
│                  │                                            │
│  ┌───────────────▼───────────────┬──────────────────────────┤
│  │  PiscineWeb (coeur)           │  ActionControler (sync)  │
│  │  - Gestion routes             │  - NTP synchronization   │
│  │  - SSE broadcast              │  - Date/heure update     │
│  │  - Authentification           │  - Init params piscine   │
│  └───────────────┬───────────────┴──────────────────────────┘
│                  │                                            │
│  ┌───────────────▼───────────────┬──────────────────────────┤
│  │  PiscineWebTelecom (ICSC)     │  Logger (SD Card)        │
│  │  - Buffer read/write          │  - Enregistrement CSV    │
│  │  - Callbacks reception        │  - Debug messages        │
│  │  - Détection contrôleur       │  - Historique horodaté   │
│  └───────────────┬───────────────┴──────────────────────────┘
│                  │                          │                 │
└──────────────────┼──────────────────────────┼─────────────────┘
                   │ ICSC (Serial)            │ SPI
                   ▼                          ▼
        ┌──────────────────────┐   ┌──────────────────┐
        │  Contrôleur ESP32    │   │   Carte SD       │
        │  (maPiscinev4        │   │   (pin D8)       │
        │   Controler)         │   │                  │
        │                      │   │  Logs horodatés  │
        │  - Capteurs          │   │  TempEau, pH,    │
        │  - Pompes            │   │  Redox, etc.     │
        │  - Régulation        │   │                  │
        └──────────────────────┘   └──────────────────┘
```

---

## 📂 Structure du Projet

```
maPiscinev4Web-d1_mini/
├── src/
│   ├── maPiscineWeb.cpp               # Point d'entrée principal (setup/loop)
│   ├── PiscineWeb.cpp                   # Coeur serveur web (routes API, SSE)
│   ├── PiscineWebActionControler.cpp    # Synchronisation NTP, init params
│   ├── PiscineWebTelecom.cpp            # Communication ICSC avec ESP32
│   ├── logger.cpp                       # Système logging SD Card
│   └── ManagerTelecom.cpp               # ESP-NOW (expérimental, non utilisé)
│
├── include/
│   ├── globalPiscineWeb.h               # Constantes web (SIZE, IND_*, debug)
│   ├── globalPiscine.h                  # Codes messages ICSC (sync 3 projets)
│   ├── globalStructs.h                  # Structures données (params, users, wifi)
│   ├── indexesDef.h                     # Labels PROGMEM pour affichage
│   ├── PiscineWeb.h                     # Classe PiscineWebClass
│   ├── PiscineWebActionControler.h      # Classe ActionControler
│   ├── PiscineWebTelecom.h              # Classe PiscineWebTelecomClass
│   ├── Logger.h                         # Classe LoggerClass
│   └── ManagerTelecom.h                 # Template callbacks ESP-NOW
│
├── html/                                # Sources HTML/CSS/JS
│   ├── index.html
│   ├── css/
│   └── js/
│
├── data/                                # Fichiers compilés Gulp (SPIFFS/LittleFS)
│   ├── 404.html.lgz
│   ├── index.html.lgz
│   └── ...
│
├── cfg/
│   └── piscine.cfg                      # Configuration par défaut
│
├── scripts/
│   └── add_comments_src.py              # Script auto commentaires fonctions
│
├── platformio.ini                       # Configuration PlatformIO
├── gulpfile.js                          # Build frontend (minify, gzip)
├── package.json                         # Dépendances Node.js (Gulp)
└── README.md                            # Ce fichier

```

---

## 📖 Documentation Code

### État de la Documentation

✅ **96 fonctions documentées** avec blocs `@brief` explicites (commit 61542a2)

| Fichier Source                     | Fonctions | Description                                    |
|------------------------------------|-----------|------------------------------------------------|
| `maPiscineWeb.cpp`               | 51        | Point d'entrée, WiFi, NTP, config, timers      |
| `PiscineWeb.cpp`                   | 6         | Coeur serveur web, routes API, SSE             |
| `PiscineWebActionControler.cpp`    | 6         | Synchronisation NTP, refresh données           |
| `PiscineWebTelecom.cpp`            | 3         | Protocole ICSC, communication série ESP32      |
| `ManagerTelecom.cpp`               | 27        | ESP-NOW (expérimental), callbacks manager      |
| `logger.cpp`                       | 3         | Logging SD Card, historique horodaté           |
| **TOTAL**                          | **96**    | Descriptions complètes paramètres + mécanismes |

### Groupes Fonctionnels Principaux

**maPiscineWeb.cpp** — Point d'entrée principal
- **Timer Callbacks (9)** : `doCheckMessages()`, `doLogger()`, `doAction()`, `doCheckWIFIConnection()`, `doCheckNTPDate()`, etc.
- **WiFi Functions (6)** : `startWiFi()`, `useWifiManager()`, `WiFiConnect()`, `ConnectWithStoredCredentials()`, `findPassword()`, `resetWifiSettings()`
- **Config Functions (9)** : `loadConfiguration()`, `saveConfiguration()`, `loadConfigurationEEprom()`, `saveConfigurationEEprom()`, etc.
- **Helper Functions (5)** : `getNTPTime()`, `dstOffset()`, `formatBytes()`, `getContentType()`, `wl_status_to_string()`
- **Setup Functions (2)** : `setup()`, `loop()`

**PiscineWeb.cpp** — Serveur web asynchrone
- Démarrage serveur (`startup()`, `startServer()`, `startMDNS()`)
- Mise à jour périodique SSE (`OnUpdate()`, `sendNewParamsPiscine()`)
- Gestion LCD virtuel (`managePiscineLCD()`)

**ManagerTelecom.cpp** — ESP-NOW (expérimental)
- Initialisation ESP-NOW (`InitESPNow()`, `managerTelecomInitialisation()`)
- Callbacks réception/envoi (`receiveCallback()`, `sentCallback()`)
- Synchronisation temps (`askNewTime()`, `isTimeSych()`)
- Formatage données (`toString()`, `roundFloat()`, `toHeureFormat()`)

### Script d'Amélioration Automatique

Le fichier `improve_comments_piscine.py` permet de régénérer automatiquement les commentaires :

```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini
python3 improve_comments_piscine.py
```

Le script :
1. Recherche les blocs commentaires génériques multi-lignes
2. Les remplace par des blocs `@brief` explicites
3. Ajoute des `@brief` pour les fonctions sans documentation
4. Utilise un dictionnaire `FUNCTION_DESCRIPTIONS` (96 entrées)

---

## 🔌 Matériel Requis

### Composants

| Composant          | Référence      | Usage                     |
|--------------------|----------------|---------------------------|
| Wemos D1 mini      | ESP8266        | Microcontrôleur WiFi      |
| Carte SD           | SPI            | Stockage logs             |
| Module carte SD    | CS → D8        | Interface SPI             |
| Câble série        | RX/TX          | Communication ICSC ESP32  |

### Pinout

| Pin ESP8266 | Fonction          | Description                     |
|-------------|-------------------|---------------------------------|
| D8          | SD_CS             | Chip Select carte SD (SPI)      |
| RX          | ICSC_RX           | Réception série contrôleur      |
| TX          | ICSC_TX           | Transmission série contrôleur   |
| D1/D2       | I2C (optionnel)   | Si extension I2C nécessaire     |

---

## 🔧 Configuration

### `platformio.ini`

```ini
[env:d1_mini]
platform = espressif8266
board = d1_mini
framework = arduino
monitor_speed = 115200

lib_deps = 
    alanswx/ESPAsyncWiFiManager@^0.31
    bblanchon/ArduinoJson@^7.3.0
    me-no-dev/ESP Async WebServer@^1.2.3
    arduino-libraries/NTPClient@^3.2.1
    paulstoffregen/Time@^1.6.1

monitor_filters = esp8266_exception_decoder
build_flags = 
    -DCORE_DEBUG_LEVEL=5
    -DBOARD_HAS_PSRAM
```

### `globalPiscineWeb.h` - Constantes clés

```cpp
// Tailles buffers
#define SIZE_ARRAY_DATA 60              // Taille tableau données piscine
#define MAX_USERS 3                     // Nombre max utilisateurs
#define MAX_WIFI 3                      // Nombre max réseaux WiFi

// Index données synchronisées avec Controler et Clavier
#define IND_Alertes 1
#define IND_TempEau 2
#define IND_TempAir 3
#define IND_PHVal 4
#define IND_CLVal 5
// ... (voir fichier complet)

// Mode debug
bool debug = true;
```

### Endpoints API REST

| Endpoint              | Méthode | Description                          |
|-----------------------|---------|--------------------------------------|
| `/api/status`         | GET     | État complet piscine (JSON)          |
| `/api/command`        | POST    | Envoi commande au contrôleur         |
| `/api/logs`           | GET     | Récupération logs SD Card            |
| `/api/config`         | GET/POST| Configuration système                |
| `/api/wifi`           | POST    | Configuration WiFi                   |
| `/piscineEvents`      | SSE     | Mises à jour temps réel données      |
| `/piscineParamsEvents`| SSE     | Mises à jour paramètres              |
| `/piscineDebugEvents` | SSE     | Messages debug                       |

---

## 🚀 Utilisation

### 1️⃣ Installation Dépendances Frontend

```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini
npm install
```

### 2️⃣ Build Frontend (Gulp)

```bash
# Minify et gzip des fichiers HTML/CSS/JS
npx gulp

# Les fichiers sont générés dans data/ (.lgz)
```

### 3️⃣ Compilation Firmware

```bash
~/.platformio/penv/bin/platformio run
```

**Vérifications :**
- RAM usage < 80%
- Flash usage < 90%
- Aucune erreur de linking

### 4️⃣ Upload Firmware

```bash
~/.platformio/penv/bin/platformio run --target upload
```

### 5️⃣ Upload Filesystem (SPIFFS/LittleFS)

```bash
~/.platformio/penv/bin/platformio run --target uploadfs
```

**Contenu uploadé :** fichiers `data/*.lgz` (HTML/CSS/JS compressés)

### 6️⃣ Moniteur Série

```bash
~/.platformio/penv/bin/platformio device monitor
```

---

## 🌐 Premier Démarrage

1. **Brancher l'ESP8266** via USB
2. **Uploader firmware + filesystem** (voir ci-dessus)
3. **Redémarrer l'ESP8266**
4. **Connexion WiFi Manager :**
   - Le D1 mini crée un point d'accès : `maPiscineWeb-XXXXXX`
   - Se connecter depuis smartphone/PC
   - Naviguer vers `http://192.168.4.1`
   - Sélectionner réseau WiFi et entrer mot de passe
   - Valider → L'ESP8266 redémarre et se connecte au réseau

5. **Accès interface web :**
   - Via mDNS : `http://mapiscine.local` (macOS/Linux/iOS)
   - Via IP : affichée dans le moniteur série (ex: `http://192.168.1.42`)

---

## 📊 Logging SD Card

### Format Fichiers

Les logs sont enregistrés dans des répertoires par date :

```
/SD/logs/2024/12/25/
    piscine_20241225.csv
```

### Format CSV

```csv
timestamp,TempEau,TempAir,TempPAC,TempInt,PHVal,RedoxVal,CLVal,PompePH,PompeCL,PompeALG,PP,PAC,Auto
1735142400,25.3,18.5,22.1,19.0,7.2,650,0.8,0,0,0,1,1,1
```

### Récupération Logs

**Via API REST :**
```bash
curl "http://mapiscine.local/api/logs?start=2024-12-25&end=2024-12-26" > logs.csv
```

**Via interface web :**
- Section "Historique" → Sélectionner plage de dates → Télécharger CSV

---

## 🔄 Communication ICSC avec Contrôleur

### Protocole

Le serveur web communique avec le contrôleur ESP32 via **protocole ICSC** (série 115200 bauds) :

| Code Message       | Valeur | Description                        |
|--------------------|--------|------------------------------------|
| `DATA_MSG`         | 0      | Échange données capteurs/actionneurs|
| `CLIENT_HELLO`     | 1      | Hello client → serveur             |
| `SERVER_HELLO`     | 2      | Hello serveur → client             |
| `SYNCH_TIME_REQ`   | 3      | Demande synchronisation temps      |
| `SYNCH_TIME`       | 4      | Envoi heure NTP                    |
| `SENSOR_DATA_MSG`  | 8      | Données capteurs supplémentaires   |

### Buffer Lecture/Écriture

- **Buffer lecture :** `MAX_READ_DATA` (50 entrées) — données reçues du contrôleur
- **Buffer écriture :** `MAX_WRITE_DATA` (20 entrées) — commandes vers contrôleur

### Callbacks

```cpp
void PiscineWebTelecomClass::receiveData(...)   // Réception données capteurs
void PiscineWebTelecomClass::receiveTime(...)   // Réception demande synchro temps
void PiscineWebTelecomClass::receiveSync(...)   // Confirmation synchronisation
void PiscineWebTelecomClass::receiveHello(...)  // Poignée de main
void PiscineWebTelecomClass::receiveTempAdd(...) // Températures additionnelles
```

---

## 🛠️ Scripts Utilitaires

### `scripts/add_comments_src.py`

Ajoute automatiquement des commentaires `But:/Entrées:/Sortie:` avant chaque fonction C++ :

```bash
python3 scripts/add_comments_src.py
```

**Fonctionnement :**
- Scanne tous les `.cpp` dans `src/`
- Détecte les définitions de fonctions via regex
- Insère un bloc commentaire si `But:` absent
- Crée un backup `.bak` avant modification

---

## 🔍 Modules Principaux

### `maPiscineWeb.cpp`
- **Rôle :** Point d'entrée, `setup()` et `loop()` Arduino
- **Responsabilités :**
  - Initialisation WiFi Manager
  - Configuration AsyncWebServer + routes
  - Setup NTP, SD Card, ICSC
  - Boucle principale avec appels `OnUpdate()`

### `PiscineWeb.cpp`
- **Rôle :** Coeur serveur web
- **Responsabilités :**
  - Routes API REST (`/api/*`)
  - SSE broadcast temps réel
  - Authentification utilisateurs
  - Gestion état piscine (struct `piscineParams[]`)

### `PiscineWebActionControler.cpp`
- **Rôle :** Contrôleur actions web
- **Responsabilités :**
  - Synchronisation NTP automatique (1h)
  - Mise à jour date/heure système
  - Initialisation paramètres piscine au démarrage

### `PiscineWebTelecom.cpp`
- **Rôle :** Communication ICSC
- **Responsabilités :**
  - Gestion buffer lecture/écriture
  - Callbacks réception messages
  - Détection présence contrôleur
  - Envoi commandes utilisateur

### `Logger.cpp`
- **Rôle :** Système logging SD
- **Responsabilités :**
  - Enregistrement CSV horodaté
  - Création répertoires par date
  - Fonctions `print()` / `printf()` pour debug
  - Récupération historique pour API

---

## 📈 Performances

### Mémoire

| Ressource       | Usage Typique | Max Recommandé |
|-----------------|---------------|----------------|
| RAM             | ~65%          | 80%            |
| Flash           | ~75%          | 90%            |

### Réseau

- **WiFi :** 802.11 b/g/n (2.4 GHz)
- **Connexions simultanées :** 4 (AsyncWebServer)
- **SSE clients max :** 4 (limitation ESP8266)

### Logging

- **Fréquence :** Toutes les 5 minutes (configurable)
- **Rotation :** Par jour (nouveau fichier chaque jour)
- **Taille fichier :** ~50 KB/jour (1440 entrées @ 5 min)

---

## 🔧 Troubleshooting

### Problème : WiFi ne se connecte pas

**Solution :**
1. Vérifier LED clignote (mode WiFi Manager)
2. Chercher réseau `maPiscineWeb-XXXXXX`
3. Reconfigurer via `http://192.168.4.1`
4. Si bloqué : presser bouton RESET physique

### Problème : Carte SD non détectée

**Vérifications :**
1. Carte formatée en FAT32
2. Pin D8 correctement connecté (CS)
3. Alimentation suffisante (500mA min)
4. Moniteur série : `[Logger] SD Card init: OK`

### Problème : Pas de communication avec contrôleur

**Diagnostics :**
1. Vérifier câblage RX/TX (RX ESP8266 ↔ TX ESP32)
2. Baudrate identique (115200)
3. Moniteur série : `[Telecom] Controleur present: true`
4. LED activité sur contrôleur ESP32

### Problème : Interface web inaccessible

**Checks :**
1. mDNS activé : `ping mapiscine.local`
2. IP correcte dans moniteur série
3. Firewall autorise port 80
4. Filesystem uploadé : `platformio run --target uploadfs`

### Problème : Mémoire insuffisante

**Actions :**
1. Réduire `MAX_USERS` / `MAX_WIFI` dans `globalPiscineWeb.h`
2. Désactiver debug : `bool debug = false;`
3. Compiler en release : retirer `-DCORE_DEBUG_LEVEL=5`

---

## 🔒 Sécurité

### Authentification

- Mot de passe admin stocké dans `struct_configuration`
- Sessions web avec cookies sécurisés
- API REST protégée par token Bearer (optionnel)

### Recommandations

- **Changer mot de passe admin** par défaut
- **Activer HTTPS** si exposition internet (AsyncWebServer + SSL)
- **Limiter accès WiFi** (réseau local isolé)
- **Mettre à jour firmware** régulièrement

---

## 🌟 Synchronisation Multi-Projets

**CRITIQUE :** Les constantes `IND_*` doivent être **identiques** dans les 3 projets :

1. **maPiscinev4Controler-ESP32** (`globalPiscine.h`)
2. **maPiscinev4.5Clavier-d1_mini** (`globalPiscine.h`)
3. **maPiscinev4Web-d1_mini** (`globalPiscineWeb.h`)

Toute modification d'index nécessite **recompilation et upload des 3 firmwares**.

---

## 📦 Dépendances

### Libraries PlatformIO

```ini
alanswx/ESPAsyncWiFiManager @ ^0.31
bblanchon/ArduinoJson @ ^7.3.0
me-no-dev/ESP Async WebServer @ ^1.2.3
arduino-libraries/NTPClient @ ^3.2.1
paulstoffregen/Time @ ^1.6.1
```

### Node.js (Frontend Build)

```json
{
  "devDependencies": {
    "gulp": "^4.0.2",
    "gulp-htmlmin": "^5.0.1",
    "gulp-gzip": "^1.4.2",
    ...
  }
}
```

---

## 📝 Historique Versions

| Version | Date       | Modifications                                    |
|---------|------------|--------------------------------------------------|
| 4.0.0   | 12/2024    | Documentation complète, headers, commentaires    |
| 3.1     | 11/2024    | Migration ArduinoJson v7, AsyncWebServer         |
| 3.0     | 10/2024    | Ajout SSE, logging SD Card amélioré              |
| 2.0     | 09/2024    | Refonte architecture, séparation modules         |
| 1.0     | 08/2024    | Version initiale                                 |

---

## 👤 Auteur

**Ludovic Sorriaux**  
Projet : Système de gestion piscine automatisée (ESP32 + ESP8266)

---

## 📜 Licence

Projet privé - Tous droits réservés

---

## 🔗 Liens Utiles

- [PlatformIO Documentation](https://docs.platformio.org/)
- [ESPAsyncWebServer](https://github.com/me-no-dev/ESPAsyncWebServer)
- [ArduinoJson v7](https://arduinojson.org/)
- [Gulp](https://gulpjs.com/)

---

## 📞 Support

En cas de problème :
1. Vérifier logs moniteur série
2. Consulter section Troubleshooting ci-dessus
3. Vérifier synchronisation IND_* entre projets
4. Tester avec `debug = true` dans `globalPiscineWeb.h`
