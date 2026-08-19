# TOCHECK — Zones d'ombre à faire valider par l'auteur

Ce fichier liste les comportements peu clairs, incohérences apparentes ou dépendances possiblement mortes, trouvés en lisant le code actuel de **ce projet** (`maPiscinev4.5Web-d1_mini`), que je n'ai pas pu trancher avec certitude sans accès au code du contrôleur ESP32 (`maPiscinev4Controler-ESP32`) ou sans test sur le matériel réel. Chaque point décrit le doute plutôt que de l'affirmer tranché — merci de confirmer/infirmer.

## 1. ~~Incompatibilité potentielle backend/frontend sur l'encodage de `IND_Alerte`~~ — RÉSOLU (2026-08-19)

Vérifié directement dans le firmware contrôleur (`alertes.h`/`alertes.cpp`, `maPiscinev4Controler-ESP32`) : c'était l'hypothèse (a). Le contrôleur envoie bien un vrai bitmask 7 bits (`ALERT_INONDATION=1` … `ALERT_FILTRATION_COURTE=7`, combinés via `1 << (element-1)`) depuis la refonte du système d'alertes. Le commentaire de `include/globalPiscineWeb.h` décrivait l'ancien schéma énuméré 0-15, devenu obsolète — corrigé pour refléter le vrai bitmask. Le décodage du frontend (`piscinePrincipale.js`) était déjà correct, aucun changement de logique nécessaire côté JS.

## 2. `showSessionExpiredDialog()` référence des variables hors de son scope

Dans `html/js/piscineScripts.js`, la fonction `showSessionExpiredDialog(action)` (lignes ~255-286) utilise `sessionData`, `now` et `timeRemaining` comme si elles étaient accessibles, alors que ce sont des variables locales déclarées uniquement dans `checkSessionValidity()` (une autre fonction). Elle est appelée depuis deux endroits :
- `checkSessionValidity()` elle-même (où ces variables *sont* en scope, car même portée locale JS... à vérifier si l'appel se fait bien avant la fin de la fonction) ;
- `onPageError()` (déclenché sur une réponse HTTP 400 contenant "Invalid Session"), où ces variables sont indéfinies.
- **À vérifier** : le second cas d'appel provoque-t-il réellement une erreur JavaScript en conditions réelles (navigateur avec console ouverte lors d'une expiration de session déclenchée par une requête AJAX) ? Si oui, l'affichage du dialog de fin de session serait cassé dans ce cas précis (redirection vers login sans message explicatif, ou blocage total selon la tolérance du navigateur aux erreurs JS).

## 3. Double persistance de la configuration (EEPROM + fichier JSON LittleFS)

`src/maPiscineWeb.cpp` maintient **deux** mécanismes de sauvegarde de la configuration (mot de passe admin, utilisateurs, réseaux WiFi) :
- `loadConfigurationEEprom()` / `saveConfigurationEEprom()` — ancien mécanisme, EEPROM émulée, adresses 0 à `sizeof(config)`.
- `loadConfiguration()` / `saveConfiguration()` — fichier `/cfg/piscine.cfg` sur LittleFS, format JSON.

Au démarrage (`setup()`), seul `loadConfiguration()` (JSON/LittleFS) est appelé — `loadConfigurationEEprom()` n'apparaît **pas** dans le flux observé de `setup()`. Et `saveNewConfiguration()` (appelée par le portail WiFiManager après une nouvelle saisie de credentials, et par certains handlers HTTP) n'appelle que `saveConfiguration()` (JSON) — pas `saveConfigurationEEprom()`. Les fonctions EEPROM semblent donc ne plus être exercées par aucun chemin actif identifié, mais une recherche exhaustive de tous leurs appelants n'a pas été menée à 100% (fichier `maPiscineWeb.cpp` volumineux, 1468 lignes).
- **À vérifier** : `loadConfigurationEEprom()` et `saveConfigurationEEprom()`/`printConfigurationEEprom()` sont-elles encore appelées quelque part dans le code actif, ou sont-elles des vestiges d'une ancienne persistance EEPROM totalement remplacée par le fichier JSON ? Si vestiges, elles peuvent être supprimées (avec la portion EEPROM.begin/write correspondante) sans risque.

