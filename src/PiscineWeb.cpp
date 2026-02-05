/*******************************************************************************
 * @file    PiscineWeb.cpp
 * @brief   Implémentation classe PiscineWebClass - Coeur serveur web
 * @details Gestion AsyncWebServer, routes API (/api/status, /api/command, etc.),
 *          SSE (Server-Sent Events), authentification, mise à jour données,
 *          interface entre web et contrôleur ESP32.
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#include "PiscineWeb.h"
#include "Logger.h"
#include "PiscineWebTelecom.h"
#include "PiscineWebStrings.h"
#include "IndexNames.h"  // Optimisation RAM #6 : Noms des paramètres en PROGMEM

// Optimisation RAM #5 : Définition de piscineFolder en PROGMEM
const char PiscineWebClass::piscineFolder[] PROGMEM = "/html";

    PiscineWebClass::~PiscineWebClass(void)
      {};

/**
 * @brief Constructeur : Initialisation de la classe PiscineWebClass (actuellement vide, juste log)
 */
    PiscineWebClass::PiscineWebClass(){
        //logger.println("init maPiscineWeb");
    }


// public
/**
 * @brief Démarrage complet du serveur web : Appelle startServer() (routes AsyncWebServer) et startMDNS() (mDNS responder piscine.local)
 */
    void PiscineWebClass::startup(){
      logger.println("[WEB] maPiscineWeb Startup ... ");
      startServer();               // Start a HTTP server with a file read handler and an upload handler
      startMDNS();                 // Start the mDNS responder
      
      // RAM monitoring : État après démarrage serveur web (AsyncWebServer + mDNS)
      logger.printf("[RAM] Serveur web démarré - Free heap: %d bytes\n", ESP.getFreeHeap());
//      prepareNewParamsPiscine();
//      File root = SD.open("/", FILE_READ);
//      logger.println("SDCard Contents : ");
//      printDirectory(root, 1);
    }


/**
 * @brief Mise à jour périodique : Appelle MDNS.update(), sendNewParamsPiscine() (SSE push), et manageDebugLCD() si debug actif
 */
    void PiscineWebClass::OnUpdate(){

        MDNS.update();
        if(--MDNSAppels == 0){
            MDNSAppels = 120;          // every minute
        }
    //    sendNewParams();              // for debuging
        if(currentPage == PAGE_PRICIPALE || currentPage == PAGE_PARAMETRES) {          // in page principal or in page param
            sendNewParamsPiscine();
        }
        if( currentPage == PAGE_DEBUG ) {          // in page debug 
            if(logger.hasDebugMessage()){ // if debug message available
                manageDebugLCD();
            }
        }
    }

/**
 * @brief Rafraîchissement affichage LCD : Appelle managePiscineLCD() pour mettre à jour l'écran LCD virtuel (toutes les 10s)
 */
    void PiscineWebClass::OnUpdatePiscineLCD(){
        managePiscineLCD();
    }

/**
 * @brief Liste récursive du contenu SD (répertoires + fichiers) avec indentation. Version classe PiscineWebClass (duplicate de maPiscinev3Web.cpp)
 */
    void PiscineWebClass::printDirectory(File dir, int numTabs) {

        dir.rewindDirectory();
        while(true) {
          File entry =  dir.openNextFile();
          if (! entry) {
            // no more files
            //logger.println("**nomorefiles**");
            break;
          }
          for (uint8_t i=0; i<numTabs; i++) {
            logger.print('\t');   // we'll have a nice indentation
          }
          // Print the 8.3 name
          logger.print(entry.name());
          // Recurse for directories, otherwise print the file size
          if (entry.isDirectory()) {
            logger.println("/ (Rep)");
            printDirectory(entry, numTabs+1);
          } else {
            // files have sizes, directories do not
            logger.print("\t\t");
            logger.println(entry.size());
          }
          entry.close();
        }
    }


