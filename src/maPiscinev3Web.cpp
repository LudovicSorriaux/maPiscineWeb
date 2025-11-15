/*******************************************************************************
 * @file    maPiscinev3Web.cpp
 * @brief   Point d'entrée principal - Serveur web asynchrone ESP8266
 * @details Setup WiFi (WiFiManager), AsyncWebServer, routes API REST, SSE,
 *          initialisation SD card, Logger, NTP, ICSC. Loop principal avec
 *          gestion mises à jour (PiscineWeb, ActionControler, Telecom, Logger).
 * 
 * @version 4.0.0
 * @date    Novembre 2024
 * @author  Ludovic Sorriaux
 * 
 * Ma Piscine Manager web site (ESP8266)
 * The good one !! 
 * Ce projet gère le site web de gestion de la piscine et les logs sur carte SD
 ******************************************************************************/

#define TZ_OFFSET 1

// include libraries
#include <Arduino.h>
#include <FS.h>                 //this needs to be first, or it all crashes and burns...
#include <SimpleTimer.h>
#include <TimeLib.h>
#include <EEPROM.h>   
#include <SPI.h>
#include <SDFS.h>

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
//#include <espnow.h> 
//#else
//#include <WiFi.h>
//#include <ESPmDNS.h>
//#include <esp_now.h> 
#endif
   
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>
#include <DNSServer.h>
#include <NTPClient.h>
#include <ESPAsyncWiFiManager.h>      
#include <ArduinoJson.h> 

// include sub files
#include "globalPiscine.h"
#include "globalPiscineWeb.h"
#include "Logger.h"
#include "PiscineWebTelecom.h"
#include "ManagerTelecom.h"
#include "PiscineWeb.h"
#include "PiscineWebActionControler.h"

 /* ------------- Parameter Variables  -------------*/

   bool debug = true;

 /* -------------   Variables  -------------*/
        // global variables
    SimpleTimer timer;
    AsyncWebServer server(80);
    DNSServer dns;

    bool cardPresent = false;
    const uint8_t SDchipSelect = D8;
    int8_t wifi_status = 0;    // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever

    piscineParametres piscineParams[IND_MAX_PISCINE+1];   // +1 for ClearAlert
    char indexName[IND_TOTAL+1][MAX_KEY_LEN];
    struct_configuration config;
    struct_Etalon_Data etalon_Data;
   
        // local variables
    bool managerPresent = false;
    routeur_Data routeurData;

    const uint8_t wifiResetPin = D2;
    const uint8_t masterSwPin = D1;
    
    int timerWebTelecom;
    int timerWebAction;
    int timerManagerTelecom;
    int timerManagerCheckCnx;
    int timerSendWebParams;
    int timerWebLCD;
    int timerLogger;
    
    int timerWIFI_NOK, timerWIFI_OK;
    int timerNTP_NOK, timerNTP_OK;
    bool NTPok = false;
    WiFiUDP ntpUDP;
    NTPClient timeClient(ntpUDP, "europe.pool.ntp.org", 0, 24*3600*1000);     // By default 'time.nist.gov' is used with 60 seconds update interval and

    const char *APssid = "maPiscineAP"; // The name of the Wi-Fi network that will be created
    const char *APpassword = "maPiscine";   // The password required to connect to it, leave blank for an open network

    bool shouldSaveConfig = false;    //flag for saving data
    volatile boolean awakenByInterruptRstWifi = false; /* variable to indicate that an interrupt has occured */

    bool flgModulesStarted = false;   // flag to setup modules depending on wifi (web and espnow)
    bool flgInSetup = true;


 /* -------------   Functions prototypes  -------------*/
/**
 * @brief Callback manager : Reçoit l'heure depuis le contrôleur ESP32 et met à jour l'horloge système (setTime), puis relance NTP si nécessaire
 */
    void setTheTime(time_t newTime);
    void startSD();           // Start the SD and list all contents
/**
 * @brief Initialise le tableau indexName[IND_TOTAL] avec les noms des paramètres piscine (Temp, pH, Redox, CL, Filtration, etc.) pour affichage web/SD
 */
    void initIndexNames();

/**
 * @brief Orchestrateur WiFi complet : 1) Reconnexion au dernier AP, 2) Connexion aux SSIDs stockés (config), 3) Portail captif WiFi Manager si échec
 */
    bool startWiFi();
    bool useWifiManager();
/**
 * @brief Recherche le mot de passe associé à un SSID dans le tableau config.wifi[]. Retourne pointeur vers password ou nullptr si non trouvé
 */
    char* findPassword(const char *ssid);
    bool WiFiConnect(const char *ssid, const char *passphrase);
/**
 * @brief Scanne les réseaux WiFi disponibles et tente connexion aux SSIDs stockés dans config.wifi[] (jusqu'à 3 entrées)
 */
    bool ConnectWithStoredCredentials();
    void resetWifiSettings();

/**
 * @brief Charge la configuration admin/user depuis EEPROM (addresses 0-499). Structure : adminPassword(64), user(64), user_password(64), wifi[3].ssid(64), wifi[3].password(64)
 */
    void loadConfigurationEEprom();
    void saveConfigurationEEprom(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password);
/**
 * @brief Affiche le contenu de la config EEPROM sur Serial (admin, user, passwords, SSIDs) pour debug
 */
    void printConfigurationEEprom();
    void printConfiguration() ;
/**
 * @brief Charge la configuration admin/user depuis EEPROM (addresses 0-499). Structure : adminPassword(64), user(64), user_password(64), wifi[3].ssid(64), wifi[3].password(64)
 */
    void loadConfiguration() ;
    void saveConfiguration() ;
/**
 * @brief Met à jour config en mémoire (adminPassword, user, user_password, wifi[0]), puis appelle saveConfiguration() et saveConfigurationEEprom()
 */
    void saveNewConfiguration(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password);
    void printDirectory(File dir, int numTabs);
/**
 * @brief Efface les paramètres WiFi (config.wifi[] remis à zéro), sauve config sur SD, puis redémarre l'ESP8266
 */
    void resetWifiSettingsInConfig();

/**
 * @brief Synchronise l'horloge système via NTP (europe.pool.ntp.org, pool 123). Applique timezone TZ_OFFSET + DST (heure d'été France). Retourne true si succès
 */
    bool getNTPTime();
    int dstOffset(time_t newTime);

/**
 * @brief Convertit une taille en octets vers chaîne formatée (B, KB ou MB) selon magnitude (ex: 1536 -> "1.50 KB")
 */
    String formatBytes(size_t bytes);
    String getContentType(String filename);
/**
 * @brief Convertit un code de statut WiFi (wl_status_t enum) en chaîne lisible ("WL_CONNECTED", "WL_NO_SSID_AVAIL", etc.) pour debug
 */
    const char* wl_status_to_string(wl_status_t status);

 /* -------------   Classes  -------------*/

    LoggerClass logger;                                     // Logger vers Serial et SD Card
    PiscineWebClass maPiscineWeb;                           // gestion sur serveur web              
    PiscineWebTelecomClass webTelecom;      // telecoms avec controleur 
    PiscineWebActionControlerClass webAction;                    
    ManagerTelecomClass managerTelecom;                     // gestion des echanges avec les modules espnow
 
 /* -------------   Callback functions  -------------*/
              /* --- Timer Callbacks  --- */
/**
 * @brief Callback timer : Appelle webTelecom.OnUpdate() pour traiter les messages UART entrants depuis le contrôleur ESP32 (protocole ICSC)
 */
    void doCheckMessages() {        // webTelecom
      webTelecom.OnUpdate();
    }
    
/**
 * @brief Callback timer : Appelle logger.OnUpdate() pour gérer l'enregistrement CSV périodique des paramètres piscine sur carte SD
 */
    void doLogger(){                // logger
        logger.OnUpdate();
    }
        
/**
 * @brief Callback timer : Appelle webAction.OnUpdate() pour vérifier si une nouvelle synchronisation NTP est nécessaire (timeout)
 */
    void doAction(){                // webAction
        webAction.OnUpdate();
    }
        
/**
 * @brief Callback timer : Vérifie la connexion ESP-NOW avec le manager PAC et tente reconnexion si perdue
 */
    void doCheckManagerTelecomConnection(){   // managerTelecom
      managerTelecom.reconnectControlerTelecom();  
    }
    
