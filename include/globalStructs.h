/*******************************************************************************
 * @file    globalStructs.h
 * @brief   Structures de données globales
 * @details Définitions structures: piscineParametres (valeur + flags changed),
 *          users_t (authentification), wifi_t (config WiFi), configuration_t,
 *          data_t (échange données). Partagées entre tous les modules.
 * 
 * Usage   : Stockage état piscine, configuration WiFi, gestion utilisateurs
 * Référencé par : globalPiscineWeb.h, PiscineWeb.cpp, tous modules
 * Référence     : Aucune
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

    // global structures definitions 



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
    bool enableLocalAutoLogin = true;  // Auto-login pour clients réseau local (TTL très long)
  } struct_configuration;

  typedef struct data_t {
    uint8_t index;          
    uint8_t destination;          
    int16_t value;
  } dataStruct;
  
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