// for debug 
  /*
   * void PiscineWebClass::prepareNewParamsPiscine
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::prepareNewParamsPiscine(){
            float phVal, redoxVal, clVal, tempAir,tempEau, tempInt, tempPAC;
            uint8_t PAC, P3;
            uint16_t PP, PH, CL;
            static uint8_t nbfois = 1;

        for(int i=0;i< IND_MAX_PISCINE+1;i++){           // +1 for IND_ClearAlert
            if (piscineParams[i].changedWeb){
                piscineParams[i].changedControler = true;
                piscineParams[i].changedWeb = false;
            }
        }        

        if (--nbfois == 0){
            phVal = random(40,110); phVal/=10;
            clVal = random(0,30); clVal/=10;
            redoxVal = random(600,800);
            tempAir = random(200,350); tempAir/=10;
            tempEau = random(200,350); tempEau/=10;
            tempInt = random(200,350); tempInt/=10;
            tempPAC = random(200,350); tempPAC/=10;

            PAC = random(0,10)%2;
            P3 = random(0,10)%2;
            PP = (random(0,5)*60)+random(0,60);
            PH = random(0,60);
            CL = random(0,60);

            piscineParams[IND_PHVal].valeur = phVal;
            piscineParams[IND_RedoxVal].valeur = redoxVal;
            piscineParams[IND_CLVal].valeur = clVal;
            piscineParams[IND_TempAir].valeur = tempAir;
            piscineParams[IND_TempEau].valeur = tempEau;
            piscineParams[IND_TempInt].valeur = tempInt;
            piscineParams[IND_TempPAC].valeur = tempPAC;
            piscineParams[IND_PP].valeur = PP;
            piscineParams[IND_PAC].valeur = PAC;
            piscineParams[IND_PompePH].valeur = PH;
            piscineParams[IND_PompeCL].valeur = CL;
            piscineParams[IND_PompeALG].valeur = P3;

            piscineParams[IND_PHVal].changedControler = true;
            piscineParams[IND_RedoxVal].changedControler = true;
            piscineParams[IND_TempAir].changedControler = true;
            piscineParams[IND_TempEau].changedControler = true;
            piscineParams[IND_TempInt].changedControler = true;
            piscineParams[IND_TempPAC].changedControler = true;
            piscineParams[IND_PP].changedControler = true;
            piscineParams[IND_PAC].changedControler = true;
            piscineParams[IND_PompePH].changedControler = true;
            piscineParams[IND_PompeCL].changedControler = true;
            piscineParams[IND_PompeALG].changedControler = true;

            nbfois=50;
        }
    }

  /*
   * void PiscineWebClass::sendNewParams
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::sendNewParams(){
        prepareNewParamsPiscine();
        sendNewParamsPiscine();
    }

// private 

  /*
   * void PiscineWebClass::sendNewParamsPiscine
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::sendNewParamsPiscine(){
            char jsonBuff[768];  // Optimisation RAM : char[] au lieu de String
            char jsonBuffParams[768];
            StaticJsonDocument<512> piscineParamsEventsJson;  // Optimisation RAM : StaticJsonDocument
            StaticJsonDocument<512> piscineEventsJson;
            bool newValPP = false, newValPParams = false;  
            bool doItFull = false;

        if(nbAppels <= 0) {
            doItFull = true;
            nbAppels = 20;                  // 10 sec env
        }

        for(int i=0;i<IND_ClearAlert;i++){           // +1 for IND_ClearAlert
            if( (doItFull) || (piscineParams[i].changedControler)) {
                if (currentPage == PAGE_PRICIPALE) {          // in page principal
                    if(piscinePPSet.find(i) != piscinePPSet.end()){
                        piscineEventsJson[getIndexNameF(i)] = piscineParams[i].valeur;  // Optimisation RAM #6 : PROGMEM
                        if (!newValPP) newValPP = true;
                    }
                    piscineParams[i].changedControler = false;
                } else if(currentPage == PAGE_PARAMETRES) {          // in page param
                    if(piscineParamsSet.find(i) != piscineParamsSet.end()){
                        piscineParamsEventsJson[getIndexNameF(i)] = piscineParams[i].valeur;  // Optimisation RAM #6 : PROGMEM
                        if (!newValPParams) newValPParams = true;
                    }
                    piscineParams[i].changedControler = false;
                }
            }
        }
        nbAppels--;
        if(newValPP){
            serializeJson(piscineEventsJson, jsonBuff, sizeof(jsonBuff));
            logger.println(jsonBuff);
            piscineEvents.send(jsonBuff, "piscineData", millis());  
        } else if (newValPParams){
            serializeJson(piscineParamsEventsJson, jsonBuffParams, sizeof(jsonBuffParams));
            logger.println(jsonBuffParams);
            piscineEvents.send(jsonBuffParams, "piscineParamsData", millis());  
        }
    }

  /*
   * void PiscineWebClass::managePiscineLCD
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::managePiscineLCD(){
            char strTempo[30];
            char strTempo1[64], strTempo2[96], strTempo3[128];
            char jsonBuff[384];  // Optimisation RAM : char[] au lieu de String
            StaticJsonDocument<256> jsonRoot;  // Optimisation RAM

        if (currentPage == PAGE_PRICIPALE) {          // in page principal

            //  jsonRoot["Alerte"] = 1;                 // Mode Alertes

            if(piscineParams[IND_Auto].valeur == 1){    // mode auto
                strcpy_P(strTempo1, STR_MODE_AUTO);
                jsonRoot["ligne1"] = strTempo1;
                getDateFormated(strTempo,20,1);   // medium date
                snprintf(strTempo2, sizeof(strTempo2), "%s, %d h %02d", strTempo, hour(), minute()); 
                jsonRoot["ligne2"] = strTempo2;
                if (piscineParams[IND_PP].valeur != 0) {
                    char heureMinPP[16];
                    minuteToHeureMinute(piscineParams[IND_PP].valeur, heureMinPP, sizeof(heureMinPP));
                    snprintf(strTempo3, sizeof(strTempo3), "%s%s", FPSTR(STR_PP_FOR), heureMinPP);
                    if(piscineParams[IND_PompePH].valeur != 0) {
                        char minSecPH[24];
                        secondsToMinuteSeconds(piscineParams[IND_PompePH].valeur, minSecPH, sizeof(minSecPH));
                        char temp[64];
                        snprintf(temp, sizeof(temp), "%s%s", FPSTR(STR_PH_MINUS_FOR), minSecPH);
                        strcat(strTempo3, temp);
                    }
                    if( (piscineParams[IND_TypePompe3].valeur == PHp) && (piscineParams[IND_PompeALG].valeur != 0) ){
                        char minSecALG[24];
                        secondsToMinuteSeconds(piscineParams[IND_PompeALG].valeur, minSecALG, sizeof(minSecALG));
                        char temp[64];
                        snprintf(temp, sizeof(temp), "%s%s", FPSTR(STR_PH_PLUS_FOR), minSecALG);
                        strcat(strTempo3, temp);
                    }
                    if (piscineParams[IND_PompeCL].valeur != 0) {
                        char minSecCL[24];
                        secondsToMinuteSeconds(piscineParams[IND_PompeCL].valeur, minSecCL, sizeof(minSecCL));
                        char temp[64];
                        snprintf(temp, sizeof(temp), "%s%s", FPSTR(STR_CL_FOR), minSecCL);
                        strcat(strTempo3, temp);
                    }
                    jsonRoot["ligne3"] = strTempo3;
                }
            } else {                                            // mode manu
                strcpy_P(strTempo1, STR_MODE_MANUEL);
                jsonRoot["ligne1"] = strTempo1;
                getDateFormated(strTempo,30,0);                 // full date
                snprintf(strTempo2, sizeof(strTempo2), "%s,   %d h %02d", strTempo, hour(), minute()); 
                jsonRoot["ligne2"] = strTempo2;
            }
            serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
//            logger.println(jsonBuff);
            piscineEvents.send(jsonBuff, "piscineLCDData", millis());  
        }
    }

  /*
   * void PiscineWebClass::manageDebugLCD
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::manageDebugLCD(){
            char strTempo1[256];
            char jsonBuff[512];  // Optimisation RAM : char[] au lieu de String
            StaticJsonDocument<384> jsonRoot;  // Optimisation RAM

        if (currentPage == PAGE_DEBUG) {          // in page debug
            logger.getDebugMessage(strTempo1, sizeof(strTempo1));
            if(strcmp(strTempo1, "") != 0 ){ // if debug message available
                jsonRoot["lignes"] = strTempo1;
                serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
                piscineEvents.send(jsonBuff, "piscineLCDDebug", millis());  
            }
        }
    }

  /*
   * void PiscineWebClass::setEtalonData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::setEtalonData(){
        char jsonBuff[256];  // Optimisation RAM
        StaticJsonDocument<128> piscineEtalonJson;  // Optimisation RAM

        if(strcmp(etalon_Data.PHRedox,"PH")==0){
            piscineEtalonJson["phCalc"] = etalon_Data.calculated;
            piscineEtalonJson["phMesu"] = etalon_Data.mesure;
            piscineEtalonJson["phAjust"] = etalon_Data.ajust;
        } else if(strcmp(etalon_Data.PHRedox,"Redox")==0){
            piscineEtalonJson["redoxCalc"] = etalon_Data.calculated;
            piscineEtalonJson["redoxMesu"] = etalon_Data.mesure;
            piscineEtalonJson["redoxAjust"] = etalon_Data.ajust;
        }
        piscineEtalonJson.shrinkToFit();  // optional
        serializeJson(piscineEtalonJson, jsonBuff, sizeof(jsonBuff));
        logger.println(jsonBuff);
        piscineEvents.send(jsonBuff, "piscineMaintenance", millis());  
    }

  /*
   * void PiscineWebClass::sendTempAdd
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::sendTempAdd(unsigned char len, char *data){
        char jsonBuff[512];  // Optimisation RAM
        StaticJsonDocument<384> piscineTempAddJson;  // Optimisation RAM        
        JsonArray sondes;
        unsigned int ind=0;   // start after code command
        unsigned int i,j,maxAdd;
        byte adresses[6][8];
        char printableAddresse[16+1];
  

        if(len != 0){       // got some adresses
            for (j=0;j<6;j++){
              for(i=0;i<8;i++){
//                  if(debug) logger.printf(" index is %d, char is %x \n",rtn,addr[j][i]);
                adresses[j][i] = *(data+ind);
                if(ind++ >= len) break;
              }
              if(ind >= len) break;
            }
            maxAdd=j;
            sondes = piscineTempAddJson["sondes"].to<JsonArray>();
            for(j=0;j<maxAdd;j++){
                addInText(adresses[j],printableAddresse);    // source,dest
                if(strcmp("0000000000000000",printableAddresse)!=0){
                    JsonObject sonde = sondes.add<JsonObject>();
                    sonde["printable"] = printableAddresse;
                    sonde["index"] = j;
                    switch (j) {
                        case 0: 
                            sonde["type"] = "Air";
                        break;
                        case 1: 
                            sonde["type"] = "Eau";
                        break;
                        case 2: 
                            sonde["type"] = "Pac";
                        break;
                        default: 
                            sonde["type"] = "N/A";
                        break;
                    }
                }
            }
        }

        serializeJson(piscineTempAddJson, jsonBuff, sizeof(jsonBuff));
        logger.println(jsonBuff);
        piscineEvents.send(jsonBuff, "piscineMaintenance", millis());  

    }

  /*
   * void PiscineWebClass::setTempAdd
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::setTempAdd(char *jsonSondes){
        StaticJsonDocument<192> sondes;  // Optimisation RAM #7 : 3 sondes max
 
        byte address[8];
        byte addresses[3][8];
        char tempAddr[3*8];
        const char* printableAdd;
        const char* sondeType;
        int i,j,k;


        DeserializationError error = deserializeJson(sondes, jsonSondes);

        if (error) {
            logger.print("[WEB] ❌ ERREUR : deserializeJson() failed: ");
            logger.println(error.c_str());
        return;
        }

        for(j=0;j<3;j++){
            for(i=0;i<8;i++){
                addresses[j][i]=0;
            }
        }

        for (JsonObject sonde : sondes.as<JsonArray>()){
            printableAdd = sonde["printable"]; 
            Serial1.printf_P(PSTR("Processing sonde : %s\n"), printableAdd);
            sondeType = sonde["type"]; 

            addToHex(address,printableAdd);
            j = -1;
            if (strcmp("Air",sondeType)==0){
                j=0;
            } else if (strcmp("Eau",sondeType)==0){
                j=1;
            } else if (strcmp("Pac",sondeType)==0){
                j=2;
            }
            if(j != -1){
                for(i=0;i<8;i++){
                    addresses[j][i]=address[i];
                }
            }
        }
        k=0;
        for(j=0;j<3;j++){
            for(i=0;i<8;i++){
                tempAddr[k++]=addresses[j][i];
            }
        }
        logger.print("Sending temp address : ");
        for (uint i=0;i<sizeof(tempAddr);i++){
          (i==sizeof(tempAddr)-1) ? logger.printf("%x\n",tempAddr[i]) : logger.printf("%x, ",tempAddr[i]);
        }
        logger.println();

        webTelecom.sendTempAddMess(true,tempAddr, sizeof(tempAddr));
    }

/*__________________________________________________________SETUP_FUNCTIONS__________________________________________________________*/

  
  /*
   * void PiscineWebClass::startMDNS
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::startMDNS() { // Start the mDNS responder     

        if (WiFi.status() != WL_CONNECTED) return; // Sécurité
        if (!MDNS.begin(mdnsName)) { // Sur ESP8266, inutile de passer l'IP en paramètre
            logger.println(F("[MDNS] ❌ ERREUR : Setup failed!"));
        } else {
            MDNS.addService(PSTR("http"), PSTR("tcp"), 80);
            MDNS.addServiceTxt(PSTR("http"), PSTR("tcp"), PSTR("path"), PSTR("/"));     // Ajoute quelques propriétés pour être mieux détecté
            logger.printf("[MDNS] Responder started: http://%s.local\n",mdnsName);
        }
    }

  /*
   * void PiscineWebClass::startServer
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::startServer() { // Start a HTTP server with a file read handler and an upload handler

        logger.println("[WEB] Starting Piscine Web Server");
//        server.reset();

    // --- 1. ROUTES API
        server.on("/", HTTP_ANY, std::bind(&PiscineWebClass::handleRoot, this, std::placeholders::_1));                         // Call the 'handleRoot' function when a client requests URI "/"                         // Call the 'handleRoot' function when a client requests URI "/"

                    // -------- call backs for debug ------------
        server.on("/jsonConfig", HTTP_ANY, std::bind(&PiscineWebClass::showJsonConfig, this, std::placeholders::_1));
        
                    // -------- call backs from javascripts ------------
        server.on("/checkLocalAuth", HTTP_GET, std::bind(&PiscineWebClass::handleCheckLocalAuth, this, std::placeholders::_1));  // Nouveau : check auto-login local
        // On utilise "/api/auth" pour regrouper tout ce qui touche aux utilisateurs
        server.on("/api/auth", HTTP_POST, [this](AsyncWebServerRequest *request) {
            if (request->hasParam("action")) {
                char action[32];
                request->getParam("action")->value().toCharArray(action, 32);

                if (strcmp(action, "logon") == 0)           handleLogin(request);      
                else if (strcmp(action, "register") == 0)    handleRegister(request);    
                else if (strcmp(action, "changeAdmin") == 0) handleChangAdminPW(request);  
                else if (strcmp(action, "userProfile") == 0) handleUserProfile(request);       
                else if (strcmp(action, "getUsers") == 0)    handleGetUsers(request);
                else if (strcmp(action, "deleteUsers") == 0) handleDeleteUsers(request);  
               else request->send(404, "text/plain", F("Action inconnue"));
            } else {
                request->send(400, "text/plain", F("Action manquante"));
            }
        });
/*        server.on("/logon", HTTP_POST, std::bind(&PiscineWebClass::handleLogin, this, std::placeholders::_1)); 			  
        server.on("/register", HTTP_POST, std::bind(&PiscineWebClass::handleRegister, this, std::placeholders::_1)); 	
        server.on("/changeAdmin", HTTP_POST, std::bind(&PiscineWebClass::handleChangAdminPW, this, std::placeholders::_1)); 	
        server.on("/userProfile", HTTP_POST, std::bind(&PiscineWebClass::handleUserProfile, this, std::placeholders::_1));  
        server.on("/getUsers", HTTP_POST, std::bind(&PiscineWebClass::handleGetUsers, this, std::placeholders::_1));  
        server.on("/deleteUsers", HTTP_POST, std::bind(&PiscineWebClass::handleDeleteUsers, this, std::placeholders::_1));  
*/

            // -------- call backs from restapi ------------
