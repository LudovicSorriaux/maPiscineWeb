/*******************************************************************************
 * @file    PiscineWebTelecom.cpp
 * @brief   Implémentation communication ICSC avec contrôleur ESP32
 * @details Gestion protocole ICSC série, callbacks réception (data, time,
 *          sync, hello, tempAdd), buffer lecture/écriture, détection présence
 *          contrôleur.
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#include "PiscineWebTelecom.h"
#include "Logger.h"
#include "ManagerTelecom.h"
#include "PiscineWeb.h"

    // static callbacks 
    
  static void recData(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveData(src, command, len, data);
  }
    
  static void recTime(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveTime(src, command, len, data);
  }
    
  static void recSync(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveSync(src, command, len, data);
  }

  static void recTempAdd(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveTempAdd(src, command, len, data);
  }

  static void recEtalonData(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveEtalonData(src, command, len, data);
  }

  static void recHello(unsigned char src, char command, unsigned char len, char *data) {
    webTelecom.receiveHello(src, command, len, data);
  }
    
    // Class Functions 

    PiscineWebTelecomClass::~PiscineWebTelecomClass(void)
      {};
    
/**
 * @brief Constructeur : Initialise la classe PiscineWebTelecomClass (log debug si activé)
 */
    PiscineWebTelecomClass::PiscineWebTelecomClass() {
        if(debug){
          logger.println(F("  in PiscineWebTelecom setup : "));
        }
      };

/**
 * @brief Initialise le protocole ICSC sur Serial (station 'W') et enregistre 7 callbacks : 'V' (data), 'T' (time), 'S' (sync), 'H' (hello), 'A'/'B' (tempAdd), 'E' (etalon)
 */
    void PiscineWebTelecomClass::initTelecom(){
        telecom.begin(Serial, 'W');
        telecom.registerCommand('V', &recData);
        telecom.registerCommand('T', &recTime);
        telecom.registerCommand('S', &recSync);
        telecom.registerCommand('H', &recHello);
        telecom.registerCommand('A', &recTempAdd);
        telecom.registerCommand('B', &recTempAdd);
        telecom.registerCommand('E', &recEtalonData);
    }

