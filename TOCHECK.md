# TOCHECK — Zones d'ombre à faire valider par l'auteur

Ce fichier liste les comportements peu clairs, incohérences apparentes ou dépendances possiblement mortes, trouvés en lisant le code actuel de **ce projet** (`maPiscinev4.5Web-d1_mini`), que je n'ai pas pu trancher avec certitude sans accès au code du contrôleur ESP32 (`maPiscinev4Controler-ESP32`) ou sans test sur le matériel réel. Chaque point décrit le doute plutôt que de l'affirmer tranché — merci de confirmer/infirmer.

## 2. `showSessionExpiredDialog()` référence des variables hors de son scope

Dans `html/js/piscineScripts.js`, la fonction `showSessionExpiredDialog(action)` (lignes ~255-286) utilise `sessionData`, `now` et `timeRemaining` comme si elles étaient accessibles, alors que ce sont des variables locales déclarées uniquement dans `checkSessionValidity()` (une autre fonction). Elle est appelée depuis deux endroits :
- `checkSessionValidity()` elle-même (où ces variables *sont* en scope, car même portée locale JS... à vérifier si l'appel se fait bien avant la fin de la fonction) ;
- `onPageError()` (déclenché sur une réponse HTTP 400 contenant "Invalid Session"), où ces variables sont indéfinies.
- **À vérifier** : le second cas d'appel provoque-t-il réellement une erreur JavaScript en conditions réelles (navigateur avec console ouverte lors d'une expiration de session déclenchée par une requête AJAX) ? Si oui, l'affichage du dialog de fin de session serait cassé dans ce cas précis (redirection vers login sans message explicatif, ou blocage total selon la tolérance du navigateur aux erreurs JS).

## 3. Double persistance de la configuration (EEPROM + fichier JSON LittleFS) — RÉSOLU (2026-08-20)

Confirmé : le rationnel "repli si SD indisponible" ne s'appliquait pas (la config JSON vit sur LittleFS, la flash interne — jamais sur SD, qui ne sert qu'aux logs, cf. §11). L'EEPROM était en plus déjà désynchronisée de la structure de config actuelle (ne persistait pas `enableLocalAutoLogin`, ajouté depuis). `loadConfigurationEEprom()`/`saveConfigurationEEprom()`/`printConfigurationEEprom()` **supprimées**. Bug connexe découvert et corrigé au passage : `resetWifiSettingsInConfig()` effaçait le WiFi en mémoire et sur EEPROM (jamais relu) mais n'appelait jamais `saveConfiguration()` (JSON) — le reset ne survivait donc pas à un redémarrage. Ajouté.

## 4. `/jsonConfig` accessible sans authentification

La route `ANY /jsonConfig` (`PiscineWeb.cpp`, `showJsonConfig`) ne vérifie ni session ni mot de passe avant de renvoyer le contenu JSON de `config` — qui inclut les hash de mots de passe (admin + utilisateurs) et les identifiants/mots de passe WiFi enregistrés. C'est manifestement une route de debug.
- **À vérifier** : est-ce intentionnel (outil de diagnostic local, jamais exposé au WAN car le reverse-proxy ne route que certaines routes), ou un oubli de protection à corriger ? Si le reverse-proxy WAN (mentionné dans la mémoire projet) route `/` en général plutôt que des chemins ciblés, cette route serait exposée publiquement.

## 5. Incohérence de vérification du mot de passe admin selon les endpoints — RÉSOLU (2026-08-20)

Confirmé : `/upload` et `/listdir` utilisaient déjà correctement `_checkPassword()`. Seul `handleDeleteUsers` comparait en clair (`strcmp`) — cassé depuis la migration des mots de passe vers le hachage. Corrigé (remplacé par `_checkPassword()`).

## 6. `handleUserProfile` stocke le mot de passe modifié en clair — RÉSOLU, périmètre élargi (2026-08-20)

Confirmé, et plus grave que documenté : la fonction ne vérifiait **aucune authentification** (ni session, ni mot de passe admin, ni même l'ancien mot de passe de l'utilisateur ciblé) — n'importe qui pouvait changer le mot de passe de n'importe quel compte en connaissant juste son nom d'utilisateur. Corrigé : ajout d'une vérification de session (`checkSessionParam`) et du mot de passe admin (`_checkPassword`), hachage du nouveau mot de passe (`_hashPassword`). Bug connexe découvert et corrigé au passage : le champ HTML réellement soumis s'appelle `userpasswordprofile`, mais le backend lisait un paramètre `password` qui n'existait pas dans le formulaire — le changement de mot de passe ne pouvait donc jamais fonctionner, même avant ce correctif.

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

## 12. Ancien système de chargement des graphiques (`handlePiscineGraphDatas`) — RÉSOLU (2026-08-20)

Confirmé : enregistré via le routeur d'actions générique (`action=getGraphDatas`) mais jamais appelé par le frontend actuel (`piscineGraphs.js` utilise le système chunké). **Supprimé** (handler + déclaration + entrée du routeur d'actions).