//             server.on("/isInSession", HTTP_POST, handleInSession); 

            // ---------- Piscine ------
        server.on("/setPiscine", HTTP_POST, [this](AsyncWebServerRequest *request) {
            if (request->hasParam("action")) {
                char action[32];
                request->getParam("action")->value().toCharArray(action, 32);
                
                if (strcmp(action, "InitPagePrincipale") == 0)         handleInitPiscinePP(request);
                else if (strcmp(action, "InitPageParams") == 0)     handleInitPiscinePParams(request);
                else if (strcmp(action, "Parametres") == 0)          handlePiscineParams(request);
                else if (strcmp(action, "Debug") == 0)          handlePiscinePageDebug(request);
                else if (strcmp(action, "Maintenance") == 0)    handlePiscinePageMaintenance(request);
                else if (strcmp(action, "InitMaintenance") == 0)      handleInitPiscinePageMaintenance(request);
                else if (strcmp(action, "getGraphDatas") == 0)      handlePiscineGraphDatas(request);
                else if (strcmp(action, "setActivePage") == 0) {
                                                char p[16];
                                                request->getParam("page")->value().toCharArray(p, 16);      //principale parametres debug maintenance
                                                if (strcmp(p, "principale") == 0) currentPage = PAGE_PRICIPALE;
                                                else if (strcmp(p, "parametres") == 0) currentPage = PAGE_PARAMETRES;
                                                else if (strcmp(p, "debug") == 0) currentPage = PAGE_DEBUG;
                                                else if (strcmp(p, "maintenance") == 0) currentPage = PAGE_MAINTENANCE;
                                                request->send(200); 
                                            }    
                else request->send(404, "text/plain", F("Action inconnue"));
            } else {
                request->send(400, "text/plain", F("Action manquante"));
            }
        });

/*
        server.on("/setPiscinePagePrincip", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePP, this, std::placeholders::_1)); 
        server.on("/setPiscinePageParams", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePParams, this, std::placeholders::_1)); 
        server.on("/setPiscineParam", HTTP_POST, std::bind(&PiscineWebClass::handlePiscineParams, this, std::placeholders::_1)); 
        server.on("/setPiscineDebug", HTTP_POST, std::bind(&PiscineWebClass::handlePiscinePageDebug, this, std::placeholders::_1)); 
        server.on("/setPiscineMaintenance", HTTP_POST, std::bind(&PiscineWebClass::handlePiscinePageMaintenance, this, std::placeholders::_1)); 
        server.on("/setPiscineInitMaintenance", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePageMaintenance, this, std::placeholders::_1)); 
*/
            // ---------- Routeur ------
        server.on("/setRouteurInfo", HTTP_POST, std::bind(&PiscineWebClass::handleRouteurInfo, this, std::placeholders::_1)); 

    // --- 2. GESTION DU SSE UNIQUE ---
        piscineEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
            logger.printf("[WEB] Client reconnected! Last message ID: %u\n", client->lastId());
            }
            client->send("hello! PiscineEvents Ready", NULL, millis(), 10000);  // send message "hello!", id current millis and set reconnect delay to 1 second
        });
        server.addHandler(&piscineEvents);

/*      piscineParamsEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
            logger.printf("[WEB] Client reconnected! Last message ID: %u\n", client->lastId());
            }
            client->send("hello! PiscineParamsEvents Ready", NULL, millis(), 10000);
        });
        piscineDebugEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
                logger.printf("[WEB] Client reconnected! Last message ID: %u\n", client->lastId());
            }
            logger.setDebugMessage(true);
            client->send("hello! piscineDebugEvents Ready", NULL, millis(), 10000);
        });
        piscineMaintenanceEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
                logger.printf("[WEB] Client reconnected! Last message ID: %u\n", client->lastId());
            }
            client->send("hello! piscineMaintenanceEvents Ready", NULL, millis(), 10000);
        });

        server.addHandler(&piscineParamsEvents);
        server.addHandler(&piscineDebugEvents);
        server.addHandler(&piscineMaintenanceEvents);
*/

    // --- 3. FICHIERS STATIQUES (L'ordre est important !) ---
        char pathBuf[32];
        strcpy_P(pathBuf, piscineFolder);
        strcat(pathBuf, "/images/");
        server.serveStatic("/images", SDFS, pathBuf);      // On sert les images en premier si elles sont dans un dossier spécifique
        strcpy_P(pathBuf, piscineFolder);
        server.serveStatic("/", SDFS, pathBuf);   // serve static files (js,css,html,etc..) from SD card piscine folder

    // --- 4. NOT FOUND ---
        server.onNotFound(std::bind(&PiscineWebClass::handleOtherFiles, this, std::placeholders::_1));           			  // When a client requests an unknown URI (i.e. something other than "/"), call function handleNotFound"
    
    // --- 5. DÉMARRAGE ---
        server.begin();                             			  // start the HTTP server
        logger.print("[WEB] HTTP server started, IP address: ");
        logger.println(WiFi.localIP());

    }


