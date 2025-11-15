# Copilote - maPiscineWeb v4.0

**Version 4.0 - Novembre 2025**

But : fournir aux développeurs et à l'assistant IA un aide-mémoire pratique pour le serveur web piscine Wemos D1 mini.

---

## Contexte Produit

- **Rôle** : Serveur web asynchrone qui communique avec le contrôleur principal (ESP32) et fournit une interface web pour le monitoring et le contrôle de la piscine.
- **Matériel clé** : 
  - ESP8266 D1 mini
  - Carte SD (pin D8) pour logging des données
  - WiFi Manager pour configuration réseau
  - Serveur web asynchrone (port 80)
- **Bibliothèques majeures** : 
  - ESPAsyncWebServer (serveur web asynchrone)
  - ESPAsyncWiFiManager (configuration WiFi)
  - ArduinoJson (sérialisation données)
  - NTPClient (synchronisation heure)
  - SDFS (système de fichiers SD)
  - SimpleTimer (callbacks périodiques)
  - TimeLib (gestion date/heure)

---

## Fichiers Importants

### Point d'Entrée
- **`src/maPiscinev3Web.cpp`** : Point d'entrée `setup`/`loop`, serveur web, timers, gestion WiFi et carte SD.

### Modules Principaux
- **`src/PiscineWeb.cpp`** : Gestion des endpoints API web (routes REST, handlers).
- **`src/PiscineWebActionControler.cpp`** : Contrôle des actions utilisateur depuis le web.
- **`src/PiscineWebTelecom.cpp`** : Communication avec le contrôleur ESP32 (protocole propriétaire).
- **`src/ManagerTelecom.cpp`** : Gestionnaire de communication et synchronisation.
- **`src/logger.cpp`** : Enregistrement des données sur carte SD (fichiers CSV).

### Headers
- **`include/globalPiscine.h`** : Déclarations globales partagées avec contrôleur, constantes d'index (`IND_*`).
- **`include/globalPiscineWeb.h`** : Constantes spécifiques au serveur web.
- **`include/PiscineWeb.h`** : Interface API web.
- **`include/PiscineWebActionControler.h`** : Interface contrôle d'actions web.
- **`include/PiscineWebTelecom.h`** : Interface communication contrôleur.
- **`include/ManagerTelecom.h`** : Interface gestionnaire telecom.
- **`include/Logger.h`** : Interface logger SD.

### Configuration & Assets
- **`platformio.ini`** : Configuration PlatformIO (environnement `d1_mini`, bibliothèques).
- **`html/`** : Fichiers HTML/CSS/JS de l'interface web.
- **`data/`** : Fichiers compressés (.lgz) pour SPIFFS/LittleFS.
- **`cfg/piscine.cfg`** : Fichier de configuration.
- **`gulpfile.js`** : Build system pour minification HTML/CSS/JS.
- **`package.json`** : Dépendances Node.js pour build frontend.

---

## Architecture du Projet

### Flux de Données Principal
```
Client Web (Browser) → HTTP Request → AsyncWebServer (port 80)
    ↓
PiscineWeb (Routes API) → PiscineWebActionControler
    ↓
PiscineWebTelecom ↔ [Communication] ↔ Contrôleur ESP32
    ↓
Logger → Carte SD (fichiers CSV)
```

### Boucle Principale
```
loop() → server.handleClient() → timer.run() → checkWiFi() → syncTime()
```

### Timers SimpleTimer
- **Périodiques** : Synchronisation NTP, vérification WiFi, logging SD
- **On-demand** : Requêtes HTTP, communication contrôleur

### Endpoints API (exemples)
- `GET /api/status` : État actuel de la piscine
- `GET /api/logs` : Récupération logs SD
- `POST /api/command` : Envoi commande au contrôleur
- `GET /api/config` : Configuration système
- `POST /api/wifi` : Configuration WiFi

---

## Bonnes Pratiques de Développement

### Règles Générales
- **Toujours répondre en français** dans ce dépôt.
- **Documentation obligatoire** : Chaque fichier .h/.cpp doit avoir un en-tête (Usage/Référencé par/Référence).
- **Commentaires fonctions** : Format `But/Entrées/Sortie` pour toutes les fonctions.
- **Style de code** :
  - camelCase pour les variables
  - PascalCase pour les classes (suffixe `Class` si applicable)
  - UPPER_CASE pour les constantes

### Modifications Index ICSC
- **Ne jamais modifier les index `IND_*`** sans synchroniser le contrôleur principal ESP32.
- Les index sont partagés via `globalPiscine.h` entre tous les projets.
- Toute modification d'index nécessite une mise à jour de 3 projets :
  - maPiscinev4Controler-ESP32
  - maPiscinev4.5Clavier-d1_mini
  - maPiscinev4Web-d1_mini

