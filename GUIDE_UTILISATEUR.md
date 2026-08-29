# Guide utilisateur — Interface web de la piscine

Ce guide s'adresse au propriétaire de la piscine, pas à un développeur. Il explique comment utiliser le site web qui permet de surveiller et piloter la piscine depuis un ordinateur, une tablette ou un téléphone.

## 1. Vue d'ensemble

L'interface web est la fenêtre par laquelle vous consultez et pilotez votre piscine à distance : température de l'eau, pH, taux de chlore, état des pompes, mode automatique ou manuel, historique sous forme de graphiques, réglages, et alertes en cas de problème (inondation, manque de produit, panne...).

Elle fonctionne dans un navigateur (Chrome, Safari, Firefox...), sur téléphone comme sur ordinateur, et se met à jour **en temps réel** : pas besoin de recharger la page pour voir une nouvelle mesure de température ou de pH.

Le boîtier qui héberge ce site web est un petit module séparé du boîtier de régulation principal ; il sert uniquement d'intermédiaire entre votre navigateur et l'installation. Si votre réseau WiFi tombe en panne ou si le boîtier redémarre, l'interface redevient accessible automatiquement une fois la connexion rétablie, en général en quelques dizaines de secondes.

## 2. Comment se connecter

### 2.1 Adresse d'accès

Depuis un appareil connecté au **même réseau WiFi que la piscine**, ouvrez `http://mapiscine.local` (ou l'adresse IP du boîtier si le nom ne fonctionne pas sur votre appareil).

### 2.2 Connexion automatique (auto-login local)

Si vous êtes sur le réseau WiFi de la maison, l'application peut vous reconnaître automatiquement et vous ouvrir directement l'écran principal, **sans avoir à saisir d'identifiant ni de mot de passe**. C'est le comportement par défaut.

- Cette reconnaissance automatique peut être désactivée depuis la page **Paramètres** (interrupteur "connexion automatique locale") si vous préférez toujours saisir un mot de passe, même à la maison.
- Si vous accédez à l'interface depuis l'extérieur de votre domicile (via Internet), la connexion automatique ne s'active jamais : un mot de passe est toujours demandé, c'est normal et voulu — c'est ce qui protège votre installation d'un accès non désiré depuis l'extérieur.
- Après une coupure de courant ou un redémarrage du boîtier, il est possible qu'une reconnexion automatique en cache localement sur votre appareil soit rejetée une fois par le serveur (le boîtier "oublie" les connexions en cours à chaque redémarrage) — dans ce cas, l'application vous ramène simplement vers l'écran de connexion.

### 2.3 Connexion manuelle

Saisissez votre identifiant et votre mot de passe sur l'écran de connexion. Une case "rester connecté" permet de rester identifié plus longtemps (environ 1 jour au lieu d'une heure sans cette case cochée) lorsque vous vous connectez depuis l'extérieur.

### 2.4 Session expirée

Après une période d'inactivité (ou lorsque le délai maximal de connexion est écoulé), l'application vous prévient environ 5 minutes avant l'expiration par une petite notification, puis vous redemande de vous connecter. Vos réglages ne sont jamais perdus dans ce cas : seule la connexion doit être renouvelée.

## 3. Lire l'écran principal

L'écran principal (première page après connexion) affiche en un coup d'œil :

- **Les températures** : eau, air, local technique, et éventuellement la température en sortie de pompe à chaleur.
- **Les jauges de qualité d'eau** : pH (idéalement autour de 7.2) et, au choix (un tap sur la jauge fait basculer l'affichage), soit le taux de chlore soit le potentiel Redox — les zones de couleur (vert/orange/rouge) indiquent si la valeur est dans la bonne plage.
- **Les voyants d'état** : pompe de filtration, pompe à chaleur, pompe pH, pompe chlore, pompe du 3ᵉ produit (algicide ou autre selon votre configuration), lampe, volet, et le mode Auto/Manuel.
- **La bannière d'alerte** : si un problème est détecté, un bandeau rouge apparaît en haut de l'écran avec le ou les messages concernés (voir section 6).

## 4. Configurer les paramètres

La page **Paramètres** regroupe tous les réglages : plages horaires de filtration, plages de fonctionnement de la lampe et du volet, consigne de la pompe à chaleur (température fixe ou relative à la température extérieure), dosage des produits (pH, chlore), débit des pompes doseuses, volume de la piscine, seuils et polarité des capteurs d'alerte, activation/désactivation de la connexion automatique locale, et pilotage de la pompe à chaleur par le routeur solaire si vous en possédez un.

Chaque réglage est appliqué **dès que vous le modifiez** (interrupteur, curseur, champ) — il n'y a pas de bouton "Enregistrer" global à valider en fin de page.

## 5. Utiliser la page Maintenance

La page **Maintenance** sert aux opérations ponctuelles qu'un utilisateur avancé effectue de temps en temps :

- **Étalonnage du pH** : à l'aide de solutions tampons (pH 4, 7 et éventuellement 9), vous pouvez recalibrer la sonde pH pour garantir des mesures précises. La page vous guide pas à pas (lancement du scan, lecture de la mesure brute, validation).
- **Étalonnage du Redox/chlore** : même principe avec deux solutions de référence (basse et haute).
- **Sondes de température** : si vous ajoutez, remplacez ou déplacez une sonde de température, cette page permet de scanner le réseau de sondes détectées et d'attribuer à chacune son rôle (eau, air, sortie PAC).