/*__________________________________________________________SERVER_HANDLERS__________________________________________________________*/

  /*
   * void PiscineWebClass::handleLogin
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleLogin(AsyncWebServerRequest *request) {                         // If a POST request is made to URI /login
        bool flgVerified = false;
        char newusername[11], newuserpassword[11];
        uint8_t indUser = 0;
        char jsonBuff[768];  // Optimisation RAM
        StaticJsonDocument<512> jsonRoot;  // Optimisation RAM
        char sessionID[16];                       // calculated at each login set in the cookie maPiscine (15 chars)
        long ttl = 1*60*60;                       // 1 hours by default in sec
        //  long ttl = 2*60;                          // 2 min by default in sec for debug
        bool keepAlive = false;

    if( ! request->hasParam("username",true) || ! request->hasParam("password",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("password",true)->value() == NULL) { // If the POST request doesn't have username and password data
        request->send(400, FPSTR(STR_CONTENT_PLAIN), FPSTR(STR_INVALID_REQUEST));         // The request is invalid, so send HTTP status 400
    } else {  // check the credentials
        request->getParam("username",true)->value().toCharArray(newusername,11);
        request->getParam("password",true)->value().toCharArray(newuserpassword,11);
        if(request->hasParam("keepAlive",true)){    // have if checked
        keepAlive = true;
        }
        for(indUser=0;indUser<MAX_USERS;indUser++){   // find user in config
            if(strcmp(config.users[indUser].user, newusername) == 0){       // found existing user check password
                if(strcmp(config.users[indUser].user_passwd, newuserpassword) == 0 ){     // good password
                    flgVerified = true;
                }
                break;
            }  
        }

        if(flgVerified) {                     // If both the username and the password are correct
            // RAM monitoring : Charge mémoire lors d'un login (pic d'utilisation)
            logger.printf("[RAM] Login %s - Free heap: %d bytes\n", newusername, ESP.getFreeHeap());
            
            bool isLocal = isLocalClient(request);  // Nouveau : détection client local
            
            // Adapter le TTL selon le contexte
            if (isLocal && config.enableLocalAutoLogin) {
                ttl = 365 * 24 * 60 * 60;  // 1 an pour client local avec auto-login activé
                logger.printf("[AUTH] Client local détecté : TTL = 1 an (IP: %s)\n", 
                             request->client()->remoteIP().toString().c_str());
            } else if (isLocal) {
                ttl = 30 * 24 * 60 * 60;  // 30 jours pour client local sans auto-login
                logger.println("[AUTH] Client local : TTL = 30 jours");
            } else if(keepAlive) {
                ttl = ttl * 24;  // 1 jour si keepAlive pour client distant
                logger.println("[AUTH] Client distant avec keepAlive : TTL = 1 jour");
            } else {
                logger.println("[AUTH] Client distant : TTL = 1 heure");
            }
            
            generateKey(sessionID, ttl);
            jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_LOG_IN_SUCCESS);
            jsonRoot[FPSTR(STR_JSON_USERNAME)] = newusername;
            jsonRoot[FPSTR(STR_JSON_PASSWORD)] = newuserpassword;
            jsonRoot[FPSTR(STR_JSON_SESSIONID)] = sessionID;   
            jsonRoot[FPSTR(STR_JSON_TTL)] = ttl;
            jsonRoot[FPSTR(STR_JSON_ISLOCAL)] = isLocal;  // Informe le frontend
            char welcomeMsg[64];
            snprintf(welcomeMsg, sizeof(welcomeMsg), "%s%s!", FPSTR(STR_WELCOME), newusername);
            jsonRoot[FPSTR(STR_JSON_MESSAGE)] = welcomeMsg;
            logger.println(FPSTR(STR_LOG_SUCCESS));
        } else {              // bad password or user not found
            jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_LOG_IN_FAILED);
            jsonRoot[FPSTR(STR_JSON_MESSAGE)] = FPSTR(STR_WRONG_CREDENTIALS);
            logger.println(FPSTR(STR_LOG_FAILED)); 
        }
        serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
        AsyncWebServerResponse *response = request->beginResponse(200, FPSTR(STR_CONTENT_PLAIN), jsonBuff);
        response->addHeader(FPSTR(STR_HEADER_CACHE), FPSTR(STR_HEADER_NOCACHE));
        response->addHeader(FPSTR(STR_HEADER_CORS), FPSTR(STR_HEADER_CORS_ALL));
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);
    }
  }

  /*
   * void PiscineWebClass::handleRegister
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleRegister(AsyncWebServerRequest *request){ 							// If a POST request is made to URI /register
    int8_t flgFoundUser = -1;
    int8_t flgFoundEmpty = -1;
    char newusername[11], newuserpassword[11], theadminpassword[11];
    uint8_t indUser = 0;
    char jsonBuff[768];  // Optimisation RAM
    StaticJsonDocument<512> jsonRoot;  // Optimisation RAM #7
    char sessionID[16];                       // calculated at each login set in the cookie maPiscine (15 chars)
    long ttl = 12*60*60*1000;                 // 12 hours by default
    char flgLogin[8];

    if( ! request->hasParam("username",true) || ! request->hasParam("password",true) || ! request->hasParam("adminpassword",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("password",true)->value() == NULL || request->getParam("adminpassword",true)->value() == NULL) { // If the POST request doesn't have username and password data
        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
    if(strcmp(theadminpassword, config.adminPassword) == 0){                                       // good admin password register new user or update it
        request->getParam("username",true)->value().toCharArray(newusername,11);
        request->getParam("password",true)->value().toCharArray(newuserpassword,11);
        logger.printf("[AUTH] New user: %s, passwd: %s\n",newusername,newuserpassword);

        for(indUser=0;indUser<MAX_USERS;indUser++){   // find user in config
            if(strcmp(config.users[indUser].user, newusername) == 0){       // found existing user check password
                flgFoundUser = indUser;
                break;
            }
            if(config.users[indUser].user[0]==0){       // found an empty user space
                flgFoundEmpty = indUser;
                break;
            }
        }  
        if(flgFoundUser != -1) {            // Found username and updated the password
            jsonRoot["status"] = "User Already Exist";
            jsonRoot["username"] = String(newusername);
            jsonRoot["message"] = "User already exist,updated with new password.";
            strncpy(config.users[flgFoundUser].user_passwd, newuserpassword,11); 
            saveNewConfiguration(nullptr,newusername,newuserpassword,nullptr,nullptr);      // save the config to file
            logger.println("[AUTH] User already exists, updated with new password");
        } else {                        // not found so new user
          if(flgFoundEmpty != -1 ){     // flgFoundEmpty is the index breaked so still have room for a new user create a new entry
            strncpy(config.users[flgFoundEmpty].user, newusername,11); 
            strncpy(config.users[flgFoundEmpty].user_passwd, newuserpassword,11); 
            saveNewConfiguration(nullptr,newusername,newuserpassword,nullptr,nullptr);      // save the config to file
            generateKey(sessionID,ttl);
            jsonRoot["status"] = "New User Created Succesfully";
            jsonRoot["username"] = newusername;
            jsonRoot["password"] = newuserpassword;
            jsonRoot["sessionID"] = sessionID;   
            jsonRoot["ttl"] = ttl;
            if (request->hasParam("flgLogin",true)) {
            logger.println("[AUTH] Request has flgLogin");
            request->getParam("flgLogin",true)->value().toCharArray(flgLogin, 8);
            logger.printf("[AUTH] FlagLogin is %s\n",flgLogin);
            if(strcmp(flgLogin, "true") == 0){
                jsonRoot["message"] = String("Welcome, ") + newusername + "!";
            } else {
                jsonRoot["message"] = String("Welcome to ") + newusername + " in the app !";
            }
            jsonRoot["flgLogin"] = flgLogin;      
            } else {      // case where flgLogin not there no auto log then
                logger.println("[AUTH] Request has not flgLogin : return false");
                jsonRoot["flgLogin"] = "false";
                jsonRoot["message"] = String("User ") + newusername + " created successfully";
            }  
            logger.println("[AUTH] New user created successfully"); 
          } else {  // no room for new user
            jsonRoot["status"] = "No room for new user";
            jsonRoot["username"] = String(newusername);
            jsonRoot["message"] = "There is no room for a new user, use an existing one !";
            logger.println("[AUTH] ⚠️ No room for new user"); 
          } 
        }
    } else {  // bad adminPassword
        jsonRoot["status"] = "Bad AdminPassword";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("[AUTH] ❌ Bad AdminPassword"); 
    }
    serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));  // Optimisation RAM
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
    response->addHeader("Cache-Control","no-cache");
    response->addHeader("Access-Control-Allow-Origin","*");
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
  }

  /**
   * @brief Vérifie si le client est sur le réseau local (même sous-réseau que l'ESP8266)
   * @param request Requête HTTP AsyncWebServer
   * @return true si client local, false sinon
   */
  void PiscineWebClass::handleCheckLocalAuth(AsyncWebServerRequest *request) {
    char jsonBuff[512];  // Optimisation RAM
    StaticJsonDocument<256> jsonRoot;  // Optimisation RAM
    char sessionID[16];
    long ttl = 365 * 24 * 60 * 60;  // 1 an pour clients locaux
    
    bool isLocal = isLocalClient(request);
    
    if (isLocal && config.enableLocalAutoLogin) {
        // Générer une session automatique pour client local
        generateKey(sessionID, ttl);
        
        jsonRoot["status"] = "Auto Login Local";
        jsonRoot["isLocal"] = true;
        jsonRoot["autoLogin"] = true;
        jsonRoot["sessionID"] = sessionID;
        jsonRoot["ttl"] = ttl;
        jsonRoot["username"] = "local_user";
        jsonRoot["message"] = "Bienvenue (connexion locale automatique)";
        
        logger.printf("[AUTH] Auto-login local : IP=%s, TTL=1 an\n", 
                     request->client()->remoteIP().toString().c_str());
    } else {
        jsonRoot["status"] = "Authentication Required";
        jsonRoot["isLocal"] = isLocal;
        jsonRoot["autoLogin"] = false;
        jsonRoot["message"] = "Authentification requise";
        
        logger.printf("[AUTH] Authentification requise : IP=%s, Local=%s, Config=%s\n",
                     request->client()->remoteIP().toString().c_str(),
                     isLocal ? "true" : "false",
                     config.enableLocalAutoLogin ? "enabled" : "disabled");
    }
    
    serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
    AsyncWebServerResponse *response = request->beginResponse(200, FPSTR(STR_CONTENT_JSON), jsonBuff);
    response->addHeader(FPSTR(STR_HEADER_CACHE), FPSTR(STR_HEADER_NOCACHE));
    response->addHeader(FPSTR(STR_HEADER_CORS), FPSTR(STR_HEADER_CORS_ALL));
    request->send(response);
  }

  /*
   * void PiscineWebClass::handleChangAdminPW
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleChangAdminPW(AsyncWebServerRequest *request){
    char theadminpassword[11];
    char newadminpassword[11];
    char jsonBuff[512];  // Optimisation RAM
    StaticJsonDocument<256> jsonRoot;  // Optimisation RAM

    if( ! request->hasParam("password",true) || ! request->hasParam("adminpassword",true) 
        || request->getParam("password",true)->value() == NULL || request->getParam("adminpassword",true)->value() == NULL) {       // If the POST request doesn't have username and password data
        request->send(400, FPSTR(STR_CONTENT_PLAIN), FPSTR(STR_INVALID_REQUEST));         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
    if(strcmp(theadminpassword, config.adminPassword) == 0 ){                                      // good admin password allowed to update it
        request->getParam("password",true)->value().toCharArray(newadminpassword,11);
        strncpy( config.adminPassword, newadminpassword, 11);                                        // set the new password
        saveNewConfiguration(newadminpassword,nullptr,nullptr,nullptr,nullptr);                                                                  // save changes to the config file
        jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_ADMIN_PW_UPDATED);
        jsonRoot[FPSTR(STR_JSON_MESSAGE)] = FPSTR(STR_ADMIN_PW_SUCCESS_MSG);
        logger.println(FPSTR(STR_LOG_ADMIN_UPDATED)); 
    } else {  // bad adminPassword
        jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_BAD_ADMIN_PW);
        jsonRoot[FPSTR(STR_JSON_MESSAGE)] = FPSTR(STR_BAD_ADMIN_MSG);
        logger.println(FPSTR(STR_LOG_BAD_ADMIN)); 
    }
    serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
    AsyncWebServerResponse *response = request->beginResponse(200, FPSTR(STR_CONTENT_PLAIN), jsonBuff);
    response->addHeader(FPSTR(STR_HEADER_CACHE), FPSTR(STR_HEADER_NOCACHE));
    response->addHeader(FPSTR(STR_HEADER_CORS), FPSTR(STR_HEADER_CORS_ALL));
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
    }

  /*
   * void PiscineWebClass::handleUserProfile
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleUserProfile(AsyncWebServerRequest *request){
    bool flgfound = false;
    char newusername[11], newuserpassword[11], oldusername[11];
    uint8_t indUser = 0;
    char jsonBuff[512];  // Optimisation RAM
    StaticJsonDocument<256> jsonRoot;  // Optimisation RAM

    if( ! request->hasParam("username",true) || ! request->hasParam("nameuserprofile",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("nameuserprofile",true)->value() == NULL ) { // If the POST request doesn't have username and password data
        request->send(400, FPSTR(STR_CONTENT_PLAIN), FPSTR(STR_INVALID_REQUEST));         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("username",true)->value().toCharArray(oldusername,15); 
    request->getParam("nameuserprofile",true)->value().toCharArray(newusername,15); 
    if( request->hasParam("password",true)) request->getParam("password",true)->value().toCharArray(newuserpassword,10);
    logger.printf("[AUTH] Update user: %s, passwd: %s\n",newusername,newuserpassword);

        for(indUser=0;indUser<MAX_USERS;indUser++){   // check to see if user already exist
            if(strcmp(config.users[indUser].user, oldusername) == 0){       // found existing user only update the password
            strncpy(config.users[indUser].user,newusername,11);
            if(request->hasParam("ChangePassword")){
                strncpy(config.users[indUser].user_passwd, newuserpassword, 11);
            } 
            saveConfiguration();      // save the config to file
            flgfound = true;
            break;
        }
    }  
    if(flgfound) {            // Found username and updated 
        jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_USER_PROFILE_UPDATED);
        jsonRoot[FPSTR(STR_JSON_USERNAME)] = newusername;
        jsonRoot[FPSTR(STR_JSON_PASSWORD)] = newuserpassword;
        jsonRoot[FPSTR(STR_JSON_MESSAGE)] = FPSTR(STR_USER_PROFILE_MSG);
        logger.println(FPSTR(STR_LOG_USER_UPDATED));
    } else {                  // not found so can't update
        jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_USER_PROFILE_NOT_UPDATED);
        jsonRoot[FPSTR(STR_JSON_MESSAGE)] = FPSTR(STR_USER_NOT_FOUND_MSG);
        logger.println(FPSTR(STR_LOG_USER_NOT_FOUND)); 
    } 
    serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
    AsyncWebServerResponse *response = request->beginResponse(200, FPSTR(STR_CONTENT_PLAIN), jsonBuff);
    response->addHeader(FPSTR(STR_HEADER_CACHE), FPSTR(STR_HEADER_NOCACHE));
    response->addHeader(FPSTR(STR_HEADER_CORS), FPSTR(STR_HEADER_CORS_ALL));
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
    }

  /*
   * void PiscineWebClass::handleGetUsers
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleGetUsers(AsyncWebServerRequest *request){
    char jsonBuff[768];  // Optimisation RAM
    StaticJsonDocument<512> jsonRoot;  // Optimisation RAM
    uint8_t indU=0, indUser=0;

        jsonRoot[FPSTR(STR_JSON_STATUS)] = FPSTR(STR_USER_LIST);
        JsonArray rtnUsers = jsonRoot["users"].to<JsonArray>();

        for(indUser=0;indUser<MAX_USERS;indUser++){   // find user in config
            rtnUsers[indU]["username"] = config.users[indUser].user;
            indU++;  
        }
        serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));
        AsyncWebServerResponse *response = request->beginResponse(200, FPSTR(STR_CONTENT_PLAIN), jsonBuff);
        response->addHeader(FPSTR(STR_HEADER_CACHE), FPSTR(STR_HEADER_NOCACHE));
        response->addHeader(FPSTR(STR_HEADER_CORS), FPSTR(STR_HEADER_CORS_ALL));
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);

    }

  /*
   * void PiscineWebClass::handleDeleteUsers
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
  void PiscineWebClass::handleDeleteUsers(AsyncWebServerRequest *request){
    bool flgfound = false;
    char theadminpassword[11];
    char currentUser[11];
    char username[11];
    char jsonBuff[512];  // Optimisation RAM
    StaticJsonDocument<256> jsonRoot;  // Optimisation RAM


    if(request->hasParam("adminpassword",true)){
        request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
        if(strcmp(theadminpassword, config.adminPassword) == 0 ){                                    // good admin password allowed to process
        for (int i=0; i<MAX_USERS;i++){
            sprintf(currentUser, "user%d",i);
            logger.printf("[AUTH] Current user is %s\n",currentUser);
            if(request->hasParam(currentUser,true)){     // checkbox is checked => delete the user (value of checkbox)
                request->getParam(currentUser,true)->value().toCharArray(username,11);
                logger.printf("[AUTH] User to delete: %s\n",username);
                for (int j=0; j<MAX_USERS; j++) {
                    if(strcmp(config.users[j].user, username) == 0){            // found existing user 
                        flgfound = true;
                        strcpy(config.users[j].user,"");
                        strcpy(config.users[j].user_passwd,"");
                        logger.println("[AUTH] User deleted");
                        break;
                    }
                }
            }
        }
        if(flgfound){               // did at le  st a user 
            saveConfiguration();      // save the config to file
            jsonRoot["status"] = "User(s) Deleted";
            jsonRoot["message"] = "User(s) Deleted in the config file";
            logger.println("[AUTH] User(s) deleted");
        } else {
            jsonRoot["status"] = "No User(s) to Delete";
            jsonRoot["message"] = "Can not find existing user to delete !";
            logger.println("[AUTH] ❌ Can not find existing user to delete!"); 
        }
        } else {  // bad adminPassword
        jsonRoot["status"] = "Bad Admin Password";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("[AUTH] ❌ Bad AdminPassword"); 
        }
    } else {  // no admin passord so => bad adminPassword
        jsonRoot["status"] = "Bad Admin Password";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("[AUTH] ❌ Bad AdminPassword"); 
    }
    serializeJson(jsonRoot, jsonBuff);
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
    response->addHeader("Cache-Control","no-cache");
    response->addHeader("Access-Control-Allow-Origin","*");
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
    }

/*__________________________________________________________WEB HOOKS__________________________________________________________*/

  /*
   * void PiscineWebClass::handleRoot
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleRoot(AsyncWebServerRequest *request) {                         // When URI / is requested, send a login web page
        logger.println("[WEB] Enter handleRoot");
        if(!handleFileRead("/main.html",request)){
            handleFileError("/main.html",request);                 // file not found
        } 
    }

  /*
   * void PiscineWebClass::handleOtherFiles
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleOtherFiles(AsyncWebServerRequest *request){ 	// if the requested file or page doesn't exist, return a 404 not found error
        logger.println("[WEB] Enter handleOtherFiles");
        logger.printf("[WEB] http://%s%s\n", request->host().c_str(), request->url().c_str());
        if(!handleFileRead(request->url(),request)){
            handleFileError(request->url(),request);                 // file not found
        } 
    }

  /*
   * void PiscineWebClass::handleNotFound
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleNotFound(AsyncWebServerRequest *request){ 	// if the requested file or page doesn't exist, return a 404 not found error
        logger.println("[WEB] Enter handleNotFound");

        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
        logger.print("[WEB] NOT_FOUND: ");
        switch (request->method()) { 
            case HTTP_GET: logger.print("GET");
            break;    
            case HTTP_POST: logger.print("POST");
            break;    
            case HTTP_DELETE : logger.print("DELETE");
            break;    
            case HTTP_PUT : logger.print("PUT");
            break;    
            default : logger.print("UNKNOWN");
        }
        logger.printf(" http://%s%s\n", request->host().c_str(), request->url().c_str());

        if(request->contentLength()){
            logger.printf("_CONTENT_TYPE: %s\n", request->contentType().c_str());
            logger.printf("_CONTENT_LENGTH: %u\n", request->contentLength());
        }

        int headers = request->headers();
        int i;
        for(i=0;i<headers;i++){
            AsyncWebHeader* h = request->getHeader(i);
            logger.printf("_HEADER[%s]: %s\n", h->name().c_str(), h->value().c_str());
        }

        int params = request->params();
        for(i=0;i<params;i++){
            AsyncWebParameter* p = request->getParam(i);
            if(p->isFile()){
            logger.printf("_FILE[%s]: %s, size: %u\n", p->name().c_str(), p->value().c_str(), p->size());
            } else if(p->isPost()){
            logger.printf("_POST[%s]: %s\n", p->name().c_str(), p->value().c_str());
            } else {
            logger.printf("_GET[%s]: %s\n", p->name().c_str(), p->value().c_str());
            }
        }
    }

/*__________________________________________________________REST_HANDLERS__________________________________________________________*/

  /*
   * bool PiscineWebClass::checkSessionParam
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebClass::checkSessionParam(AsyncWebServerRequest *request){
        char sessionID[16];
        bool rtn = false;

        if(request->hasParam("sess",true)){                                     // check the session credentials
            request->getParam("sess",true)->value().toCharArray(sessionID,16);      
            rtn = isSessionValid(sessionID);
        }
        return rtn;
    }

                // --- Piscine ----
  /*
   * void PiscineWebClass::handleInitPiscinePP
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleInitPiscinePP(AsyncWebServerRequest *request){
        char jsonBuff[768];  // Optimisation RAM
        StaticJsonDocument<512> piscineEventsJson;  // Optimisation RAM

        for(uint8_t x:piscinePPSet){
            piscineEventsJson[getIndexNameF(x)] = piscineParams[x].valeur;  // Optimisation RAM #6 : PROGMEM
	    }
        serializeJson(piscineEventsJson, jsonBuff, sizeof(jsonBuff));
        logger.println(jsonBuff);
        piscineEvents.send(jsonBuff, "piscineData", millis());  
        request->send(200, FPSTR(STR_CONTENT_PLAIN), FPSTR(STR_OK_INIT_PP));
        logger.println(FPSTR(STR_OK_INIT_PP));
    }    

  /*
   * void PiscineWebClass::handleInitPiscinePParams
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleInitPiscinePParams(AsyncWebServerRequest *request){
        char jsonBuffParams[768];  // Optimisation RAM
        StaticJsonDocument<512> piscineParamsEventsJson;  // Optimisation RAM

        for(uint8_t x:piscineParamsSet){
            piscineParamsEventsJson[getIndexNameF(x)] = piscineParams[x].valeur;  // Optimisation RAM #6 : PROGMEM
        }
        piscineParamsEventsJson["localAutoLogin"] = config.enableLocalAutoLogin ? 1 : 0;
        serializeJson(piscineParamsEventsJson, jsonBuffParams, sizeof(jsonBuffParams));
        logger.println(jsonBuffParams);
        piscineEvents.send(jsonBuffParams, "piscineParamsData", millis());  
        request->send(200, FPSTR(STR_CONTENT_PLAIN), FPSTR(STR_OK_INIT_PARAMS));
        logger.println(FPSTR(STR_OK_INIT_PARAMS));
    }    

  /*
   * void PiscineWebClass::handlePiscineParams
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handlePiscineParams(AsyncWebServerRequest *request) {   // /setLampe?sess=x&state=ON|OFF
        char param[13];
        int16_t valParam;
        bool changed = false;

        logger.println("[WEB] Enter handlePiscineParams");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("[WEB] ❌ ERREUR : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if( (request->hasParam("param",true)) && (request->hasParam("val",true)) ){                                
                request->getParam("param",true)->value().toCharArray(param,sizeof(param));      
                valParam = request->getParam("val",true)->value().toInt();  
                logger.printf("[WEB] Param: %s, Value: %d\n",param,valParam);    
                if(strcmp(param, "lampe") == 0){
                    if (piscineParams[IND_Lampe].valeur != valParam){
                        piscineParams[IND_Lampe].valeur = valParam;
                        piscineParams[IND_Lampe].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "volet") == 0){
                    if (piscineParams[IND_Volet].valeur != valParam){
                        piscineParams[IND_Volet].valeur = valParam;
                        piscineParams[IND_Volet].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "autoMode") == 0){
                    if (piscineParams[IND_Auto].valeur != valParam){
                        piscineParams[IND_Auto].valeur = valParam;
                        piscineParams[IND_Auto].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "PP") == 0){
                    if (piscineParams[IND_PP].valeur != valParam){
                        piscineParams[IND_PP].valeur = valParam;
                        piscineParams[IND_PP].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "PAC") == 0){
                    if (piscineParams[IND_PAC].valeur != valParam){
                        piscineParams[IND_PAC].valeur = valParam;
                        piscineParams[IND_PAC].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "PH") == 0){
                    if (piscineParams[IND_PompePH].valeur != valParam){
                        piscineParams[IND_PompePH].valeur = valParam;
                        piscineParams[IND_PompePH].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "CL") == 0){
                    if (piscineParams[IND_PompeCL].valeur != valParam){
                        piscineParams[IND_PompeCL].valeur = valParam;
                        piscineParams[IND_PompeCL].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "P3") == 0){
                    if (piscineParams[IND_PompeALG].valeur != valParam){
                        piscineParams[IND_PompeALG].valeur = valParam;
                        piscineParams[IND_PompeALG].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "strtTPP") == 0){
                    if (piscineParams[IND_PlageOnPP].valeur != valParam){
                        piscineParams[IND_PlageOnPP].valeur = valParam;
                        piscineParams[IND_PlageOnPP].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "stopTPP") == 0){
                    if (piscineParams[IND_PlageOffPP].valeur != valParam){
                        piscineParams[IND_PlageOffPP].valeur = valParam;
                        piscineParams[IND_PlageOffPP].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "strtTPAC") == 0){
                    if (piscineParams[IND_PlageOnPAC].valeur != valParam){
                        piscineParams[IND_PlageOnPAC].valeur = valParam;
                        piscineParams[IND_PlageOnPAC].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "stopTPAC") == 0){
                    if (piscineParams[IND_PlageOffPAC].valeur != valParam){
                        piscineParams[IND_PlageOffPAC].valeur = valParam;
                        piscineParams[IND_PlageOffPAC].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "pacViaRouter") == 0){
                    if (piscineParams[IND_pacViaRouter].valeur != valParam){
                        piscineParams[IND_pacViaRouter].valeur = valParam;
                        piscineParams[IND_pacViaRouter].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "localAutoLogin") == 0){
                    if (config.enableLocalAutoLogin != (valParam != 0)){
                        config.enableLocalAutoLogin = (valParam != 0);
                        saveConfiguration();      // save the config to file
                    }
                } else if (strcmp(param, "typeTemp") == 0){
                    logger.printf("[WEB] TypeTemp changed to %s, type is %d\n",(valParam==0)?"Fixe":"Rel",valParam);
                    if (piscineParams[IND_TypeTemp].valeur != valParam){
                        piscineParams[IND_TypeTemp].valeur = valParam;
                        piscineParams[IND_TypeTemp].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "tempFixRel") == 0){
                    if(piscineParams[IND_TypeTemp].valeur == 0) {                        // typeTemp = 0 then type is fix
                        logger.printf("[WEB] tempfixrel is fix as typeTemp is 0\n");
                        if (piscineParams[IND_tFixe].valeur != valParam){
                            piscineParams[IND_tFixe].valeur = valParam;
                            piscineParams[IND_tFixe].changedWeb = true;
                            changed = true;
                        }
                    } else {                                                            // typeTemp = 1 then type is rel
                        logger.printf("[WEB] tempfixrel is rel as typeTemp isnt 0:%d\n",piscineParams[IND_TypeTemp].valeur);
                        if (piscineParams[IND_tVar].valeur != valParam){
                            piscineParams[IND_tVar].valeur = valParam;
                            piscineParams[IND_tVar].changedWeb = true;
                            changed = true;
                        }
                    }  
                } else if (strcmp(param, "phRef") == 0){
                    if (piscineParams[IND_PHRef].valeur != valParam){
                        piscineParams[IND_PHRef].valeur = valParam;
                        piscineParams[IND_PHRef].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "lampeAuto") == 0){
                    if (piscineParams[IND_PlageLampe].valeur != valParam){
                        piscineParams[IND_PlageLampe].valeur = valParam;
                        piscineParams[IND_PlageLampe].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "strtLampe") == 0){
                    if (piscineParams[IND_PlageOnLampe].valeur != valParam){
                        piscineParams[IND_PlageOnLampe].valeur = valParam;
                        piscineParams[IND_PlageOnLampe].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "stopLampe") == 0){
                    if (piscineParams[IND_PlageOffLampe].valeur != valParam){
                        piscineParams[IND_PlageOffLampe].valeur = valParam;
                        piscineParams[IND_PlageOffLampe].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "voletAuto") == 0){
                    if (piscineParams[IND_PlageVolet].valeur != valParam){
                        piscineParams[IND_PlageVolet].valeur = valParam;
                        piscineParams[IND_PlageVolet].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "ouvVolet") == 0){
                    if (piscineParams[IND_PlageOuvVolet].valeur != valParam){
                        piscineParams[IND_PlageOuvVolet].valeur = valParam;
                        piscineParams[IND_PlageOuvVolet].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "fermeVolet") == 0){
                    if (piscineParams[IND_PlageFermVolet].valeur != valParam){
                        piscineParams[IND_PlageFermVolet].valeur = valParam;
                        piscineParams[IND_PlageFermVolet].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "redoxRef") == 0){
                    if (piscineParams[IND_RedoxRef].valeur != valParam){
                        piscineParams[IND_RedoxRef].valeur = valParam;
                        piscineParams[IND_RedoxRef].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "typeP3") == 0){
                    if (piscineParams[IND_TypePompe3].valeur != valParam){
                        piscineParams[IND_TypePompe3].valeur = valParam;
                        piscineParams[IND_TypePompe3].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "p3Qty") == 0){
                    if (piscineParams[IND_ALGQuantite].valeur != valParam){
                        piscineParams[IND_ALGQuantite].valeur = valParam;
                        piscineParams[IND_ALGQuantite].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "p3Frq") == 0){
                    if (piscineParams[IND_ALGFrequence].valeur != valParam){
                        piscineParams[IND_ALGFrequence].valeur = valParam;
                        piscineParams[IND_ALGFrequence].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "clearAlert") == 0){
                    if (piscineParams[IND_MAX_PISCINE].valeur != valParam){        // replace IND_ClearAlert
                        piscineParams[IND_MAX_PISCINE].valeur = valParam;
                        piscineParams[IND_MAX_PISCINE].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "flowAlert") == 0){
                    if (piscineParams[IND_InvFlowAlert].valeur != valParam){
                        piscineParams[IND_InvFlowAlert].valeur = valParam;
                        piscineParams[IND_InvFlowAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "innondAlert") == 0){
                    if (piscineParams[IND_InvInondationAlert].valeur != valParam){
                        piscineParams[IND_InvInondationAlert].valeur = valParam;
                        piscineParams[IND_InvInondationAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "pacAlert") == 0){
                    if (piscineParams[IND_InvPACAlert].valeur != valParam){
                        piscineParams[IND_InvPACAlert].valeur = valParam;
                        piscineParams[IND_InvPACAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "nivPH") == 0){
                    if (piscineParams[IND_InvNivPHAlert].valeur != valParam){
                        piscineParams[IND_InvNivPHAlert].valeur = valParam;
                        piscineParams[IND_InvNivPHAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "nivCL") == 0){
                    if (piscineParams[IND_InvNivCLAlert].valeur != valParam){
                        piscineParams[IND_InvNivCLAlert].valeur = valParam;
                        piscineParams[IND_InvNivCLAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "nivALG") == 0){
                    if (piscineParams[IND_InvNivALGAlert].valeur != valParam){
                        piscineParams[IND_InvNivALGAlert].valeur = valParam;
                        piscineParams[IND_InvNivALGAlert].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "pmpPH") == 0){
                    if (piscineParams[IND_PompePH].valeur != valParam){
                        piscineParams[IND_PompePH].valeur = valParam;
                        piscineParams[IND_PompePH].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "pmpCL") == 0){
                    if (piscineParams[IND_PompeCL].valeur != valParam){
                        piscineParams[IND_PompeCL].valeur = valParam;
                        piscineParams[IND_PompeCL].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "pmp3") == 0){
                    if (piscineParams[IND_PompeALG].valeur != valParam){
                        piscineParams[IND_PompeALG].valeur = valParam;
                        piscineParams[IND_PompeALG].changedWeb = true;
                        changed = true;
                    }
                }
                request->send(200, "text/plain","OK setPiscineParams done");
                logger.printf("[WEB] OK setPiscineParams done, changed is:%s\n",(changed)?"true":"false");
            } else {                                                            // bad parameter
                logger.println("Eror : Invalid Parameter");
                request->send(400, "text/plain", "400: Invalid Parameter");        
            }
        }
    }

  /*
   * void PiscineWebClass::handlePiscineGraphDatas
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handlePiscineGraphDatas(AsyncWebServerRequest *request) {   // /getPiscineGraphs?sess=x&start=yyyy-mm-dd&end=yyyy-mm-dd
        char start[11], end[11];
        char jsonBuff[256];  // Optimisation RAM
        StaticJsonDocument<128> jsonRoot;  // Optimisation RAM #7

        logger.println("Enter handlePiscineGraphs");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("Error : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if( (request->hasParam("start",true)) && (request->hasParam("end",true)) ){                                
                request->getParam("start",true)->value().toCharArray(start,sizeof(start));      
                request->getParam("end",true)->value().toCharArray(end,sizeof(end));      
                logger.printf("Get Graph datas Start : %s, End : %s\n",start,end);
                if(!logger.setStartEnd(start,end)){     // problems with dates
                    jsonRoot["status"] = "Error";
                    jsonRoot["message"] = "Probleme sur les dates debut et fin";
                    jsonRoot["correction"] = (String)"Vérifier les dates de début: " + start + " et de fin: " +end+" demandées";
                    serializeJson(jsonRoot, jsonBuff, sizeof(jsonBuff));  // Optimisation RAM
                    AsyncWebServerResponse *response = request->beginResponse(200, "application/json", jsonBuff);
                    response->addHeader("Cache-Control","no-cache");
                    response->addHeader("Access-Control-Allow-Origin","*");
                    request->send(response);
                } else {
                    AsyncWebServerResponse *response = 
                        request->beginChunkedResponse("text/plain", [](uint8_t *buffer, size_t maxLen, size_t index) -> size_t {
                                    //Write up to "maxLen" bytes into "buffer" and return the amount written.
                                    //index equals the amount of bytes that have been already sent
                                    //You will be asked for more data until 0 is returned
                                    //Keep in mind that you can not delay or yield waiting for more data!
                            size_t len = 0;
                            Serial1.printf_P(PSTR("Chunk callback: maxLen %d index %d\n"), maxLen, index );
                            len = logger.fetchDatas((char *)buffer, maxLen);
                            if (len == 0) {
                                Serial1.printf_P(PSTR("ReadLog complete, bytesread %d of %d\n"), len, maxLen);
                            }
                            Serial1.printf_P(PSTR("Chunk read complete, read /return %d of %d\n"), len, maxLen);
                            return len;
                        });
                    response->addHeader("Server","Web Server Piscine");
                    request->send(response);    // here we start the chunking
                    logger.printf("OK handlePiscineGraphs done");
                }
            } else {                                                            // bad parameter
                logger.println("Error : Invalid Parameter");
                request->send(400, "text/plain", "400: Invalid Parameter");        
            }
        }
    }

  /*
   * void PiscineWebClass::handlePiscinePageDebug
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handlePiscinePageDebug(AsyncWebServerRequest *request){
        int showDebug = 0;
        char param[10];
        bool trigger = false;

        logger.println("Enter handlePiscinePageDebug");
        if(request->hasParam("showDebug",true)){                                
            showDebug = request->getParam("showDebug",true)->value().toInt();
            logger.printf("showDebug is: %s\n",(showDebug==1)?"true":"false");
            logger.setDebugMessage((showDebug==1)?true:false);
            request->send(200, "text/plain","OK setPiscineDebug done");
            logger.println("OK setPiscineDebug done");
        } else if(request->hasParam("trigger",true)){                 // first call trigger the logs on                          
            request->getParam("trigger",true)->value().toCharArray(param,sizeof(param));
            logger.printf("trigger is: %s\n",param);
            trigger = (strcmp(param, "start") == 0) ? true : false; 
            logger.setDebugMessage(trigger);
            request->send(200, "text/plain","OK trigger Logs done");
            logger.println("OK trigger Logs done");
        } else {                                                            // bad parameter
            logger.println("Eror : Invalid Parameter");
            request->send(400, "text/plain", "400: Invalid Parameter");        
        }
    }

  /*
   * void PiscineWebClass::handleInitPiscinePageMaintenance
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleInitPiscinePageMaintenance(AsyncWebServerRequest *request){

        char jsonBuff[128];  // Optimisation RAM
        StaticJsonDocument<64> piscineMaintenanceInitJson;  // Optimisation RAM #7


        serializeJson(piscineMaintenanceInitJson, jsonBuff, sizeof(jsonBuff));  // Optimisation RAM
        logger.println(jsonBuff);
        piscineEvents.send(jsonBuff, "piscineMaintenance", millis());  
        request->send(200, "text/plain","OK InitPiscinePageMaintenance done");
        logger.println("OK InitPiscinePageMaintenance done");

    }

  /*
   * void PiscineWebClass::handlePiscinePageMaintenance
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handlePiscinePageMaintenance(AsyncWebServerRequest *request){
        char command[15];
        char type[7];
        char value[10];
        char jsonSondes[500];

        logger.println("Enter handlePiscinePageMaintenance");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("Error : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if(request->hasParam("command",true)){                                
                request->getParam("command",true)->value().toCharArray(command,sizeof(command));      
                logger.printf("Command is : %s\n",command);  
                resetEtalonData(false);                            strcpy(etalon_Data.action,"Valid");
  
                if(strcmp(command, "scanSondes") == 0){
                    webTelecom.sendTempAddMess(false,strdup(""),1);     // strdup : convert "" from (const char*) to (char *)
                } else if (strcmp(command, "validSondes") == 0){
                    if(request->hasParam("sondes",true)){                                
                        request->getParam("sondes",true)->value().toCharArray(jsonSondes,sizeof(jsonSondes));      
                        logger.printf("Sondes is : %s\n",jsonSondes);
                        setTempAdd(jsonSondes);
                    }
                } else if (strcmp(command, "scanPH") == 0){
                    if(request->hasParam("typePH",true)){           // PH4 or PH7 or PH9                     
                        request->getParam("typePH",true)->value().toCharArray(type,sizeof(type));      
                        logger.printf("Scan PH typePH is : %s\n",type);
                        strcpy(etalon_Data.action,"Start");
                        strcpy(etalon_Data.PHRedox,"PH");
                        strcpy(etalon_Data.type,type);
                        flgScanPH = true;
                        webTelecom.sendEtalonMode();
                    }
                } else if (strcmp(command, "scanRedox") == 0){
                    if(request->hasParam("typeRedox",true)){          // "Low" or "High"                      
                        request->getParam("typeRedox",true)->value().toCharArray(type,sizeof(type));      
                        logger.printf("Scan Redox typeRedox is : %s\n",type);
                        strcpy(etalon_Data.action,"Start");
                        strcpy(etalon_Data.PHRedox,"Redox");
                        strcpy(etalon_Data.type,type);
                        flgScanRedox = true;
                        webTelecom.sendEtalonMode();
                    }
                } else if (strcmp(command, "cancelScan") == 0){
                    if(request->hasParam("type",true)){           // Redox or PH           
                        request->getParam("type",true)->value().toCharArray(type,sizeof(type));      
                        logger.printf("Cancel Scan type is : %s\n",type);
                        strcpy(etalon_Data.action,"CancelScan");
                        strcpy(etalon_Data.PHRedox,type);
                        if(strcmp(type,"PH")==0){
                            if(flgScanPH){
                                webTelecom.sendEtalonMode();
                                flgScanPH = false;
                            }
                        } else if(strcmp(type,"Redox")==0){
                            if(flgScanRedox){
                                webTelecom.sendEtalonMode();
                                flgScanRedox = false;
                            }
                        }
                    }
                } else if (strcmp(command, "cancelPH") == 0){
                    logger.println("Cancel PH Etalon");
                    strcpy(etalon_Data.action,"Cancel");
                    strcpy(etalon_Data.PHRedox,"PH");
                    webTelecom.sendEtalonMode();
                } else if (strcmp(command, "cancelRedox") == 0){
                    logger.println("Cancel Redox Etalon");
                    strcpy(etalon_Data.action,"Cancel");
                    strcpy(etalon_Data.PHRedox,"Redox");
                    webTelecom.sendEtalonMode();
                } else if (strcmp(command, "validEtalon") == 0){
                    if(request->hasParam("valEtalon",true)){   
                        request->getParam("valEtalon",true)->value().toCharArray(value,sizeof(value));
                        if(request->hasParam("type",true)){                                
                            request->getParam("type",true)->value().toCharArray(type,sizeof(type));      
                            logger.printf("Valid Etalon with value %s and type is %s\n",value,type);
                            strcpy(etalon_Data.action,"Valid");
                            strcpy(etalon_Data.PHRedox,value);
                            strcpy(etalon_Data.type,type);
                            webTelecom.sendEtalonMode();
                        }
                    }
                }
                request->send(200, "text/plain","OK setPiscineMaintenance done");
                logger.println("OK setPiscineMaintenance done");
            } else {                                                            // bad parameter
                logger.println("Error : Invalid Parameter (no Command)");
                request->send(400, "text/plain", "400: Invalid Parameter");        
            }
        }
    }

                    // --- Routeur ----
  /*
   * void PiscineWebClass::handleRouteurInfo
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleRouteurInfo(AsyncWebServerRequest *request){
        char pacViaRouter[5];
                // url = "http:// + config.maPiscineServer + "/setRouteurInfo?pacViaRouter=" + "ON | OFF";

        logger.println("Enter handleRouteurInfo");
        if(request->hasParam("pacViaRouter",true)){    
            request->getParam("pacViaRouter",true)->value().toCharArray(pacViaRouter,sizeof(pacViaRouter));      
            logger.printf("pacViaRouter is: %s\n",pacViaRouter);
            webTelecom.sendRouteurData(pacViaRouter);
            request->send(200, "text/plain","OK setRouteurInfo done");
            logger.println("OK handleRouteurInfo done");
        } else {                                                            // bad parameter
            logger.println("Error : Invalid Parameter ");
            request->send(400, "text/plain", "400: Invalid Parameter");        
        }
    }    


/*__________________________________________________________SDFS_HANDLERS__________________________________________________________*/

  /*
   * bool PiscineWebClass::handleFileRead
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebClass::handleFileRead(String path, AsyncWebServerRequest *request) { // send the right file to the client (if it exists)
        String contentType, pathWithGz;
        File file;
        bool rtn = false;
        bool gzip = false;

        logger.printf(" Asking for file : %s\n", path.c_str());
        char folderBuf[16];
        strcpy_P(folderBuf, piscineFolder);
        path = String(folderBuf) + path;

        contentType = getContentType(path);              // Get the MIME type
        pathWithGz = path + ".lgz";

        if (SD.exists(pathWithGz)){
            path += ".lgz";         // If there's a compressed version available use it
            gzip = true;
            logger.printf(" Found gziped file : %s\n", path.c_str());
        } 
        if (SD.exists(path)) {      
            file = SD.open(path, FILE_READ);  
            if (file) logger.println("Okay file is open !! ");  
            AsyncWebServerResponse *response = request->beginResponse(file, path,contentType);
            if(gzip){
                response->addHeader("Content-Encoding", "gzip");
//              response->addHeader("Access-Control-Allow-Origin","*");
                response->setCode(200);
                request->send(response);
            } else {
                request->send(file, path,contentType);
            }   
            logger.println(String("\tSent file to client: ") + path);   
            rtn = true;
        } else {
            logger.println(String("\tFile Not Found: ") + path);   // If the file doesn't exist, return false
            rtn = false;
        }
        return rtn;
    }

  /*
   * bool PiscineWebClass::handleFileError
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebClass::handleFileError(String path, AsyncWebServerRequest *request) {         // send file not found to the client
        String page404Path = "/404.html";
    if (!handleFileRead(page404Path, request)){      // try sending 404.html file from SDFS before static one
                                            // if not found then go for local one
        const char html404[] = R"(<!DOCTYPE html>
        <html>
        <head>
            <title>My mobile page!</title>
            <meta charset="UTF-8">
            <meta name="author" content="Ludovic Sorriaux">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet" id="bootstrap-css">
            <script src="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
        </head>
        <body>
            <div class="container">
            <div class="row">
                <div class="span12">
                <div class="hero-unit center">
                    <h1>Page Not Found <small><font face="Tahoma" color="red">Error 404</font></small></h1>
                    <br />
                    <p>The page you requested could not be found, either contact your webmaster</p>
                    <p>Or try again. Use your browsers <b>Back</b> button to navigate to the page you have prevously come from</p>
                </div>
                <br />
                </div>
            </div>
            </div>
        </body>
        </html>
        )";
        request->send(404, "text/plain", html404);
    } else {        // sent done by handleFileRead !!
    }

    logger.print("NOT_FOUND: ");
    switch (request->method()) { 
        case HTTP_GET: logger.print("GET");
        break;    
        case HTTP_POST: logger.print("POST");
        break;    
        case HTTP_DELETE : logger.print("DELETE");
        break;    
        case HTTP_PUT : logger.print("PUT");
        break;    
        default : logger.print("UNKNOWN");
    }
    logger.printf(" http://%s%s\n", request->host().c_str(), request->url().c_str());

    if(request->contentLength()){
        logger.printf("_CONTENT_TYPE: %s\n", request->contentType().c_str());
        logger.printf("_CONTENT_LENGTH: %u\n", request->contentLength());
    }

    int headers = request->headers();
    int i;
    for(i=0;i<headers;i++){
        AsyncWebHeader* h = request->getHeader(i);
        logger.printf("_HEADER[%s]: %s\n", h->name().c_str(), h->value().c_str());
    }

    int params = request->params();
    for(i=0;i<params;i++){
        AsyncWebParameter* p = request->getParam(i);
        if(p->isFile()){
        logger.printf("_FILE[%s]: %s, size: %u\n", p->name().c_str(), p->value().c_str(), p->size());
        } else if(p->isPost()){
        logger.printf("_POST[%s]: %s\n", p->name().c_str(), p->value().c_str());
        } else {
        logger.printf("_GET[%s]: %s\n", p->name().c_str(), p->value().c_str());
        }
    }
    return false;
    }

  /*
   * void PiscineWebClass::handleFileList
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::handleFileList( AsyncWebServerRequest *request) {
      String output = "";
      File root = SD.open("/", FILE_READ);

      printDirectory(root, 0, &output);
      request->send(200, "text/json", output);
    }

/**
 * @brief Liste récursive du contenu SD (répertoires + fichiers) avec indentation. Version classe PiscineWebClass (duplicate de maPiscinev3Web.cpp)
 */
    void PiscineWebClass::printDirectory(File dir, int numTabs, String *output) {

      while (true) {
          File entry =  dir.openNextFile();
          if (! entry) {
            //logger.println("**nomorefiles**");
            break;
          }
          for (uint8_t i=0; i<numTabs; i++) {
            *output += "\t";   // we'll have a nice indentation
          }
          // Print the 8.3 name
          *output += (entry.name());
          // Recurse for directories, otherwise print the file size
          if (entry.isDirectory()) {
            *output += ("/\n");
            printDirectory(entry, numTabs+1,output);
          } else {
            // files have sizes, directories do not
            *output += "\t\t";
            *output += entry.size();
            *output += "\n";
          }
          entry.close();
      }
    }


