# 🔧 Guide d'intégration RÉEL - Auto-login avec piscineScripts.js

**Projet** : maPiscinev4Web-d1_mini  
**Date** : 27 janvier 2026  
**Fichier principal** : `html/js/piscineScripts.js`

---

## ✅ Modifications effectuées

### 📦 **Fusion localAuth.js → piscineScripts.js**

**Fichiers modifiés** :
- ✅ `piscineScripts.js` : Intégration complète de l'auto-login
- ✅ `localAuth.js` : Renommé en `localAuth.js.backup` (code mergé)

**Avantages de la fusion** :
- ✅ Plus de problème d'ordre de chargement
- ✅ Un seul fichier JS à maintenir
- ✅ Code plus cohérent
- ✅ Performance légèrement meilleure (1 requête HTTP au lieu de 2)

---

### 1️⃣ **piscineScripts.js** - Fonctions ajoutées

#### Nouvelle fonction `checkLocalAuthOnStartup()` (~ligne 120)

**Ajoutée après `checkExistingSessionOrAutoLogin()`**

```javascript
function checkLocalAuthOnStartup() {
    // Vérifie session existante d'abord
    // Sinon appelle GET /checkLocalAuth
    // Si autoLogin=true → onSuccess()
    // Sinon → pageLogin
}
```

**Rôle** : Point d'entrée auto-login au démarrage de l'application.

---

#### Fonction `showToast()` (~ligne 188)

```javascript
function showToast(message, type) {
    // Affiche notification temporaire (3 secondes)
    // Types : 'success', 'error', 'info', 'warning'
}
```

**Rôle** : Feedback visuel pour l'utilisateur.

---

#### Fonction `enhanceLoginWithLocalCheck()` (~ligne 205)

```javascript
function enhanceLoginWithLocalCheck() {
    // Hook optionnel (backend gère déjà le TTL adaptatif)
}
```

---

#### Fonction `checkSessionValidity()` (~ligne 213)

```javascript
function checkSessionValidity() {
    // Vérifie expiration session toutes les 60 secondes
    // Redirige vers login si expirée
}
```

**Rôle** : Sécurité - déconnexion automatique.

---

#### Appel au démarrage (fin du fichier, ~ligne 4000)

**Ajouté dans `$(document).on('pagebeforeshow', '#pagePiscineParametres'...)`** :

```javascript
// === AUTO-LOGIN LOCAL : Vérification au démarrage ===
checkLocalAuthOnStartup();

// Vérification périodique session (60 secondes)
setInterval(checkSessionValidity, 60000);
```

---

### 2️⃣ **piscineScripts.js** - Fonction modifiée

#### Handler `onSuccess()` étendu (~ligne 314)

**Modification déjà effectuée précédemment** :

```javascript
// Support "Auto Login Local" en plus de "Log in Successful"
if (returnedData.status == "Log in Successful" || returnedData.status == "Auto Login Local"){
```

**Ajouté** : Gestion flag `isLocal` pour message adapté.

---

### 3️⃣ **Ancien localAuth.js**

- ✅ Renommé en `localAuth.js.backup`
- ✅ Code intégré dans `piscineScripts.js`
- ✅ Ne plus charger dans `main.html`

---

## 🔄 Flux d'authentification complet

### Scénario 1 : Client local avec auto-login

```
1. Chargement main.html
   ↓
2. piscineScripts.js charge
   ↓
3. localAuth.js charge (après piscineScripts.js)
   ↓
4. $(document).ready() → checkLocalAuthOnStartup()
   ↓
5. Appel checkExistingSessionOrAutoLogin() (piscineScripts.js)
   ├─ Session valide ? → Redirect #pagePiscinePrincipale ✅
   └─ Pas de session → Continue...
   ↓
6. GET /checkLocalAuth
   ↓
7. Backend détecte IP locale (192.168.x.x)
   ↓
8. Retourne {autoLogin: true, sessionID: "...", ttl: 31536000}
   ↓
9. localAuth.js appelle onSuccess() (piscineScripts.js)
   ↓
10. onSuccess() affiche popup #dlg-login
    - Titre : "Auto Login Local"
    - Message : "🏠 Connexion locale (session 1 an)"
    - Bouton : "Aller à la page principale"
    ↓
11. Utilisateur clique → Redirect #pagePiscinePrincipale
    ✅ ACCÈS DIRECT (0 mot de passe)
```

---

### Scénario 2 : Client distant

```
1-5. Idem scénario 1
   ↓
6. GET /checkLocalAuth
   ↓
7. Backend détecte IP distante (93.x.x.x)
   ↓
8. Retourne {autoLogin: false}
   ↓
9. Redirect #pageLogin
   ↓
10. Utilisateur entre login/password
    ↓
11. POST /logon avec isLocal=false
    ↓
12. Backend retourne TTL adaptatif (1h ou 1j)
    ↓
13. onSuccess() affiche popup
    - Message : "Session 1 heure" (ou 24h si keepAlive)
```

---

## 📝 Fichiers à charger dans main.html

Dans votre `main.html`, ajouter uniquement :

```html
<head>
    <!-- 1. jQuery -->
    <script src="js/jquery-3.x.x.min.js"></script>
    
    <!-- 2. jQuery Mobile -->
    <script src="js/jquery.mobile-1.4.5.min.js"></script>
    
    <!-- 3. Autres libs (validation, etc.) -->
    <script src="js/jquery.validate.min.js"></script>
    
    <!-- 4. piscineScripts.js (CONTIENT MAINTENANT localAuth intégré) -->
    <script src="js/piscineScripts.js"></script>
    
    <!-- 5. CSS pour les toasts d'auto-login -->
    <link rel="stylesheet" href="css/localAuth.css">
</head>
```

