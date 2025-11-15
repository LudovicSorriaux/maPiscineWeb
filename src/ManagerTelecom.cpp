#include "ManagerTelecom.h"
#include "Logger.h"
#include "PiscineWebTelecom.h"
#include "PiscineWebActionControler.h"
#include "globalPiscineWeb.h"

//#include "controlerTelecomDefs.h"
//#include "controlerTelecomCallBacks.h"



// ------------- Begin all ControlerTelecom manager functions ----------------
  
    ManagerTelecomClass::ManagerTelecomClass(){
      if(debug){
          logger.println("  in ManagerTelecom setup : ");
      }
    }

    ManagerTelecomClass::~ManagerTelecomClass(void)
      {};



    void ManagerTelecomClass::managerTelecomInitialisation(){     // called by setup
        if(debug){
          if (firstTime) logger.println(F("  in ControlerTelecom initialisation : "));
          else logger.println(F("  in ControlerTelecom initialisation try to reconnect"));
        }
        webTelecom.setWriteData(IND_BlinkWifiLed, -1); // 0: off; 1: ON; -1: blink 3 times
        if(firstTime){
          logger.println("LSHome Piscine Object Starting ...");
          logger.print("My MAC Address is: ");          // Output my MAC address - useful for later
          logger.println(WiFi.macAddress());
          WiFi.macAddress(myOwnMac);
          logger.print("My WiFi Channel is: ");         // Output wifi channel - useful for later
          logger.println(WiFi.channel());
          channel = WiFi.channel();
          if(InitESPNow()){                                 // Init ESP now with Restart if something goes wrong
            firstTime = false;
          }
        }
        if (!foundManager){                             // in initialisation phase need to send Client Hello msg
          initNodeMessage.sendingId++;
          sendData(broadcastAddress,initNodeMessage);
        } 
    }

    void ManagerTelecomClass::setTimeCallBack(void (*theTimeCallBack)(time_t thetime)){
      timeCallback = theTimeCallBack;
    }

    void ManagerTelecomClass::reconnectControlerTelecom(){
      if(!foundManager){
        logger.println(F("Not connected to ControlerTelecom server.. Retrying"));
        managerTelecomInitialisation();  
      }
      else{
        if (nbOK == 100){
          logger.println(F("Still connected (100 fois) to ControlerTelecom server => OK "));
          nbOK=0;    
        } else nbOK++;
      }
    }

    bool ManagerTelecomClass::isControlerTelecomconnected(){
      return foundManager;
    }   

    void ManagerTelecomClass::askNewTime(){
      if(!foundManager){
        reconnectControlerTelecom();
      } else {
        synchTimeReqMessage.sendingId += 1;
  //      sendData(managerMac,synchTimeReqMessage);
        sendData(broadcastAddress,synchTimeReqMessage);
      }
    }

    bool ManagerTelecomClass::isTimeSych(){
      return synchedTime;
    }

    void ManagerTelecomClass::writeContent(uint8_t character){
      content.concat(char(character));
    }
          
    void ManagerTelecomClass::setFlgWaitAckRefresh(bool etat){
      flgWaitAckRefresh = etat;
      if(etat) nbWaitACKRefresh=0;
    }

    void ManagerTelecomClass::printToTerminal(){   // Sent serial data to ControlerTelecom terminal - Unlimited string readed
     if (content != "") {
//        ControlerTelecom.virtualWrite (TerminalControlerTelecom, content);
        content = "";                         
     }  
   }

    void ManagerTelecomClass::sendNewValue(uint8_t index,int16_t valeur){
      String key;
      
      key = String(index);
      jsonValues[key] = valeur;
      newValuesToSend = true;
      logger.printf("prepare to send to manager %s, id %d is : %d\n",indexName[index],index,piscineParams[index].valeur);
    }

    void ManagerTelecomClass::sendToManagerNewValues() {
      String jsonBuff;

        if(newValuesToSend){
          dataMsg.boardID = PISCINE_ID;
          memcpy(dataMsg.macOfPeer, managerMac, ESP_NOW_ETH_ALEN);
          serializeJson(jsonValues, jsonBuff);
          jsonValues.clear();                                   // reset jsonvalues
          strcpy(dataMsg.jsonBuff, jsonBuff.c_str());
          dataMsg.sendingId += 1;
          logger.printf("Sending new Data_Msg message");
      //      sendData(managerMac,dataMsg);
          sendData(broadcastAddress,dataMsg);
          newValuesToSend = false;
        }
    }

    void ManagerTelecomClass::sendSyncMess(uint8_t typeSync){
        // todo
    }

