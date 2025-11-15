#include "PiscineWeb.h"
#include "Logger.h"
#include "PiscineWebTelecom.h"

    PiscineWebClass::~PiscineWebClass(void)
      {};

    PiscineWebClass::PiscineWebClass(){
        //logger.println("init maPiscineWeb");
    }


// public
    void PiscineWebClass::startup(){
      logger.println("maPiscineWeb Startup ... ");
      startServer();               // Start a HTTP server with a file read handler and an upload handler
      startMDNS();                 // Start the mDNS responder
//      prepareNewParamsPiscine();
//      File root = SDFS.open("/","r");
//      logger.println("SDCard Contents : ");
//      printDirectory(root, 1);
    }


    void PiscineWebClass::OnUpdate(){
        MDNS.update();
    //    sendNewParams();              // for debuging
        sendNewParamsPiscine();
        if(logger.getDebugMessage()){
            manageDebugLCD();
        }
    }

    void PiscineWebClass::OnUpdatePiscineLCD(){
        managePiscineLCD();
    }

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

    void PiscineWebClass::sendNewParams(){
        prepareNewParamsPiscine();
        sendNewParamsPiscine();
    }

// private 

    void PiscineWebClass::sendNewParamsPiscine(){
            String jsonBuff;
            String jsonBuffParams;
            JsonDocument piscineParamsEventsJson;
            JsonDocument piscineEventsJson;
            bool newValPP = false, newValPParams = false;  
            bool doItFull = false;

        if(nbAppels-- == 0) {
            doItFull = true;
            nbAppels = 10;                  // 10 sec env
        }

        for(int i=0;i<IND_ClearAlert;i++){           // +1 for IND_ClearAlert
            if( (doItFull) || (piscineParams[i].changedControler)) {
                if (piscineEvents.count() != 0 ) {          // in page principal
                    if(piscinePPSet.find(i) != piscinePPSet.end()){
                        piscineEventsJson[indexName[i]] = piscineParams[i].valeur;
                        if (!newValPP) newValPP = true;
                    }
                }
                if (piscineParamsEvents.count() != 0 ) {          // in page param
                    if(piscineParamsSet.find(i) != piscineParamsSet.end()){
                        piscineParamsEventsJson[indexName[i]] = piscineParams[i].valeur;
                        if (!newValPParams) newValPParams = true;
                    }
                }
            }
            piscineParams[i].changedControler = false;
        }
        if (newValPP){
            serializeJson(piscineEventsJson, jsonBuff);
            logger.println(jsonBuff);
            piscineEvents.send(jsonBuff.c_str(), "piscineData", millis());  
        }
        if (newValPParams){
            serializeJson(piscineParamsEventsJson, jsonBuffParams);
            logger.println(jsonBuffParams);
            piscineParamsEvents.send(jsonBuffParams.c_str(), "piscineParamsData", millis());  
        }
    }

    void PiscineWebClass::managePiscineLCD(){
            char strTempo[30];
            String strTempo1,strTempo2,strTempo3;
            String jsonBuff;
            JsonDocument  jsonRoot;

        if (piscineEvents.count() != 0 ) {          // in page principal

            //  jsonRoot["Alerte"] = 1;                 // Mode Alertes

            if(piscineParams[IND_Auto].valeur == 1){    // mode auto
                strTempo1 = String("Mode Automatique");
                jsonRoot["ligne1"] = strTempo1.c_str();
                getDateFormated(strTempo,20,1);   // medium date
                strTempo2 = String(strTempo) + String(", ") + hour() + String(" h "); 
                if (minute() <10 ) {
                    strTempo2 += String("0") + minute();
                } else {
                    strTempo2 += String(minute()); 
                }
                jsonRoot["ligne2"] = strTempo2.c_str();
                if (piscineParams[IND_PP].valeur != 0) {
                    strTempo3 = String(" PP for ") + minuteToHeureMinute(piscineParams[IND_PP].valeur); //  "PP:10h20";
                    if(piscineParams[IND_PompePH].valeur != 0) {
                        strTempo3 += String(", PH- for ") + secondsToMinuteSeconds(piscineParams[IND_PompePH].valeur);  // 5h3mn5sec
                    }
                    if( (piscineParams[IND_TypePompe3].valeur == PHp) && (piscineParams[IND_PompeALG].valeur != 0) ){
                        strTempo3 += String(", PH+ for ") + secondsToMinuteSeconds(piscineParams[IND_PompeALG].valeur);
                    }
                    if (piscineParams[IND_PompeCL].valeur != 0) {
                        strTempo3 += String(", CL for ") + secondsToMinuteSeconds(piscineParams[IND_PompeCL].valeur);
                    }
                    jsonRoot["ligne3"] = strTempo3.c_str();
                }
            } else {                                            // mode manu
                strTempo1 = String("Mode Manuel");
                jsonRoot["ligne1"] = strTempo1.c_str();
                getDateFormated(strTempo,30,0);                 // full date
                strTempo2 = String(strTempo) + String(",   ") + hour() + String(" h "); 
                if (minute() <10 ) {
                    strTempo2 += String("0") + minute();
                } else {
                    strTempo2 += String( minute() ); 
                }
                jsonRoot["ligne2"] = strTempo2.c_str();
            }
            serializeJson(jsonRoot, jsonBuff);
//            logger.println(jsonBuff);
            piscineEvents.send(jsonBuff.c_str(), "piscineLCDData", millis());  
        }
    }

    void PiscineWebClass::manageDebugLCD(){
            String strTempo1;
            String jsonBuff;
            JsonDocument  jsonRoot;

        if (piscineDebugEvents.count() != 0 ) {          // in page debug
            if(logger.getDebugMessage()){
                strTempo1 = logger.getDebugMessage();
                jsonRoot["lignes"] = strTempo1.c_str();

                serializeJson(jsonRoot, jsonBuff);
                piscineDebugEvents.send(jsonBuff.c_str(), "piscineLCDDebug", millis());  
            }
        }
    }

    void PiscineWebClass::setEtalonData(){
        String jsonBuff;
        JsonDocument piscineEtalonJson;  

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
        serializeJson(piscineEtalonJson, jsonBuff);
        logger.println(jsonBuff);
        piscineMaintenanceEvents.send(jsonBuff.c_str(), "piscineMaintenance", millis());  
    }

    void PiscineWebClass::sendTempAdd(unsigned char len, char *data){
        String jsonBuff;
        JsonDocument piscineTempAddJson;         
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

        serializeJson(piscineTempAddJson, jsonBuff);
        logger.println(jsonBuff);
        piscineMaintenanceEvents.send(jsonBuff.c_str(), "piscineMaintenance", millis());  

    }

    void PiscineWebClass::setTempAdd(char *jsonSondes){
        JsonDocument sondes;
 
        byte address[8];
        byte addresses[3][8];
        char tempAddr[3*8];
        const char* printableAdd;
        const char* sondeType;
        int i,j,k;


        DeserializationError error = deserializeJson(sondes, jsonSondes);

        if (error) {
            logger.print("deserializeJson() failed: ");
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
            Serial1.printf("Processing sonde : %s\n",printableAdd);
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

  
    void PiscineWebClass::startMDNS() { // Start the mDNS responder
      if (!MDNS.begin(mdnsName,WiFi.localIP())) {
        logger.println("Error setting up MDNS responder!");
      } else {
        logger.println("mDNS responder started");
        // Add service to MDNS-SD
        MDNS.addService("http", "tcp", 80);
        logger.printf("mDNS responder started: http://%s.local\n",mdnsName);
      }
    }

    void PiscineWebClass::startServer() { // Start a HTTP server with a file read handler and an upload handler

        logger.println("Starting Piscine Web Server");
//        server.reset();
        server.on("/", HTTP_ANY, std::bind(&PiscineWebClass::handleRoot, this, std::placeholders::_1));                         // Call the 'handleRoot' function when a client requests URI "/"                         // Call the 'handleRoot' function when a client requests URI "/"

                    // -------- call backs for debug ------------
        server.on("/jsonConfig", HTTP_ANY, std::bind(&PiscineWebClass::showJsonConfig, this, std::placeholders::_1));
        
                    // -------- call backs from javascripts ------------
        server.on("/logon", HTTP_POST, std::bind(&PiscineWebClass::handleLogin, this, std::placeholders::_1)); 			  
        server.on("/register", HTTP_POST, std::bind(&PiscineWebClass::handleRegister, this, std::placeholders::_1)); 	
        server.on("/changeAdmin", HTTP_POST, std::bind(&PiscineWebClass::handleChangAdminPW, this, std::placeholders::_1)); 	
        server.on("/userProfile", HTTP_POST, std::bind(&PiscineWebClass::handleUserProfile, this, std::placeholders::_1));  
        server.on("/getUsers", HTTP_POST, std::bind(&PiscineWebClass::handleGetUsers, this, std::placeholders::_1));  
        server.on("/deleteUsers", HTTP_POST, std::bind(&PiscineWebClass::handleDeleteUsers, this, std::placeholders::_1));  
        
                    // -------- call backs from restapi ------------
        // server.on("/isInSession", HTTP_POST, handleInSession); 

            // ---------- Piscine ------
        server.on("/setPiscinePagePrincip", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePP, this, std::placeholders::_1)); 
        server.on("/setPiscinePageParams", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePParams, this, std::placeholders::_1)); 
        server.on("/setPiscineParam", HTTP_POST, std::bind(&PiscineWebClass::handlePiscineParams, this, std::placeholders::_1)); 
        server.on("/getGraphDatas", HTTP_POST, std::bind(&PiscineWebClass::handlePiscineGraphDatas, this, std::placeholders::_1)); 
        server.on("/setPiscineDebug", HTTP_POST, std::bind(&PiscineWebClass::handlePiscinePageDebug, this, std::placeholders::_1)); 
        server.on("/setPiscineMaintenance", HTTP_POST, std::bind(&PiscineWebClass::handlePiscinePageMaintenance, this, std::placeholders::_1)); 
        server.on("/setPiscineInitMaintenance", HTTP_POST, std::bind(&PiscineWebClass::handleInitPiscinePageMaintenance, this, std::placeholders::_1)); 

                // -------- call statics files not html ------------
        server.serveStatic("/", SDFS, "/");
/*        String path = piscineFolder + "/css/";        
        server.serveStatic("/", SDFS,  path.c_str());
        path = piscineFolder + "/js/";        
        server.serveStatic("/js", SDFS, path.c_str());
        path = piscineFolder + "/img/";        
        server.serveStatic("/img", SDFS, path.c_str());
        path = piscineFolder + "/";        
        server.serveStatic("/ico", SDFS, path.c_str());
*/
                    // -------- call html files need checkin auth ------------
        server.onNotFound(std::bind(&PiscineWebClass::handleOtherFiles, this, std::placeholders::_1));           			  // When a client requests an unknown URI (i.e. something other than "/"), call function handleNotFound"

        piscineEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
            logger.printf("Client reconnected! Last message ID that it got is: %u\n", client->lastId());
            }
            client->send("hello! PiscineEvents Ready", NULL, millis(), 10000);  // send message "hello!", id current millis and set reconnect delay to 1 second
        });
        piscineParamsEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
            logger.printf("Client reconnected! Last message ID that it got is: %u\n", client->lastId());
            }
            client->send("hello! PiscineParamsEvents Ready", NULL, millis(), 10000);
        });
        piscineDebugEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
                logger.printf("Client reconnected! Last message ID that it got is: %u\n", client->lastId());
            }
            logger.setDebugMessage(true);
            client->send("hello! piscineDebugEvents Ready", NULL, millis(), 10000);
        });
        piscineMaintenanceEvents.onConnect([](AsyncEventSourceClient *client){
            if(client->lastId()){
                logger.printf("Client reconnected! Last message ID that it got is: %u\n", client->lastId());
            }
            client->send("hello! piscineMaintenanceEvents Ready", NULL, millis(), 10000);
        });


        server.addHandler(&piscineEvents);
        server.addHandler(&piscineParamsEvents);
        server.addHandler(&piscineDebugEvents);
        server.addHandler(&piscineMaintenanceEvents);

        server.begin();                             			  // start the HTTP server
        logger.print("HTTP server started, IP address: ");
        logger.println(WiFi.localIP());

    }