/**
 * @brief Callback timer : Envoie les nouvelles valeurs de paramètres piscine au manager ESP-NOW (si actif)
 */
    void doManagerTelecomManage(){            // managerTelecom   
      managerTelecom.sendToManagerNewValues();                            // ManageNewValues();
    }

/**
 * @brief Callback timer : Appelle maPiscineWeb.OnUpdate() pour envoyer les paramètres mis à jour via SSE vers les clients web
 */
    void doSendWebParams(){         // piscineWeb
        maPiscineWeb.OnUpdate();
    }

/**
 * @brief Callback timer : Appelle maPiscineWeb.OnUpdatePiscineLCD() pour rafraîchir l'affichage LCD virtuel (toutes les 10s)
 */
    void doUpdatePiscineLCD(){      // piscineWeb
        maPiscineWeb.OnUpdatePiscineLCD();
    }

/**
 * @brief Callback timer : Surveille la connexion WiFi et tente reconnexion automatique si déconnexion détectée (basculement timer NOK/OK)
 */
    void doCheckWIFIConnection(){   // WIFI
      if(WiFi.status() != WL_CONNECTED){      // wifi is not connected
        if(startWiFi()){                      // wifi (re)started
          if(!flgModulesStarted){
            WiFi.mode(WIFI_AP_STA);           //Set device in AP_STA mode to handle espnow and web
            maPiscineWeb.startup();
            if(managerPresent){
              managerTelecom.managerTelecomInitialisation();
              managerTelecom.setTimeCallBack(setTheTime);
            }  
            flgModulesStarted = true;
          }
          timer.enable(timerWIFI_OK);
          timer.disable(timerWIFI_NOK);
          timer.enable(timerNTP_NOK);         // new wifi then get time ASAP
          timer.disable(timerNTP_OK);
        } else {                              // cant connect to wifi
          timer.enable(timerWIFI_NOK);
          timer.disable(timerWIFI_OK);
          timer.disable(timerNTP_OK);
          timer.disable(timerNTP_NOK);
        }
      } else {                                // already connected
        Serial1.println(F("\nAlready connected to WIFI "));    
          timer.enable(timerWIFI_OK);
          timer.disable(timerWIFI_NOK);
          timer.enable(timerNTP_OK);
          timer.disable(timerNTP_NOK);
          webTelecom.setWriteData(IND_BlinkWifiLed,1);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
          wifi_status = 1;
          webTelecom.OnUpdate();
      }
    }

/**
 * @brief Callback timer : Vérifie la synchronisation NTP et tente nouvelle synchro si échec (basculement timer NOK/OK)
 */
    void doCheckNTPDate(){          // NTP
        NTPok = getNTPTime();
        if (NTPok){
          timer.enable(timerNTP_OK);
          timer.disable(timerNTP_NOK);
        } else {
          timer.enable(timerNTP_NOK);
          timer.disable(timerNTP_OK);
        }
/*      if (!ControlerTelecomMgr.isTimeSych()){   // need to switch to faster ask
        timer.enable(timerTIME_NOK);
        timer.disable(timerTIME_OK);
      } 
      ControlerTelecomMgr.askNewTime();
*/
    }


              /* --- Wifi Manager Callbacks  --- */
/**
 * @brief Callback WiFi Manager : Levée du flag shouldSaveConfig quand l'utilisateur sauve une nouvelle configuration WiFi
 */
    void saveConfigCallback () {
      Serial1.println(" !!!!  Should save config is setted  !!! ");
      shouldSaveConfig = true;
    }

/**
 * @brief Callback WiFi Manager : Exécuté lors de l'entrée en mode AP (portail captif). Affiche l'IP du portail de configuration
 */
    void configModeCallback (AsyncWiFiManager  *myWiFiManager) {
      Serial1.println("Entered config mode");
      Serial1.println(WiFi.softAPIP());
      Serial1.println(myWiFiManager->getConfigPortalSSID());
      webTelecom.setWriteData(IND_BlinkWifiLed,-2);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
      wifi_status = -2;
    }

              /* --- managerTelecom Callbacks  --- */
/**
 * @brief Callback manager : Reçoit l'heure depuis le contrôleur ESP32 et met à jour l'horloge système (setTime), puis relance NTP si nécessaire
 */
    void setTheTime(time_t newTime){     // callback function when time is set up by controler
//      setTime(newTime);                // done by managerTelecoms to loose less secs.. 
      webAction.doChangeDate();
      Serial1.print(F(" New TIME from Manager : "));
      Serial1.printf("New time is now : %d/%d/%d %d:%d:%d \n", day(), month(), year(), hour(), minute(), second() );
      timer.enable(timerNTP_OK);
      timer.disable(timerNTP_NOK);
    }


 /* -------------   Iterruption functions  -------------*/
    // The interuptCallBack handler will just signal that the interupt has happened
    // we will do the work from the main loop.
/**
 * @brief ISR (IRAM) : Routine d'interruption bouton reset WiFi (GPIO D2). Lève le flag interrupted pour traitement dans checkInterrupt()
 */
    void IRAM_ATTR interuptCallBackRstWifi() {     //
       awakenByInterruptRstWifi=true;
    }
     
/**
 * @brief Détecte si le bouton WiFi reset (D2) a été pressé (flag interrupted). Si oui, appelle resetWifiSettings() après 3s de maintien
 */
    void checkInterrupt() {
      if(awakenByInterruptRstWifi) {
        detachInterrupt(digitalPinToInterrupt(wifiResetPin));
        resetWifiSettings();                            //reset settings back to reconnect
        Serial1.println("Reset wifi Settings rebooting ...");    //reset and try again, or maybe put it to deep sleep
        ESP.reset();
        delay(3000);
      }
    }

/*_____________________________________________SETUP___________________________________________________________*/

/**
 * @brief Initialisation complète ESP8266 : Serial, GPIO, EEPROM, SD card, WiFi, NTP, classes (webTelecom, logger, webAction, maPiscineWeb), et démarrage timers SimpleTimer
 */
    void setup(){
      uint8_t maxtriesNTP = 10;
      flgInSetup = true;    
    
        // Set console baud rate
      Serial.begin(ESP8266_BAUD);                 // Start the Serial1 communication to send messages to the controler uses uart 0
      Serial1.begin(ESP8266_BAUD, SERIAL_8N1);    // Start the Serial1 communication to send messages to the computer as monitor users uart1 tx on D4
      Serial1.setDebugOutput(true);
      delay(1000);
      Serial.println(F("\nMa piscine web INITIALIZATION"));
      Serial1.println(F("\nMa piscine web INITIALIZATION"));
    
      pinMode(wifiResetPin,INPUT_PULLUP);         // D2 on the Wemos
  //    attachInterrupt(digitalPinToInterrupt(wifiResetPin), interuptCallBackRstWifi, FALLING);

      pinMode(masterSwPin,INPUT_PULLUP);          // D1 on the Wemos
//      (digitalRead(masterSwPin) == HIGH) ? managerPresent = false : managerPresent = true;
      managerPresent = false;
      Serial1.printf("Master pin is %s\n",(digitalRead(masterSwPin) == HIGH) ? "false" : "true");
      
      initIndexNames();
      webTelecom.initTelecom();
      webAction.initializePiscineParams();
  
      startSD();               // Start the SD card and list all contents 
      loadConfiguration();
    
      timerWIFI_OK = timer.setInterval(60*60*1000L, doCheckWIFIConnection);   // check wifi toutes les heures
      timerWIFI_NOK = timer.setInterval(1000L, doCheckWIFIConnection);        // check wifi toutes les sec si nok
      timerNTP_OK = timer.setInterval(60*60*1000L, doCheckNTPDate);           // toutes les heures get new ntp time
      timerNTP_NOK = timer.setInterval(5*1000L, doCheckNTPDate);              // toutes les 5 sec si nok. 

      if(startWiFi()){ 
        Serial1.println("connected...yeey :)");      

        while(maxtriesNTP-- != 0){   // wait to get a valid time
          NTPok = getNTPTime();
          if (NTPok){
            break;
          }
        }
        WiFi.mode(WIFI_AP_STA);                          //Set device in AP_STA mode to handle espnow and web
        logger.OnUpdate();
        maPiscineWeb.startup();
        if(managerPresent){
          managerTelecom.managerTelecomInitialisation();
          managerTelecom.setTimeCallBack(setTheTime);
        }
        flgModulesStarted = true;

        timer.enable(timerWIFI_OK);
        timer.disable(timerWIFI_NOK);
        if (NTPok) {
          timer.enable(timerNTP_OK);
          timer.disable(timerNTP_NOK);
        } else {
          timer.enable(timerNTP_NOK);
          timer.disable(timerNTP_OK);
        }
      } else {                                // cant connect to wifi
        timer.enable(timerWIFI_NOK);
        timer.disable(timerWIFI_OK);
        timer.disable(timerNTP_OK);
        timer.disable(timerNTP_NOK);
      }  
      timerWebTelecom = timer.setInterval(100L, doCheckMessages);             // telecom 100ms
      timerWebAction = timer.setInterval(200L, doAction);                     // actions exchanges
      if(managerPresent){
        timerManagerTelecom = timer.setInterval(1250L, doManagerTelecomManage);             // pas trop vite to laisser du temps a controlerTelecom...
        timerManagerCheckCnx = timer.setInterval(60000L, doCheckManagerTelecomConnection);  // check if still connected to controlerTelecom every minute d'inactivité
      }
      timerSendWebParams = timer.setInterval(1000L,doSendWebParams);          // toutes les sec
      timerWebLCD = timer.setInterval(10000L,doUpdatePiscineLCD);             // toutes les 10 sec
      timerLogger = timer.setInterval(60000L,doLogger);                       // toutes les mn
       
      Serial.println("maPiscine Web is Ready !\n");
      Serial1.println("maPiscine Web is Ready !\n");
      flgInSetup = false;
    }
    