### Gestion Asynchrone
- **Toujours utiliser les handlers asynchrones** avec `ESPAsyncWebServer`.
- Éviter les `delay()` dans les callbacks HTTP.
- Utiliser `AsyncWebServerRequest* request` pour envoyer les réponses.

### Carte SD
- **Vérifier `cardPresent`** avant toute opération de lecture/écriture.
- Gérer les erreurs d'ouverture de fichiers (SD peut être retirée).
- Format des logs : CSV avec timestamp.

### WiFi Manager
- **Mode AP captif** activé automatiquement si pas de configuration WiFi.
- SSID AP : configurable dans `globalPiscineWeb.h`.
- Configuration sauvegardée en EEPROM/SPIFFS.

### Tests Minimums
```bash
# Compilation
~/.platformio/penv/bin/platformio run

# Upload firmware
~/.platformio/penv/bin/platformio run -t upload

# Upload filesystem (SPIFFS/LittleFS)
~/.platformio/penv/bin/platformio run -t uploadfs

# Moniteur série
~/.platformio/penv/bin/platformio device monitor -b 115200
```

---

## Commandes Utiles (macOS zsh)

### Navigation
```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini
```

### Frontend Build (Gulp)
```bash
# Installer les dépendances Node.js
npm install

# Build frontend (minification HTML/CSS/JS)
npx gulp

# Watch mode (rebuild automatique)
npx gulp watch
```

### Compilation Firmware
```bash
# Build complet
~/.platformio/penv/bin/platformio run

# Build avec affichage des erreurs
~/.platformio/penv/bin/platformio run 2>&1 | tail -50

# Nettoyage
~/.platformio/penv/bin/platformio run -t clean
```

### Flash Firmware et Filesystem
```bash
# Upload firmware vers D1 mini
~/.platformio/penv/bin/platformio run -t upload

# Upload filesystem (data/ -> SPIFFS)
~/.platformio/penv/bin/platformio run -t uploadfs

# Upload avec port spécifique
~/.platformio/penv/bin/platformio run -t upload --upload-port /dev/cu.usbserial-*
```

### Monitoring
```bash
# Moniteur série
~/.platformio/penv/bin/platformio device monitor -b 115200

# Lister les ports disponibles
~/.platformio/penv/bin/platformio device list
```

### Git
```bash
# Sauvegarde avant modifications
git add -A && git commit -m "Sauvegarde avant modifs"

# Vérifier l'état
git status --short

# Voir les modifications
git diff --stat
```

---

## Points d'Attention Spécifiques

### Serveur Web Asynchrone
- Les callbacks HTTP sont **non-bloquants**.
- Utiliser `request->send()` pour envoyer la réponse.
- Gérer les headers CORS si nécessaire pour API cross-origin.

### Carte SD
- Pin CS : **D8** (défini par `SDchipSelect`).
- Format attendu : **FAT32**.
- Vérifier `cardPresent` avant chaque opération.
- Logger écrit en mode **append** pour ne pas écraser les données.

### Mémoire ESP8266
- **RAM limitée** (~80KB utilisable).
- Utiliser `PROGMEM` pour stocker les constantes en Flash.
- Libérer les `String` et buffers dynamiques rapidement.
- Surveiller les stack overflows (crash aléatoires).

### WiFi Manager
- **Mode AP** : ESP8266 devient point d'accès si pas de config WiFi.
- **Portal captif** : permet de configurer SSID/Password via navigateur.
- Configuration sauvegardée automatiquement.
- Timeout de connexion configurable.

### Communication Contrôleur
- Protocole propriétaire (pas ICSC ici, contrairement au Clavier).
- Synchronisation périodique des états.
- Bufferisation des commandes si contrôleur indisponible.

### NTP et TimeLib
- Synchronisation NTP au démarrage et périodique.
- Timezone : définie par `TZ_OFFSET` (+1 pour France).
- TimeLib gère le temps local (epoch + offset).

---

## Workflow Recommandé

### 1. Avant Toute Modification
```bash
# Créer une sauvegarde
git add -A && git commit -m "Sauvegarde avant [description]"

# Créer une branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 2. Développement
- Modifier les fichiers concernés (firmware ou frontend).
- Ajouter les en-têtes documentés si nouveaux fichiers.
- Ajouter les commentaires `But/Entrées/Sortie` pour nouvelles fonctions.

### 3. Build Frontend (si HTML/CSS/JS modifiés)
```bash
# Build frontend
npx gulp

