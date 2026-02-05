# 🔐 Auto-login Local - Documentation d'implémentation

**Date** : 26 janvier 2026  
**Projet** : maPiscinev4Web-d1_mini  
**Fonctionnalité** : Détection réseau local + auto-login (bypass page login)

---

## 📋 Résumé

Système d'authentification adaptative qui détecte si le client web est sur le **même réseau local** que l'ESP8266. Si oui, propose un **auto-login automatique** avec session longue durée (1 an) sans demander mot de passe.

---

## 🏗️ Architecture

### Backend (ESP8266)

#### Modifications fichiers

1. **`include/globalStructs.h`**
   - Ajout flag `bool enableLocalAutoLogin = true` dans `struct_configuration`
   - Permet d'activer/désactiver l'auto-login local via config

2. **`include/PiscineWeb.h`**
   - Déclaration `bool isLocalClient(AsyncWebServerRequest *request)`
   - Déclaration `void handleCheckLocalAuth(AsyncWebServerRequest *request)`

3. **`src/PiscineWeb.cpp`**
   - Implémentation `isLocalClient()` : Détection IP locale (comparaison sous-réseau)
   - Implémentation `handleCheckLocalAuth()` : Endpoint API GET `/checkLocalAuth`
   - Modification `handleLogin()` : TTL adaptatif (1 an local, 30j local sans auto-login, 1j/1h distant)
   - Ajout route `/checkLocalAuth` dans `startServer()`

---

## 🔍 Détection réseau local

### Fonction `isLocalClient()`

```cpp
bool PiscineWebClass::isLocalClient(AsyncWebServerRequest *request) {
    IPAddress clientIP = request->client()->remoteIP();
    IPAddress serverIP = WiFi.localIP();
    IPAddress subnet = WiFi.subnetMask();
    
    // Comparaison bit à bit : (client & mask) == (server & mask)
    for (int i = 0; i < 4; i++) {
        if ((clientIP[i] & subnet[i]) != (serverIP[i] & subnet[i])) {
            return false;  // Différent sous-réseau
        }
    }
    return true;  // Même sous-réseau
}
```

**Exemples** :
- Serveur ESP8266 : `192.168.1.100` / Masque : `255.255.255.0`
- Client smartphone : `192.168.1.50` → **Local** ✅
- Client 4G : `93.12.45.78` → **Distant** ❌

---

## 📡 Endpoint API : `/checkLocalAuth`

### Requête
```http
GET /checkLocalAuth HTTP/1.1
Host: mapiscine.local
```

### Réponse (Client local avec auto-login activé)
```json
{
  "status": "Auto Login Local",
  "isLocal": true,
  "autoLogin": true,
  "sessionID": "A7f2K9mP3xL5q1R",
  "ttl": 31536000,
  "username": "local_user",
  "message": "Bienvenue (connexion locale automatique)"
}
```

### Réponse (Authentification requise)
```json
{
  "status": "Authentication Required",
  "isLocal": false,
  "autoLogin": false,
  "message": "Authentification requise"
}
```

---

## 🎨 Frontend (jQuery Mobile)

### Fichiers créés

1. **`html/js/localAuth.js`**
   - Fonction `checkLocalAuthOnStartup()` : Vérification auto-login au démarrage
   - Fonction `checkSessionValidity()` : Validation périodique session (60s)
   - Gestion localStorage (sessionID, username, expiry)
   - Compatible pages virtuelles jQuery Mobile

2. **`html/css/localAuth.css`**
   - Styles toast notifications (success, error, info, warning)
   - Animations slide/fade
   - Responsive mobile

---

## 🔧 Intégration dans `main.html`

### 1. Ajouter les includes (dans `<head>`)

```html
<!-- Auto-login local -->
<link rel="stylesheet" href="css/localAuth.css">
<script src="js/localAuth.js"></script>
```

### 2. Structure pages jQuery Mobile

```html
<!-- Page Login (virtuelle) -->
<div data-role="page" id="pageLogin">
    <div data-role="header">
        <h1>Connexion</h1>
    </div>
    <div data-role="content">
        <!-- Votre formulaire login existant -->
    </div>
</div>

<!-- Page Principale (virtuelle) -->
<div data-role="page" id="pagePrincipale">
    <div data-role="header">
        <h1>Ma Piscine</h1>
    </div>
    <div data-role="content">
        <!-- Votre contenu principal -->
    </div>
</div>
```

### 3. Le script `localAuth.js` s'auto-initialise

```javascript
// Au chargement, appelle automatiquement :
$(document).ready(function() {
    checkLocalAuthOnStartup();  // Vérifie auto-login
    setInterval(checkSessionValidity, 60000);  // Check toutes les 60s
});
```

---

## 📊 Flux d'authentification

### Scénario 1 : Client local (WiFi maison)

```
1. Chargement main.html
   ↓
2. localAuth.js → GET /checkLocalAuth
   ↓
3. Backend détecte IP locale (192.168.x.x)
   ↓
4. Retourne autoLogin=true + sessionID
   ↓
5. Frontend stocke session (localStorage)
   ↓
6. Redirection automatique vers #pagePrincipale
   ✅ Pas de page login !
```

### Scénario 2 : Client distant (Internet/VPN)

```
1. Chargement main.html
   ↓
2. localAuth.js → GET /checkLocalAuth
   ↓
3. Backend détecte IP distante (93.x.x.x)
   ↓
4. Retourne autoLogin=false
   ↓
5. Frontend affiche #pageLogin
   ↓
6. Utilisateur entre login/password
   ↓
7. POST /logon → session 1h ou 1 jour
```