/*_____________________________________________LOOP____________________________________________________________*/

/**
 * @brief Boucle principale Arduino : Appelle checkInterrupt() (bouton WiFi reset) puis timer.run() (gestion callbacks périodiques)
 */
    void loop(){
      checkInterrupt();    //Check if an interrupt has occurred and act on it
      timer.run();                  // Run SimpleTimer
    }
    
/*_________________________________________SETUP_FUNCTIONS_____________________________________________________*/

/**
 * @brief Initialise le tableau indexName[IND_TOTAL] avec les noms des paramètres piscine (Temp, pH, Redox, CL, Filtration, etc.) pour affichage web/SD
 */
    void initIndexNames(){
      strncpy(indexName[IND_Alerte],"Alerte",MAX_KEY_LEN);           // 1 
      strncpy(indexName[IND_TempEau],"tempEau",MAX_KEY_LEN);         // 2 Temp Eau val
      strncpy(indexName[IND_TempAir],"tempAir",MAX_KEY_LEN);         // 3 Temp Air Val
      strncpy(indexName[IND_TempPAC],"tempPAC",MAX_KEY_LEN);         // 4 Temp Eau sortie de PAC
      strncpy(indexName[IND_TempInt],"tempInt",MAX_KEY_LEN);         // 5 Temp Interieur Local
      strncpy(indexName[IND_PHVal],"phVal",MAX_KEY_LEN);             // 6 PH val
      strncpy(indexName[IND_RedoxVal],"redoxVal",MAX_KEY_LEN);       // 7 Redox val
      strncpy(indexName[IND_CLVal],"clVal",MAX_KEY_LEN);             // 8 CL val
      strncpy(indexName[IND_RedoxRef],"redoxRef",MAX_KEY_LEN);       // 9
      strncpy(indexName[IND_PHRef],"phRef",MAX_KEY_LEN);             // 10
      strncpy(indexName[IND_Lampe],"lampe",MAX_KEY_LEN);             // 11 Lampe : on = 1
      strncpy(indexName[IND_Volet],"volet",MAX_KEY_LEN);             // 12 Volet : fermé = 1
      strncpy(indexName[IND_PompePH],"PH",MAX_KEY_LEN);              // 13 Pompe PH : on = 1
      strncpy(indexName[IND_PompeCL],"CL",MAX_KEY_LEN);              // 14 Pompe CL : on = 1
      strncpy(indexName[IND_PompeALG],"P3",MAX_KEY_LEN);             // 15 Pompe ALG : on = 1
      strncpy(indexName[IND_PP],"PP",MAX_KEY_LEN);                   // 16 Pompe Principale : on = 1
      strncpy(indexName[IND_PAC],"PAC",MAX_KEY_LEN);                 // 17 Pompe a chaleur : on = 1
      strncpy(indexName[IND_Auto],"autoMode",MAX_KEY_LEN);           // 18 Mode Automatique : auto = 1
      strncpy(indexName[IND_Hibernate],"Hibernate",MAX_KEY_LEN);     // 19 hibernate : on = 1
      strncpy(indexName[IND_HumInt],"HumInt",MAX_KEY_LEN);           // 20 Humidité Interieur Local
      strncpy(indexName[IND_TypeTemp],"typeTemp",MAX_KEY_LEN);       // 21 0=tempRelatif, 1=tempFixe
      strncpy(indexName[IND_tFixe],"tempFix",MAX_KEY_LEN);           // 22 PAC temp Fixe
      strncpy(indexName[IND_tVar],"tempRel",MAX_KEY_LEN);            // 23 PAC temp Variable
      strncpy(indexName[IND_InvFlowAlert],"flowAlert",MAX_KEY_LEN);  // 24 
      strncpy(indexName[IND_InvInondationAlert],"innondAlert",MAX_KEY_LEN); // 25 
      strncpy(indexName[IND_InvNivPHAlert],"nivPH",MAX_KEY_LEN);     // 26 
      strncpy(indexName[IND_InvNivCLAlert],"nivCL",MAX_KEY_LEN);     // 27 
      strncpy(indexName[IND_InvNivALGAlert],"nivALG",MAX_KEY_LEN);   // 28 
      strncpy(indexName[IND_InvPACAlert],"pacAlert",MAX_KEY_LEN);    // 29 
      strncpy(indexName[IND_PlageOnPP],"strtTPP",MAX_KEY_LEN);       // 30 Pompe Principale Plage On 
      strncpy(indexName[IND_PlageOffPP],"stopTPP",MAX_KEY_LEN);      // 31 Pompe Principale Plage Off
      strncpy(indexName[IND_ALGQuantite],"p3Qty",MAX_KEY_LEN);       // 32
      strncpy(indexName[IND_ALGFrequence],"p3Frq",MAX_KEY_LEN);      // 33 1 to 48h then 100=hebdo, 1000=mensuel
      strncpy(indexName[IND_PlageLampe],"lampeAuto",MAX_KEY_LEN);    // 34 Lampe Plage On 
      strncpy(indexName[IND_PlageOnLampe],"strtLampe",MAX_KEY_LEN);  // 35 Lampe Plage On 
      strncpy(indexName[IND_PlageOffLampe],"stopLampe",MAX_KEY_LEN); // 36 Lampe Plage Off
      strncpy(indexName[IND_PlageVolet],"voletAuto",MAX_KEY_LEN);    // 37 Volet Plage On 
      strncpy(indexName[IND_PlageOuvVolet],"ouvVolet",MAX_KEY_LEN);  // 38 Volet Plage On 
      strncpy(indexName[IND_PlageFermVolet],"fermeVolet",MAX_KEY_LEN);    // 39 Volet Plage Off
      strncpy(indexName[IND_TypePompe3],"typeP3",MAX_KEY_LEN);            // 40 type pompe 3 : 0=off, 1=PH-, 2=ALG
      strncpy(indexName[IND_PlageOnPAC],"strtTPAC",MAX_KEY_LEN);        // 41 Pompe a Chaleur Plage On  
      strncpy(indexName[IND_PlageOffPAC],"stopTPAC",MAX_KEY_LEN);       // 42 Pompe a Chaleur Plage Off 
      strncpy(indexName[IND_pacViaRouter],"PacViaRouter",MAX_KEY_LEN);  // 43 Controle PAC via routeur
      strncpy(indexName[IND_PAC_Present],"PAC_Present",MAX_KEY_LEN);   // 44 Controle si presence PAC
      strncpy(indexName[IND_dose_PH],"dose_PH",MAX_KEY_LEN);            // 45 Controle PAC via routeur
      strncpy(indexName[IND_dose_CL],"dose_CL",MAX_KEY_LEN);            // 46 Controle PAC via routeur
      strncpy(indexName[IND_ClearAlert],"ClearAlert",MAX_KEY_LEN);      // 47 to clear Alerts
      strncpy(indexName[IND_volume_piscine],"volumePiscine",MAX_KEY_LEN);  // 48 volume de la Piscine
      strncpy(indexName[IND_Defaults],"Set Defaults",MAX_KEY_LEN);       // 49  reset to defaults parameters
      strncpy(indexName[IND_Debug],"Set Debug",MAX_KEY_LEN);             // 50  Switch to debug mode
  
      strncpy(indexName[IND_WifiStatus],"WifiStatus",MAX_KEY_LEN);        // 60
      strncpy(indexName[IND_EPOCH],"EPOCH",MAX_KEY_LEN);                  // 61

      strncpy(indexName[IND_Graphiques],"Graphiques",MAX_KEY_LEN);        // 62 type x100 : 0 Jour, 1 Semaine, 2 Mois et unite = duree en H(Jour), J(Sem), S(Mois)  
      strncpy(indexName[IND_PAGES],"PAGES",MAX_KEY_LEN);                  // 63
      strncpy(indexName[IND_PagePrincipale],"PagePrincipale",MAX_KEY_LEN);// 64
      strncpy(indexName[IND_PagePP],"PagePP",MAX_KEY_LEN);                // 65
      strncpy(indexName[IND_PagePAC],"PagePAC",MAX_KEY_LEN);              // 66
      strncpy(indexName[IND_PageCL],"PageCL",MAX_KEY_LEN);                // 67
      strncpy(indexName[IND_PagePH],"PagePH",MAX_KEY_LEN);                // 68
      strncpy(indexName[IND_PageALG],"PageALG",MAX_KEY_LEN);              // 69
      strncpy(indexName[IND_PageLampe],"PageLampe",MAX_KEY_LEN);          // 70
      strncpy(indexName[IND_PageVolet],"PageVolet",MAX_KEY_LEN);          // 71
      strncpy(indexName[IND_PageSlider],"PageSlider",MAX_KEY_LEN);        // 72
      strncpy(indexName[IND_PageWeb],"PageWeb",MAX_KEY_LEN);              // 73
      strncpy(indexName[IND_RefreshCriticalValues],"RefreshCritVal",MAX_KEY_LEN);    // 80
      strncpy(indexName[IND_Clavier],"Clavier",MAX_KEY_LEN);              // 81
      strncpy(indexName[IND_BlinkWifiLed],"BlinkWifiLed",MAX_KEY_LEN);    // 82


    }