Si vous quittez la page Maintenance en cours d'étalonnage sans valider, l'opération en cours est annulée automatiquement — pensez à valider avant de changer de page si vous voulez conserver le résultat.

## 6. Comprendre et acquitter les alertes

Quand un problème est détecté par l'installation, un bandeau rouge apparaît sur l'écran principal avec un ou plusieurs des messages suivants :

- **Inondation** — un débordement d'eau a été détecté.
- **Absence de flux d'eau** — la pompe de filtration tourne mais l'eau ne circule pas (filtre bouché, vanne fermée, pompe défaillante...).
- **Problème PAC** — anomalie sur la pompe à chaleur.
- **Plus de pH+/pH-** — la pompe doseuse de pH est à court de produit.
- **Plus de chlore** — la pompe doseuse de chlore est à court de produit.
- **Plus de produit pompe 3** — le 3ᵉ bidon (algicide ou autre produit configuré) est vide.
- **Fenêtre de filtration trop courte** — la plage horaire de filtration configurée est jugée insuffisante par rapport aux besoins de traitement.

Un bouton présent dans la bannière permet d'**acquitter** l'alerte (reconnaître que vous en avez pris connaissance) une fois le problème traité (bidon rempli, pompe redémarrée, etc.). L'acquittement est global : il efface l'ensemble des alertes actives en une seule action, il n'existe pas de bouton pour acquitter un seul message à la fois si plusieurs alertes sont actives simultanément.

Certaines alertes peuvent être désactivées individuellement depuis la page Paramètres (par exemple si vous n'utilisez pas de capteur de débit) — ce réglage change ce qui est surveillé, il ne doit pas être confondu avec l'acquittement d'une alerte déjà déclenchée.

## 7. Récupérer des fichiers (page technique `/upload`)

Une page technique, séparée de l'application principale, permet de gérer les fichiers stockés sur le boîtier — notamment les fichiers de log (relevés quotidiens, moyennes, alertes) enregistrés sur la carte SD. Elle est réservée à un usage avancé (mise à jour de fichiers, récupération de logs pour analyse) et n'est pas accessible depuis le menu de l'application.

- **Accès** : ouvrez `http://mapiscine.local/upload`. Un mot de passe **administrateur** est demandé (différent, le cas échéant, de votre mot de passe utilisateur habituel) — sans lui, aucune action n'est possible.
- **Consulter le contenu d'un dossier** : une fois le mot de passe saisi, indiquez un chemin (par exemple `/log/2026/logs/aout/`) dans le champ prévu — le contenu du dossier s'affiche automatiquement en dessous, avec la taille et la date de chaque fichier.
- **Télécharger un fichier** : à côté de chaque fichier listé, un lien **⬇ télécharger** déclenche son enregistrement directement dans votre navigateur, comme n'importe quel téléchargement classique — pratique pour récupérer un log et l'ouvrir dans un tableur.
- **Envoyer un fichier** (mise à jour) : à réserver aux personnes qui savent ce qu'elles font, cette même page permet aussi d'envoyer un fichier vers le boîtier ; une mauvaise manipulation ici peut rendre l'application inaccessible.

## 8. Dépannage courant

**L'application n'affiche aucune donnée ou reste bloquée sur "connexion..."**
Vérifiez que votre appareil est bien connecté au WiFi de la maison, ou que la connexion Internet fonctionne si vous êtes à l'extérieur. Rechargez la page.

**Je suis redirigé vers l'écran de connexion alors que je pensais être connecté**
Votre session a expiré, ou le boîtier a redémarré récemment (une coupure de courant, par exemple) — reconnectez-vous simplement, aucune donnée n'est perdue.

**Les valeurs affichées ne bougent plus / semblent figées**
Rechargez complètement la page (fermer et rouvrir l'onglet, ou tirer vers le bas sur mobile). Si le problème persiste au-delà de quelques minutes, il est possible que la communication entre le boîtier web et le boîtier de régulation principal soit temporairement interrompue — les commandes ne seront pas prises en compte tant que cette communication n'est pas rétablie.

**Une alerte reste affichée alors que j'ai réglé le problème**
Utilisez le bouton d'acquittement dans la bannière rouge. Si l'alerte réapparaît immédiatement, c'est que la cause n'est pas encore réellement résolue (par exemple le niveau du bidon est encore trop bas).

**Je n'arrive plus à me connecter (mot de passe oublié, etc.)**
Contactez la personne qui a mis en place l'installation — la gestion des utilisateurs et du mot de passe administrateur se fait depuis le menu utilisateur de l'application, accessible une fois connecté avec un compte disposant des droits nécessaires.

**Le WiFi de la maison a changé (nouvelle box, nouveau mot de passe)**
Le boîtier tentera de se reconnecter automatiquement s'il retrouve un réseau déjà connu. S'il n'y parvient pas après plusieurs minutes, il proposera son propre réseau WiFi temporaire de configuration (visible dans la liste des réseaux WiFi disponibles depuis votre téléphone) permettant de lui indiquer les nouveaux identifiants.
