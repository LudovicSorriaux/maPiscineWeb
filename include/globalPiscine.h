/*******************************************************************************
 * @file    globalPiscine.h
 * @brief   Constantes globales système piscine (partagées 3 projets)
 * @details Codes messages ICSC (DATA_MSG, CLIENT_HELLO, SYNCH_TIME, etc.),
 *          IDs systèmes (PISCINE_ID, ARROSAGE_ID, etc.), états transmission.
 *          DOIT RESTER SYNCHRONISÉ avec Controler et Clavier.
 * 
 * Usage   : Communication ICSC, identification systèmes, états messages
 * Référencé par : TOUS les modules (Controler, Clavier, Web)
 * Référence     : Arduino.h
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#include <Arduino.h>

#define DATA_MSG 0
#define CLIENT_HELLO 1
#define SERVER_HELLO 2
#define SYNCH_TIME_REQ 3
#define SYNCH_TIME 4
#define ERROR_MSG 5
#define PROGS_REQ_MSG 6
#define PROGS_DATA_MSG 7
#define SENSOR_DATA_MSG 8
#define ROUTEUR_REQ_MSG 9
#define ROUTEUR_DATA_MSG 10
#define CLIENT_SONDE_HELLO 20
#define CLIENT_ROUTEUR_HELLO 21
#define NO_MSG 255

#define NOSENT 0             // not yet sent do nothing;
#define NOSENTACK 10         // not yet received do nothing;
#define SENTNOACK 20         // sent but not delivered
#define SENTOK 30            // sent and delivered : process next step (wait for datareceive);
#define DATARECEIVEDOK 40    // process next step
#define SENTABORTED 50       // max retries can't find manager gotosleep or re-initialise;

#define PISCINE_ID 1
#define ARROSAGE_ID 2
#define CHAUFFAGE_ID 3
#define LAMPES_ID 4
#define VOLETS_ID 5

#define MAX_USERS 5                      // max nb of users
#define MAX_WIFI 3                       // max nb of wifi configs

#define MAX_KEY_LEN 15
#define IND_MAX_PISCINE 55    // last index !!
#define IND_TOTAL 83          // all indexes  

#define MAX_USERNAME_SIZE 11
#define MAX_WIFI_NAME_SIZE 32

// telecom
    #define ESP8266_BAUD 115200

// Classes
   class LoggerClass;
   class PiscineWebClass;
   // class ManagerTelecomClass;  // DÉSACTIVÉ : ESP-NOW manager (optimisation RAM)
   class PiscineWebActionControlerClass;
   class PiscineWebTelecomClass;

// Instances
   extern LoggerClass logger;                                                   
   extern PiscineWebClass maPiscineWeb;
   extern PiscineWebActionControlerClass webAction;                    
   extern PiscineWebTelecomClass webTelecom;
   // extern ManagerTelecomClass managerTelecom;  // DÉSACTIVÉ : ESP-NOW manager (optimisation RAM)


    // global structures definitions 
#ifndef maPiscineWebStructures
#define maPiscineWebStructures
  typedef struct piscineParametres {
    int16_t valeur;
    bool changedWeb = false;
    bool changedControler = false;
    bool changedFromManager = false;
  } struct_piscineParams;

  typedef struct users_t {
    char user[MAX_USERNAME_SIZE];
    char user_passwd[MAX_USERNAME_SIZE];
  } struct_users;

  typedef struct wifi_t {
    char ssid[MAX_WIFI_NAME_SIZE];
    char ssid_passwd[MAX_WIFI_NAME_SIZE*2];
  } struct_wifi;

  typedef struct configuartion_t {
    char adminPassword[MAX_USERNAME_SIZE];
    users_t users[MAX_USERS];
    wifi_t wifi[MAX_WIFI];
    bool enableLocalAutoLogin = true;
  } struct_configuration;

  typedef struct data_t {
    uint8_t index;          
    uint8_t destination;          
    int16_t value;
  } dataStruct;
  


// DÉSACTIVÉ : ESP-NOW manager (optimisation RAM)
// #define ESP_NOW_ETH_ALEN 6              /* Length of ESPNOW peer MAC address */
// #define ESP_NOW_MAX_DATA_LEN 250        /* Maximum length of ESPNOW data which is sent very time */

    //Messages structures
    typedef struct etalon_Data_t{
      float mesure = 0.0;
      float ajust = 0.0;
      float calculated = 0.0;
      char action[15] = "";
      char PHRedox[10] = "";
      char type[7] = ""; 
    } struct_Etalon_Data;

    typedef struct struct_routeur_Data{
      float GRIDCurrentPower = 0.0;
      float LOADCurrentPower = 0.0;
      float PVCurrentPower = 0.0;
      time_t debutRelayPAC = 0; 
      boolean relayPAC = false;
      boolean routeurPresent = false;
    } routeur_Data;
#endif

    // global variables defined in main 
   extern bool debug;
   extern bool managerPresent;
   extern bool flgInSetup;
   extern const char* mdnsName;   // Domain name for the mDNS responder


   extern routeur_Data routeurData;

   extern bool cardPresent;
   extern const uint8_t SDchipSelect;
   extern int8_t wifi_status;    // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
   extern bool NTPok;

               
   extern piscineParametres piscineParams[IND_MAX_PISCINE+1];   
   // extern char indexName[IND_TOTAL+1][MAX_KEY_LEN];  // OBSOLETE : remplacé par IndexNames.h (PROGMEM, -1260 octets RAM)
   extern struct_configuration config;
   extern struct_Etalon_Data etalon_Data;


    // global functions defined in main 
   extern void saveConfiguration();
   extern void saveNewConfiguration(const char *adminPassword,const char *user,const char * user_password,const char * ssid, const char * ssid_password);