/**
 * @brief Monte la carte SD (FAT, CS=D8), affiche le contenu racine et lève le flag cardPresent si succès. Retourne sans erreur si carte absente
 */
    void startSD() {            // Start the SD and list all contents

        SDFSConfig cfg;
        File root;

      cfg.setCSPin(SDchipSelect);
      SDFS.setConfig(cfg);
      if(!SDFS.begin()){          // see if the card is present and can be initialized:
        Serial1.println("SDCard Initialization Failed");
        cardPresent = false;
        return;
      }
      cardPresent = true;

/*      root = SDFS.open("/","r");
      Serial1.println("SDCard Contents : ");
      printDirectory(root, 1);
*/
    }

/**
 * @brief Orchestrateur WiFi complet : 1) Reconnexion au dernier AP, 2) Connexion aux SSIDs stockés (config), 3) Portail captif WiFi Manager si échec
 */
    bool startWiFi() {          
        bool rtn = false;

      if(WiFi.status() != WL_CONNECTED){ 
        webTelecom.setWriteData(IND_BlinkWifiLed,-3);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
        wifi_status = -3;
        webTelecom.OnUpdate();

//  WiFi.setOutputPower(5);   // 5db... 
//  IPAddress ip(192,168,100,250);
//  IPAddress gateway(192,168,100,1);
//  IPAddress subnet(255,255,255,0);
//  WiFi.config(ip, gateway, subnet);

        Serial1.println(F(" Try to connect the Wifi..."));
        WiFi.mode(WIFI_STA);                                 
        Serial1.println(F(" First try with last used wifi ssid ..."));
        if(!WiFiConnect(nullptr,nullptr)){
          Serial1.println(F("WiFi cnx with last connection FAILED, Next try with ssids in config ..."));
          if(flgInSetup)
            checkInterrupt();
          if(!ConnectWithStoredCredentials()){
            Serial1.println(F("WiFi with saved connections FAILED, using WifiManager"));
            WiFi.mode(WIFI_AP);
            if(!useWifiManager()){                                      // test with wifimanager
              Serial1.println(F("wifimanager WiFi connection FAILED"));
            }
          }
        }

        if(WiFi.status() == WL_CONNECTED) {
          Serial1.println();
          Serial1.println(F("WiFi connected"));
          Serial1.print(F("IP address: "));
          Serial1.print(WiFi.localIP());
          Serial1.print(F("\t\t\t MAC address: "));
          Serial1.print(WiFi.macAddress());
          Serial1.print(F("\t\t\t Wifi Channel: "));
          Serial1.println(WiFi.channel());
          webTelecom.setWriteData(IND_BlinkWifiLed,1);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
          wifi_status = 1;
          webTelecom.OnUpdate();
          rtn = true;
        } else {
          Serial1.println(F("\nCan't connect to WIFI ..."));
          webTelecom.setWriteData(IND_BlinkWifiLed,0);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
          wifi_status = 0;
          webTelecom.OnUpdate();
          rtn = false;
        }
      } else {
        Serial1.println(F("\nAlready connected to WIFI "));    
          webTelecom.setWriteData(IND_BlinkWifiLed,1);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
          wifi_status = 1;
          webTelecom.OnUpdate();
        rtn = true;
      }
      return rtn;
    }

/**
 * @brief Lance le portail captif AsyncWiFiManager avec paramètres custom (config.adminPassword, config.user, etc.). Sauve la config si shouldSaveConfig==true
 */
    bool useWifiManager(){
      bool rtn = true;
      char wifi_ssid[32];
      char wifi_password[64];

      AsyncWiFiManager wifiManager(&server,&dns);
      AsyncWiFiManagerParameter custom_user("user", "User", config.users[0].user, sizeof(config.users[0].user));              // id-name, placeholder-prompt, default, length
      AsyncWiFiManagerParameter custom_user_passwd("passwd", "Password", config.users[0].user_passwd, sizeof(config.users[0].user_passwd));
      AsyncWiFiManagerParameter custom_adminpasswd("Admpasswd", "Admin Pass", config.adminPassword, sizeof(config.adminPassword));

        wifiManager.setAPCallback(configModeCallback);
        wifiManager.setSaveConfigCallback(saveConfigCallback);
        wifiManager.setTimeout(180);
  //     wifiManager.setBreakAfterConfig(true);

        wifiManager.addParameter(&custom_user);
        wifiManager.addParameter(&custom_user_passwd);
        wifiManager.addParameter(&custom_adminpasswd);

        webTelecom.setWriteData(IND_BlinkWifiLed,-2);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
        webTelecom.OnUpdate();
        if(flgInSetup)
          checkInterrupt();
        
        if (!wifiManager.startConfigPortal(APssid,APpassword)) {
          Serial1.println("failed to connect and hit timeout");
          rtn = false;     // connextion failed
        } else {
          if (shouldSaveConfig){
            webTelecom.setWriteData(IND_BlinkWifiLed,-1);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
            wifi_status = -1;
            webTelecom.OnUpdate();
            strcpy(wifi_ssid, wifiManager.getConfiguredSTASSID().c_str());
            strcpy(wifi_password, wifiManager.getConfiguredSTAPassword().c_str()); 
            saveNewConfiguration(custom_adminpasswd.getValue(), custom_user.getValue(), custom_user_passwd.getValue(),wifi_ssid, wifi_password);        //read updated parameters
          } else {
            strcpy(wifi_ssid, WiFi.SSID().c_str());
            strcpy(wifi_password, WiFi.psk().c_str()); 
            saveNewConfiguration(nullptr,nullptr,nullptr,wifi_ssid, wifi_password);        //read updated parameters
          }
          server.end();  
          rtn = true;
        }
        return rtn;
    }