---

## ⏱️ Durées de session (TTL)

| Contexte | Condition | TTL | Remarque |
|----------|-----------|-----|----------|
| **Local auto-login** | IP locale + `enableLocalAutoLogin=true` | **1 an** | Quasi-infini |
| **Local avec login** | IP locale + login manuel | **30 jours** | Confort usage |
| **Distant keepAlive** | IP distante + checkbox "Se souvenir" | **1 jour** | Sécurité renforcée |
| **Distant normal** | IP distante | **1 heure** | Sécurité max |

---

## 🛡️ Sécurité

### ✅ Points forts
- Détection côté serveur (impossible à contourner côté client)
- Option désactivable (`enableLocalAutoLogin = false`)
- Logs détaillés de toutes les connexions auto-login
- TTL adaptatif selon contexte

### ⚠️ Points de vigilance
1. **WiFi invité** : Toute personne connectée au WiFi local a accès
2. **Pas de whitelist MAC** : N'importe quel appareil du réseau local
3. **Accès physique** : Accès total depuis la maison

### 🔒 Recommandations
- Désactiver l'auto-login si WiFi ouvert/public
- Combiner avec authentification double facteur (future amélioration)
- Logger toutes les connexions auto-login sur SD
- Page admin toujours protégée par mot de passe

---

## 🔧 Configuration

### Activer/Désactiver l'auto-login local

**Méthode 1 : Modifier le code (défaut)**
```cpp
// Dans globalStructs.h
bool enableLocalAutoLogin = true;  // true = activé, false = désactivé
```

**Méthode 2 : Via page admin (à implémenter)**
```html
<!-- Future interface admin -->
<input type="checkbox" id="enableLocalAutoLogin" checked>
<label>Activer auto-login réseau local</label>
```

---

## 📝 Logs

### Exemples logs Serial

**Client local auto-login** :
```
[PiscineWeb] Client local détecté : 192.168.1.50 (serveur: 192.168.1.100, masque: 255.255.255.0)
[PiscineWeb] Auto-login local : IP=192.168.1.50, TTL=1 an
```

**Client distant** :
```
[PiscineWeb] Client distant détecté : 93.12.45.78 (serveur: 192.168.1.100, masque: 255.255.255.0)
[PiscineWeb] Authentification requise : IP=93.12.45.78, Local=false, Config=enabled
```

**Login manuel local** :
```
[PiscineWeb] Client local détecté : 192.168.1.50
[PiscineWeb] Client local détecté : TTL = 1 an (IP: 192.168.1.50)
[PiscineWeb] Log in Successful
```

---

## 🧪 Tests

### Test 1 : Client local WiFi
1. Connecter smartphone au WiFi maison
2. Ouvrir `http://mapiscine.local`
3. **Attendu** : Redirection directe vers page principale (pas de login)
4. **Vérifier** : localStorage contient `maPiscine` (sessionID)

### Test 2 : Client distant VPN/4G
1. Déconnecter WiFi, activer 4G
2. Ouvrir `http://[IP_PUBLIQUE]:80`
3. **Attendu** : Affichage page login
4. **Vérifier** : Logs Serial montrent "Client distant détecté"

### Test 3 : Désactivation auto-login
1. Modifier `enableLocalAutoLogin = false`
2. Compiler + uploader firmware
3. Connecter WiFi local
4. **Attendu** : Affichage page login même en local

### Test 4 : Expiration session
1. Modifier TTL à 60s (test rapide)
2. Auto-login local
3. Attendre 61s
4. **Attendu** : Redirection vers login + toast "Session expirée"

---

## 📦 Fichiers modifiés/créés

### Modifiés
- ✏️ `include/globalStructs.h` (ajout flag)
- ✏️ `include/PiscineWeb.h` (déclarations)
- ✏️ `src/PiscineWeb.cpp` (implémentations)

### Créés
- ✨ `html/js/localAuth.js` (logique frontend)
- ✨ `html/css/localAuth.css` (styles toasts)
- ✨ `AUTOLOGIN_LOCAL_README.md` (cette doc)

---

## 🚀 Prochaines étapes

### Améliorations possibles
1. **Interface admin** : Toggle activé/désactivé dans page paramètres
2. **Whitelist MAC** : Autoriser uniquement certains appareils
3. **Double authentification** : Code SMS/email pour clients distants
4. **Logs SD** : Enregistrer toutes connexions auto-login
5. **Plage IP personnalisée** : Définir manuellement IPs de confiance

---

## 💡 Utilisation quotidienne

### Cas d'usage
- **À la maison** : Ouvrez l'app → accès direct (0 clic)
- **En vacances** : Login manuel → session 1 jour (confort)
- **Invités** : Partagez WiFi → ils ont accès (optionnel)

### Désactivation rapide
Si besoin sécurité maximale (Airbnb, etc.) :
```cpp
config.enableLocalAutoLogin = false;  // Via page admin future
```

---

## 📞 Support

En cas de problème, vérifier :
1. **Logs Serial** : Messages détection IP
2. **Console navigateur** : Erreurs JavaScript
3. **localStorage** : `maPiscine`, `maPiscineExpiry`
4. **Réseau** : Même sous-réseau que l'ESP8266 ?

---

**Auteur** : Ludovic Sorriaux  
**Date** : Janvier 2026  
**Version** : 1.0
