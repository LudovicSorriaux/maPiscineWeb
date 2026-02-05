# Standards de Logging - maPiscine Web

## Format Standard
```
[SOURCE] message
```

## Tags de Source Disponibles

### Système & Infrastructure
- **`[SYSTEM]`** - Diagnostic système (RAM, Flash, LittleFS)
- **`[RAM]`** - Monitoring RAM en production (5 points stratégiques)

### Réseau & Connectivité  
- **`[WIFI]`** - Connexion WiFi, statut réseau
- **`[MDNS]`** - Responder mDNS, découverte réseau
- **`[NTP]`** - Synchronisation horaire (si implémenté)

### Serveur Web
- **`[WEB]`** - Serveur HTTP, handlers, SSE, requêtes
- **`[AUTH]`** - Authentification, sessions, gestion utilisateurs

### Communication & Données
- **`[TELECOM]`** - Communication ICSC avec contrôleur, sondes
- **`[LOGGER]`** - Gestion fichiers log, rotation journalière
- **`[SD]`** - Carte SD, opérations fichiers

## Niveaux Optionnels (uniquement pour problèmes)

### ⚠️ ALERTE (Warning)
```cpp
logger.printf("[RAM] ⚠️ ALERTE : RAM faible (< 15 KB) - Risque instabilité!\n");
logger.println("[AUTH] ⚠️ No room for new user");
```
**Usage** : Situations anormales mais non critiques, nécessitant attention.

### ❌ ERREUR (Error)
```cpp
logger.println("[SD] ❌ ERREUR : Can't open alert file");
logger.println("[MDNS] ❌ ERREUR : Setup failed!");
logger.println("[WEB] ❌ ERREUR : Invalid Session");
```
**Usage** : Échecs d'opérations, erreurs techniques bloquantes.

## Exemples par Contexte

### Démarrage
```cpp
logger.println("[WEB] maPiscineWeb Startup...");
logger.println("[WEB] Starting Piscine Web Server");
logger.printf("[MDNS] Responder started: http://%s.local\n", mdnsName);
logger.print("[WEB] HTTP server started, IP address: ");
logger.printf("[RAM] Serveur web démarré - Free heap: %d bytes\n", ESP.getFreeHeap());
```

### Authentification
```cpp
logger.printf("[AUTH] Client local détecté : TTL = 1 an (IP: %s)\n", ip);
logger.println("[AUTH] Client distant avec keepAlive : TTL = 1 jour");
logger.printf("[AUTH] Login %s - Free heap: %d bytes\n", username, ESP.getFreeHeap());
logger.printf("[AUTH] New user: %s, passwd: %s\n", user, pass);
logger.println("[AUTH] User already exists, updated with new password");
logger.println("[AUTH] ❌ Bad AdminPassword");
```

### Opérations Logger
```cpp
logger.printf("[LOGGER] New AlertFileName : %s\n", alertFileName.c_str());
logger.printf("[LOGGER] New LogFileName : %s\n", logFileName.c_str());
logger.printf("[RAM] Nouveau jour détecté - Free heap avant création logs: %d bytes\n", heap);
```

### Monitoring RAM (5 points stratégiques)
```cpp
// 1. Démarrage
logger.printf("[RAM] Démarrage terminé - Free heap: %d bytes (%.1f%% libre)\n", heap, pct);

// 2. Serveur web
logger.printf("[RAM] Serveur web démarré - Free heap: %d bytes\n", heap);

// 3. Login
logger.printf("[RAM] Login %s - Free heap: %d bytes\n", username, heap);

// 4. Surveillance périodique (10 min)
logger.printf("[RAM] Surveillance périodique - Free heap: %d bytes (%.1f%%)\n", heap, pct);

// 5. Nouveau jour (création logs)
logger.printf("[RAM] Nouveau jour détecté - Free heap avant création logs: %d bytes\n", heap);
```

### Erreurs
```cpp
logger.println("[SD] ❌ ERREUR : SDCard Initialization Failed");
logger.println("[SD] ❌ ERREUR : Can't open alert file");
logger.println("[WEB] ❌ ERREUR : deserializeJson() failed");
logger.println("[WEB] ❌ ERREUR : Invalid Session");
logger.println("[WEB] ❌ ERREUR : Invalid Parameter");
logger.println("[AUTH] ❌ Can not find existing user to delete!");
```

## Avantages de cette Approche

### ✅ Pas de verbosité inutile
- Pas de `[INFO]` redondant sur chaque ligne (90% des logs sont informatifs)
- Économie RAM : chaque `[INFO]` = 6 caractères × nb logs

### ✅ Filtrage efficace
```bash
# Filtrer tous les logs RAM
grep "\[RAM\]" /log/2025/alerts/Alerts-Jan.log

# Filtrer toutes les erreurs
grep "❌" /log/2025/alerts/Alerts-Jan.log

# Filtrer authentification
grep "\[AUTH\]" /log/2025/alerts/Alerts-Jan.log
```

### ✅ Signaux forts
- `⚠️` et `❌` attirent immédiatement l'œil sur les problèmes
- Logs normaux restent épurés et lisibles

### ✅ Cohérence
- Format uniforme : `[SOURCE] message`
- Tags courts et explicites (4-8 caractères)
- Unicodes UTF-8 supportés (⚠️ ❌)

## Migration & Maintenance

### Règles d'ajout de nouveaux logs
1. **Toujours préfixer avec `[SOURCE]`**
2. **Utiliser `⚠️` ou `❌` seulement si problème**
3. **Ne jamais ajouter `[INFO]` (implicite par défaut)**
4. **Choisir le tag de source approprié** (voir liste ci-dessus)

### Exemple de nouveau log
```cpp
// ❌ MAUVAIS (sans tag)
logger.println("Configuration saved");

// ❌ MAUVAIS (avec [INFO] inutile)
logger.println("[CONFIG][INFO] Configuration saved");

// ✅ BON
logger.println("[CONFIG] Configuration saved");

// ✅ BON (avec erreur)
logger.println("[CONFIG] ❌ ERREUR : Failed to save configuration");
```

## Performance
- **RAM** : Économie ~6 octets par log vs `[SOURCE][INFO]`
- **Flash** : Strings PROGMEM pour constantes fréquentes (STR_*)
- **Lisibilité** : Format court = logs plus clairs en production

## Version
- **Date** : 4 février 2026
- **RAM libre actuel** : 25444 bytes (68.9% utilisé)
- **Gain depuis optimisation** : +8260 bytes (+48%)
