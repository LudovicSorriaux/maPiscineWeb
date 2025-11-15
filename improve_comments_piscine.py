#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script amélioration commentaires projet maPiscineWeb
Remplace les commentaires génériques "But : (description automatique)"
par des descriptions explicites pour chaque fonction.
"""

import re
import sys
from pathlib import Path

# Dictionnaire descriptions explicites fonctions
FUNCTION_DESCRIPTIONS = {
    # ===== maPiscinev3Web.cpp - Main Entry Point =====
    
    # Timer Callbacks (9)
    'void doCheckMessages()': 
        "Callback timer : Appelle webTelecom.OnUpdate() pour traiter les messages UART entrants depuis le contrôleur ESP32 (protocole ICSC)",
    
    'void doLogger()': 
        "Callback timer : Appelle logger.OnUpdate() pour gérer l'enregistrement CSV périodique des paramètres piscine sur carte SD",
    
    'void doAction()': 
        "Callback timer : Appelle webAction.OnUpdate() pour vérifier si une nouvelle synchronisation NTP est nécessaire (timeout)",
    
    'void doCheckManagerTelecomConnection()': 
        "Callback timer : Vérifie la connexion ESP-NOW avec le manager PAC et tente reconnexion si perdue",
    
    'void doManagerTelecomManage()': 
        "Callback timer : Envoie les nouvelles valeurs de paramètres piscine au manager ESP-NOW (si actif)",
    
    'void doSendWebParams()': 
        "Callback timer : Appelle maPiscineWeb.OnUpdate() pour envoyer les paramètres mis à jour via SSE vers les clients web",
    
    'void doUpdatePiscineLCD()': 
        "Callback timer : Appelle maPiscineWeb.OnUpdatePiscineLCD() pour rafraîchir l'affichage LCD virtuel (toutes les 10s)",
    
    'void doCheckWIFIConnection()': 
        "Callback timer : Surveille la connexion WiFi et tente reconnexion automatique si déconnexion détectée (basculement timer NOK/OK)",
    
    'void doCheckNTPDate()': 
        "Callback timer : Vérifie la synchronisation NTP et tente nouvelle synchro si échec (basculement timer NOK/OK)",
    
    # WiFi Manager Callbacks (2)
    'void saveConfigCallback()': 
        "Callback WiFi Manager : Levée du flag shouldSaveConfig quand l'utilisateur sauve une nouvelle configuration WiFi",
    
    'void configModeCallback(AsyncWiFiManager *myWiFiManager)': 
        "Callback WiFi Manager : Exécuté lors de l'entrée en mode AP (portail captif). Affiche l'IP du portail de configuration",
    
    # Manager Callbacks (1)
    'void setTheTime(time_t newTime)': 
        "Callback manager : Reçoit l'heure depuis le contrôleur ESP32 et met à jour l'horloge système (setTime), puis relance NTP si nécessaire",
    
    # ISR (1)
    'void IRAM_ATTR interuptCallBackRstWifi()': 
        "ISR (IRAM) : Routine d'interruption bouton reset WiFi (GPIO D2). Lève le flag interrupted pour traitement dans checkInterrupt()",
    
    # Main Functions (2)
    'void setup()': 
        "Initialisation complète ESP8266 : Serial, GPIO, EEPROM, SD card, WiFi, NTP, classes (webTelecom, logger, webAction, maPiscineWeb), et démarrage timers SimpleTimer",
    
    'void loop()': 
        "Boucle principale Arduino : Appelle checkInterrupt() (bouton WiFi reset) puis timer.run() (gestion callbacks périodiques)",
    
    # Setup Functions (2)
    'void initIndexNames()': 
        "Initialise le tableau indexName[IND_TOTAL] avec les noms des paramètres piscine (Temp, pH, Redox, CL, Filtration, etc.) pour affichage web/SD",
    
    'void startSD()': 
        "Monte la carte SD (FAT, CS=D8), affiche le contenu racine et lève le flag cardPresent si succès. Retourne sans erreur si carte absente",
    
    # WiFi Functions (6)
    'bool startWiFi()': 
        "Orchestrateur WiFi complet : 1) Reconnexion au dernier AP, 2) Connexion aux SSIDs stockés (config), 3) Portail captif WiFi Manager si échec",
    
    'bool useWifiManager()': 
        "Lance le portail captif AsyncWiFiManager avec paramètres custom (config.adminPassword, config.user, etc.). Sauve la config si shouldSaveConfig==true",
    
    'char* findPassword(const char *ssid)': 
        "Recherche le mot de passe associé à un SSID dans le tableau config.wifi[]. Retourne pointeur vers password ou nullptr si non trouvé",
    
    'bool WiFiConnect(const char *ssid, const char *passphrase)': 
        "Tente connexion WiFi à un SSID donné avec timeout de 10s. Retourne true si connecté, false si échec",
    
    'bool ConnectWithStoredCredentials()': 
        "Scanne les réseaux WiFi disponibles et tente connexion aux SSIDs stockés dans config.wifi[] (jusqu'à 3 entrées)",
    
    'void resetWifiSettings()': 
        "Efface les paramètres WiFi (config.wifi[] remis à zéro), sauve config sur SD, puis redémarre l'ESP8266",
    
    # Config Functions (9)
    'void loadConfigurationEEprom()': 
        "Charge la configuration admin/user depuis EEPROM (addresses 0-499). Structure : adminPassword(64), user(64), user_password(64), wifi[3].ssid(64), wifi[3].password(64)",
    
    'void saveConfigurationEEprom(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password)': 
        "Sauvegarde config admin/user dans EEPROM (5 entrées : adminPassword, user, user_password, 1er SSID/password). Appelle EEPROM.commit()",
    
    'void printConfigurationEEprom()': 
        "Affiche le contenu de la config EEPROM sur Serial (admin, user, passwords, SSIDs) pour debug",
    
    'void loadConfiguration()': 
        "Charge le fichier /cfg/piscine.cfg (JSON) depuis la SD : config admin/users, wifi SSIDs, seuils piscine (pH, redox, CL, temp, Orp)",
    
    'void saveConfiguration()': 
        "Sauvegarde le fichier /cfg/piscine.cfg (JSON) sur SD : sérialise la structure config complète (admin, users, wifi, seuils piscine)",
    
    'void saveNewConfiguration(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password)': 
        "Met à jour config en mémoire (adminPassword, user, user_password, wifi[0]), puis appelle saveConfiguration() et saveConfigurationEEprom()",
    
    'void printConfiguration()': 
        "Affiche sur Serial la config complète en mémoire (admin, users, wifi, seuils piscine) pour debug",
    
    'void resetWifiSettingsInConfig()': 
        "Efface tous les SSIDs/passwords dans config.wifi[] (3 entrées remises à vide)",
    
    'void printDirectory(File dir, int numTabs)': 
        "Liste récursive du contenu d'un répertoire SD (fichiers + sous-répertoires) avec indentation. Utilisée pour debug SD",
    
    # Helper Functions (5)
    'bool getNTPTime()': 
        "Synchronise l'horloge système via NTP (europe.pool.ntp.org, pool 123). Applique timezone TZ_OFFSET + DST (heure d'été France). Retourne true si succès",
    
    'int dstOffset(time_t newTime)': 
        "Calcule l'offset DST (Daylight Saving Time) pour la France : +3600s si été (dernier dimanche mars 2h -> dernier dimanche octobre 3h), sinon 0",
    
    'String formatBytes(size_t bytes)': 
        "Convertit une taille en octets vers chaîne formatée (B, KB ou MB) selon magnitude (ex: 1536 -> \"1.50 KB\")",
    
    'String getContentType(String filename)': 
        "Détermine le MIME type d'un fichier selon son extension (.html -> text/html, .css -> text/css, .js -> application/javascript, etc.)",
    
    'const char* wl_status_to_string(wl_status_t status)': 
        "Convertit un code de statut WiFi (wl_status_t enum) en chaîne lisible (\"WL_CONNECTED\", \"WL_NO_SSID_AVAIL\", etc.) pour debug",
    
    # Utility (1)
    'void checkInterrupt()': 
        "Détecte si le bouton WiFi reset (D2) a été pressé (flag interrupted). Si oui, appelle resetWifiSettings() après 3s de maintien",
    
    # ===== PiscineWeb.cpp - Web Server Core =====
    
    'PiscineWebClass::PiscineWebClass()': 
        "Constructeur : Initialisation de la classe PiscineWebClass (actuellement vide, juste log)",
    
    'void PiscineWebClass::startup()': 
        "Démarrage complet du serveur web : Appelle startServer() (routes AsyncWebServer) et startMDNS() (mDNS responder piscine.local)",
    
    'void PiscineWebClass::OnUpdate()': 
        "Mise à jour périodique : Appelle MDNS.update(), sendNewParamsPiscine() (SSE push), et manageDebugLCD() si debug actif",
    
    'void PiscineWebClass::OnUpdatePiscineLCD()': 
        "Rafraîchissement affichage LCD : Appelle managePiscineLCD() pour mettre à jour l'écran LCD virtuel (toutes les 10s)",
    
    'void PiscineWebClass::printDirectory(File dir, int numTabs)': 
        "Liste récursive du contenu SD (répertoires + fichiers) avec indentation. Version classe PiscineWebClass (duplicate de maPiscinev3Web.cpp)",
    
    # ===== PiscineWebActionControler.cpp - Action Controller =====
    
    'PiscineWebActionControlerClass::PiscineWebActionControlerClass()': 
        "Constructeur : Initialise la classe PiscineWebActionControlerClass (log debug si activé)",
    
    'void PiscineWebActionControlerClass::setStartupApp()': 
        "Placeholder fonction startup (actuellement vide, réservée pour initialisations futures)",
    
    'void PiscineWebActionControlerClass::initializePiscineParams()': 
        "Réinitialise tous les flags changed* du tableau piscineParams[] (changedWeb, changedFromManager, changedControler = false)",
    
    'void PiscineWebActionControlerClass::refreshData()': 
        "Envoie une demande de synchronisation complète au contrôleur ESP32 via webTelecom.sendAskSyncMess('C')",
    
    'void PiscineWebActionControlerClass::doChangeDate()': 
        "Envoie la nouvelle date/heure au contrôleur ESP32 via webTelecom.sendTimeMess() (appelée après synchro NTP réussie)",
    
    'void PiscineWebActionControlerClass::OnUpdate()': 
        "Vérifie le timeout de synchronisation (timeoutSynch). Si expiré, envoie une demande de synchro complète au contrôleur (refreshData)",
    
    # ===== PiscineWebTelecom.cpp - UART Communication =====
    
    'PiscineWebTelecomClass::PiscineWebTelecomClass()': 
        "Constructeur : Initialise la classe PiscineWebTelecomClass (log debug si activé)",
    
    'void PiscineWebTelecomClass::initTelecom()': 
        "Initialise le protocole ICSC sur Serial (station 'W') et enregistre 7 callbacks : 'V' (data), 'T' (time), 'S' (sync), 'H' (hello), 'A'/'B' (tempAdd), 'E' (etalon)",
    
    'bool PiscineWebTelecomClass::getReadData(dataStruct *tabRead, uint8_t taille)': 
        "Copie les données reçues du buffer readData[] vers tabRead[] (max taille éléments). Retourne true si données disponibles, false si buffer vide",
    
    'void PiscineWebTelecomClass::setWriteData': 
        "Ajoute une donnée (index, valeur) au buffer d'écriture writeData[] pour envoi ultérieur au contrôleur ESP32",
    
    # ===== ManagerTelecom.cpp - ESP-NOW Manager =====
    
    'ManagerTelecomClass::ManagerTelecomClass()': 
        "Constructeur : Initialise la classe ManagerTelecomClass (log debug si activé)",
    
    'void ManagerTelecomClass::managerTelecomInitialisation()': 
        "Initialise ESP-NOW : Affiche MAC/channel, appelle InitESPNow(), envoie message Hello en broadcast si manager non trouvé",
    
    'void ManagerTelecomClass::setTimeCallBack(void (*theTimeCallBack)(time_t thetime))': 
        "Enregistre un callback externe pour mise à jour heure (pointeur de fonction, ex: setTheTime)",
    
    'void ManagerTelecomClass::reconnectControlerTelecom()': 
        "Vérifie connexion ESP-NOW au manager. Si perdue, relance managerTelecomInitialisation(). Affiche log toutes les 100 vérifications si OK",
    
    'bool ManagerTelecomClass::isControlerTelecomconnected()': 
        "Retourne true si le manager ESP-NOW a été trouvé (foundManager==true), false sinon",
    
    'void ManagerTelecomClass::askNewTime()': 
        "Envoie un message ESP-NOW de type CLIENT_ASKING_TIME pour demander l'heure au manager PAC",
    
    'bool ManagerTelecomClass::isTimeSych()': 
        "Retourne true si l'heure a été synchronisée avec le manager (flgTimeSynch==true), false sinon",
    
    'void ManagerTelecomClass::writeContent(uint8_t character)': 
        "Ajoute un caractère au buffer outputString[] pour envoi ESP-NOW (utilisé pour messages texte vers terminal manager)",
    
    'void ManagerTelecomClass::setFlgWaitAckRefresh(bool etat)': 
        "Définit le flag d'attente d'acquittement pour rafraîchissement LCD (flgWaitAckRefresh = etat)",
    
    'void ManagerTelecomClass::printToTerminal()': 
        "Envoie le buffer outputString[] via ESP-NOW (message WRITE_TERMINAL_FROM_SLAVE). Utilisé pour debug/log sur manager",
    
    'void ManagerTelecomClass::sendNewValue(uint8_t index,int16_t valeur)': 
        "Envoie une paire (index, valeur) au manager via ESP-NOW (message DATA_FOR_MANAGER)",
    
    'void ManagerTelecomClass::sendToManagerNewValues()': 
        "Parcourt piscineParams[] et envoie toutes les valeurs changedFromManager==true au manager ESP-NOW",
    
    'void ManagerTelecomClass::sendSyncMess(uint8_t typeSync)': 
        "Envoie un message de synchronisation ESP-NOW au manager (type: LCD_REFRESH, ASK_FOR_SYNC_DATA, etc.)",
    
    'bool ManagerTelecomClass::InitESPNow()': 
        "Initialise le sous-système ESP-NOW (WiFi.mode(WIFI_STA), esp_now_init). Redémarre si échec. Retourne true si succès",
    
    'void ManagerTelecomClass::registerSendCallback()': 
        "Enregistre le callback ESP-NOW d'envoi (sentCallback) via esp_now_register_send_cb",
    
    'void ManagerTelecomClass::registerRecvCallback()': 
        "Enregistre le callback ESP-NOW de réception (receiveCallback) via esp_now_register_recv_cb",
    
    'void ManagerTelecomClass::formatMacAddressToStr(const uint8_t *macAddr, char *buffer, int maxLength)': 
        "Convertit une adresse MAC (6 octets) en chaîne formatée \"XX:XX:XX:XX:XX:XX\" (buffer préalloué)",
    
    'bool ManagerTelecomClass::registerPeer(uint8_t peerMac[])': 
        "Enregistre un peer ESP-NOW (adresse MAC manager) dans la liste des pairs. Retourne true si succès",
    
    'bool ManagerTelecomClass::compareMacAdd(uint8_t *mac1, uint8_t *mac2)': 
        "Compare 2 adresses MAC (6 octets). Retourne true si identiques, false sinon",
    
    'void ManagerTelecomClass::receiveCallback(uint8_t *macAddr, uint8_t *data, uint8_t dataLen)': 
        "Callback ESP-NOW de réception : Parse les messages entrants (MANAGER_HELLO, SENDING_TIME, DATA_FROM_MANAGER, etc.) et met à jour l'état",
    
    'void ManagerTelecomClass::doCallbacks()': 
        "Traite les callbacks différés (time sync, data update) en appelant les fonctions enregistrées (timeCallback, etc.)",
    
    'void ManagerTelecomClass::sentCallback(uint8_t *macAddr, uint8_t status)': 
        "Callback ESP-NOW d'envoi : Log le statut de transmission (success/error) et affiche l'adresse MAC destinataire",
    
    'void ManagerTelecomClass::getMessageType(uint8_t messId, char *messagetypeStr)': 
        "Convertit un ID de message ESP-NOW (enum messageType) en chaîne lisible (\"MANAGER_HELLO\", \"SENDING_TIME\", etc.)",
    
    'void ManagerTelecomClass::printDate(time_t newDate)': 
        "Affiche une date time_t formatée (DD/MM/YYYY HH:MM:SS) sur Serial pour debug",
    
    'String ManagerTelecomClass::toString(int16_t valeur, int8_t divider)': 
        "Convertit int16_t en String avec division optionnelle (ex: 235 divisé par 10 -> \"23.5\")",
    
    'float ManagerTelecomClass::roundFloat(float num,int precision)': 
        "Arrondit un float à N décimales (precision). Ex: roundFloat(3.14159, 2) -> 3.14",
    
    'String ManagerTelecomClass::toHeureFormat(int16_t mn)': 
        "Convertit un temps en minutes (int16_t) en format HH:MM (String). Ex: 125 -> \"02:05\"",
    
    # ===== logger.cpp - SD Card Logger =====
    
    'LoggerClass::LoggerClass()': 
        "Constructeur : Initialise la classe LoggerClass (log debug si activé)",
    
    'bool LoggerClass::initDirs()': 
        "Crée l'arborescence SD /Log/YYYY/Alerts et /Log/YYYY/Logs/MONTH si absente. Retourne true si succès",
    
    'void LoggerClass::OnUpdate()': 
        "Mise à jour périodique : Vérifie changement mois/jour, crée nouveaux fichiers log (alerts, logs CSV), écrit les valeurs piscineParams[] sur SD",
}


def replace_generic_comment_blocks(file_path: Path) -> bool:
    """
    Remplace les blocs commentaires génériques multi-lignes par des @brief.
    
    Format recherché :
      /*
       * FunctionName
       * But : (description automatique) — expliquer brièvement l'objectif de la fonction
       * Entrées : voir la signature de la fonction (paramètres)
       * Sortie : valeur de retour ou effet sur l'état interne
       */
    
    Args:
        file_path: Chemin vers fichier .cpp à traiter
        
    Returns:
        True si modifications effectuées, False sinon
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Erreur lecture {file_path}: {e}")
        return False
    
    original_content = content
    replacements_count = 0
    
    # Pattern pour blocs génériques multi-lignes
    generic_pattern = re.compile(
        r'  /\*\s*\n'  # début bloc (2 espaces)
        r'\s*\*\s*(.+?)\s*\n'  # signature fonction
        r'\s*\*\s*But\s*:\s*\(description automatique\)[^\n]*\n'  # But générique
        r'\s*\*\s*Entrées[^\n]*\n'  # Entrées
        r'\s*\*\s*Sortie[^\n]*\n'  # Sortie
        r'\s*\*/',  # fin bloc
        re.MULTILINE
    )
    
    def replace_comment(match):
        nonlocal replacements_count
        function_signature = match.group(1).strip()
        
        # Recherche description explicite
        description = None
        for key, desc in FUNCTION_DESCRIPTIONS.items():
            # Normalisation pour matching
            key_norm = key.replace(' ', '').replace('*', '').replace('::', '').lower()
            sig_norm = function_signature.replace(' ', '').replace('*', '').replace('::', '').lower()
            
            if key_norm in sig_norm or sig_norm in key_norm:
                description = desc
                break
        
        if description:
            replacements_count += 1
            new_comment = (
                f"/**\n"
                f" * @brief {description}\n"
                f" */"
            )
            return new_comment
        else:
            # Pas de description trouvée, conserver original
            return match.group(0)
    
    # Remplacement
    content = generic_pattern.sub(replace_comment, content)
    
    if content != original_content:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {file_path.name}: {replacements_count} blocs commentaires remplacés")
            return True
        except Exception as e:
            print(f"❌ Erreur écriture {file_path}: {e}")
            return False
    else:
        print(f"⚪ {file_path.name}: Aucun remplacement de bloc nécessaire")
        return False


