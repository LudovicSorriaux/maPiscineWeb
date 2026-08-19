# 📊 Diagramme de flux - Auto-login local

> ⚠️ **Mise à jour (08/2026)** : l'étape 4 ci-dessous a changé. Le client transmet désormais son `sessionId` local (s'il en a un) en paramètre `?sess=` de l'appel `GET /checkLocalAuth`, et le serveur valide **d'abord** cette session existante avant d'envisager un auto-login. Dans la version d'origine du diagramme, le serveur régénérait systématiquement une nouvelle session à chaque appel (scénario A, étape 6a), ce qui saturait la table de sessions — ce n'était pas le comportement voulu, voir `AUTOLOGIN_LOCAL_README.md` pour le détail du bug corrigé.

## 🔄 Flux complet d'authentification

```
┌─────────────┐                    ┌──────────────┐                    ┌──────────────┐
│  Navigateur │                    │  ESP8266     │                    │ localStorage │
│  (Client)   │                    │  (Serveur)   │                    │              │
└──────┬──────┘                    └───────┬──────┘                    └──────┬───────┘
       │                                   │                                   │
       │  1. Chargement main.html          │                                   │
       ├──────────────────────────────────>│                                   │
       │                                   │                                   │
       │  2. Exécution localAuth.js        │                                   │
       │  $(document).ready()              │                                   │
       │────┐                              │                                   │
       │    │ checkLocalAuthOnStartup()    │                                   │
       │<───┘                              │                                   │
       │                                   │                                   │
       │  3. Vérifier session existante    │                                   │
       ├───────────────────────────────────────────────────────────────────────>│
       │<───────────────────────────────────────────────────────────────────────┤
       │  sessionID + expiry               │                                   │
       │                                   │                                   │
       │  [Si session valide]              │                                   │
       │  → Redirect #pagePrincipale       │                                   │
       │  [Si session expirée/absente]     │                                   │
       │  ↓ Continue...                    │                                   │
       │                                   │                                   │
       │  4. GET /checkLocalAuth?sess=X    │                                   │
       │  (X = sessionId local si connu)   │                                   │
       ├──────────────────────────────────>│                                   │
       │                                   │  4bis. isSessionValid(X) ?        │
       │                                   │  [Si oui] → confirmer, PAS de     │
       │                                   │  nouvelle session (voir 7a')      │
       │                                   │  [Si non] → suite normale ↓       │
       │                                   │                                   │
       │                                   │  5. Récupérer IP client           │
       │                                   │  request->client()->remoteIP()    │
       │                                   │────┐                              │
       │                                   │    │ isLocalClient()              │
       │                                   │    │ Comparer sous-réseau         │
       │                                   │<───┘                              │
       │                                   │                                   │
       │                                   │  [Scénario A : Client LOCAL]      │
       │                                   │  IP: 192.168.1.50                 │
       │                                   │  Serveur: 192.168.1.100           │
       │                                   │  → Même sous-réseau ✅            │
       │                                   │                                   │
       │                                   │  6a. Générer sessionID            │
       │                                   │  ttl = 365 * 24 * 60 * 60 (1 an)  │
       │                                   │────┐                              │
       │                                   │    │ generateKey()                │
       │                                   │<───┘                              │
       │                                   │                                   │
       │  7a. Réponse JSON                 │                                   │
       │  {autoLogin: true, sessionID: ... }│                                  │
       │<──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  8a. Stocker session              │                                   │
       ├───────────────────────────────────────────────────────────────────────>│
       │  localStorage.setItem(...)        │                                   │
       │                                   │                                   │
       │  9a. Afficher toast               │                                   │
       │  "Bienvenue (connexion locale)"   │                                   │
       │────┐                              │                                   │
       │    │ showToast()                  │                                   │
       │<───┘                              │                                   │
       │                                   │                                   │
       │  10a. Redirection jQuery Mobile   │                                   │
       │  $.mobile.changePage(             │                                   │
       │    "#pagePrincipale"              │                                   │
       │  )                                │                                   │
       │────┐                              │                                   │
       │    │ ✅ ACCÈS DIRECT               │                                   │
       │<───┘    (pas de login)            │                                   │
       │                                   │                                   │
       │                                   │                                   │
       │                                   │  [Scénario B : Client DISTANT]    │
       │                                   │  IP: 93.12.45.78                  │
       │                                   │  Serveur: 192.168.1.100           │
       │                                   │  → Sous-réseau différent ❌       │
       │                                   │                                   │
       │  7b. Réponse JSON                 │                                   │
       │  {autoLogin: false, ...}          │                                   │
       │<──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  8b. Afficher page login          │                                   │
       │  $.mobile.changePage(             │                                   │
       │    "#pageLogin"                   │                                   │
       │  )                                │                                   │
       │────┐                              │                                   │
       │    │ 🔐 LOGIN REQUIS               │                                   │
       │<───┘                              │                                   │
       │                                   │                                   │
       │  9b. Utilisateur entre            │                                   │
       │      login + password             │                                   │
       │────┐                              │                                   │
       │    │                              │                                   │
       │<───┘                              │                                   │
       │                                   │                                   │
       │  10b. POST /logon                 │                                   │
       │  {username, password, keepAlive}  │                                   │
       ├──────────────────────────────────>│                                   │
       │                                   │                                   │
       │                                   │  11b. Valider credentials         │
       │                                   │  + Appeler isLocalClient()        │
       │                                   │────┐                              │
       │                                   │    │ TTL adaptatif :              │
       │                                   │    │ - Distant + keepAlive: 1j    │
       │                                   │    │ - Distant normal: 1h         │
       │                                   │<───┘                              │
       │                                   │                                   │
       │  12b. Réponse login success       │                                   │
       │  {sessionID, ttl, isLocal: false} │                                   │
       │<──────────────────────────────────┤                                   │
       │                                   │                                   │
       │  13b. Stocker session + redirect  │                                   │
       ├───────────────────────────────────────────────────────────────────────>│
       │                                   │                                   │
       │  ✅ ACCÈS ACCORDÉ                  │                                   │
       │                                   │                                   │
```

