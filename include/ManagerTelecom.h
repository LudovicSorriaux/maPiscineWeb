/*******************************************************************************
 * @file    ManagerTelecom.h
 * @brief   Gestionnaire de télécommunication ESP-NOW (expérimental)
 * @details Template callbacks pour communication ESP-NOW entre ESP8266
 *          Fournit infrastructure callback C++ → C pour ESP-NOW
 *          (Alternative/Complément au protocole ICSC série)
 * 
 * Usage   : Communication sans fil optionnelle (non utilisé actuellement)
 * Référencé par : (expérimental)
 * Référence     : espnow.h (ESP-NOW), ArduinoJson, globalPiscine.h
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

// DÉSACTIVÉ : Module ESP-NOW désactivé pour optimisation RAM
// Tout le contenu de ce fichier est mis en commentaire
// Pour réactiver : décommenter le bloc ci-dessous et restaurer les appels dans le code

#if 0  // <-- METTRE À 1 POUR RÉACTIVER ESP-NOW

#include "globalPiscine.h"

#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <TimeLib.h>

extern "C" {
#include <espnow.h>
}
/*
#include <Arduino.h>
#include <Print.h>
extern "C" {
#include <espnow.h>
}
*/ 

template <typename T>
struct Callback;

template <typename Ret, typename... Params>
struct Callback<Ret(Params...)> {
   template <typename... Args> 
   static Ret callback(Args... args) {                    
      return func(args...);  
   }
   static std::function<Ret(Params...)> func; 
};

template <typename Ret, typename... Params>
std::function<Ret(Params...)> Callback<Ret(Params...)>::func;

typedef struct message {
  uint8_t messID = DATA_MSG;
  uint8_t macOfPeer[ESP_NOW_ETH_ALEN];
  uint8_t boardID;
  char jsonBuff[ESP_NOW_MAX_DATA_LEN-(3+ESP_NOW_ETH_ALEN)];
  uint8_t sendingId = 0;
} struct_message;
typedef struct initNode {
  uint8_t messID = CLIENT_HELLO;
  uint8_t sendingId = 0;
} initdataMsg;
typedef struct initManagerMsg {
  uint8_t messID = SERVER_HELLO;
  uint8_t macOfPeer[ESP_NOW_ETH_ALEN];
  uint8_t channel;
  uint8_t sendingId = 0;
} initManagerData;
typedef struct synchTimeMsg {
  uint8_t messID = SYNCH_TIME;
  uint8_t day;
  uint8_t mounth;
  uint8_t year;
  uint8_t hours;
  uint8_t minutes;
  uint8_t seconds;
  uint8_t weekday;    // 0 is dimanche
  uint8_t sendingId = 0;
} synchTimeData;
typedef struct synchTimeReqMsg {
  uint8_t messID = SYNCH_TIME_REQ;
  uint8_t sendingId = 0;
} synchTimeReqData;
typedef struct errorMsg {
  uint8_t messID = ERROR_MSG;
  uint8_t macOfPeer[ESP_NOW_ETH_ALEN];
  char message[100];
  uint8_t sendingId;
} errorData;


class ManagerTelecomClass {

  public :

// ------------- Begin all ControlerTelecom manager functions ----------------
  
    ManagerTelecomClass();
    ~ManagerTelecomClass(void);

    void managerTelecomInitialisation();
    void setTimeCallBack(void (*theTimeCallBack)(time_t thetime));
    void reconnectControlerTelecom();
    bool isControlerTelecomconnected();
    void askNewTime();
    bool isTimeSych();
    void writeContent(uint8_t character);
    void setFlgWaitAckRefresh(bool etat);
    void printToTerminal();   // Sent serial data to ControlerTelecom terminal - Unlimited string readed
    void sendToManagerNewValues();
    void sendNewValue(uint8_t index,int16_t valeur);
    void sendSyncMess(uint8_t typeSync);

      
      bool modeEtalonPH = false;
      bool modeEtalonCL = false;

  private :

      JsonDocument jsonValues;
//      DynamicJsonDocument  jsonValues(ESP_NOW_MAX_DATA_LEN-(3*ESP_NOW_ETH_ALEN)); //
      bool newValuesToSend = false;
      bool needToSync = true;
      bool firstTime = true;
      void (*timeCallback)(time_t thetime);
      bool foundManager = false;
      bool synchedTime = false;

      uint8_t nbOK = 0;
      uint8_t nbMiseAJour = 0;  
      uint32_t lastChangeDate = 0;
      bool flipflop = true;
      bool alertOK = false;
      String content = "";  //null string constant for terminal( an empty string )
      unsigned long  lastSendEmailAlert = 0;
      unsigned long  lastSendSMSAlert = 0;
      bool flgWaitAckRefresh = false;
      int8_t nbWaitACKRefresh = 0;

      int16_t nouvelleHeure[7] = {0,0,0,0,0,0,0};     // hr, min, sec, day, month, yr, wday
      char ligne1[17], ligne2[17];
      uint32_t lastTimeConnected;

      uint8_t broadcastAddress[ESP_NOW_ETH_ALEN] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};    //MAC Address to broadcast 
      uint8_t managerMac[ESP_NOW_ETH_ALEN];   // manager's mac address
      uint8_t myOwnMac[ESP_NOW_ETH_ALEN];     // my mac address
      int8_t channel;                         // WiFi Channel

      message dataMsg;
      initdataMsg initNodeMessage;
      initManagerData initManagerMessage;
      synchTimeData synchTimeMessage;
      synchTimeReqData synchTimeReqMessage;
      errorData errorMessage;
      uint8_t nbSendReties = 0;                // control nb send failures to detect problem 
      const uint8_t maxSendRetries = 3;        // can't reach manager any more restart init prcedure

    // private 
    void registerSendCallback();
    void registerRecvCallback();
    bool InitESPNow();
    void formatMacAddressToStr(const uint8_t *macAddr, char *buffer, int maxLength);
    bool registerPeer(uint8_t peerMac[]);           //Register peer (manager for slave)
    bool compareMacAdd(uint8_t *mac1, uint8_t *mac2);
    void receiveCallback(uint8_t *macAddr, uint8_t *data, uint8_t dataLen);
    void doCallbacks();
    void sentCallback(uint8_t *macAddr, uint8_t status);        // callback when data is sent
    void getMessageType(uint8_t messId, char *messagetypeStr);
    template <typename T> void sendData(uint8_t *peerAddress, const T message);

    // utils functions
    void printDate(time_t newDate);
    String toString(int16_t valeur, int8_t divider);
    float roundFloat(float num,int precision);
    String toHeureFormat(int16_t mn);

};

#endif  // #if 0 - Fin bloc ESP-NOW désactivé