## 4. `/jsonConfig` accessible sans authentification

La route `ANY /jsonConfig` (`PiscineWeb.cpp`, `showJsonConfig`) ne vérifie ni session ni mot de passe avant de renvoyer le contenu JSON de `config` — qui inclut les hash de mots de passe (admin + utilisateurs) et les identifiants/mots de passe WiFi enregistrés. C'est manifestement une route de debug.
- **À vérifier** : est-ce intentionnel (outil de diagnostic local, jamais exposé au WAN car le reverse-proxy ne route que certaines routes), ou un oubli de protection à corriger ? Si le reverse-proxy WAN (mentionné dans la mémoire projet) route `/` en général plutôt que des chemins ciblés, cette route serait exposée publiquement.

## 5. Incohérence de vérification du mot de passe admin selon les endpoints

- `handleDeleteUsers` compare le mot de passe admin fourni au champ `config.adminPassword` avec `strcmp` (comparaison en clair), alors que ce champ est normalement hashé au format `SEL:HASH` après la migration (`_migratePasswords()`, exécutée au premier démarrage suivant la mise à jour du firmware).
- Les routes `/upload` et `/listdir` comparent également un paramètre `adminPassword` — méthode de comparaison à confirmer précisément (comparaison directe ou passage par `_checkPassword`).
- **À vérifier** : ces comparaisons en clair sont-elles un bug résiduel d'avant l'introduction du hashage (oubli de mise à jour lors de l'ajout de `_hashPassword`/`_checkPassword`), ou existe-t-il un mécanisme de contournement qui les rend fonctionnelles malgré tout (par exemple si `config.adminPassword` n'est en pratique jamais migré) ? Si c'est un bug, la suppression d'utilisateurs et/ou l'upload de fichiers seraient impossibles en usage normal après la première migration de mot de passe.

## 6. `handleUserProfile` stocke le mot de passe modifié en clair