/**
 * @brief Recherche le mot de passe associé à un SSID dans le tableau config.wifi[]. Retourne pointeur vers password ou nullptr si non trouvé
 */
    char* findPassword(const char *ssid){
      for(int i=0; i<MAX_WIFI; i++){
        if(strcmp(ssid,config.wifi[i].ssid) == 0){
          return config.wifi[i].ssid_passwd;
          break;
        }    
      }
      return nullptr;
    }

/**
 * @brief Tente connexion WiFi à un SSID donné avec timeout de 10s. Retourne true si connecté, false si échec
 */
    bool WiFiConnect(const char *ssid, const char *passphrase){
       unsigned long mytimeout = millis() / 1000;
      if(ssid == nullptr){
        WiFi.persistent( false );
        WiFi.begin();
      } else {
        WiFi.persistent( true );
        WiFi.begin(ssid, passphrase); //WiFi connection
      }
        while (WiFi.status() != WL_CONNECTED && WiFi.status() != WL_CONNECT_FAILED){
            Serial1.print(".");
            delay(500);
            if((millis() / 1000) > mytimeout + 10){ // try for less than 10 seconds to connect to WiFi router
              Serial1.println();
              break;
            }
        }
        Serial1.println();

        if (WiFi.status() == WL_CONNECTED){
          return true;
        }
        return false;
    }

/**
 * @brief Scanne les réseaux WiFi disponibles et tente connexion aux SSIDs stockés dans config.wifi[] (jusqu'à 3 entrées)
 */
    bool ConnectWithStoredCredentials(){
        const char *ssid = "null";
        const char *password = nullptr;
        int retryNetworks = 4;

        while (retryNetworks-- > 0){
          Serial1.printf("Retry %d \n", retryNetworks);
          Serial1.print("Looking for networks : ");
          int networksCount = WiFi.scanNetworks(false);
          Serial1.printf("%d\n", networksCount);
          for (int j = 0; j < networksCount; j++){
            Serial1.printf("network %d : %s \n", j+1, WiFi.SSID(j).c_str());
          }
          if (networksCount >= 0){
            for (int i = 0; i < networksCount; i++){
              checkInterrupt();
              if(strcmp(ssid,WiFi.SSID(i).c_str()) != 0){     // only if new ssid isn't the last one. 
                ssid = strdup(WiFi.SSID(i).c_str());
                Serial1.printf("ssid: %s \n", ssid);
                password = findPassword(ssid);  

                if (*ssid != 0x00 && ssid && password){
                  Serial1.printf("Trying to connect to ssid %s with pwd : %s\n",ssid,password);
                  if (WiFiConnect(ssid, password)){
                    Serial1.println("Connected to WiFi network with ssid from saved params");
                    WiFi.scanDelete();
                    if(WiFi.status() == WL_CONNECTED){  
                      Serial1.print("\nIP address: ");
                      IPAddress myip = WiFi.localIP();
                      Serial1.println(myip); 
                      WiFi.printDiag(Serial1);
                    }
                    return true;
                  } else {
                    Serial1.println("\nCan't connect to this WIFI ");    
                    Serial1.println(wl_status_to_string(WiFi.status()));
                  }
                }
              }
            }
          }
          delay(250);
        }
      return false;
    }

/**
 * @brief Efface les paramètres WiFi (config.wifi[] remis à zéro), sauve config sur SD, puis redémarre l'ESP8266
 */
    void resetWifiSettings() {
      Serial1.println(F("settings invalidated"));
      Serial1.println(F("THIS MAY CAUSE AP NOT TO START UP PROPERLY. YOU NEED TO COMMENT IT OUT AFTER ERASING THE DATA."));

      WiFi.mode(WIFI_AP_STA); // cannot erase if not in STA mode !
      WiFi.persistent(true);
#if defined(ESP8266)
      WiFi.disconnect(true);
#else
      WiFi.disconnect(true, true);
#endif
      WiFi.persistent(false);
      delay(200);
      resetWifiSettingsInConfig();
    }

/*________________________________________Config_FUNCTIONS____________________________________________________*/

    // Loads the configuration from EEprom adminPassword & users
/**
 * @brief Charge la configuration admin/user depuis EEPROM (addresses 0-499). Structure : adminPassword(64), user(64), user_password(64), wifi[3].ssid(64), wifi[3].password(64)
 */
    void loadConfigurationEEprom() {
      char buff[64];
      uint8_t i,j;
      uint8_t adminPasswordSize = sizeof(config.adminPassword);
      uint8_t aUserSize = sizeof(config.users[0]);
      uint8_t userNameSize = sizeof(config.users[0].user);
      uint8_t userPwdSize = sizeof(config.users[0].user_passwd);
      uint8_t aWifiSize = sizeof(config.wifi[0]);
      uint8_t ssidSize = sizeof(config.wifi[0].ssid);
      uint8_t ssidPwdSize = sizeof(config.wifi[0].ssid_passwd);


        Serial1.println("loading config");
        EEPROM.begin(sizeof(config)+1);
        i = EEPROM.read(sizeof(config));
//        i=0;                // for debug simulaes a first time
        if (i != 0x75){   // the first time 
          strncpy(config.adminPassword,"manager",adminPasswordSize);    // manager by default
          for (j=0;j<MAX_USERS;j++){
            strncpy(config.users[j].user,"",userNameSize);
            strncpy(config.users[j].user_passwd,"",userPwdSize);
          }
          for (j=0;j<MAX_WIFI;j++){
            strncpy(config.wifi[j].ssid,"",ssidSize);
            strncpy(config.wifi[j].ssid_passwd,"",ssidPwdSize);
          }
          saveConfigurationEEprom("manager","","","","");
        } else {        // not the first time
          for ( i = 0; i < adminPasswordSize; i++ ){                 // adminpasswd
            buff[i] = EEPROM.read ( i );  // read Persistance from EEPROM (Adress = 100...) 
          } 
          if( buff[0] == 0) {
            strcpy(buff,"manager"); // manager by default
          } else {
            strncpy(config.adminPassword,buff,adminPasswordSize);
            for ( j = 0; j < MAX_USERS; j++ ){                  // USERS
              for ( i = 0; i < userNameSize; ++i ){             // user name
                buff[i] = EEPROM.read ( i + adminPasswordSize + (j*aUserSize) ); 
              } 
              if( buff[0] == 0) {
                break;                                          // no more users
              } else {
                strncpy(config.users[j].user,buff,userNameSize);  
                for ( i = 0; i < userPwdSize; ++i ){            // User password j
                  buff[i] = EEPROM.read ( i + adminPasswordSize + (j*aUserSize) + userNameSize );      
                } 
                strncpy(config.users[j].user_passwd,buff,userPwdSize);  
              }
            } // end for each user    

            for ( j = 0; j < MAX_WIFI; j++ ){                  // WIFI
              for ( i = 0; i < ssidSize; ++i ){             // ssid name
                buff[i] = EEPROM.read ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) ); 
              } 
              if( buff[0] == 0) {
                break;                                          // no more ssid
              } else {
                strncpy(config.wifi[j].ssid,buff,ssidSize);  
                for ( i = 0; i < ssidPwdSize; ++i ){            // ssid password 
                  buff[i] = EEPROM.read ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) + ssidSize );      
                } 
                strncpy(config.wifi[j].ssid_passwd,buff,ssidPwdSize);  
              }
            } // end for each wifi    
          }
        }
        EEPROM.end();
        Serial1.println("config is now :");
        Serial1.printf("AdminPassword : %s\n",config.adminPassword);
        for ( j = 0; j < MAX_USERS; j++ ){
          Serial1.printf(" User%d : user name : %s, passwd : %s\n",j,config.users[j].user,config.users[j].user_passwd);
        }     
        for ( j = 0; j < MAX_WIFI; j++ ){
          Serial1.printf(" SSID%d : SSID name : %s, SSID passwd : %s\n",j,config.wifi[j].ssid,config.wifi[j].ssid_passwd);
        }     
    }