/**
 * @brief Copie les données reçues du buffer readData[] vers tabRead[] (max taille éléments). Retourne true si données disponibles, false si buffer vide
 */
    bool PiscineWebTelecomClass::getReadData(dataStruct *tabRead, uint8_t taille){
      uint8_t maxtab = 0;         
        if(maxReadData != 0){
            (maxReadData-1 < taille) ? maxtab = maxReadData-1 : maxtab = taille;
            for(int i=maxtab; i>=0; i--){
                (tabRead+i)->index = readData[i].index;
                (tabRead+i)->value = readData[i].value;  
            }
            (maxtab == maxReadData-1) ? maxReadData = 0 : maxReadData -= taille;
            return true;
        } else return false;    
    }

  /**
 * @brief Ajoute une donnée (index, valeur) au buffer d'écriture writeData[] pour envoi ultérieur au contrôleur ESP32
 */
    void PiscineWebTelecomClass::setWriteData(uint8_t index, int16_t value){
        writeData[maxWriteData].index = index;
        writeData[maxWriteData].value = value;
        maxWriteData++;
        if (debug){
          logger.print(" maxWriteData = ");
          logger.print(maxWriteData);
          logger.print("  writeData is : ind=");
          logger.print(indexName[index]);
          logger.print(" & val=");
          logger.println(value);
        }
        if(!waitToTransmit) waitToTransmit = true;  
    }

  /*
   * bool PiscineWebTelecomClass::isControleurPresent
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebTelecomClass::isControleurPresent(){
      return controleurPresent;
    }

  /*
   * void PiscineWebTelecomClass::OnUpdate
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::OnUpdate(){
        char theMessage[sizeof(dataStruct)];
        uint8_t index;
        int16_t valeur;
        static uint8_t nbCall = 0;


          /* ---------- first read -------------- */
      telecom.process();

      if(!controleurPresent){     // controleur still not there, wait
        if(nbCall++ > 10){        // every 5 sec 
          nbCall = 0;  
          sendHelloMess();
        }
      } else {                    // controleur is there

          /* first check if synch request is needed and reask if no response */ 
        if(flgWaitAckSync){                  // wait for a sync refresh
          if(nbWaitACKSync++ >= 50){         // called each 100ms so 50 is 5 secs : too long waited relunch
            if(flgAckSyncInd != 0){
              sendAskSyncMess(flgAckSyncInd);  
            }
          }
          nbWaitACKSync = 0;
        }

            /* ---------- Next write --------------  */
        if(waitToTransmit) {
          if(controleurPresent){        // don't send until controleur is ready
            while (maxWriteData != 0) {
              index = writeData[maxWriteData-1].index;
              valeur = writeData[maxWriteData-1].value;
              if(debug){
                logger.printf("    Now sending command %s with index=%d and value=%d\n", indexName[index],index,valeur);
              }
              memcpy(&theMessage, &writeData[maxWriteData-1], sizeof(dataStruct));
              telecom.send('C', 'V', sizeof(theMessage), theMessage);     // ICSC::send(char station (C controler,K keyboard,W web), 
                                                                          //            char command (V values,T text, H time,S sync),
                                                                          //            unsigned char len=0, char *data=NULL);
              do {
                maxWriteData--;
              } while( (maxWriteData != 0) && (writeData[maxWriteData].index == writeData[maxWriteData-1].index));    // old = new
            }
            waitToTransmit = false;
          }
        } 
      }
    }

              /*   Callback from telecom */
  /*
   * void PiscineWebTelecomClass::receiveData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveData(unsigned char src, char command, unsigned char len, char *data){
        dataStruct mess;
      logger.printf("Got Data message : source is : %c, cmd is : %c, size is : %0X, sizeof datastruc is %0X message is : ", src, command, len, sizeof(dataStruct) );
      for (int i=0;i<len;i++){
        (i==len-1)? logger.printf("%x\n",data[i]) : logger.printf("%x, ",data[i]);
      }
      logger.println();

      if(command == 'V') {    // normal comms Index/Value message  
                                                  // station (C controler,K keyboard,W web), 
                                                  // command (V values,J jsonText, T time,S sync, H hello)
        if (len == sizeof(dataStruct)) {
          memcpy(&mess, data, len);
          logger.printf("    Got message from Controler : %s index=%d  value=%d\n",indexName[mess.index],mess.index,mess.value);
          if( !((maxReadData != 0) && ( readData[maxReadData-1].index == (uint8_t)mess.index ) && (readData[maxReadData-1].value == (int16_t)mess.value)) ){
            readData[maxReadData].index = (uint8_t)mess.index;
            readData[maxReadData].value = (int16_t)mess.value;
            maxReadData++;
          }
        }  
      }  
    }

  /*
   * void PiscineWebTelecomClass::receiveTime
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveTime(unsigned char src, char command, unsigned char len, char *data){
        time_t newTime=0;
        tmElements_t tm;


      logger.printf("Got Time message : source is : %c, cmd is : %c, size is : %0X, sizeof datastruc is %0X message is : ", src, command, len, sizeof(dataStruct) );
      for (int i=0;i<len;i++){
        if(i==len-1){
          logger.printf("%d\n",data[i]);
        } else {
          logger.printf("%d, ",data[i]);
        }
      }

      if(command == 'T') {    // normal comms time message  // station (C controler,K keyboard,W web), 
                                                            // command (V values,J jsonText, T time,S sync, H hello)
        if (len >= sizeof(time_t)) {
          memcpy(&newTime, data, sizeof(time_t));
          breakTime(newTime, tm);  // break time_t into elements
          logger.printf("    Got new time message from Controler : %02d/%02d/%02d %02d:%02d:%02d\n",tm.Day,tm.Month,tm.Year,tm.Hour,tm.Minute,tm.Second);
          setTime(newTime);  
        }  
      }  
    }

  /*
   * void PiscineWebTelecomClass::receiveSync
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveSync(unsigned char src, char command, unsigned char len, char *data){
        char typeSync; // typeSync is 'F' full, 'C' critical Values, 'W' web page
        uint16_t maxInd = 0;
        uint8_t i=0;
 
      if(debug){
        logger.printf("Got Sync message type %c (%0X) from Controleur size is : %0X, message is : ", data[0],data[0],len );
        for (int i=0;i<len;i++){
          if(i==len-1){
            logger.printf("%x\n",data[i]);
          } else {
            logger.printf("%x, ",data[i]);
          }
        }
      }

      if(command == 'S') {    // normal comms     // station (C controler,K keyboard,W web), 
                                                  // command (V values, J jsonText, T time, S sync, H hello)
        flgWaitAckSync = false;
        flgAckSyncInd = 0;
        nbWaitACKSync = 0;
        typeSync = data[0];

        switch(typeSync){
          case 'C':
            maxInd = IND_SYNC_CritVals;
            break;
          case 'W':
            maxInd = IND_SYNC_Web;
            break;
          case 'F':
          default:
            maxInd = IND_MAX_PISCINE;
            typeSync='F';
            break;
        }
        if(maxInd>sizeof(piscineParams)){
          maxInd = sizeof(piscineParams);
        }

        for (i=0; i<maxInd; i++){
          piscineParams[i].valeur = getint(*(data+1+(i*2)+1),*(data+1+(i*2))); // low, high
          piscineParams[i].changedControler = true;
          logger.printf("   ==> ind:%s, valeur:%d\n",indexName[i],piscineParams[i].valeur);
        }
        if(managerPresent){
          managerTelecom.sendSyncMess(typeSync);
        }  
      }  
    }

  /*
   * void PiscineWebTelecomClass::receiveTempAdd
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveTempAdd(unsigned char src, char command, unsigned char len, char *data){
//      char typeSync; // typeSync is 'F' full, 'K' critical Values

      if(debug){
        logger.printf("    Got tempAdd message from Controler : source is : %c, cmd is : %c, size is : %d, message is : ", src, command, len);
        for (int i=0;i<len;i++){
          (i==len-1) ? logger.printf("%x\n",data[i]) : logger.printf("%x, ",data[i]);
        }
        logger.println();
      }
      if(command == 'A') {    // ask for temp add // station (C controler,K keyboard,W web), 
                              // command (V values, J jsonText, T time, S sync, H hello, A ask temp add, B set temp add)
          maPiscineWeb.sendTempAdd(len, data);    // set temp add values
      }

    }

  /*
   * void PiscineWebTelecomClass::receiveEtalonData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveEtalonData(unsigned char src, char command, unsigned char len, char *data){

      if(debug){
        logger.printf("    Got EtalonData message from Controler : source is : %c, cmd is : %c, size is : %d, message is : ", src, command, len);
        for (int i=0;i<len;i++){
          (i==len-1)? logger.printf("%x\n",data[i]) : logger.printf("%x, ",data[i]);
        }
        logger.println();
      }
      if(command == 'E') {    // ask for temp add // station (C controler,K keyboard,W web), 
                              // command (V values, J jsonText, T time, S sync, H hello, A ask temp add, B set temp add, E etalonMode)

        memcpy(&etalon_Data, data, len);     
        maPiscineWeb.setEtalonData();    
      }

    }

  /*
   * void PiscineWebTelecomClass::receiveHello
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::receiveHello(unsigned char src, char command, unsigned char len, char *data){

      logger.printf("Got Hello message : source is : %c, cmd is : %c, size is : %0X, sizeof datastruc is %0X message is : ", src, command, len, sizeof(dataStruct) );
      for (int i=0;i<len;i++){
        if(i==len-1){
          logger.printf("%d\n",data[i]);
        } else {
          logger.printf("%d, ",data[i]);
        }
      }

      if(command == 'H') {    // normal comms     // station (C controler,K keyboard,W web), 
                                                  // command (V values,J jsonText, T time,S sync, H hello, R routeurHello, D routeurData)
        if(!flgInSetup){
          controleurPresent = true;         // controleur is present (rebooted) reset comms
          waitToTransmit = false;
          maxWriteData = 0;

          sendAskSyncMess('F');               // need to sync all values upon hello message
        }  
      }  
    }

  /*
   * void PiscineWebTelecomClass::sendTimeMess
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendTimeMess(){
          char theMessage[sizeof(time_t)];
          time_t maintenant;

          if(NTPok) {
            maintenant = now();
            memcpy(&theMessage, &maintenant, sizeof(time_t));

            logger.printf(" Time message is : %lld\n",maintenant);
            logger.println(F(" Sending Time message "));

            telecom.send('C', 'T', sizeof(time_t), theMessage);          // ICSC::send(char station (C controler,K keyboard,W web), 
                                                                        //            char // command (V values,J jsonText, T time,S sync, H hello, R routeurHello, D routeurData)
                                                                        //            unsigned char len=0, char *data=NULL);                                                  
          }
        }

  /*
   * void PiscineWebTelecomClass::sendAskSyncMess
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendAskSyncMess(char typeSync){  
      // typeSync is 'F' full, 'C' critical Values, 'W' web page
      char theMessage[1] = {typeSync};

      if(debug){
        logger.println(F("    Now sending ask synch message to controleur !"));
      }
      telecom.send('C', 'S', sizeof(theMessage), theMessage);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello)
      flgWaitAckSync = true;
      flgAckSyncInd = typeSync;
    }
 
  /*
   * void PiscineWebTelecomClass::sendRouteurData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendRouteurData(bool data=true){  // !data = hello
      // command (V values,J jsonText, T time,S sync, H hello, R routeurHello, D routeurData)
          char theMessage[sizeof(routeurData)];
      if(data) { // do data stuff
        memcpy(&theMessage, &routeurData, sizeof(routeurData));
        if(debug){
          logger.println(F("    Now sending routeur data message to controleur !"));
        }
        telecom.send('C', 'D', sizeof(theMessage), theMessage);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello)
      } else {    // do hello stuff
        if(debug){
          logger.println(F("    Now sending routeur hello message to controleur !"));
        }
        telecom.send('C', 'R', sizeof(routeurData.routeurPresent), routeurData.routeurPresent);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello)
      }
    }
 
  /*
   * void PiscineWebTelecomClass::sendTempAddMess
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendTempAddMess(bool set, char *theMessage, uint8_t len){

      if(set) {     // setting new adreses
        logger.printf("    Now sending tempAdd message to Controleur with type 'B' (set) size is %d!\n",len);
        telecom.send('C', 'B', len, theMessage);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello, A ask temp add, B set temp add)
      } else {      // no set so asking for adresses
        if(debug) logger.println(F("    Now sending ask tempAdd message to controleur !"));      
        telecom.send('C', 'A', len, theMessage);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello, A ask temp add, B set temp add)
      }
    }

  /*
   * void PiscineWebTelecomClass::sendEtalonMode
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendEtalonMode(){

      char message[sizeof(etalon_Data)]; 

      memcpy(message, &etalon_Data, sizeof(etalon_Data)); 
      logger.printf("    Now sending etalon Mode message to Controleur with type 'E'\n");
      // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello, A ask temp add, B set temp add, E etalonMode)
      telecom.send('C', 'E', sizeof(etalon_Data), message); 
    }

  /*
   * void PiscineWebTelecomClass::sendHelloMess
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebTelecomClass::sendHelloMess(){
      char theMessage[1] = {0};

      if(debug){
        logger.println(F("    Now sending hello message to controleur !"));
      }
      telecom.send('C', 'H', sizeof(theMessage), theMessage);   // ICSC::send(char station (C controler,K keyboard,W web), command (V values,J jsonText, T time,S sync, H hello)
    }