/*__________________________________________________________SERVER_HANDLERS__________________________________________________________*/

  void PiscineWebClass::handleLogin(AsyncWebServerRequest *request) {                         // If a POST request is made to URI /login
        bool flgVerified = false;
        char newusername[11], newuserpassword[11];
        uint8_t indUser = 0;
        String jsonBuff;
        JsonDocument  jsonRoot;
        char sessionID[16];                       // calculated at each login set in the cookie maPiscine (15 chars)
        long ttl = 1*60*60;                       // 1 hours by default in sec
        //  long ttl = 2*60;                          // 2 min by default in sec for debug
        bool keepAlive = false;

    if( ! request->hasParam("username",true) || ! request->hasParam("password",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("password",true)->value() == NULL) { // If the POST request doesn't have username and password data
        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
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
            if(keepAlive) ttl=ttl*24;           // one day if keepAlive one hour else
            generateKey(sessionID, ttl);
            jsonRoot["status"] = "Log in Successful";
            jsonRoot["username"] = String(newusername);
            jsonRoot["password"] = String(newuserpassword);
            jsonRoot["sessionID"] = sessionID;   
            jsonRoot["ttl"] = ttl;   
            jsonRoot["message"] = String("Welcome, ") + newusername + "!";
            logger.println("Log in Successful");
        } else {              // bad password or user not found
            jsonRoot["status"] = "Log in Failed";
            jsonRoot["message"] = "Wrong username/password! try again.";
            logger.println("Log in Failed"); 
        }
        serializeJson(jsonRoot, jsonBuff);
        AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
        response->addHeader("Cache-Control","no-cache");
        response->addHeader("Access-Control-Allow-Origin","*");
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);
    }
  }

  void PiscineWebClass::handleRegister(AsyncWebServerRequest *request){ 							// If a POST request is made to URI /register
    int8_t flgFoundUser = -1;
    int8_t flgFoundEmpty = -1;
    char newusername[11], newuserpassword[11], theadminpassword[11];
    uint8_t indUser = 0;
    String jsonBuff;
    JsonDocument  jsonRoot;
    char sessionID[16];                       // calculated at each login set in the cookie maPiscine (15 chars)
    long ttl = 12*60*60*1000;                 // 12 hours by default
    String flgLogin;

    if( ! request->hasParam("username",true) || ! request->hasParam("password",true) || ! request->hasParam("adminpassword",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("password",true)->value() == NULL || request->getParam("adminpassword",true)->value() == NULL) { // If the POST request doesn't have username and password data
        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
    if(strcmp(theadminpassword, config.adminPassword) == 0){                                       // good admin password register new user or update it
        request->getParam("username",true)->value().toCharArray(newusername,11);
        request->getParam("password",true)->value().toCharArray(newuserpassword,11);
        logger.printf("the new user is : %s, passwd is : %s\n",newusername,newuserpassword);

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
            logger.println("User already Exist,updated with new password");
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
            logger.println("request has flgLogin");
            flgLogin = request->getParam("flgLogin",true)->value();
            logger.printf("FlagLogin is %s\n",flgLogin.c_str());
            if(flgLogin == "true"){
                jsonRoot["message"] = String("Welcome, ") + newusername + "!";
            } else {
                jsonRoot["message"] = String("Welcome to ") + newusername + " in the app !";
            }
            jsonRoot["flgLogin"] = flgLogin;      
            } else {      // case where flgLogin not there no auto log then
                logger.println("request has not flgLogin : return false");
                jsonRoot["flgLogin"] = "false";
                jsonRoot["message"] = String("User ") + newusername + " created successfully";
            }  
            logger.println("New User Created Succesfully"); 
          } else {  // no room for new user
            jsonRoot["status"] = "No room for new user";
            jsonRoot["username"] = String(newusername);
            jsonRoot["message"] = "There is no room for a new user, use an existing one !";
            logger.println("No room for new user"); 
          } 
        }
    } else {  // bad adminPassword
        jsonRoot["status"] = "Bad AdminPassword";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("Bad AdminPassword"); 
    }
    serializeJson(jsonRoot, jsonBuff);
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
    response->addHeader("Cache-Control","no-cache");
    response->addHeader("Access-Control-Allow-Origin","*");
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
  }

  void PiscineWebClass::handleChangAdminPW(AsyncWebServerRequest *request){
    char theadminpassword[11];
    char newadminpassword[11];
    String jsonBuff;
    JsonDocument  jsonRoot;

    if( ! request->hasParam("password",true) || ! request->hasParam("adminpassword",true) 
        || request->getParam("password",true)->value() == NULL || request->getParam("adminpassword",true)->value() == NULL) {       // If the POST request doesn't have username and password data
        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
    if(strcmp(theadminpassword, config.adminPassword) == 0 ){                                      // good admin password allowed to update it
        request->getParam("password",true)->value().toCharArray(newadminpassword,11);
        strncpy( config.adminPassword, newadminpassword, 11);                                        // set the new password
        saveNewConfiguration(newadminpassword,nullptr,nullptr,nullptr,nullptr);                                                                  // save changes to the config file
        jsonRoot["status"] = "Admin Password Updated";
        jsonRoot["message"] = "Succesfully updated the admin passord !";
        logger.println("Admin Password Updated"); 
    } else {  // bad adminPassword
        jsonRoot["status"] = "Bad Admin Password";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("Bad AdminPassword"); 
    }
    serializeJson(jsonRoot, jsonBuff);
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
    response->addHeader("Cache-Control","no-cache");
    response->addHeader("Access-Control-Allow-Origin","*");
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
    }

  void PiscineWebClass::handleUserProfile(AsyncWebServerRequest *request){
    bool flgfound = false;
    char newusername[11], newuserpassword[11], oldusername[11];
    uint8_t indUser = 0;
    String jsonBuff;
    JsonDocument  jsonRoot;

    if( ! request->hasParam("username",true) || ! request->hasParam("nameuserprofile",true) 
        || request->getParam("username",true)->value() == NULL || request->getParam("nameuserprofile",true)->value() == NULL ) { // If the POST request doesn't have username and password data
        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
        return;
    }

    request->getParam("username",true)->value().toCharArray(oldusername,15); 
    request->getParam("nameuserprofile",true)->value().toCharArray(newusername,15); 
    if( request->hasParam("password",true)) request->getParam("password",true)->value().toCharArray(newuserpassword,10);
    logger.printf("the new user is : %s, passwd is : %s\n",newusername,newuserpassword);

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
        jsonRoot["status"] = "User Profile Updated";
        jsonRoot["username"] = String(newusername);
        jsonRoot["password"] = String(newuserpassword);
        jsonRoot["message"] = "User profile updated";
        logger.println("User profile updated");
    } else {                  // not found so can't update
        jsonRoot["status"] = "User Profile not Updated";
        jsonRoot["message"] = "Can not find existing user, logoff and try again !";
        logger.println("User not found so can't update"); 
    } 
    serializeJson(jsonRoot, jsonBuff);
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
    response->addHeader("Cache-Control","no-cache");
    response->addHeader("Access-Control-Allow-Origin","*");
    request->send(response);
    logger.print("Json is : ");
    logger.println(jsonBuff);
    }

  void PiscineWebClass::handleGetUsers(AsyncWebServerRequest *request){
    String jsonBuff;
    JsonDocument  jsonRoot;
    uint8_t indU=0, indUser=0;

        jsonRoot["status"] = "User List";
        JsonArray rtnUsers = jsonRoot["users"].to<JsonArray>();

        for(indUser=0;indUser<MAX_USERS;indUser++){   // find user in config
            rtnUsers[indU]["username"] = config.users[indUser].user;
            indU++;  
        }
        serializeJson(jsonRoot, jsonBuff);
        AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
        response->addHeader("Cache-Control","no-cache");
        response->addHeader("Access-Control-Allow-Origin","*");
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);

    }

  void PiscineWebClass::handleDeleteUsers(AsyncWebServerRequest *request){
    bool flgfound = false;
    char theadminpassword[11];
    char currentUser[11];
    char username[11];
    String jsonBuff;
    JsonDocument  jsonRoot;


    if(request->hasParam("adminpassword",true)){
        request->getParam("adminpassword",true)->value().toCharArray(theadminpassword,11);      
        if(strcmp(theadminpassword, config.adminPassword) == 0 ){                                    // good admin password allowed to process
        for (int i=0; i<MAX_USERS;i++){
            sprintf(currentUser, "user%d",i);
            logger.printf("currentuser is %s\n",currentUser);
            if(request->hasParam(currentUser,true)){     // checkbox is checked => delete the user (value of checkbox)
                request->getParam(currentUser,true)->value().toCharArray(username,11);
                logger.printf("User to delete is %s\n",username);
                for (int j=0; j<MAX_USERS; j++) {
                    if(strcmp(config.users[j].user, username) == 0){            // found existing user 
                        flgfound = true;
                        strcpy(config.users[j].user,"");
                        strcpy(config.users[j].user_passwd,"");
                        logger.println("user deleted");
                        break;
                    }
                }
            }
        }
        if(flgfound){               // did at le  st a user 
            saveConfiguration();      // save the config to file
            jsonRoot["status"] = "User(s) Deleted";
            jsonRoot["message"] = "User(s) Deleted in the config file";
            logger.println("User(s) deleted");
        } else {
            jsonRoot["status"] = "No User(s) to Delete";
            jsonRoot["message"] = "Can not find existing user to delete !";
            logger.println("Can not find existing user to delete !"); 
        }
        } else {  // bad adminPassword
        jsonRoot["status"] = "Bad Admin Password";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("Bad AdminPassword"); 
        }
    } else {  // no admin passord so => bad adminPassword
        jsonRoot["status"] = "Bad Admin Password";
        jsonRoot["message"] = "You entered an invalid admin password, please try again !";
        logger.println("Bad AdminPassword"); 
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

    void PiscineWebClass::handleRoot(AsyncWebServerRequest *request) {                         // When URI / is requested, send a login web page
        logger.println("Enter handleRoot");
        if(!handleFileRead("/main.html",request)){
            handleFileError("/main.html",request);                 // file not found
        } 
    }

    void PiscineWebClass::handleOtherFiles(AsyncWebServerRequest *request){ 	// if the requested file or page doesn't exist, return a 404 not found error
        logger.println("Enter handleOtherFiles");
        logger.printf(" http://%s %s\n", request->host().c_str(), request->url().c_str());
        if(!handleFileRead(request->url(),request)){
            handleFileError(request->url(),request);                 // file not found
        } 
    }

    void PiscineWebClass::handleNotFound(AsyncWebServerRequest *request){ 	// if the requested file or page doesn't exist, return a 404 not found error
        logger.println("Enter handleNotFound");

        request->send(400, "text/plain", "400: Invalid Request");         // The request is invalid, so send HTTP status 400
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
    }

/*__________________________________________________________REST_HANDLERS__________________________________________________________*/

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
    void PiscineWebClass::handleInitPiscinePP(AsyncWebServerRequest *request){
        String jsonBuff;
        JsonDocument piscineEventsJson;

        for(uint8_t x:piscinePPSet){
            piscineEventsJson[indexName[x]] = piscineParams[x].valeur;
	    }
        serializeJson(piscineEventsJson, jsonBuff);
        logger.println(jsonBuff);
        piscineEvents.send(jsonBuff.c_str(), "piscineData", millis());  
        request->send(200, "text/plain","OK initPiscinePPParams done");
        logger.println("OK initPiscinePPParams done");
    }    

    void PiscineWebClass::handleInitPiscinePParams(AsyncWebServerRequest *request){
        String jsonBuffParams;
        JsonDocument piscineParamsEventsJson;

        for(uint8_t x:piscineParamsSet){
            piscineParamsEventsJson[indexName[x]] = piscineParams[x].valeur;
        }
        serializeJson(piscineParamsEventsJson, jsonBuffParams);
        logger.println(jsonBuffParams);
        piscineParamsEvents.send(jsonBuffParams.c_str(), "piscineParamsData", millis());  
        request->send(200, "text/plain","OK initPiscinePParamParams done");
        logger.println("OK initPiscinePParamParams done");
    }    

    void PiscineWebClass::handlePiscineParams(AsyncWebServerRequest *request) {   // /setLampe?sess=x&state=ON|OFF
        char param[13];
        int16_t valParam;
        bool changed = false;

        logger.println("Enter handlePiscineParams");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("Error : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if( (request->hasParam("param",true)) && (request->hasParam("val",true)) ){                                
                request->getParam("param",true)->value().toCharArray(param,sizeof(param));      
                valParam = request->getParam("val",true)->value().toInt();  
                logger.printf("Param : %s, Vaue : %d\n",param,valParam);    
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
                } else if (strcmp(param, "typeTemp") == 0){
                    logger.printf("TypeTemp changed to %s, type is %d\n",(valParam==0)?"Fixe":"Rel",valParam);
                    if (piscineParams[IND_TypeTemp].valeur != valParam){
                        piscineParams[IND_TypeTemp].valeur = valParam;
                        piscineParams[IND_TypeTemp].changedWeb = true;
                        changed = true;
                    }
                } else if (strcmp(param, "tempFixRel") == 0){
                    if(piscineParams[IND_TypeTemp].valeur == 0) {                        // typeTemp = 0 then type is fix
                        logger.printf("tempfixrel is fix as typeTemp is 0\n");
                        if (piscineParams[IND_tFixe].valeur != valParam){
                            piscineParams[IND_tFixe].valeur = valParam;
                            piscineParams[IND_tFixe].changedWeb = true;
                            changed = true;
                        }
                    } else {                                                            // typeTemp = 1 then type is rel
                        logger.printf("tempfixrel is rel as typeTemp isnt 0:%d\n",piscineParams[IND_TypeTemp].valeur);
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
                logger.printf("OK setPiscineParams done, changed is:%s\n",(changed)?"true":"false");
            } else {                                                            // bad parameter
                logger.println("Eror : Invalid Parameter");
                request->send(400, "text/plain", "400: Invalid Parameter");        
            }
        }
    }

    void PiscineWebClass::handlePiscineGraphDatas(AsyncWebServerRequest *request) {   // /setLampe?sess=x&state=ON|OFF
        char start[11], end[11];
        String jsonBuff;
        JsonDocument jsonRoot;

        logger.println("Enter handlePiscineGraphs");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("Error : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if( (request->hasParam("start",true)) && (request->hasParam("end",true)) ){                                
                request->getParam("start",true)->value().toCharArray(start,sizeof(start));      
                request->getParam("end",true)->value().toCharArray(end,sizeof(end));      
                logger.printf("Start : %s, End : %s\n",start,end);
                if(!logger.setStartEnd(start,end)){     // problems with dates
                    jsonRoot["status"] = "Error";
                    jsonRoot["message"] = "Probleme sur les dates debut et fin";
                    jsonRoot["correction"] = (String)"Vérifier les dates de début: " + start + " et de fin: " +end+" demandées";
                    serializeJson(jsonRoot, jsonBuff);
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
                            Serial1.printf("Chunk callback: maxLen %d index %d\n", maxLen, index );
                            len = logger.fetchDatas((char *)buffer, maxLen);
                            if (len == 0) {
                                Serial1.printf("ReadLog complete, bytesread %d of %d\n", len, maxLen);
                            }
                            Serial1.printf("Chunk read complete, read /return %d of %d\n", len, maxLen);
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

    void PiscineWebClass::handlePiscinePageDebug(AsyncWebServerRequest *request){
        int showDebug = 0;

        logger.println("Enter handlePiscinePageDebug");
        if(!checkSessionParam(request)){                                       // check session
            logger.println("Error : Invalid Session");
            request->send(400, "text/plain", "400: Invalid Session");        
        } else {                                                              // good sessid, then do things
            if(request->hasParam("showDebug",true)){                                
                showDebug = request->getParam("showDebug",true)->value().toInt();
                logger.printf("showDebug is: %s\n",(showDebug==1)?"true":"false");
                logger.setDebugMessage((showDebug==1)?true:false);
                request->send(200, "text/plain","OK setPiscineDebug done");
                logger.println("OK setPiscineDebug done");
            } else {                                                            // bad parameter
                logger.println("Eror : Invalid Parameter");
                request->send(400, "text/plain", "400: Invalid Parameter");        
            }
        }
    }

    void PiscineWebClass::handleInitPiscinePageMaintenance(AsyncWebServerRequest *request){

        String jsonBuff;
        JsonDocument piscineMaintenanceInitJson;         


        serializeJson(piscineMaintenanceInitJson, jsonBuff);
        logger.println(jsonBuff);
        piscineMaintenanceEvents.send(jsonBuff.c_str(), "piscineMaintenance", millis());  
        request->send(200, "text/plain","OK InitPiscinePageMaintenance done");
        logger.println("OK InitPiscinePageMaintenance done");

    }

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

/*__________________________________________________________SDFS_HANDLERS__________________________________________________________*/

    bool PiscineWebClass::handleFileRead(String path, AsyncWebServerRequest *request) { // send the right file to the client (if it exists)
        String contentType, pathWithGz;
        File file;
        bool rtn = false;
        bool gzip = false;

        logger.printf(" Asking for file : %s\n", path.c_str());
        path = piscineFolder + path;

        contentType = getContentType(path);              // Get the MIME type
        pathWithGz = path + ".lgz";

        if (SDFS.exists(pathWithGz)){
            path += ".lgz";         // If there's a compressed version available use it
            gzip = true;
            logger.printf(" Found gziped file : %s\n", path.c_str());
        } 
        if (SDFS.exists(path)) {      
            file = SDFS.open(path,"r");  
            if (file) logger.println("Okay file is open !! ");  
            AsyncWebServerResponse *response = request->beginResponse(file, path,contentType);
            if(gzip)   response->addHeader("Content-Encoding", "gzip");
            response->addHeader("Access-Control-Allow-Origin","*");
            response->setCode(200);
            request->send(response);
            rtn = true;
        } else {
            logger.println(String("\tFile Not Found: ") + path);   // If the file doesn't exist, return false
            rtn = false;
        }
        return rtn;
    }

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

    void PiscineWebClass::handleFileList( AsyncWebServerRequest *request) {
      String output = "";
      File root = SDFS.open("/","r");

      printDirectory(root, 0, &output);
      request->send(200, "text/json", output);
    }

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

    void PiscineWebClass::showJsonConfig(AsyncWebServerRequest *request){
        String jsonBuff;
        JsonDocument jsonConfig;         // config file
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

        serializeJson(jsonConfig, jsonBuff);
        AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", jsonBuff);
        response->addHeader("Cache-Control","no-cache");
        response->addHeader("Access-Control-Allow-Origin","*");
        request->send(response);
        logger.print("Json is : ");
        logger.println(jsonBuff);

    }


/*__________________________________________________________AUTHENTIFY_FUNCTIONS__________________________________________________________*/

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

    String PiscineWebClass::getContentType(String filename) { // determine the filetype of a given filename, based on the extension
    if (filename.endsWith(".html")) return "text/html";
    else if (filename.endsWith(".css")) return "text/css";
    else if (filename.endsWith(".js")) return "application/javascript";
    else if (filename.endsWith(".ico")) return "image/x-icon";
    else if (filename.endsWith(".lgz")) return "application/x-gzip";
    return "text/plain";
    }

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

    void PiscineWebClass::printActiveSessions(){   // to help debug
        logger.printf("Dump of Active session tab, now is: %lld\n",now());
        for (uint8_t i=0; i<10;i++){
            if(activeSessions[i].timecreated == 0) break; // no more to show
            logger.printf("sessionID: %s, ttl: %lld, timecreated: %lld\n", activeSessions[i].sessID,activeSessions[i].ttl,activeSessions[i].timecreated);
        }  
    }

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

    String PiscineWebClass::minuteToHeureMinute(int16_t mn){
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

    String PiscineWebClass::secondsToMinuteSeconds(int16_t sec){
        String output = String("");
        float mn;
        uint8_t heures = 0;
        uint8_t minutes = 0;
        uint8_t secondes = 0;


        mn = (float)sec/60;
        if(mn>=60.0f){
            heures = mn / 60;
            mn = mn - (heures*60);
        }
        minutes = (uint8_t)mn;
        secondes = (mn - minutes) * 60;

        if(heures != 0){
            if(heures < 10)
                output += String("0") + heures+ "h";
            else
                output += String(heures) + "h";
        }
        if((heures != 0) || (minutes !=0)){
            if(minutes < 10)
                output += String("0") + minutes + "mn";
            else  
                output += String(minutes) + "mn";
        }
        if(secondes < 10)
            output += String("0") + secondes + "sec";
        else  
            output += String(secondes) + "sec";

        return output;
    }

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
    void PiscineWebClass::addToHex(byte *add,const char *printableAdd){
        byte hex;
        uint i,j;

        hex = 0;
        j = 0;
        for ( i = 0; i < 16; i+=2) {
            // -'0' for digits 0..9 and -('A'-10) for digits `A`..`F`
            hex = toupper(printableAdd[i]) - ((printableAdd[i] >= 'A') ? ('A' - 10) : '0');
            Serial1.printf("i is %d, hex is : %x, ",i,hex);
            hex *= 0x10; // shift for one hexadecimal digit
            Serial1.printf("hex is now : %x, ",hex);
            hex += toupper(printableAdd[i+1]) - ((printableAdd[i+1] >= 'A') ? ('A' - 10) : '0');
            Serial1.printf("hex is finnally: %x\n",hex);
            add[j++]=hex;
        }

        logger.printf(" Addresse was : %s, now it is ",printableAdd);
        for(int i=0; i<8;i++){
            logger.printf("%x ",*(add+i));
        }
        logger.println();
    }

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
  