/**
 * @brief Sauvegarde config admin/user dans EEPROM (5 entrées : adminPassword, user, user_password, 1er SSID/password). Appelle EEPROM.commit()
 */
    void saveConfigurationEEprom(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password) {
      uint8_t i,j,k;
      bool firstTime = true;
      bool flgFoundSSID = false;
      uint8_t adminPasswordSize = sizeof(config.adminPassword);
      uint8_t aUserSize = sizeof(config.users[0]);
      uint8_t userNameSize = sizeof(config.users[0].user);
      uint8_t userPwdSize = sizeof(config.users[0].user_passwd);
      uint8_t aWifiSize = sizeof(config.wifi[0]);
      uint8_t ssidSize = sizeof(config.wifi[0].ssid);
      uint8_t ssidPwdSize = sizeof(config.wifi[0].ssid_passwd);

        Serial1.printf("Saving config : adminPW : %s, user : %s, passwd : %s, SSID : %s, SSIDPwd : %s\n",adminPassword,user,user_password, ssid, ssid_password);

        EEPROM.begin(sizeof(config)+1);
        i = EEPROM.read(sizeof(config));
//        i=0;                // for debug simulaes a first time
        (i == 0x75) ? firstTime = false : firstTime = true;

        if( adminPassword[0] != 0) {
          for ( i = 0; i < adminPasswordSize; i++ ){
            EEPROM.write ( i , adminPassword[i] );
            config.adminPassword[i] = adminPassword[i];
            if(adminPassword[i]==0)
              break;
          } 
        } 

        if(firstTime) {         // configure the config with good values
          for ( j = 1; j < MAX_USERS; j++ ){                                      // set to 0 next users values
            for ( i = 0; i < userNameSize; i++ ){
              EEPROM.write ( i + adminPasswordSize + (j*aUserSize), 0 );
            } 
            for ( i = 0; i < userPwdSize; i++ ){
              EEPROM.write ( i + adminPasswordSize + (j*aUserSize) + (userNameSize), 0 );
            } 
          }  
          for ( j = 1; j < MAX_WIFI; j++ ){                                      // set to 0 next wifi values
            for ( i = 0; i < ssidSize; i++ ){
              EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize), 0 );
            } 
            for ( i = 0; i < ssidPwdSize; i++ ){
              EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) + ssidSize, 0 );
            } 
          }  
       } else {                 // not the first time so find a empty slot
          if( user[0] != 0) {
             for (k=0;k<MAX_USERS;k++){
               if(config.users[k].user[0]==0) break;
             }
             if (k<MAX_USERS-1) {  // space left moving all so new fits in first place  
               for (j=k;j<0;j--){
                 memcpy(&config.users[j+1],&config.users[j],aUserSize);
                 for (i=0;i<aUserSize;i++){
                  EEPROM.write ( i + adminPasswordSize + ((j+1)*aUserSize), EEPROM.read(i + adminPasswordSize + ((j)*aUserSize)) );
                 }
               }   
             }                     // replacing at the first place  
            for ( i = 0; i < userNameSize; ++i ){                   // user0  
              EEPROM.write ( i + adminPasswordSize , user[i] );   
              config.users[0].user[i] = user[i];
              if(user[i]==0)
                break;
            } 
            for ( i = 0; i < userPwdSize; ++i ){            // passwd user0
              EEPROM.write ( i + adminPasswordSize + (userNameSize), user_password[i] ); 
              config.users[0].user_passwd[i] = user_password[i];
              if(user_password[i]==0)
                break;
            } 
          }
          if( ssid[0] != 0) {
            for (k=0;k<MAX_WIFI;k++){
              if(strcmp(config.wifi[k].ssid,ssid)==0){   // if same ssid
                flgFoundSSID = true;
                break;
              }  
              if(config.wifi[k].ssid[0]==0) break;       // if empty space
            }
            if(flgFoundSSID){                            // already there then recopy the new passwd. 
              for ( i = 0; i < ssidSize; ++i ){                     
                EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + ((k)*aWifiSize), ssid[i] );
                config.wifi[k].ssid[i] = ssid[i];
                if(ssid[i]==0)
                  break;
              } 
              for ( i = 0; i < ssidPwdSize; ++i ){          
                EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + ((k)*aWifiSize) + ssidSize, ssid_password[i] );
                config.wifi[k].ssid_passwd[i] = ssid_password[i];
                if(ssid_password[i]==0)
                  break;
              } 
            } else {                                     // new one then move it at first place.  
              if (k<MAX_WIFI-1) {  // space left moving all so new fits in first place  
                for (j=k;j<0;j--){
                  memcpy(&config.wifi[j+1],&config.wifi[j],aWifiSize);
                  for (i=0;i<aWifiSize;i++){
                    EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + ((j+1)*aWifiSize), EEPROM.read(i + adminPasswordSize + (MAX_USERS*aUserSize) + ((j)*aWifiSize)) );
                  }
                }   
              }                     // replacing at the first place  
              for ( i = 0; i < ssidSize; ++i ){                     
                EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize), ssid[i] );  
                config.wifi[0].ssid[i] = ssid[i];
                if(ssid[i]==0)
                  break;
              } 
              for ( i = 0; i < ssidPwdSize; ++i ){            
                EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + ssidSize, ssid_password[i] ); 
                config.wifi[0].ssid_passwd[i] = ssid_password[i];
                if(ssid_password[i]==0)
                  break;
              } 
            }
          } 
       }


        Serial1.println("config is now :");
        Serial1.printf("AdminPassword : %s\n",config.adminPassword);
        for ( j = 0; j < MAX_USERS; j++ ){
          Serial1.printf(" User%d : user name : %s, passwd : %s\n",j,config.users[j].user,config.users[j].user_passwd);
        }     
        for ( j = 0; j < MAX_WIFI; j++ ){
          Serial1.printf(" SSID%d : SSID name : %s, SSID passwd : %s\n",j,config.wifi[j].ssid,config.wifi[j].ssid_passwd);
        }
        if(firstTime)     
          EEPROM.write(sizeof(config),0x75);    // not the first time anymore. 

        EEPROM.commit();
        EEPROM.end();
        printConfiguration();
    }

/**
 * @brief Affiche le contenu de la config EEPROM sur Serial (admin, user, passwords, SSIDs) pour debug
 */
    void printConfigurationEEprom() {
      char buff[64];
      uint8_t i,j;
      uint8_t adminPasswordSize = sizeof(config.adminPassword);
      uint8_t aUserSize = sizeof(config.users[0]);
      uint8_t userNameSize = sizeof(config.users[0].user);
      uint8_t userPwdSize = sizeof(config.users[0].user_passwd);
      uint8_t aWifiSize = sizeof(config.wifi[0]);
      uint8_t ssidSize = sizeof(config.wifi[0].ssid);
      uint8_t ssidPwdSize = sizeof(config.wifi[0].ssid_passwd);
        
        Serial1.println(F("config from EEPROM is : "));
        EEPROM.begin(sizeof(config)+1);

        for ( i = 0; i < adminPasswordSize; i++ ){      // adm passwd
          buff[i] = EEPROM.read ( i );  
        } 
        Serial1.printf("AdminPassword : %s\n",buff);

        for ( j = 0; j < MAX_USERS; j++ ){              // users
            Serial1.printf(" User%d : ",j);              // user name
            for ( i = 0; i < userNameSize; ++i ){
                buff[i] = EEPROM.read ( i + adminPasswordSize + (j*aUserSize) );     
            } 
            Serial1.printf("user name : %s, ",buff);
            for ( i = 0; i < userPwdSize; ++i ){       // user pwd
                buff[i] = EEPROM.read ( i + adminPasswordSize + (j*aUserSize) + userNameSize );     
            } 
            Serial1.printf("passwd : %s, ",buff);
        } // end for each user

        for ( j = 0; j < MAX_WIFI; j++ ){              // Wifi
            Serial1.printf(" ssid%d : ",j);              // ssid
            for ( i = 0; i < ssidSize; ++i ){
                buff[i] = EEPROM.read ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) );     
            } 
            Serial1.printf("ssid name : %s, ",buff);
            for ( i = 0; i < ssidPwdSize; ++i ){       // ssid pwd
                buff[i] = EEPROM.read ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) + ssidSize );     
            } 
            Serial1.printf("ssid passwd : %s\n",buff);
        } // end for each wifi

        i = EEPROM.read(sizeof(config));
        (i == 0x75) ? Serial1.println(F("this isnt the firstTime")) : Serial1.println(F("this is the firstTime"));

        EEPROM.end();
        Serial1.println();
    } 

    // Loads the configuration from a file
