
#include "globalPiscine.h"


#include <globalPiscineWeb.h>

#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
//#else
//#include <WiFi.h>
//#include <ESPmDNS.h>
#endif
#include <ESPAsyncWebServer.h>
#include <ESPAsyncTCP.h>
#include <set>
#include <ArduinoJson.h> 



class blinkClass {

  public :

// ------------- Begin all ControlerTelecom manager functions ----------------
  
blinkClass();
~blinkClass(void);

    void blink();
    void startup();
    void OnUpdate();
    void OnUpdatePiscineLCD();
    void printDirectory(File dir, int numTabs);

    void sendTempAdd(unsigned char len, char *data);
    void setEtalonData();
    void setTempAdd(char *jsonSondes);
                
       
private :
        uint8_t nbAppels=10;         // toutes les 10s env
        char addr[6][8];
        time_t tStart, tEnd;

        AsyncWebServer server = AsyncWebServer(80); 
        String piscineFolder = "/html"; 

        AsyncEventSource piscineEvents = AsyncEventSource("/piscineEvents");
        AsyncEventSource piscineParamsEvents = AsyncEventSource("/piscineParamsEvents");
        AsyncEventSource piscineDebugEvents = AsyncEventSource("/piscineDebugEvents");
        AsyncEventSource piscineMaintenanceEvents = AsyncEventSource("/piscineMaintenanceEvents");
        

        const char* mdnsName = "mapiscine"; 			// Domain name for the mDNS responder

        std::set<uint8_t> piscinePPSet {IND_PHVal,IND_RedoxVal,IND_CLVal, IND_TempAir, IND_TempEau, IND_TempInt, IND_TempPAC, 
                                        IND_PP, IND_PAC, IND_PompePH, IND_PompeCL, IND_PompeALG, IND_Lampe, IND_Volet, IND_Auto};
        std::set<int> piscineParamsSet {IND_PP, IND_PAC, IND_PompePH, IND_PompeCL, IND_PompeALG, IND_Lampe, IND_Volet, IND_Auto, 
                                        IND_PlageOnPP, IND_PlageOffPP, IND_TypeTemp, IND_tFixe, IND_tVar, IND_PHRef, IND_RedoxRef, 
                                        IND_TypePompe3,IND_ALGQuantite, IND_ALGFrequence, 
                                        IND_ClearAlert, IND_InvPACAlert, IND_InvFlowAlert, IND_InvInondationAlert, 
                                        IND_InvNivPHAlert, IND_InvNivCLAlert, IND_InvNivALGAlert, 
                                        IND_PlageLampe, IND_PlageOnLampe, IND_PlageOffLampe, IND_PlageVolet, IND_PlageOuvVolet, IND_PlageFermVolet, 
                                        };

        typedef struct sessions {
            char sessID[16]="\0";
            time_t ttl;
            time_t timecreated;
        } actSessions;
        actSessions activeSessions[10];

        // debug
    void prepareNewParamsPiscine();
    void sendNewParams();

    void sendNewParamsPiscine();
    void managePiscineLCD();
    void manageDebugLCD();
      

    // --- SETUP_FUNCTIONS ---
    void startMDNS();                      // Start the mDNS responder
    void startServer();                    // Start a HTTP server with a file read handler and an upload handler
        
    // --- SERVER HANDLERS ---
    void handleLogin(AsyncWebServerRequest *request);                          // If a POST request is made to URI /login
    void handleRegister(AsyncWebServerRequest *request); 						// If a POST request is made to URI /register
    void handleChangAdminPW(AsyncWebServerRequest *request);
    void handleUserProfile(AsyncWebServerRequest *request);
    void handleGetUsers(AsyncWebServerRequest *request);
    void handleDeleteUsers(AsyncWebServerRequest *request);

    void handleRoot(AsyncWebServerRequest *request);                           // When URI / is requested, send a login web page
    void handleOtherFiles(AsyncWebServerRequest *request);
    void handleNotFound(AsyncWebServerRequest *request); 	                    // if the requested file or page doesn't exist, return a 404 not found error

        
    // --- PAGES HANDLERS ---
    bool checkSessionParam(AsyncWebServerRequest *request);
            // --- Piscine ----
    void handleInitPiscinePP(AsyncWebServerRequest *request);
    void handleInitPiscinePParams(AsyncWebServerRequest *request);
    void handlePiscineParams(AsyncWebServerRequest *request);
    void handlePiscineGraphDatas(AsyncWebServerRequest *request);
    void handlePiscinePageDebug(AsyncWebServerRequest *request);
    void handleInitPiscinePageMaintenance(AsyncWebServerRequest *request);
    void handlePiscinePageMaintenance(AsyncWebServerRequest *request);        

    // --- SPIFFS_FUNCTIONS ---
    bool handleFileRead(String path, AsyncWebServerRequest *request);          // send the right file to the client (if it exists)
    bool handleFileError(String path, AsyncWebServerRequest *request);         // send file not found to the client
    void handleFileList( AsyncWebServerRequest *request);
    void showJsonConfig(AsyncWebServerRequest *request);
        
    // --- Authetified_FUNCTIONS ---
    bool isSessionValid(char *sessID);

    // --- HELPER_FUNCTIONS ---
    void printDirectory(File dir, int numTabs, String *output);
    void printActiveSessions();
    String formatBytes(size_t bytes);                                          // convert sizes in bytes to KB and MB
    String getContentType(String filename);
    bool generateKey(char *sessID,long ttl);
    void getDateFormated(char *datestr, uint8_t len, uint8_t mode);
    String minuteToHeureMinute(int16_t mn);
    String secondsToMinuteSeconds(int16_t sec);
    void addInText(byte *addresse, char *printableAdd);
    void addToHex(byte *add,const char *printableAdd);
    void resetEtalonData(bool all);

};