**✅ Simplification** :
- ~~`localAuth.js`~~ **supprimé** → code intégré dans `piscineScripts.js`
- Plus de problème d'ordre de chargement
- Un seul fichier JS à maintenir

---

## 🎨 Pages jQuery Mobile requises

Votre `main.html` doit contenir ces pages virtuelles :

### Page Login (existante, à garder)
```html
<div data-role="page" id="pageLogin">
    <!-- Votre formulaire login actuel -->
</div>
```

### Popup Dialog Login (existant, utilisé par auto-login)
```html
<div data-role="page" id="dlg-login">
    <div data-role="header">
        <h1 id="dlg-status">Status</h1>
    </div>
    <div data-role="content">
        <p id="dlg-message">Message</p>
        <p id="dlg-user">User</p>
        <p id="dlg-ttl">TTL</p>
        
        <a href="#" id="mainPageButton" data-role="button">Aller à la page principale</a>
        <a href="#pageLogin" id="retryButton" data-role="button">Réessayer</a>
        <a href="#" id="backButton" data-role="button">Retour</a>
        <a href="#pageLogin" id="loginButton" data-role="button">Login</a>
    </div>
</div>
```

### Page Principale Piscine (existante)
```html
<div data-role="page" id="pagePiscinePrincipale">
    <!-- Votre contenu actuel -->
</div>
```

---

## 🧪 Tests

### Test 1 : Session existante valide

1. Se connecter normalement (login/password)
2. Fermer navigateur
3. Rouvrir `http://mapiscine.local`
4. **Attendu** : Redirect direct vers `#pagePiscinePrincipale` (pas de popup)

### Test 2 : Auto-login local (première fois)

1. Effacer localStorage (F12 → Application → Clear)
2. Connecter au WiFi local
3. Ouvrir `http://mapiscine.local`
4. **Attendu** :
   - Popup `#dlg-login` s'affiche
   - Status : "Auto Login Local"
   - Message : "🏠 Connexion locale (session 1 an)"
   - Clic bouton → Redirect `#pagePiscinePrincipale`

### Test 3 : Client distant (4G)

1. Désactiver WiFi, passer en 4G
2. Ouvrir `http://[IP_PUBLIQUE]:80`
3. **Attendu** :
   - Page `#pageLogin` s'affiche
   - Formulaire login/password normal
   - Après login : Popup avec "Session 1 heure"

---

## 🔍 Debugging

### Console navigateur (F12)

**Messages clés** :
```
[LocalAuth] Vérification auto-login local...
[PiscineScripts] Vérification session existante...
[PiscineScripts] Session valide trouvée, restauration...
[LocalAuth] Auto-login local activé, traitement via piscineScripts.js
```

### Logs Serial ESP8266

```
[PiscineWeb] Client local détecté : 192.168.1.50
[PiscineWeb] Auto-login local : IP=192.168.1.50, TTL=1 an
```

---

## ⚠️ Points d'attention

### 1. Variable globale `mainPage`

Dans `piscineScripts.js`, `mainPage` est initialisée dans `getMainPage()` :

```javascript
function getMainPage(){
    mainPage = '#pagePiscinePrincipale';
}
```

**Vérifié** : Cette fonction est appelée dans `onSuccess()` ✅

---

### 2. Gestion popup `#dlg-login`

Le popup existant est **réutilisé** pour l'auto-login :
- Titre dynamique (`#dlg-status`)
- Message adapté (`#dlg-message`)
- Boutons conditionnels (montrer/cacher selon contexte)

**Avantage** : Cohérence visuelle avec workflow actuel

---

### 3. Calcul TTL cookie

**Correction effectuée** :
```javascript
// AVANT (bug : ttl déjà en secondes)
setCookie("maPiscine", sessID, ttl);

// APRÈS (correct : conversion secondes → heures)
setCookie("maPiscine", sessID, ttl / 3600);
```

---

## 🚀 Prochaines étapes

### Compilation firmware

```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini
~/.platformio/penv/bin/platformio run -t upload
~/.platformio/penv/bin/platformio run -t uploadfs
```

### Build frontend (si Gulp utilisé)

```bash
gulp
```

### Test complet

1. Effacer localStorage navigateur
2. Effacer cookies
3. Recharger page
4. Vérifier logs console + Serial

---

## 📊 Récapitulatif modifications

| Fichier | Action | Description |
|---------|--------|-------------|
| `piscineScripts.js` | **Modifié** | 4 fonctions ajoutées + 1 appel au démarrage |
| `localAuth.js` | **Renommé** | → `localAuth.js.backup` (code intégré) |
| `localAuth.css` | **Conservé** | CSS toasts (toujours nécessaire) |

**Total** : 1 seul fichier JS modifié, ~150 lignes ajoutées

---

## ✅ Checklist finale

- [x] `piscineScripts.js` modifié (fusion complète)
- [x] `localAuth.js` → backup (plus utilisé)
- [x] Backend déjà OK (fait précédemment)
- [x] **Plus de problème d'ordre de chargement**
- [ ] Ajouter `<link rel="stylesheet" href="css/localAuth.css">` dans `main.html`
- [ ] Compiler firmware
- [ ] Upload filesystem
- [ ] Tester WiFi local
- [ ] Tester 4G distant

---

**Auteur** : Ludovic Sorriaux  
**Date** : 27 janvier 2026  
**Version** : 1.1 (intégration piscineScripts.js)