/**
 * @brief Charge la configuration admin/user depuis EEPROM (addresses 0-499). Structure : adminPassword(64), user(64), user_password(64), wifi[3].ssid(64), wifi[3].password(64)
 */
    void loadConfiguration() {
        JsonDocument jsonConfig;         // config file
        int j = 0;

      // Open file for reading
      if (SDFS.exists("/cfg/piscine.cfg")) {      
        File configFile = SDFS.open("/cfg/piscine.cfg","r");  
        if (configFile) logger.println(F("Okay file is open !! "));  
        else {
          Serial1.println(F("Cant to open config file"));
          return;
        }  

        // file is OK Deserialize the JSON document
        DeserializationError error = deserializeJson(jsonConfig, configFile);
        if(error.code() == DeserializationError::Ok){
          Serial1.println(F("Deserialization succeeded"));
          // Copy values from the JsonDocument to the Config

          if (jsonConfig["adminPassword"].is<JsonVariantConst>()) {
            strlcpy(config.adminPassword,                      // <- destination
                    jsonConfig["adminPassword"] | "manager",   // <- source
                    MAX_USERNAME_SIZE               // <- destination's capacity
                    );
          } else {
              strlcpy(config.adminPassword,"manager",MAX_USERNAME_SIZE);
          }          
          if (jsonConfig["users"].is<JsonVariantConst>()) {
            uint8_t max_users = jsonConfig["users"].size();
            if(max_users > MAX_USERS) max_users = MAX_USERS;
            JsonArray usersTable = jsonConfig["users"];
            for (j=0;j<max_users;j++){
              strlcpy(config.users[j].user,usersTable[j]["username"].as<String>().c_str(),MAX_USERNAME_SIZE);
              strlcpy(config.users[j].user_passwd,usersTable[j]["password"].as<String>().c_str(),MAX_USERNAME_SIZE);
            }
          }  
          if (jsonConfig["wifi"].is<JsonVariantConst>()) {
            uint8_t max_wifis = jsonConfig["wifi"].size();
            JsonArray wifiTable = jsonConfig["wifi"];
            if(max_wifis > MAX_WIFI) max_wifis = MAX_WIFI;
            for (j=0;j<max_wifis;j++){
              strlcpy(config.wifi[j].ssid,wifiTable[j]["ssid"].as<String>().c_str(),MAX_WIFI_NAME_SIZE);
              strlcpy(config.wifi[j].ssid_passwd,wifiTable[j]["password"].as<String>().c_str(),MAX_WIFI_NAME_SIZE*2);
            }
          }
          Serial1.println(F("JsonConfig file loaded !!"));
          // print the json config file
          configFile.seek(0,SeekSet);
          while (configFile.available()) {
            Serial1.write(configFile.read());
          }
          Serial1.println();
        } else {
          switch (error.code()) {
            case DeserializationError::InvalidInput:
                Serial1.print(F("Invalid input! "));
                break;
            case DeserializationError::NoMemory:
                Serial1.print(F("Not enough memory "));
                break;
            default:
                Serial1.print(F("Deserialization failed "));
                break;
          }
          Serial1.println(F("Deserialize error Failed to interpret config file, using default configuration : adminPw=manager, nbusers=0"));
          strncpy(config.adminPassword,"manager",MAX_USERNAME_SIZE);
          // need to load defaults options and wifi params too ....
        }
        // Close the file (Curiously, File's destructor doesn't close the file)
        configFile.close();
        printConfiguration();
      } else {
          Serial1.println(F("Cant to open config file, file not found"));
          return;
      }
    }

    // Saves the configuration to a file
/**
 * @brief Sauvegarde config admin/user dans EEPROM (5 entrées : adminPassword, user, user_password, 1er SSID/password). Appelle EEPROM.commit()
 */
    void saveConfiguration() {
          JsonDocument jsonConfig;         // config file
          String jsonBuff;
          int i;

      // Open file for writing
        if (SDFS.exists("/cfg/piscine.cfg")) {      
          File configFile = SDFS.open("/cfg/piscine.cfg", "w");  
          if (configFile) logger.println(F("Okay file is open !! "));  
          else {
            Serial1.println(F("Failed to open config file for writing"));
            return;
          }  
          jsonConfig["adminPassword"] = config.adminPassword;

          JsonArray users = jsonConfig["users"].to<JsonArray>();
          for(i=0;i<MAX_USERS;i++){
            if(config.users[i].user[0] != '\0'){
              JsonObject user = users.add<JsonObject>();
              user["name"] = config.users[i].user;
              user["password"] = config.users[i].user_passwd;
            }
          }
          JsonArray wifis = jsonConfig["wifi"].to<JsonArray>();
          for(i=0;i<MAX_WIFI;i++){
            if(config.wifi[i].ssid[0] != '\0'){
              JsonObject wifi = wifis.add<JsonObject>();
              wifi["ssid"] = config.wifi[i].ssid;
              wifi["password"] = config.wifi[i].ssid_passwd;
            }
          }

          serializeJson(jsonConfig, jsonBuff);
          configFile.print(jsonBuff); 
          delay(1); 
          configFile.close();   //Close the file
          Serial1.println (F("Json config file saved : "));
          Serial1.println(jsonBuff);
          printConfiguration();
        } else {
          Serial1.println(F("Failed to open config file for writing, file not found"));
          return;
        }
    }

/**
 * @brief Met à jour config en mémoire (adminPassword, user, user_password, wifi[0]), puis appelle saveConfiguration() et saveConfigurationEEprom()
 */
    void saveNewConfiguration(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password) {
          bool foundUser = false, foundSSID = false;
          int i = 0;

      if(adminPassword != nullptr){
        Serial1.printf("Saving new adminPassword: %s\n", adminPassword);
        strncpy(config.adminPassword,adminPassword,sizeof(config.adminPassword));
      }

      if(user != nullptr){        // new user
        Serial1.printf("Saving new user : name : %s, Pwd : %s\n",user, user_password);
        for(i=0;i<MAX_USERS;i++){
          if(config.users[i].user[0]==0){ // no more users
            break;
          } else if(strcmp(config.users[i].user,user)==0 ) {                         // if user exists  
            strncpy(config.users[i].user_passwd,user_password,MAX_USERNAME_SIZE);
            foundUser = true;
            break;
          }
        }
        if(!foundUser){
          if (i<MAX_USERS){                                            // room for new info
            strncpy(config.users[i].user,user,MAX_USERNAME_SIZE);
            strncpy(config.users[i].user_passwd,user_password,MAX_USERNAME_SIZE);
          } else {                                                    // no space replace first entry (oldest)  
            strncpy(config.users[0].user,user,MAX_USERNAME_SIZE);
            strncpy(config.users[0].user_passwd,user_password,MAX_USERNAME_SIZE);
          }
        }
      }
      if(ssid != nullptr){        // new ssid
        Serial1.printf("Saving wifi config : SSID : %s, SSIDPwd : %s\n",ssid, ssid_password);
        for(i=0;i<MAX_WIFI;i++){
          if(config.wifi[i].ssid[0]==0){ // no more ssids
            break;
          } else if(strcmp(config.wifi[i].ssid,ssid)==0 ) {                         // if ssid exists  
            strncpy(config.wifi[i].ssid_passwd,ssid_password,sizeof(config.wifi[i].ssid_passwd));
            foundSSID = true;
            break;
          }
        }
        if(!foundSSID){
          if (i<MAX_WIFI){                                            // room for new info
            strncpy(config.wifi[i].ssid,user,sizeof(config.wifi[0].ssid));
            strncpy(config.wifi[i].ssid_passwd,ssid_password,sizeof(config.wifi[0].ssid_passwd));
          } else {                                                    // no space replace first entry (oldest)  
            strncpy(config.wifi[0].ssid,user,sizeof(config.wifi[0].ssid));
            strncpy(config.wifi[0].ssid_passwd,ssid_password,sizeof(config.wifi[0].ssid_passwd));
          }
        }
      }
      saveConfiguration();
    }

/**
 * @brief Affiche le contenu de la config EEPROM sur Serial (admin, user, passwords, SSIDs) pour debug
 */
    void printConfiguration() {    // Prints the content of a file to the Serial1
      uint8_t i = 0;

      Serial1.println(F("Configuration in config struct is :"));
      Serial1.printf("AdminPassord: %s\n",config.adminPassword);
      for(i=0;i<MAX_USERS;i++){
        Serial1.printf("User %d : name %s, password %s\n",i,config.users[i].user, config.users[i].user_passwd);
      }
      for(i=0;i<MAX_WIFI;i++){
        Serial1.printf("Wifi %d : ssid %s, ssid_password %s\n",i,config.wifi[i].ssid, config.wifi[i].ssid_passwd);
      }
      Serial1.println();
    } 

