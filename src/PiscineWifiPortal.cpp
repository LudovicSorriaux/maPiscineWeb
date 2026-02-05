#include <WiFiManager.h>
#include "PiscineWifiPortal.h"
#include "globalPiscineWeb.h"
#include "PiscineWebTelecom.h"

    bool useWiFiManager(){
          // --- PHASE DE CONNEXION (Consomme de la RAM temporairement) ---
      WiFiManager wm;

        webTelecom.setWriteData(IND_BlinkWifiLed,-2);   // 0: off; 1: ON; -1: blink 3 times, -2 blink fast for ever, -3 blink slow for ever
          // Cette fonction sera appelée quand l'utilisateur valide le portail
        wm.setSaveConfigCallback([]() {
                char wifi_ssid[32];
                char wifi_password[64];
          // On récupère les nouvelles infos et on les sauve
            strcpy(wifi_ssid, WiFi.SSID().c_str());
            strcpy(wifi_password, WiFi.psk().c_str()); 
            saveNewConfiguration(nullptr,nullptr,nullptr,wifi_ssid, wifi_password);        //read updated parameters
        });

        wm.setDebugOutput(false);
        
        // Définit un timeout pour ne pas bloquer l'ESP indéfiniment si pas de WiFi
        wm.setConfigPortalTimeout(180); // 3 minutes

        if (!wm.autoConnect("Piscine_Config_AP")) {
          Serial.println(F("Echec de connexion, redémarrage..."));
          delay(3000);
          return false;
        }

        // À ce stade, le WiFi est connecté et l'objet 'wm' va être détruit
        Serial.println(F("WiFi Connecté via portail !"));
        
        // --- PHASE SERVEUR (Ta RAM est maintenant libérée du WiFiManager) ---
        diagnosticSysteme(); // Tu verras ici que ta RAM libre a augmenté !
        return true;
    }
