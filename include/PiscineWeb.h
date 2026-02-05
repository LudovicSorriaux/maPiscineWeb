/*******************************************************************************
 * Fichier : PiscineWeb.h
 * Usage : Classe PiscineWebClass - Serveur web asynchrone (ESP Async WebServer),
 *         gestion des endpoints API REST, SSE (Server-Sent Events),
 *         mDNS, routes HTTP, handlers de requêtes.
 * 
 * Référencé par :
 *   - maPiscinev3Web.cpp (utilise piscineWeb)
 * 
 * Référence :
 *   - globalPiscine.h
 *   - globalPiscineWeb.h
 *   - Logger.h (via PiscineWeb.cpp)
 *   - PiscineWebTelecom.h (via PiscineWeb.cpp)
 *******************************************************************************/

#include <globalPiscine.h>
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


class PiscineWebClass {
    public :

        ~PiscineWebClass(void);
        PiscineWebClass();

        void startup();
        void OnUpdate();
        void OnUpdatePiscineLCD();
        void printDirectory(File dir, int numTabs);

        void sendTempAdd(unsigned char len, char *data);
        void setEtalonData();
        void setTempAdd(char *jsonSondes);
                    
           
    private :
            enum PageActive { PAGE_PRICIPALE, PAGE_PARAMETRES, PAGE_MAINTENANCE, PAGE_DEBUG, PAGE_NONE };  
            PageActive currentPage = PAGE_NONE;

            int8_t nbAppels=20;           // refresh full des params piscines toutes les 10s env
            int8_t MDNSAppels=120;        // refresh full des params piscines toutes les mn env
            char addr[6][8];
            time_t tStart, tEnd;

            bool flgScanRedox = false;
            bool flgScanPH = false;

            AsyncWebServer server = AsyncWebServer(80); 
            static const char piscineFolder[] PROGMEM;  // Optimisation RAM : PROGMEM au lieu de String 

            AsyncEventSource piscineEvents = AsyncEventSource("/piscineEvents");
//            AsyncEventSource piscineParamsEvents = AsyncEventSource("/piscineParamsEvents");
//            AsyncEventSource piscineDebugEvents = AsyncEventSource("/piscineDebugEvents");
//            AsyncEventSource piscineMaintenanceEvents = AsyncEventSource("/piscineMaintenanceEvents");
            

 
            std::set<uint8_t> piscinePPSet {IND_PHVal,IND_RedoxVal,IND_CLVal, IND_TempAir, IND_TempEau, IND_TempInt, IND_TempPAC, 
                                            IND_PP, IND_PAC, IND_PompePH, IND_PompeCL, IND_PompeALG, IND_Lampe, IND_Volet, IND_Auto};
            std::set<int> piscineParamsSet {IND_PP, IND_PAC, IND_PompePH, IND_PompeCL, IND_PompeALG, IND_Lampe, IND_Volet, IND_Auto, 
                                            IND_PlageOnPP, IND_PlageOffPP, IND_PlageOnPAC, IND_PlageOffPAC, IND_TypeTemp, IND_tFixe, IND_tVar, IND_pacViaRouter, IND_PHRef, IND_RedoxRef, 
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
            actSessions activeSessions[5];  // Optimisation RAM : réduit de 10 à 5 sessions

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
        void handleCheckLocalAuth(AsyncWebServerRequest *request);  // Vérifie si client local + retourne session auto
                // --- Routeur ----
        void handleRouteurInfo(AsyncWebServerRequest *request);

        // --- SPIFFS_FUNCTIONS ---
        bool handleFileRead(String path, AsyncWebServerRequest *request);          // send the right file to the client (if it exists)
        bool handleFileError(String path, AsyncWebServerRequest *request);         // send file not found to the client
        void handleFileList( AsyncWebServerRequest *request);
        void showJsonConfig(AsyncWebServerRequest *request);
            
        // --- Authetified_FUNCTIONS ---
        bool isSessionValid(char *sessID);
        bool isLocalClient(AsyncWebServerRequest *request);  // Détecte si IP client dans même sous-réseau

        // --- HELPER_FUNCTIONS ---
        void printDirectory(File dir, int numTabs, String *output);
        void printActiveSessions();
        String formatBytes(size_t bytes);                                          // convert sizes in bytes to KB and MB
        String getContentType(String filename);
        bool generateKey(char *sessID,long ttl);
        void getDateFormated(char *datestr, uint8_t len, uint8_t mode);
        void minuteToHeureMinute(int16_t mn, char* output, size_t outputSize);
        void secondsToMinuteSeconds(int16_t sec, char* output, size_t outputSize);
        void addInText(byte *addresse, char *printableAdd);
        void addToHex(byte *add,const char *printableAdd);
        void resetEtalonData(bool all);
        
};