Contrairement à `handleRegister` et `handleChangAdminPW` qui appellent `_hashPassword()`, `handleUserProfile` semble copier directement le nouveau mot de passe fourni par l'utilisateur (`strncpy`) sans le hasher. Le mot de passe seraît donc stocké en clair jusqu'au prochain redémarrage du boîtier (où `_migratePasswords()` le hasherait rétroactivement).
- **À vérifier** : confirmer ce comportement en relisant `handleUserProfile` dans son intégralité (le rapport d'analyse le signale mais une revue manuelle ligne à ligne serait utile avant correction), et si confirmé, décider si c'est un oubli à corriger (appeler `_hashPassword` comme les autres handlers).

## 7. `indexesDef.h` — table de libellés obsolète, confirmée non incluse

Recherche exhaustive (`grep -rn "indexesDef" src include html`, `grep -rln "nomParam" src include html`) : le fichier `include/indexesDef.h` n'est inclus par **aucun** `.cpp`/`.h` du projet, et sa table `nomParam[]` (43 entrées, mapping différent de `IndexNames.h` actuel) n'est référencée nulle part. C'est du **code mort confirmé**, sans ambiguïté — mentionné ici pour traçabilité, mais ce point ne nécessite pas d'arbitrage : il peut être supprimé sans risque dès que souhaité (hors périmètre de cette mission, qui ne modifie aucun fichier `.h`).

## 8. `html/js/localAuth.js.backup` — fichier mort confirmé, mais à vérifier pour intention

Confirmé par recherche des balises `<script>` de `main.html` : ce fichier n'est jamais chargé. La logique d'auto-login qu'il contenait a été reportée dans `piscineScripts.js`. Le fichier `css/localAuth.css` reste utilisé (styles des notifications toast). Un gabarit `html/main_example_autologin.txt` existe également à la racine de `html/`, non chargé non plus.
- **À vérifier** : ces fichiers `.backup`/`.txt` sont-ils volontairement conservés comme référence historique, ou peuvent-ils être supprimés ? (Décision hors périmètre technique pur — question d'intention de l'auteur.)

## 9. Champ `dataStruct.destination` jamais renseigné côté web

La structure `dataStruct{index, destination, value}` utilisée pour les échanges ICSC voit son champ `destination` toujours transmis à sa valeur par défaut (0, jamais explicitement positionné) dans le code de ce module.
- **À vérifier** : ce champ est-il exploité côté contrôleur (par exemple pour du routage multi-systèmes, cohérent avec les identifiants `PISCINE_ID`/`ARROSAGE_ID`/etc. de `globalPiscine.h`), ou est-ce un vestige d'un protocole plus générique jamais utilisé dans le sens web→contrôleur ?

## 10. `IND_PACAutonome` (index 56) — absent de toute logique observée

L'index 56 (`pacAutonome`) est défini dans `globalPiscineWeb.h` et nommé dans `IndexNames.h`, mais aucune référence à un traitement spécifique (lecture, écriture, condition) n'a été trouvée dans `PiscineWeb.cpp`, `PiscineWebTelecom.cpp` ou `PiscineWebActionControler.cpp` au-delà de son passage générique dans le tableau `piscineParams[]`.
- **À vérifier** : ce paramètre est-il exploité côté frontend (page Paramètres) et/ou côté contrôleur uniquement, ou s'agit-il d'un index réservé pour une fonctionnalité pas encore branchée côté web ?

## 11. Comportement en cas d'absence prolongée de carte SD

`Logger::flushLogsToSD()` ne fait rien (no-op implicite) si `cardPresent == false`. Le tampon LittleFS (`/buf/log_buf.log`, `/buf/alert_buf.log`) continue alors de grossir indéfiniment tant que la SD reste absente, sans mécanisme de purge/rotation observé dans le code lu.
- **À vérifier** : existe-t-il une limite de taille ou une politique de rotation de ces fichiers tampon quelque part (pas trouvée dans `Logger.h`/`logger.cpp`), et que se passe-t-il concrètement si LittleFS (1 Mo de partition) sature — écriture silencieusement ignorée, erreur gérée, crash ? Ce scénario n'a pas pu être testé sans matériel.

## 12. Ancien système de chargement des graphiques (`handlePiscineGraphDatas`) toujours présent à côté du système "chunké"

`PiscineWeb.cpp` contient à la fois l'ancien handler `handlePiscineGraphDatas` (lecture bornée à 64 Ko en une fois, avec un commentaire signalant un risque de *Soft WDT reset* pour de gros historiques) et le nouveau système en 3 étapes (`handleGraphPlan`/`handleGraphFileInfo`/`handleGraphChunk`). Le frontend (`piscineGraphs.js`) semble utiliser le système chunké pour les chargements normaux.
- **À vérifier** : l'ancien handler est-il encore appelé par une route active (`server.on` documenté vers lui) ou par un vieux morceau du frontend, ou est-ce du code mort conservé "au cas où" ? S'il reste accessible via une route active, il représente un risque de reset watchdog en usage réel sur de longues périodes, contredisant la raison d'être du système chunké.

## 13. Aucune trace de RF24 / ESP-NOW / ManagerTelecom — confirmé

Recherche exhaustive (`grep -rniE "RF24|ESP-?NOW|ManagerTelecom"` sur `src/`, `include/`, `html/`) : seules deux occurrences, toutes deux des labels de commentaires historiques inoffensifs dans `src/maPiscineWeb.cpp` (aucun code actif). Ce point ne nécessite pas d'arbitrage — confirmation positive que la suppression de cet ancien sous-système radio est bien totale dans ce module, mentionnée ici uniquement pour traçabilité de la vérification demandée.