# Vérifier data/ pour fichiers .lgz générés
ls -lh data/*.lgz
```

### 4. Compilation et Tests
```bash
# Compiler firmware
~/.platformio/penv/bin/platformio run

# Si erreurs, afficher les détails
~/.platformio/penv/bin/platformio run 2>&1 | grep -E "error:|warning:" | head -20

# Upload firmware
~/.platformio/penv/bin/platformio run -t upload

# Upload filesystem (si frontend modifié)
~/.platformio/penv/bin/platformio run -t uploadfs

# Moniteur série
~/.platformio/penv/bin/platformio device monitor -b 115200
```

### 5. Vérifications
- [ ] WiFi connecté (SSID/IP affichés dans logs série)
- [ ] Serveur web accessible (http://IP-ESP/)
- [ ] API répond correctement (`/api/status`)
- [ ] Carte SD détectée (si présente)
- [ ] Logger écrit sur SD (vérifier fichiers .csv)
- [ ] Communication avec contrôleur ESP32 opérationnelle
- [ ] NTP synchronisé (heure correcte)

### 6. Documentation
```bash
# Mettre à jour README.md si architecture modifiée
# Mettre à jour ce fichier si workflow changé
```

### 7. Commit et Push
```bash
# Commit atomique
git add -A
git commit -m "feat: Description de la fonctionnalité

- Détail 1
- Détail 2
- Tests: [résultats]"

# Push (si souhaité)
git push origin feature/ma-nouvelle-fonctionnalite
```

---

## Exemples de Modifications Courantes

### Ajouter un Endpoint API
1. Ajouter le handler dans `PiscineWeb.cpp`
2. Enregistrer la route dans `server.on()`
3. Tester avec curl ou Postman
4. Documenter l'endpoint dans README.md

### Modifier l'Interface Web
1. Éditer fichiers HTML/CSS/JS dans `html/`
2. Lancer `npx gulp` pour rebuild
3. Vérifier `data/*.lgz` généré
4. Upload filesystem : `~/.platformio/penv/bin/platformio run -t uploadfs`
5. Tester dans navigateur

### Ajouter un Champ de Log
1. Modifier structure CSV dans `logger.cpp`
2. Ajouter le champ dans `writeLog()`
3. Mettre à jour le parser côté web (si lecture logs)
4. Tester écriture sur SD

### Changer un Paramètre Réseau
1. Modifier constantes dans `globalPiscineWeb.h`
2. Rebuild firmware
3. Effacer config WiFi si nécessaire (EEPROM)
4. Reconfigurer via portal captif

---

## Dépannage

### Problème de Compilation
```bash
# Nettoyer le build
~/.platformio/penv/bin/platformio run -t clean
rm -rf .pio

# Rebuild complet
~/.platformio/penv/bin/platformio run
```

### Problème Frontend (Gulp)
```bash
# Réinstaller dépendances Node.js
rm -rf node_modules package-lock.json
npm install

# Rebuild
npx gulp
```

### Problème WiFi
- Vérifier SSID/Password dans portal captif
- Réinitialiser config WiFi (bouton reset ou EEPROM clear)
- Vérifier puissance signal WiFi
- Mode AP activé ? (SSID ESP visible)

### Problème Carte SD
- Vérifier format FAT32
- Vérifier connexion SPI (pin D8)
- Tester avec autre carte SD
- Vérifier `cardPresent` dans logs série

### Problème Serveur Web
```bash
# Vérifier IP ESP8266 dans logs série
# Tester ping
ping <IP-ESP>

# Tester endpoint
curl http://<IP-ESP>/api/status

# Vérifier firewall macOS
```

### Problème Mémoire (Heap)
- Réduire taille des buffers
- Utiliser `PROGMEM` pour constantes
- Libérer `String` après usage
- Fragmenter les réponses HTTP longues

### LCD/Affichage (si présent)
- Vérifier I2C (SDA: D2, SCL: D1)
- Scanner adresses I2C disponibles
- Tester avec sketch I2C scanner

---

## Projets Associés

**Contrôleur Principal** : `/Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Controler-ESP32`  
**Clavier Interface** : `/Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4.5Clavier-d1_mini`

Toute modification des index `IND_*` ou du protocole nécessite une synchronisation entre les trois projets.

---

## Support

Pour toute question ou bug :
1. Consulter `README.md` (architecture détaillée)
2. Vérifier les logs série (debug = true)
3. Tester les endpoints API avec curl
4. Consulter ce fichier pour le workflow

**Date de dernière mise à jour** : 15 novembre 2025