def add_brief_comments(file_path: Path) -> bool:
    """
    Ajoute des blocs @brief avant chaque fonction (format maPiscinev3Web.cpp).
    
    Args:
        file_path: Chemin vers fichier .cpp à traiter
        
    Returns:
        True si modifications effectuées, False sinon
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Erreur lecture {file_path}: {e}")
        return False
    
    original_lines = lines.copy()
    replacements_count = 0
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Détecte déclaration fonction (commence par 4 espaces + type retour)
        func_match = re.match(r'^    (void|bool|int|char\*|String|const char\*|float|uint8_t) (.+?)(\{|;)\s*(//.*)?$', line)
        if func_match:
            func_signature = f"{func_match.group(1)} {func_match.group(2).strip()}"
            
            # Vérifie si déjà un commentaire @brief au-dessus
            has_brief = False
            if i > 0:
                prev_line = lines[i-1].strip()
                if prev_line.startswith('*') or prev_line.startswith('/**') or '@brief' in prev_line:
                    has_brief = True
                # Vérifie aussi 2-3 lignes au-dessus
                if i > 2:
                    for j in range(max(0, i-3), i):
                        if '@brief' in lines[j]:
                            has_brief = True
                            break
            
            if not has_brief:
                # Cherche description dans dictionnaire
                description = None
                for key, desc in FUNCTION_DESCRIPTIONS.items():
                    # Normalisation pour matching
                    key_norm = key.replace(' ', '').replace('*', '').lower()
                    sig_norm = func_signature.replace(' ', '').replace('*', '').lower()
                    if key_norm in sig_norm or sig_norm.startswith(key_norm[:20]):
                        description = desc
                        break
                
                if description:
                    # Insère bloc @brief avant la fonction
                    brief_block = [
                        f"/**\n",
                        f" * @brief {description}\n",
                        f" */\n"
                    ]
                    lines = lines[:i] + brief_block + lines[i:]
                    replacements_count += 1
                    i += 3  # Skip les lignes ajoutées
        
        i += 1
    
    if lines != original_lines:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print(f"✅ {file_path.name}: {replacements_count} commentaires @brief ajoutés")
            return True
        except Exception as e:
            print(f"❌ Erreur écriture {file_path}: {e}")
            return False
    else:
        print(f"⚪ {file_path.name}: Aucun ajout @brief nécessaire")
        return False


def main():
    """Point d'entrée principal du script."""
    
    # Répertoire src
    src_dir = Path(__file__).parent / 'src'
    
    if not src_dir.exists():
        print(f"❌ Répertoire src/ non trouvé : {src_dir}")
        sys.exit(1)
    
    # Fichiers à traiter (7 fichiers)
    target_files = [
        'maPiscinev3Web.cpp',
        'PiscineWeb.cpp',
        'PiscineWebActionControler.cpp',
        'PiscineWebTelecom.cpp',
        'ManagerTelecom.cpp',
        'logger.cpp',
        # Ignorer 'logger copie.cpp' (backup)
    ]
    
    print("=" * 70)
    print("🔧 Amélioration commentaires projet maPiscineWeb")
    print("=" * 70)
    print()
    
    total_files = 0
    modified_files = 0
    
    for filename in target_files:
        file_path = src_dir / filename
        if file_path.exists():
            total_files += 1
            # Étape 1: Remplacer blocs génériques multi-lignes
            modified1 = replace_generic_comment_blocks(file_path)
            # Étape 2: Ajouter @brief pour fonctions sans commentaire
            modified2 = add_brief_comments(file_path)
            if modified1 or modified2:
                modified_files += 1
        else:
            print(f"⚠️  Fichier non trouvé : {filename}")
    
    print()
    print("=" * 70)
    print(f"✅ Traitement terminé : {modified_files}/{total_files} fichiers modifiés")
    print("=" * 70)
    
    if modified_files > 0:
        print()
        print("⚠️  N'oubliez pas de :")
        print("   1. Compiler le projet pour vérifier (platformio run)")
        print("   2. Commiter les modifications (git commit)")
        print("   3. Mettre à jour le README.md si nécessaire")


if __name__ == '__main__':
    main()
