# 📚 INDEX - Documentation Auto-login Local

**Projet** : maPiscinev4Web-d1_mini  
**Fonctionnalité** : Détection réseau local + auto-login automatique  
**Date** : 26 janvier 2026

---

## 🗂️ Navigation rapide

### 🚀 Démarrage rapide (5 minutes)
➡️ **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)**
- Guide pas à pas pour intégrer dans votre projet existant
- Checklist complète
- Troubleshooting problèmes courants

**Commencer par ce fichier si vous voulez juste faire fonctionner l'auto-login !**

---

### 📖 Documentation technique complète
➡️ **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)**
- Architecture détaillée backend + frontend
- Détection réseau local (algorithme)
- Endpoint API `/checkLocalAuth`
- Durées de session (TTL)
- Sécurité et recommandations
- Tests unitaires
- Améliorations futures

**Lire ce fichier pour comprendre en profondeur le fonctionnement.**

---

### 📊 Diagrammes visuels
➡️ **[DIAGRAMME_FLUX.md](DIAGRAMME_FLUX.md)**
- Diagramme de séquence complet
- Détail algorithme détection IP locale
- Timeline durées de session
- Cycle de validation session
- Matrice de décision TTL

**Parfait pour une vue d'ensemble visuelle.**

---

### 📝 Résumé implémentation
➡️ **[RESUME_IMPLEMENTATION.md](RESUME_IMPLEMENTATION.md)**
- Liste fichiers modifiés/créés
- Statistiques code
- Statut tests
- Checklist complète
- Prochaines étapes

**Idéal pour un aperçu rapide de ce qui a été fait.**

---

## 📂 Fichiers code

### Backend (ESP8266)

| Fichier | Type | Description |
|---------|------|-------------|
| `include/globalStructs.h` | Modifié | Ajout flag `enableLocalAutoLogin` |
| `include/PiscineWeb.h` | Modifié | Déclarations fonctions détection locale |
| `src/PiscineWeb.cpp` | Modifié | Implémentations + route API |

### Frontend (HTML/CSS/JS)

| Fichier | Type | Description |
|---------|------|-------------|
| `html/js/localAuth.js` | Créé | Logique auto-login (211 lignes) |
| `html/css/localAuth.css` | Créé | Styles toasts (67 lignes) |
| `html/main_example_autologin.html` | Créé | Exemple intégration complète |

---

## 🎯 Par cas d'usage

### Je veux juste que ça marche
1. Lire **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)**
2. Compiler firmware
3. Upload filesystem
4. Ajouter includes dans `main.html`
5. Tester !

### Je veux comprendre comment ça marche
1. Lire **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)**
2. Consulter **[DIAGRAMME_FLUX.md](DIAGRAMME_FLUX.md)**
3. Examiner code dans `src/PiscineWeb.cpp`

### Je veux personnaliser
1. Lire section "Configuration" dans **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)**
2. Modifier TTL dans `src/PiscineWeb.cpp`
3. Personnaliser toasts dans `html/css/localAuth.css`
4. Adapter messages dans `html/js/localAuth.js`

### Je rencontre un problème
1. Consulter section "Problèmes courants" dans **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)**
2. Activer logs Serial (voir section "Debugging")
3. Vérifier console navigateur (F12)

---

## 🔍 Recherche rapide

### Algorithme détection IP locale
→ **[DIAGRAMME_FLUX.md](DIAGRAMME_FLUX.md)** - Section "Détail détection IP locale"

### Durées de session (TTL)
→ **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)** - Section "Durées de session (TTL)"

### Endpoint API `/checkLocalAuth`
→ **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)** - Section "Endpoint API"

### Configuration activation/désactivation
→ **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)** - Section "Configuration"

### Exemples code
→ **[html/main_example_autologin.html](html/main_example_autologin.html)** - Démo complète

### Styles CSS toasts
→ **[html/css/localAuth.css](html/css/localAuth.css)**

### Logique JavaScript
→ **[html/js/localAuth.js](html/js/localAuth.js)**

---

## 📋 Checklist intégration

