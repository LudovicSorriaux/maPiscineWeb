/*******************************************************************************
 * @file    PiscineWebActionControler.cpp
 * @brief   Implémentation contrôleur d'actions web
 * @details Synchronisation NTP, mise à jour date/heure, initialisation
 *          paramètres piscine, rafraîchissement données périodique.
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#include "PiscineWebActionControler.h"
#include "Logger.h"
#include "PiscineWebTelecom.h"
#include "ManagerTelecom.h"
#include "globalPiscineWeb.h"
#include "IndexNames.h"  // Optimisation RAM #6 : Noms des paramètres en PROGMEM

    PiscineWebActionControlerClass::~PiscineWebActionControlerClass(void)
      {};
/**
 * @brief Constructeur : Initialise la classe PiscineWebActionControlerClass (log debug si activé)
 */
    PiscineWebActionControlerClass::PiscineWebActionControlerClass(){
      if(debug){
          logger.println("  in PiscineWebActionControler setup : ");
      }
    }

/**
 * @brief Placeholder fonction startup (actuellement vide, réservée pour initialisations futures)
 */
      void PiscineWebActionControlerClass::setStartupApp() {
      }
      
/**
 * @brief Réinitialise tous les flags changed* du tableau piscineParams[] (changedWeb, changedFromManager, changedControler = false)
 */
      void PiscineWebActionControlerClass::initializePiscineParams(){
        for(int i=0;i<IND_MAX_PISCINE+1;i++){
          piscineParams[i].changedWeb = false;
          piscineParams[i].changedFromManager = false;
          piscineParams[i].changedControler = false;
        }
      }


/**
 * @brief Envoie une demande de synchronisation complète au contrôleur ESP32 via webTelecom.sendAskSyncMess('C')
 */
      void PiscineWebActionControlerClass::refreshData() {
          webTelecom.sendAskSyncMess('C');
      }
      
/**
 * @brief Envoie la nouvelle date/heure au contrôleur ESP32 via webTelecom.sendTimeMess() (appelée après synchro NTP réussie)
 */
      void PiscineWebActionControlerClass::doChangeDate(){    // called from get ntp_time to set the new time to the controler
        webTelecom.sendTimeMess();
/*   
        tmElements_t tm;
        breakTime(newTime, tm);  // break time_t into elements
        flgEpochOK=6;   // !=0 so true; 
        webTelecom.setWriteData(IND_Sec, tm.Second);
        webTelecom.setWriteData(IND_Year, tm.Year);
        webTelecom.setWriteData(IND_Month, tm.Month);
        webTelecom.setWriteData(IND_Day, tm.Day);
        webTelecom.setWriteData(IND_MN, tm.Minute);
        webTelecom.setWriteData(IND_Hour, tm.Hour);
*/
      }

/**
 * @brief Vérifie le timeout de synchronisation (timeoutSynch). Si expiré, envoie une demande de synchro complète au contrôleur (refreshData)
 */
      void PiscineWebActionControlerClass::OnUpdate(){
          static uint8_t nbCall = 0;

        if(webTelecom.isControleurPresent()){
          if(nbCall++ > 100){ 
            nbCall = 0;  
            timeoutSynch -= (millis() - lastcheck);
            if (timeoutSynch < 0) {                          // end menu switch display to normal
              logger.print(F(" ActionWebControler need a new synch"));
              timeoutSynch = TimeToSynch;                    // 1 heure
              refreshData();
            } else {
              lastcheck = millis();
            }
          }
          getControlerValues();         // do normal stuff if controler present
          sendWebValuesToControler();   // Next send new values

          if(managerPresent){
            sendManagerValuesToControler();
          }
        }

      }



// private :
 

  /*
   * void PiscineWebActionControlerClass::getControlerValues
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebActionControlerClass::getControlerValues(){
      dataStruct tabRead[MAX_READ_DATA];
      bool gotData = false;
      uint8_t index, i=0;
      int16_t valeur;
      bool doLogData = false;

        for (i=0; i<MAX_READ_DATA;i++){
          tabRead[i].index = 255;
        }

        gotData = webTelecom.getReadData(tabRead, sizeof(tabRead));
        if (gotData) {
          for (i=0; i<MAX_READ_DATA; i++){
            if (tabRead[i].index != 255) {          // donc != 255 ... 
              index = tabRead[i].index;
              valeur = tabRead[i].value;
              char nameBuf[MAX_KEY_LEN];  // Optimisation RAM #6 : Buffer pour PROGMEM
              if (debug) logger.printf(" Action is now processiong command %s with index=%d and value=%d\n",getIndexName(index, nameBuf),index,valeur);
              if(index < IND_ClearAlert){       // only store used parameters
                piscineParams[index].valeur = valeur;
                piscineParams[index].changedControler = true;
                // DÉSACTIVÉ : ESP-NOW manager (optimisation RAM)
                // if(managerPresent){
                //   managerTelecom.sendNewValue(index,valeur);
                // }  
                switch (index) {
                  case IND_TempEau:
                  case IND_TempAir:
                  case IND_TempPAC:
                  case IND_TempInt:
                  case IND_PHVal:
                  case IND_RedoxVal:
                  case IND_CLVal:
                  case IND_PompePH:
                  case IND_PompeCL:
                  case IND_PompeALG:
                  case IND_PP:
                  case IND_PAC:
                  case IND_Auto:
                    doLogData = true;
                } 
              } else {                              // else process them now
                processAction(index,valeur);
              }
            } else {    // end no more datas 
              break;      // break out of for()
            }
          }
          if(doLogData)
            logger.logData();
        }
    }

  /*
   * void PiscineWebActionControlerClass::processAction
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebActionControlerClass::processAction(uint8_t index, int16_t valeur) {
        
        switch(index) {
          case IND_EPOCH :        //time update
              if (debug) {
                logger.printf(" Action is now processiong command IND_EPOCH with index=%d and value=%d\n",index,valeur);
              } 
              if(valeur == 1){    // if ==0 dont do anything
                logger.println("Ask for new time...");
                if (!NTPok){                // if NTP OK new date is sent by proc and ack OK 
                  logger.println("Time asked but Can't get time from ntp server");
                  // DÉSACTIVÉ : ESP-NOW manager (optimisation RAM)
                  // if(managerPresent) {
                  //   managerTelecom.askNewTime();
                  // }  
                } else {
                  webTelecom.sendTimeMess();
                } 
              }
            break;  

          case IND_WifiStatus :     // 1 = ask
              if(valeur == 1){
                webTelecom.setWriteData(IND_BlinkWifiLed, wifi_status);  // 0: off; 1: ON; -1: blink 3 time
              }  
            break;

          case IND_Debug :      // 1 is true: set debug true, 0 is set to false
              (valeur == 1) ? debug = true : debug = false;
            break;

        }
        
    }

  /*
   * void PiscineWebActionControlerClass::sendWebValuesToControler
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebActionControlerClass::sendWebValuesToControler(){
      for(int i=0;i<IND_MAX_PISCINE;i++){  
        if(piscineParams[i].changedWeb) {  
          webTelecom.setWriteData(i, piscineParams[i].valeur);
          piscineParams[i].changedWeb = false;
        }
      }
    }

  /*
   * void PiscineWebActionControlerClass::sendManagerValuesToControler
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebActionControlerClass::sendManagerValuesToControler(){
      for(int i=0;i<IND_MAX_PISCINE;i++){  
        if(piscineParams[i].changedFromManager) {  
          webTelecom.setWriteData(i, piscineParams[i].valeur);
          piscineParams[i].changedFromManager = false;
        }
      }
    }