/**
 * @brief Efface les paramètres WiFi (config.wifi[] remis à zéro), sauve config sur SD, puis redémarre l'ESP8266
 */
    void resetWifiSettingsInConfig() {
      uint8_t i,j;
      uint8_t adminPasswordSize = sizeof(config.adminPassword);
      uint8_t aUserSize = sizeof(config.users[0]);
      uint8_t aWifiSize = sizeof(config.wifi[0]);
      uint8_t ssidSize = sizeof(config.wifi[0].ssid);
      uint8_t ssidPwdSize = sizeof(config.wifi[0].ssid_passwd);
        
        EEPROM.begin(sizeof(config)+1);
        for ( j = 0; j < MAX_WIFI; j++ ){                                      
          for ( i = 0; i < ssidSize; i++ ){
            EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize), 0 );
          } 
          for ( i = 0; i < ssidPwdSize; i++ ){
            EEPROM.write ( i + adminPasswordSize + (MAX_USERS*aUserSize) + (j*aWifiSize) + ssidSize, 0 );
          } 
          strncpy(config.wifi[j].ssid,"",ssidSize);
          strncpy(config.wifi[j].ssid_passwd,"",ssidPwdSize);
        }  

        Serial1.println("config is now :");
        Serial1.printf("AdminPassword : %s\n",config.adminPassword);
        for ( j = 0; j < MAX_USERS; j++ ){
          Serial1.printf(" User%d : user name : %s, passwd : %s\n",j,config.users[j].user,config.users[j].user_passwd);
        }     
        for ( j = 0; j < MAX_WIFI; j++ ){
          Serial1.printf(" SSID%d : SSID name : %s, SSID passwd : %s\n",j,config.wifi[j].ssid,config.wifi[j].ssid_passwd);
        }

        EEPROM.commit();
        EEPROM.end();
        printConfiguration();
    }  
/*_________________________________________HELPER_FUNCTIONS__________________________________________________*/

/**
 * @brief Liste récursive du contenu d'un répertoire SD (fichiers + sous-répertoires) avec indentation. Utilisée pour debug SD
 */
    void printDirectory(File dir, int numTabs) {

        dir.rewindDirectory();
        while(true) {
          File entry =  dir.openNextFile();
          if (! entry) {
            // no more files
            //Serial1.println("**nomorefiles**");
            break;
          }
          for (uint8_t i=0; i<numTabs; i++) {
            Serial1.print('\t');   // we'll have a nice indentation
          }
          // Print the 8.3 name
          Serial1.print(entry.name());
          // Recurse for directories, otherwise print the file size
          if (entry.isDirectory()) {
            Serial1.println("/ (Rep)");
            printDirectory(entry, numTabs+1);
          } else {
            // files have sizes, directories do not
            Serial1.print("\t\t");
            Serial1.println(entry.size(), DEC);
          }
          entry.close();
        }
    }

/**
 * @brief Synchronise l'horloge système via NTP (europe.pool.ntp.org, pool 123). Applique timezone TZ_OFFSET + DST (heure d'été France). Retourne true si succès
 */
    bool getNTPTime(){
      bool rtn = false;
      int counter = 0;
      bool timeUpdated = false;

       
        if(WiFi.status() == WL_CONNECTED){ 
                 // now connect to ntp server and get time
          timeClient.begin();
          Serial1.print(" Trying to get New TIME from NTP ");
          timeUpdated = timeClient.update();
          while(!timeUpdated && counter < 20) {
            timeUpdated = timeClient.forceUpdate();
            delay(500);
            counter++;
            Serial1.print("+");
          }
          Serial1.println();
          if(timeUpdated){ // we could update the time
            time_t newTime = timeClient.getEpochTime();   //time in seconds since Jan. 1, 1970
            newTime = newTime + (3600 * TZ_OFFSET);
            newTime = newTime + dstOffset(newTime);  //Adjust for DLT
            setTime(newTime);
            NTPok = true;
            Serial1.print(" New TIME from NTP : ");
            Serial1.println(timeClient.getFormattedTime());
            Serial1.printf(" New TIME calcuated : %02d/%02d/%d %02d:%02d:%02d\n",day(),month(),year(),hour(),minute(),second());
            webAction.doChangeDate();
            rtn = true;
          }else{
            Serial1.println("Can't get time from ntp server");
            NTPok = false;
            rtn = false;
          }
          timeClient.end();
  //        setSyncProvider(timeClient.getEpochTime);       // the function to get the time from the RTC
  //        setSyncInterval(3600*12);          // set refresh to every 12 hour (30 days = 2592000);
        } else {
          Serial1.println("Can't get time because not connected to WIFI");
          NTPok = false;
          rtn = false;     // can't connect to wifi
        }
        return rtn;
    }

/**
 * @brief Calcule l'offset DST (Daylight Saving Time) pour la France : +3600s si été (dernier dimanche mars 2h -> dernier dimanche octobre 3h), sinon 0
 */
    int dstOffset(time_t newTime){  //Adjust for DST
     // On vérifie si on est en heure d'été, un dimanche après le 25 octobre à 3H
     // On vérifie si on est en heure d'hiver, un dimanche après le 25 mars à 3H
    
      tmElements_t te;
      time_t dstStart,dstEnd;
    
        te.Year = year(newTime)-1970;
        te.Month = 3;
        te.Day = 25;
        te.Hour = 3;
        te.Minute = 0;
        te.Second = 0;
        dstStart = makeTime(te);
        dstStart = nextSunday(dstStart);  //first sunday after 25 mars
        te.Month = 10;
        dstEnd = makeTime(te);
        dstEnd = nextSunday(dstEnd);      //first sunday after 25 octobre
    
        if (newTime>=dstStart && newTime<dstEnd)
          return (3600);                  //Add back in one hours worth of seconds - DST in effect
        else
          return (0);                     //NonDST
    }

/**
 * @brief Convertit une taille en octets vers chaîne formatée (B, KB ou MB) selon magnitude (ex: 1536 -> "1.50 KB")
 */
    String formatBytes(size_t bytes) { // convert sizes in bytes to KB and MB
      String rtn;
      if (bytes < 1024) {
        rtn = String(bytes) + "B";
      } else if (bytes < (1024 * 1024)) {
        rtn = String(bytes / 1024.0) + "KB";
      } else if (bytes < (1024 * 1024 * 1024)) {
        rtn = String(bytes / 1024.0 / 1024.0) + "MB";
      }
      return rtn;
    }

/**
 * @brief Détermine le MIME type d'un fichier selon son extension (.html -> text/html, .css -> text/css, .js -> application/javascript, etc.)
 */
    String getContentType(String filename) { // determine the filetype of a given filename, based on the extension
      if (filename.endsWith(".html")) return "text/html";
      else if (filename.endsWith(".css")) return "text/css";
      else if (filename.endsWith(".js")) return "application/javascript";
      else if (filename.endsWith(".ico")) return "image/x-icon";
      else if (filename.endsWith(".gz")) return "application/x-gzip";
      return "text/plain";
    }

/**
 * @brief Convertit un code de statut WiFi (wl_status_t enum) en chaîne lisible ("WL_CONNECTED", "WL_NO_SSID_AVAIL", etc.) pour debug
 */
    const char* wl_status_to_string(wl_status_t status) {
      switch (status) {
        case WL_NO_SHIELD: return "WL_NO_SHIELD";
        case WL_IDLE_STATUS: return "WL_IDLE_STATUS";
        case WL_NO_SSID_AVAIL: return "WL_NO_SSID_AVAIL";
        case WL_SCAN_COMPLETED: return "WL_SCAN_COMPLETED";
        case WL_CONNECTED: return "WL_CONNECTED";
        case WL_CONNECT_FAILED: return "WL_CONNECT_FAILED";
        case WL_CONNECTION_LOST: return "WL_CONNECTION_LOST";
        case WL_DISCONNECTED: return "WL_DISCONNECTED";
        case WL_WRONG_PASSWORD: return "WL_WRONG_PASSWORD";
      }
      return "";
    }

/*__________________________________________END_FUNCTIONS___________________________________________________*/
 
