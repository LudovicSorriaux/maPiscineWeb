# TOCHECK — Zones d'ombre à faire valider par l'auteur

Ce fichier liste les comportements peu clairs, incohérences apparentes ou dépendances possiblement mortes, trouvés en lisant le code actuel de **ce projet** (`maPiscinev4.5Web-d1_mini`), que je n'ai pas pu trancher avec certitude sans accès au code du contrôleur ESP32 (`maPiscinev4Controler-ESP32`) ou sans test sur le matériel réel. Chaque point décrit le doute plutôt que de l'affirmer tranché — merci de confirmer/infirmer.

## 2. `showSessionExpiredDialog()` référence des variables hors de son scope — RÉSOLU (2026-08-20)

Confirmé et plus grave que documenté : `sessionData`/`now`/`timeRemaining` ne sont en réalité en scope dans **aucun** des deux cas d'appel (JS ne partage pas les variables locales entre fonctions non imbriquées, y compris depuis `checkSessionValidity()` elle-même) — la fonction levait systématiquement une `ReferenceError` dès qu'elle était appelée. Corrigé : la fonction récupère désormais sa propre copie via `maPiscine.Session.getInstance().get()` et gère le cas où aucune donnée de session n'est disponible (dialog dégradé plutôt que plantage).

## 3. Double persistance de la configuration (EEPROM + fichier JSON LittleFS) — RÉSOLU (2026-08-20)

Confirmé : le rationnel "repli si SD indisponible" ne s'appliquait pas (la config JSON vit sur LittleFS, la flash interne — jamais sur SD, qui ne sert qu'aux logs, cf. §11). L'EEPROM était en plus déjà désynchronisée de la structure de config actuelle (ne persistait pas `enableLocalAutoLogin`, ajouté depuis). `loadConfigurationEEprom()`/`saveConfigurationEEprom()`/`printConfigurationEEprom()` **supprimées**. Bug connexe découvert et corrigé au passage : `resetWifiSettingsInConfig()` effaçait le WiFi en mémoire et sur EEPROM (jamais relu) mais n'appelait jamais `saveConfiguration()` (JSON) — le reset ne survivait donc pas à un redémarrage. Ajouté.

## 4. `/jsonConfig` accessible sans authentification — RÉSOLU (2026-08-20)

Protégée par `checkSessionParam()`, comme les autres routes sensibles.

## 5. Incohérence de vérification du mot de passe admin selon les endpoints — RÉSOLU (2026-08-20)

Confirmé : `/upload` et `/listdir` utilisaient déjà correctement `_checkPassword()`. Seul `handleDeleteUsers` comparait en clair (`strcmp`) — cassé depuis la migration des mots de passe vers le hachage. Corrigé (remplacé par `_checkPassword()`).

## 6. `handleUserProfile` stocke le mot de passe modifié en clair — RÉSOLU, périmètre élargi (2026-08-20)

Confirmé, et plus grave que documenté : la fonction ne vérifiait **aucune authentification** (ni session, ni mot de passe admin, ni même l'ancien mot de passe de l'utilisateur ciblé) — n'importe qui pouvait changer le mot de passe de n'importe quel compte en connaissant juste son nom d'utilisateur. Corrigé : ajout d'une vérification de session (`checkSessionParam`) et du mot de passe admin (`_checkPassword`), hachage du nouveau mot de passe (`_hashPassword`). Bug connexe découvert et corrigé au passage : le champ HTML réellement soumis s'appelle `userpasswordprofile`, mais le backend lisait un paramètre `password` qui n'existait pas dans le formulaire — le changement de mot de passe ne pouvait donc jamais fonctionner, même avant ce correctif.

## 7. `indexesDef.h` — RÉSOLU (2026-08-20)

Code mort confirmé, **supprimé**.

## 8. `html/js/localAuth.js.backup` + `html/main_example_autologin.txt` — RÉSOLU (2026-08-20)

Fichiers morts confirmés (jamais chargés), **supprimés**.

## 9. Champ `dataStruct.destination` jamais renseigné côté web — RÉSOLU (2026-08-20)

Vérifié dans le firmware contrôleur (`Transmission.cpp`) : le champ est bien exploité, mais uniquement dans le sens réception — le contrôleur le renseigne lui-même (`CLAVIER`/`WEB`) selon la liaison série UART qui a livré le message, pour router l'écho de la commande. Le module web n'a jamais besoin de le positionner en émission. Comportement normal, pas un vestige.

## 10. `IND_PACAutonome` (index 56) — RÉSOLU (2026-08-20)

Vérifié dans le firmware contrôleur : pilote `checkPACAutonome()` (alertes.cpp), entièrement côté contrôleur. Le module web n'a pas besoin de logique dédiée — c'est un simple réglage transmis comme les autres via `piscineParams[]`.

## 11. Comportement en cas d'absence prolongée de carte SD

`Logger::flushLogsToSD()` ne fait rien (no-op implicite) si `cardPresent == false`. Le tampon LittleFS (`/buf/log_buf.log`, `/buf/alert_buf.log`) continue alors de grossir indéfiniment tant que la SD reste absente, sans mécanisme de purge/rotation observé dans le code lu.
- **À vérifier** : existe-t-il une limite de taille ou une politique de rotation de ces fichiers tampon quelque part (pas trouvée dans `Logger.h`/`logger.cpp`), et que se passe-t-il concrètement si LittleFS (1 Mo de partition) sature — écriture silencieusement ignorée, erreur gérée, crash ? Ce scénario n'a pas pu être testé sans matériel.

## 12. Ancien système de chargement des graphiques (`handlePiscineGraphDatas`) — RÉSOLU (2026-08-20)

Confirmé : enregistré via le routeur d'actions générique (`action=getGraphDatas`) mais jamais appelé par le frontend actuel (`piscineGraphs.js` utilise le système chunké). **Supprimé** (handler + déclaration + entrée du routeur d'actions).