---

## 🔍 Détail détection IP locale

```
╔════════════════════════════════════════════════════════════════╗
║  Fonction isLocalClient(request)                               ║
╚════════════════════════════════════════════════════════════════╝

Entrée :
  - request->client()->remoteIP()  → IPAddress clientIP
  - WiFi.localIP()                 → IPAddress serverIP
  - WiFi.subnetMask()              → IPAddress subnet

Algorithme :
  Pour i = 0 à 3 (octets IP) :
    Si (clientIP[i] & subnet[i]) ≠ (serverIP[i] & subnet[i])
      → return false  (Pas dans le même sous-réseau)
  
  → return true  (Même sous-réseau)

Exemple 1 : Client LOCAL ✅
  clientIP  : 192.168.  1. 50  (0xC0.A8.01.32)
  serverIP  : 192.168.  1.100  (0xC0.A8.01.64)
  subnet    : 255.255.255.  0  (0xFF.FF.FF.00)
  
  Calculs :
    [0] : (192 & 255) == (192 & 255)  →  192 == 192  ✓
    [1] : (168 & 255) == (168 & 255)  →  168 == 168  ✓
    [2] : (  1 & 255) == (  1 & 255)  →    1 ==   1  ✓
    [3] : ( 50 &   0) == (100 &   0)  →    0 ==   0  ✓
  
  Résultat : true (CLIENT LOCAL)

Exemple 2 : Client DISTANT ❌
  clientIP  :  93. 12. 45. 78  (0x5D.0C.2D.4E)
  serverIP  : 192.168.  1.100  (0xC0.A8.01.64)
  subnet    : 255.255.255.  0  (0xFF.FF.FF.00)
  
  Calculs :
    [0] : (93 & 255) == (192 & 255)  →  93 == 192  ✗
  
  Résultat : false (CLIENT DISTANT)
```

---

## ⏱️ Timeline durées de session

```
Client LOCAL (auto-login activé)
╔═══════════════════════════════════════════════════════════════╗
║                         TTL = 1 AN                            ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ ███████████████████████████████████████████████████████  │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║  0s                                            31 536 000s    ║
╚═══════════════════════════════════════════════════════════════╝

Client LOCAL (login manuel)
╔═══════════════════════════════════════════════════════════════╗
║                      TTL = 30 JOURS                           ║
║  ┌────────────────────────────────────────────┐               ║
║  │ ███████████████████████████████████████  │               ║
║  └────────────────────────────────────────────┘               ║
║  0s                               2 592 000s                  ║
╚═══════════════════════════════════════════════════════════════╝

Client DISTANT (keepAlive)
╔═══════════════════════════════════════════════════════════════╗
║                       TTL = 1 JOUR                            ║
║  ┌─────────────┐                                              ║
║  │ ██████████  │                                              ║
║  └─────────────┘                                              ║
║  0s      86 400s                                              ║
╚═══════════════════════════════════════════════════════════════╝

Client DISTANT (normal)
╔═══════════════════════════════════════════════════════════════╗
║                       TTL = 1 HEURE                           ║
║  ┌───┐                                                        ║
║  │ █ │                                                        ║
║  └───┘                                                        ║
║  0s 3600s                                                     ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🔄 Cycle de validation session (frontend)

```
┌───────────────────────────────────────────────────────────────┐
│  setInterval(checkSessionValidity, 60000)                     │
│  → Toutes les 60 secondes                                     │
└───────────────────────────────────────────────────────────────┘

Chaque 60s :
  ┌─────────────────────────────────────┐
  │ 1. Lire localStorage                │
  │    - maPiscineExpiry                │
  └───────────┬─────────────────────────┘
              │
              ▼
  ┌─────────────────────────────────────┐
  │ 2. Comparer timestamp actuel        │
  │    now vs expiry                    │
  └───────────┬─────────────────────────┘
              │
              ├───> [Si now < expiry]
              │     → Session valide, continuer
              │
              └───> [Si now >= expiry]
                    → Session expirée
                    → Supprimer localStorage
                    → showToast("Session expirée")
                    → Redirect #pageLogin
```

---

## 📊 Matrice de décision TTL

```
┌────────────┬──────────────┬──────────────┬──────────────┐
│  Contexte  │  isLocal()   │ keepAlive    │   TTL        │
├────────────┼──────────────┼──────────────┼──────────────┤
│ Auto-login │     true     │     N/A      │  1 an        │
│ Local      │     true     │     N/A      │  30 jours    │
│ Distant    │     false    │     true     │  1 jour      │
│ Distant    │     false    │     false    │  1 heure     │
└────────────┴──────────────┴──────────────┴──────────────┘

Légende :
  ▓▓▓ = Très sécurisé (1h)
  ▒▒▒ = Sécurisé (1j/30j)
  ░░░ = Confort maximum (1 an)
```

---

**Date** : 26 janvier 2026  
**Auteur** : Ludovic Sorriaux  
**Version** : 1.0