/*________________________________________Config_FUNCTIONS____________________________________________________*/

  /*
   * void PiscineWebClass::showJsonConfig
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::showJsonConfig(AsyncWebServerRequest *request){
        char jsonBuff[1536];  // Optimisation RAM
        StaticJsonDocument<1024> jsonConfig;  // Optimisation RAM #7 : Admin + users array + wifi array
        uint8_t i = 0;

        logger.println("Asked for print current config");

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

        serializeJson(jsonConfig, jsonBuff, sizeof(jsonBuff));  // Optimisation RAM
        AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
        response->addHeader("Cache-Control","no-cache");
        response->addHeader("Access-Control-Allow-Origin","*");
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);

    }


/*__________________________________________________________AUTHENTIFY_FUNCTIONS__________________________________________________________*/

  /*
   * bool PiscineWebClass::isSessionValid
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebClass::isSessionValid(char *sessID){
        uint8_t i = 0;
        bool flagOK=false;

        printActiveSessions();
        // first manage activeSessions struct
        for (i=0; i<10;i++){
            if(activeSessions[i].timecreated + activeSessions[i].ttl < now() ){ // time exhasted : delete sessionID
            activeSessions[i].sessID[0]=0;
            activeSessions[i].ttl=0;
            activeSessions[i].timecreated=0;
            }
        }
        printActiveSessions();
        logger.printf("Looking for session: %s\n",sessID);
        // search for sessID
        for (i=0; i<10;i++){
            if(activeSessions[i].ttl == 0) continue;  // found an empty slot
            if(strcmp(activeSessions[i].sessID, sessID) == 0){ 
            logger.printf("Found right session, time to live is :%lld\n",now() - (activeSessions[i].timecreated+activeSessions[i].ttl));
            flagOK = true;
            break; 
            }
        }
        return flagOK;   
    }

/*__________________________________________________________HELPER_FUNCTIONS__________________________________________________________*/


  /*
   * String PiscineWebClass::formatBytes
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    String PiscineWebClass::formatBytes(size_t bytes) { // convert sizes in bytes to KB and MB
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

  /*
   * String PiscineWebClass::getContentType
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    String PiscineWebClass::getContentType(String filename) { // determine the filetype of a given filename, based on the extension
    if (filename.endsWith(".html")) return "text/html";
    else if (filename.endsWith(".css")) return "text/css";
    else if (filename.endsWith(".js")) return "application/javascript";
    else if (filename.endsWith(".ico")) return "image/x-icon";
    else if (filename.endsWith(".lgz")) return "application/x-gzip";
    return "text/plain";
    }

  /*
   * bool PiscineWebClass::generateKey
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool PiscineWebClass::generateKey(char *sessID,long ttl){
    char strSess[16];
    char alphabeth[] = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; 
    uint8_t alphabethLength = 62;
    int i = 0;
    bool flagOK=false;

    for (uint8_t n = 0; n < 15 ; n++) {
        *(strSess+n) = alphabeth[random(0, alphabethLength-1)];
    }
    *(strSess+15) = '\0';
    logger.printf("new key strSess is : %s\n", strSess);  
    strlcpy( sessID, strSess, 16);  
    logger.printf("new key is : %s\n", sessID);  

    // manage activeSessions struct
    for (i=0; i<10;i++){
        if(activeSessions[i].timecreated+activeSessions[i].ttl < now() ){ // time exhasted : delete sessionID
        activeSessions[i].sessID[0]=0;
        activeSessions[i].ttl=0;
        activeSessions[i].timecreated=0;
        }
    }
    // store new infos
    for (i=0; i<10;i++){
        if(activeSessions[i].ttl == 0) { // found an empty slot
        strlcpy(activeSessions[i].sessID, sessID, 16);
        activeSessions[i].timecreated=now();
        activeSessions[i].ttl=ttl;
        flagOK=true;
        break;
        }
    }
    printActiveSessions();
        
    return flagOK;   //  if (!flagOK){   // couldn't store no room left.
    }

  /*
   * void PiscineWebClass::printActiveSessions
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::printActiveSessions(){   // to help debug
        logger.printf("Dump of Active session tab, now is: %lld\n",now());
        for (uint8_t i=0; i<10;i++){
            if(activeSessions[i].timecreated == 0) break; // no more to show
            logger.printf("sessionID: %s, ttl: %lld, timecreated: %lld\n", activeSessions[i].sessID,activeSessions[i].ttl,activeSessions[i].timecreated);
        }  
    }

  /*
   * void PiscineWebClass::getDateFormated
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::getDateFormated(char *datestr, uint8_t len, uint8_t mode){
        // mode is 0 : full "Lundi, le 10 Avril 2021" (30 caract) 
        //         1 : medium "Le 20 mai 2022" (20 caract)
        //         2 : short "15/04/2019" (10 caract)

        String dateString = String("");
        char jours[7][9] = {"Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"};   // 8 caract max
        char mois[12][10] = {"Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"};   // 9 caract max
        switch (mode) {
        case 0:   // mode full
            dateString += String(jours[weekday()-1]) + ", le " + day() + " " + mois[month()] + " " + year();
            break;
        case 1:   // mode medium
            dateString += String("Le ") + day() + " " + mois[month()] + " " + year();
            break;
        case 2:   // mode short
            dateString += String(day()) + "/" + month() + "/" + year();
            break;
        }
        dateString.toCharArray(datestr,len);
    }

  /*
   * void PiscineWebClass::minuteToHeureMinute
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::minuteToHeureMinute(int16_t mn, char* output, size_t outputSize){
        uint8_t heures = 0;
        uint8_t minutes = 0;

        heures = mn / 60;
        minutes = mn % 60;
        snprintf(output, outputSize, "%02dh%02d", heures, minutes);
    }

  /*
   * void PiscineWebClass::secondsToMinuteSeconds
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::secondsToMinuteSeconds(int16_t sec, char* output, size_t outputSize){
        float mn;
        uint8_t heures = 0;
        uint8_t minutes = 0;
        uint8_t secondes = 0;
        char temp[32];

        mn = (float)sec/60;
        if(mn>=60.0f){
            heures = mn / 60;
            mn = mn - (heures*60);
        }
        minutes = (uint8_t)mn;
        secondes = (mn - minutes) * 60;

        output[0] = '\0';  // Initialiser buffer vide
        if(heures != 0){
            snprintf(temp, 32, "%02dh", heures);
            strncat(output, temp, outputSize - strlen(output) - 1);
        }
        if((heures != 0) || (minutes !=0)){
            snprintf(temp, 32, "%02dmn", minutes);
            strncat(output, temp, outputSize - strlen(output) - 1);
        }
        snprintf(temp, 32, "%02dsec", secondes);
        strncat(output, temp, outputSize - strlen(output) - 1);
    }

  /*
   * void PiscineWebClass::addInText
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::addInText(byte *addresse, char *printableAdd){
        char *ptrTab = printableAdd;
        byte *ptrAdd = addresse;
        const char *hex = "0123456789ABCDEF";
        int i=0;

      for(i=0;i<8;i++){
        *ptrTab++ = hex[(*ptrAdd>>4)&0xF];
        *ptrTab++ = hex[(*ptrAdd++)&0xF];
      }
      *ptrTab = 0;

      if(debug) {
        logger.printf(" Addresse was : ");
        for(i=0; i<8;i++){
          logger.printf("%x ",*(addresse+i));
        }
        logger.printf(", now it is %s\n",printableAdd);
      }
    }  

/*    void PiscineWebClass::addToHex(byte *add,const char *printableAdd){
        char x[3];
        uint i,j;

        i = 0;
        x[2] = 0;
        for(j=0;j<sizeof(printableAdd);j+=2){
            x[0] = *(printableAdd+j);
            x[1] = *(printableAdd+j+1);
            *(add+i++) = strtol(x, 0, 16);
        }  
        logger.printf(" Addresse was : %s, now it is ",printableAdd);
        for(i=0; i<8;i++){
            logger.printf("%x ",*(add+i));
        }
        logger.println();
  
    }
*/
  /*
   * void PiscineWebClass::addToHex
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::addToHex(byte *add,const char *printableAdd){
        byte hex;
        uint i,j;

        hex = 0;
        j = 0;
        for ( i = 0; i < 16; i+=2) {
            // -'0' for digits 0..9 and -('A'-10) for digits `A`..`F`
            hex = toupper(printableAdd[i]) - ((printableAdd[i] >= 'A') ? ('A' - 10) : '0');
            Serial1.printf_P(PSTR("i is %d, hex is : %x, "),i,hex);
            hex *= 0x10; // shift for one hexadecimal digit
            Serial1.printf_P(PSTR("hex is now : %x, "),hex);
            hex += toupper(printableAdd[i+1]) - ((printableAdd[i+1] >= 'A') ? ('A' - 10) : '0');
            Serial1.printf_P(PSTR("hex is finnally: %x\n"),hex);
            add[j++]=hex;
        }

        logger.printf(" Addresse was : %s, now it is ",printableAdd);
        for(int i=0; i<8;i++){
            logger.printf("%x ",*(add+i));
        }
        logger.println();
    }

  /*
   * void PiscineWebClass::resetEtalonData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void PiscineWebClass::resetEtalonData(bool all){
        if(all){
            etalon_Data.mesure = 0.0;
            etalon_Data.ajust = 0.0;
            etalon_Data.calculated = 0.0;
        }
        strcpy(etalon_Data.action,"");
        strcpy(etalon_Data.PHRedox,"");
        strcpy(etalon_Data.type,""); 
      }

  /**
   * @brief Vérifie si le client est sur le réseau local (même sous-réseau que l'ESP8266)
   * @param request Requête HTTP AsyncWebServer
   * @return true si client local (même sous-réseau), false sinon
   */
    bool PiscineWebClass::isLocalClient(AsyncWebServerRequest *request) {
        IPAddress clientIP = request->client()->remoteIP();
        IPAddress serverIP = WiFi.localIP();
        IPAddress subnet = WiFi.subnetMask();
        
        // Vérifier si client et serveur sont dans le même sous-réseau
        for (int i = 0; i < 4; i++) {
            if ((clientIP[i] & subnet[i]) != (serverIP[i] & subnet[i])) {
                logger.printf("Client distant détecté : %s (serveur: %s, masque: %s)\n", 
                             clientIP.toString().c_str(), 
                             serverIP.toString().c_str(),
                             subnet.toString().c_str());
                return false;  // Pas dans le même sous-réseau
            }
        }
        
        logger.printf("Client local détecté : %s (serveur: %s, masque: %s)\n", 
                     clientIP.toString().c_str(), 
                     serverIP.toString().c_str(),
                     subnet.toString().c_str());
        return true;
    }
  



