# 🚀 Guide d'intégration rapide - Auto-login local

**5 minutes pour intégrer l'auto-login dans votre projet existant**

---

## ✅ Pré-requis

- ✔️ Projet maPiscinev4Web-d1_mini avec jQuery Mobile
- ✔️ Fichier `main.html` existant avec pages virtuelles
- ✔️ Système login/session fonctionnel

---

## 📦 Étape 1 : Inclure les fichiers

### Dans votre `<head>` existant, ajouter :

```html
<!-- Après jQuery Mobile CSS -->
<link rel="stylesheet" href="css/localAuth.css">

<!-- Après jQuery Mobile JS -->
<script src="js/localAuth.js"></script>
```

**Ordre important** :
1. jQuery
2. jQuery Mobile
3. **localAuth.js** (en dernier)

---

## 🏗️ Étape 2 : Adapter votre structure pages

### Vos pages jQuery Mobile doivent avoir ces IDs :

```html
<!-- Page Login -->
<div data-role="page" id="pageLogin">
    <!-- Votre formulaire login existant -->
</div>

<!-- Page Principale -->
<div data-role="page" id="pagePrincipale">
    <!-- Votre contenu principal existant -->
</div>
```

**Si vos IDs sont différents**, modifier dans `localAuth.js` :
```javascript
// Ligne 47 et suivantes
$.mobile.changePage("#VOTRE_ID_PAGE_PRINCIPALE", {transition: "slide"});

// Ligne 65 et suivantes
$.mobile.changePage("#VOTRE_ID_PAGE_LOGIN", {transition: "fade"});
```

---

## 🔌 Étape 3 : Compilation firmware

### Compiler et uploader

```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini

# Compilation
~/.platformio/penv/bin/platformio run

# Upload firmware
~/.platformio/penv/bin/platformio run -t upload

# Upload filesystem (pour les nouveaux fichiers JS/CSS)
~/.platformio/penv/bin/platformio run -t uploadfs
```

**Note** : Si vous utilisez Gulp pour minifier, lancer avant :
```bash
gulp
```

---

## 🧪 Étape 4 : Test

### Test 1 : Client local (WiFi maison)

1. Connectez votre smartphone au **même WiFi** que l'ESP8266
2. Ouvrez `http://mapiscine.local` dans le navigateur
3. **Attendu** : Redirection automatique vers page principale ✅
4. Vérifier console navigateur (F12) : `[LocalAuth] Auto-login local activé`

### Test 2 : Client distant (4G)

1. Désactivez WiFi, passez en 4G/données mobiles
2. Ouvrez `http://[VOTRE_IP_PUBLIQUE]:80`
3. **Attendu** : Affichage page login ✅
4. Connexion normale avec login/password

---

## ⚙️ Configuration

### Activer/Désactiver l'auto-login

**Dans `include/globalStructs.h`** :
```cpp
typedef struct configuartion_t {
    char adminPassword[MAX_USERNAME_SIZE];
    users_t users[MAX_USERS];
    wifi_t wifi[MAX_WIFI];
    bool enableLocalAutoLogin = true;  // ← Modifier ici
} struct_configuration;
```

- `true` : Auto-login activé (défaut)
- `false` : Toujours demander login, même en local

**Après modification** : Recompiler et uploader firmware

---

## 🎨 Personnalisation

### Modifier les toasts (notifications)

Dans `css/localAuth.css`, modifier les couleurs :
```css
.toast-success {
    background: linear-gradient(135deg, #VOS_COULEURS);
}
```

### Modifier les durées de session

Dans `src/PiscineWeb.cpp`, fonction `handleCheckLocalAuth()` :
```cpp
long ttl = 365 * 24 * 60 * 60;  // ← Modifier ici (actuellement 1 an)
```

### Changer le message de bienvenue

Dans `src/PiscineWeb.cpp`, fonction `handleCheckLocalAuth()` :
```cpp
jsonRoot["message"] = "Votre message personnalisé";
```

---

## 🐛 Debugging

### Logs Serial (ESP8266)

Ouvrir moniteur série :
```bash
~/.platformio/penv/bin/platformio device monitor -b 115200
```

**Messages clés** :
```
[PiscineWeb] Client local détecté : 192.168.1.50
[PiscineWeb] Auto-login local : IP=192.168.1.50, TTL=1 an
```

### Console navigateur (F12)

**Messages clés** :
```
[LocalAuth] Vérification auto-login local...
[LocalAuth] Réponse serveur: {autoLogin: true, sessionID: "..."}
[LocalAuth] Auto-login local activé, création session
```

---

## ❗ Problèmes courants

### Problème 1 : Toujours demande login en local

**Cause** : `enableLocalAutoLogin = false` dans config  
**Solution** : Modifier à `true` dans `globalStructs.h`, recompiler

### Problème 2 : Erreur 404 sur `/checkLocalAuth`

**Cause** : Route non enregistrée dans `startServer()`  
**Solution** : Vérifier que la ligne suivante existe dans `PiscineWeb.cpp` :
```cpp
server.on("/checkLocalAuth", HTTP_GET, std::bind(&PiscineWebClass::handleCheckLocalAuth, this, std::placeholders::_1));
```

### Problème 3 : Toast ne s'affiche pas

**Cause** : `localAuth.css` non chargé  
**Solution** : Vérifier l'include dans `<head>` et uploader filesystem

### Problème 4 : Boucle infinie de redirections

**Cause** : Conflit entre `localAuth.js` et votre code login existant  
**Solution** : Désactiver temporairement votre code auto-redirect, garder uniquement `localAuth.js`

---

## 📊 Vérification installation

### Checklist

- [ ] `globalStructs.h` modifié (flag `enableLocalAutoLogin`)
- [ ] `PiscineWeb.h` modifié (déclarations fonctions)
- [ ] `PiscineWeb.cpp` modifié (implémentations + route)
- [ ] `localAuth.js` créé dans `html/js/`
- [ ] `localAuth.css` créé dans `html/css/`
- [ ] Includes ajoutés dans `main.html`
- [ ] Firmware compilé et uploadé
- [ ] Filesystem uploadé (si nouveau fichiers)
- [ ] Test WiFi local réussi ✅
- [ ] Test 4G distant réussi ✅

---

## 🎯 Prochaines étapes

### Fonctionnalités avancées (optionnel)

1. **Page admin** : Toggle activation/désactivation auto-login
2. **Whitelist MAC** : Autoriser uniquement certains appareils
3. **Logs SD** : Enregistrer toutes connexions auto-login
4. **Double auth** : Code SMS pour clients distants

Voir `AUTOLOGIN_LOCAL_README.md` pour détails

---

## 💡 Astuces

### Performance

Le script `localAuth.js` :
- Ne ralentit **pas** le chargement (async)
- Cache la session en localStorage (pas de requête répétée)
- Vérifie la validité toutes les 60s seulement

### Compatibilité

Testé avec :
- ✅ jQuery Mobile 1.4.5
- ✅ Chrome Mobile (Android/iOS)
- ✅ Safari iOS
- ✅ Firefox Android

---

## 📞 Support

Problème non résolu ? Vérifier :
1. **Logs Serial** ESP8266
2. **Console** navigateur (F12)
3. **Network** tab (vérifier requête `/checkLocalAuth`)

---

**Temps d'intégration** : ~5 minutes  
**Difficulté** : ⭐⭐ (Facile)  
**Gain utilisateur** : ⭐⭐⭐⭐⭐ (Énorme)

**Auteur** : Ludovic Sorriaux  
**Date** : Janvier 2026