// private 

    bool ManagerTelecomClass::InitESPNow() {                             // Init ESP now with Restart if something goes wrong
        bool rtn = false;

      WiFi.mode(WIFI_STA);          // Station mode for esp-now sensor node
//      WiFi.disconnect();
      WiFi.macAddress(myOwnMac);    // set mac add in myOwnMac

      // Initialize ESP-now ----------------------------

      if (esp_now_init() == 0) {               // startup ESP Now
        esp_now_set_self_role(3);                   // ESP set role 1 = Master, 2 = Slave 3 = Master + Slave     
        registerSendCallback();
        registerRecvCallback();
        registerPeer(broadcastAddress);             // register broadcast as a valid peer
        channel = wifi_get_channel();
        if(debug) logger.println("*** ESP_Now has now init sucessfully");
        rtn = true;
      } else {      // espnow init failed
        if(debug) logger.println("*** ESP_Now init failed. Going to sleep");
        rtn = false;
      }
      return rtn;
    }

    void ManagerTelecomClass::registerSendCallback(){
      Callback<void(uint8_t*,uint8_t)>::func = std::bind(&ManagerTelecomClass::sentCallback, this, std::placeholders::_1, std::placeholders::_2);
      esp_now_send_cb_t func = static_cast<esp_now_send_cb_t>(Callback<void(uint8_t*,uint8_t)>::callback);      
      esp_now_register_send_cb(func);     // Once ESPNow is successfully Init, we will register for Send CB to get the status of Trasnmitted packet     
    }

    void ManagerTelecomClass::registerRecvCallback(){
      Callback<void(uint8_t*,uint8_t*,uint8_t)>::func = std::bind(&ManagerTelecomClass::receiveCallback, this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3);
      esp_now_recv_cb_t func = static_cast<esp_now_recv_cb_t>(Callback<void(uint8_t*,uint8_t*,uint8_t)>::callback);      
      esp_now_register_recv_cb(func);     // Once ESPNow is successfully Init, we will register for Send CB to get the status of Trasnmitted packet     
    }


    void ManagerTelecomClass::formatMacAddressToStr(const uint8_t *macAddr, char *buffer, int maxLength) {
      snprintf(buffer, maxLength, "%02x:%02x:%02x:%02x:%02x:%02x", macAddr[0], macAddr[1], macAddr[2], macAddr[3], macAddr[4], macAddr[5]);
    }

    bool ManagerTelecomClass::registerPeer(uint8_t peerMac[]){           //Register peer (manager for slave)
      bool rtn = false;
        if ( !esp_now_is_peer_exist(peerMac)) {     // Slave not paired, attempt pair       
            logger.print("Register Peer with status : ");       
            if (esp_now_add_peer(peerMac,ESP_NOW_ROLE_COMBO,channel,NULL,0) == 0) {         // Pair success         
                logger.println("Pair success");   
                rtn = true;      
            } else {         
                logger.println("Could Not peer");
                rtn = false;         
            }     
        } else {
            logger.println("Peer Already registred");
            rtn = true;         
        }
        return rtn;
    }

    bool ManagerTelecomClass::compareMacAdd(uint8_t *mac1, uint8_t *mac2){
        bool isSame = true;
      for (int i=0; i<ESP_NOW_ETH_ALEN; i++){
        if(mac1[i] != mac2[i]){
          isSame = false;
          break;
        }
      }
      return isSame;
    }

    void ManagerTelecomClass::receiveCallback(uint8_t *macAddr, uint8_t *data, uint8_t dataLen){
      // only allow a maximum of 250 characters in the message + a null terminating byte

      int msgLen = ((ESP_NOW_MAX_DATA_LEN)<(dataLen) ? (ESP_NOW_MAX_DATA_LEN) : (dataLen));       // min(ESP_NOW_MAX_DATA_LEN, dataLen);
      char buffer[msgLen + 1];
      char macStr[18];        // format the mac address
      
      strncpy(buffer, (const char *)data, msgLen);
      buffer[msgLen] = 0;     // make sure we are null terminated

      formatMacAddressToStr(macAddr, macStr, 18);
      // debug log the message to the serial port
      logger.printf("Received message from: %s\n", macStr);
      // what are our instructions
      switch(buffer[0]) {       // message type
      // for routeur solaire
        case CLIENT_ROUTEUR_HELLO:
            Serial.printf("Received CLIENT_ROUTEUR_HELLO Message\n");
            memcpy(managerMac, macAddr, ESP_NOW_ETH_ALEN);     
            if(registerPeer(macAddr)){       // if registred correctly
              memcpy(initManagerMessage.macOfPeer, macAddr, ESP_NOW_ETH_ALEN);
              initManagerMessage.channel = channel;
              sendData(macAddr,initManagerMessage);     // send server_hello
              routeurData.routeurPresent = true;
              webTelecom.sendRouteurData(false);    // data is false so hello mess
            }
          break;
        case ROUTEUR_DATA_MSG:
          memcpy(&routeurData, data, dataLen);     
          Serial.printf("Received an Routeur_DATA_MSG broadcasted or addressed to me \n");
          webTelecom.sendRouteurData(true);
          break;
      // for Manager management
        case SERVER_HELLO:
          memcpy(managerMac, macAddr, ESP_NOW_ETH_ALEN);     
          formatMacAddressToStr(managerMac, macStr, 18);
          logger.printf("Manager Mac is now : %s\n", macStr);
          memcpy(&initManagerMessage, data, dataLen);     
          logger.printf("Received SERVER_HELLO Message with channel :%d; current channel is %d\n", initManagerMessage.channel, channel);
          if(channel != initManagerMessage.channel){
            channel = initManagerMessage.channel;
            wifi_set_channel(channel);
            if(routeurData.routeurPresent) {
              memcpy(initManagerMessage.macOfPeer, macAddr, ESP_NOW_ETH_ALEN);
              initManagerMessage.channel = channel;
              sendData(macAddr,initManagerMessage);     // send server_hello to routeur 
            }
    //        WiFi.printDiag(Serial); // Uncomment to verify channel change after
          }
          registerPeer(macAddr);
          initNodeMessage.sendingId = 0;
          if(now() < 3600) {      // if never been set need to set it after 1 hour to initially set the time
            setTime(10,15,00,20,02,2021);
          }
          logger.println(F("ESP NOW connected to ControlerTelecom server, start sync"));
          webTelecom.setWriteData(IND_BlinkWifiLed, 1); // 0: off; 1: ON; -1: blink 3 times
          webAction.setStartupApp();
          needToSync = true;
          foundManager = true;
          break;
        case SYNCH_TIME: {    // '{}' is need for timeval declaration inside this specific case SYNCH_TIME
          memcpy(&synchTimeMessage, data, dataLen);     
          logger.printf("Received SYNCH_TIME Message with values : %02d/%02d/%02d %02d:%02d:%02d\n", synchTimeMessage.day,(synchTimeMessage.mounth+1),(synchTimeMessage.year+1900),synchTimeMessage.hours,synchTimeMessage.minutes,synchTimeMessage.seconds);
          tmElements_t timestruct;
          timestruct.Day = synchTimeMessage.day;
          timestruct.Month = synchTimeMessage.mounth+1;
          timestruct.Year = synchTimeMessage.year-70 ;
          timestruct.Hour = synchTimeMessage.hours;
          timestruct.Minute = synchTimeMessage.minutes;
          timestruct.Second = synchTimeMessage.seconds;
          timestruct.Wday = synchTimeMessage.weekday;
          time_t newTime = makeTime(timestruct);                    // breakTime(time, &tm);  // break time_t into elements stored in tm struct
          setTime(newTime);                                         // makeTime(&tm);         // return time_t from elements stored in tm struct
          logger.printf("New time is now : %d/%d/%d %d:%d:%d \n", day(), month(), year(), hour(), minute(), second() );
          synchedTime = true;
          synchTimeReqMessage.sendingId = 0;
          timeCallback(newTime);
          break;
        }
        case ERROR_MSG:
          memcpy(&errorMessage, data, dataLen);     
          if(compareMacAdd(errorMessage.macOfPeer,myOwnMac) || compareMacAdd(errorMessage.macOfPeer,broadcastAddress)){     // got an error message for me need to reinitialize the process send Client_Hello. 
            logger.printf("Received an ERROR_MSG broadcasted or addressed to me with value : %s\n", errorMessage.message);
            esp_now_del_peer(managerMac);
            foundManager=false;
          }  
          break;
        case DATA_MSG:
          memcpy(&dataMsg, data, dataLen);     
          if(compareMacAdd(dataMsg.macOfPeer,myOwnMac) || compareMacAdd(dataMsg.macOfPeer,broadcastAddress)){     // got an error message for me need to reinitialize the process send Client_Hello. 
            logger.printf("Received an DATA_MSG broadcasted or addressed to me with json value: %s \n", dataMsg.jsonBuff);
            doCallbacks();
          }
          break;
      }
    }

    void ManagerTelecomClass::doCallbacks(){
      JsonDocument  doc;

      deserializeJson(doc, dataMsg.jsonBuff);
      JsonObject root = doc.as<JsonObject>();
      int16_t ind = 0;

        for (JsonPair kv : root) {      // using C++11 syntax (preferred)
            logger.printf("key is: %s and value is %s",kv.key().c_str(), kv.value().as<const char*>());
            ind = strtol(kv.key().c_str(), NULL, 10);                     // conv char * en int
            piscineParams[ind].valeur = kv.value().as<int16_t>();
            piscineParams[ind].changedFromManager = true;
        }
/*
        for (JsonObject::iterator it=root.begin(); it!=root.end(); ++it) {    // using C++98 syntax (for older compilers)
            logger.println(it->key().c_str());
            logger.println(it->value().as<char*>());
        }
*/
    }

    void ManagerTelecomClass::sentCallback(uint8_t *macAddr, uint8_t status){        // callback when data is sent
      char macStr[18];
      formatMacAddressToStr(macAddr, macStr, 18);
    if (status == 0) {
        logger.println("Message recieved with status: Delivery Success" );
        nbSendReties = 0;
      } else {
        logger.printf("Last Message could not been sent to: %s, Delivery Fail\n", macStr );
        if (nbSendReties == maxSendRetries){    // can't reach manager any more restart init prcedure
          foundManager = false;
        } else {
          nbSendReties++;
        }
      }}

    void ManagerTelecomClass::getMessageType(uint8_t messId, char *messagetypeStr){
      switch (messId) {
        case 0:
            strcpy(messagetypeStr, "DATA_MSG");
          break;
        case 1:
            strcpy(messagetypeStr, "CLIENT_HELLO");
          break;
        case 2:
            strcpy(messagetypeStr, "SERVER_HELLO");
          break;
        case 3:
            strcpy(messagetypeStr, "SYNCH_TIME_REQ");
          break;
        case 4:
            strcpy(messagetypeStr, "SYNCH_TIME");
          break;
        case 5:
            strcpy(messagetypeStr, "ERROR_MSG");
          break;
        
        default:
            strcpy(messagetypeStr, "Unknown_MSG");
          break;
      }
    }

    template <typename T> void ManagerTelecomClass::sendData(uint8_t *peerAddress, const T message){
      uint8_t s_data[sizeof(message)]; 
      char msgTypStr[20];
      char macStr[18];

      formatMacAddressToStr(peerAddress, macStr, 18);
      memcpy(s_data, &message, sizeof(message));     
      if (esp_now_send(peerAddress, s_data, sizeof(s_data)) == 0) {
        getMessageType(*s_data,msgTypStr);
        logger.printf("Message type %s send successfully to %s\n", msgTypStr,macStr);
      } else {
        logger.println("Unknown error");
      }
    }

  