Avant de commencer :
- [ ] Lire **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)**
- [ ] Vérifier structure pages jQuery Mobile

Modifications backend :
- [ ] `include/globalStructs.h` modifié
- [ ] `include/PiscineWeb.h` modifié
- [ ] `src/PiscineWeb.cpp` modifié

Fichiers frontend :
- [ ] `html/js/localAuth.js` créé
- [ ] `html/css/localAuth.css` créé
- [ ] Includes ajoutés dans `main.html`

Compilation :
- [ ] Firmware compilé
- [ ] Firmware uploadé
- [ ] Filesystem uploadé

Tests :
- [ ] Test WiFi local (auto-login) ✅
- [ ] Test 4G distant (login manuel) ✅
- [ ] Logs Serial vérifiés
- [ ] Console navigateur vérifiée

---

## 🛠️ Commandes utiles

### Compilation
```bash
cd /Users/ludovic1/Documents/PlatformIO/Projects/maPiscinev4Web-d1_mini
~/.platformio/penv/bin/platformio run
```

### Upload firmware
```bash
~/.platformio/penv/bin/platformio run -t upload
```

### Upload filesystem
```bash
~/.platformio/penv/bin/platformio run -t uploadfs
```

### Logs Serial
```bash
~/.platformio/penv/bin/platformio device monitor -b 115200
```

### Build frontend (Gulp)
```bash
gulp
```

---

## 📞 Support

En cas de problème :
1. Consulter **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)** - Section "Problèmes courants"
2. Vérifier logs Serial
3. Vérifier console navigateur (F12)
4. Consulter **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)** - Section "Support"

---

## 📊 Statistiques projet

| Métrique | Valeur |
|----------|--------|
| Fichiers modifiés | 3 |
| Fichiers créés | 10 |
| Lignes code backend | ~120 |
| Lignes code frontend | ~278 |
| Pages documentation | 7 |
| Temps implémentation | 2h |
| Temps intégration | 5min |

---

## 🎯 Roadmap future

### Version 1.0 (actuelle) ✅
- Détection IP locale
- Auto-login automatique
- TTL adaptatif
- Documentation complète

### Version 1.1 (future)
- Interface admin (toggle activation)
- Whitelist MAC address
- Logs SD connexions auto-login

### Version 1.2 (future)
- Double authentification (SMS/email)
- Plage IP personnalisée
- Statistiques connexions

---

## 📖 Ordre de lecture recommandé

### Pour développeur pressé (15 min)
1. **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)** (5 min)
2. **[html/main_example_autologin.html](html/main_example_autologin.html)** (5 min - code exemple)
3. **[RESUME_IMPLEMENTATION.md](RESUME_IMPLEMENTATION.md)** (5 min)

### Pour développeur méticuleux (45 min)
1. **[RESUME_IMPLEMENTATION.md](RESUME_IMPLEMENTATION.md)** (5 min)
2. **[AUTOLOGIN_LOCAL_README.md](AUTOLOGIN_LOCAL_README.md)** (20 min)
3. **[DIAGRAMME_FLUX.md](DIAGRAMME_FLUX.md)** (10 min)
4. **[INTEGRATION_RAPIDE.md](INTEGRATION_RAPIDE.md)** (10 min)

### Pour chef de projet (5 min)
1. **[RESUME_IMPLEMENTATION.md](RESUME_IMPLEMENTATION.md)** (5 min)

---

## 🏁 Démarrage ultra-rapide

**3 commandes pour tester** :

```bash
# 1. Compiler + uploader firmware
~/.platformio/penv/bin/platformio run -t upload

# 2. Uploader filesystem
~/.platformio/penv/bin/platformio run -t uploadfs

# 3. Ajouter dans main.html
<link rel="stylesheet" href="css/localAuth.css">
<script src="js/localAuth.js"></script>
```

✅ **C'est tout !**

---

**Auteur** : Ludovic Sorriaux  
**Date** : 26 janvier 2026  
**Version** : 1.0  
**Licence** : Propriétaire (voir README.md principal)

---

**Feedback/Questions** :  
Consulter section "Support" dans chaque fichier de documentation