// utils functions
    
    
    void ManagerTelecomClass::printDate(time_t newDate){
      tmElements_t tm;
        breakTime(newDate, tm);  // break time_t into elements
        logger.print(tm.Hour);
        logger.print(":");
        logger.print(tm.Minute);
        logger.print(":");
        logger.print(tm.Second);
        logger.print(" ");
        logger.print(tm.Day);
        logger.print("/");
        logger.print(tm.Month);
        logger.print("/");
        logger.println(tm.Year+1970);
    }

    String ManagerTelecomClass::toString(int16_t valeur, int8_t divider){
      int8_t val2;
      String rtn = String(valeur/divider) + ",";
      
      val2 = valeur - (valeur/divider)*divider;
      if(val2 < 10) {
        rtn += "0" + String(val2);
      } else {
        rtn += String(val2);
      }
      return rtn;
    }
  
    float ManagerTelecomClass::roundFloat(float num,int precision){
      
      int temp=(int )(num*pow(10,precision));
      int num1=num*pow(10,precision+1);
      temp*=10;
      temp+=5;
      if(num1>=temp)
              num1+=10;
      num1/=10;
      num1*=10;
      num=num1/pow(10,precision+1);
      return num;
    }
  
    String ManagerTelecomClass::toHeureFormat(int16_t mn){
      String output = String("");
      uint8_t heures = 0;
      uint8_t minutes = 0;
  
        heures = mn / 60;
        minutes = mn % 60;
        if(heures < 10)
          output += String("0") + heures;
        else
          output += String(heures);
        if(minutes < 10)
          output += String("h0") + minutes;
        else  
          output += String("h") + minutes;
        return output;
    }

    
