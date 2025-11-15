#include <TimeLib.h>
#include "globalPiscine.h"



extern bool getNTPTime();
extern void configComs(int16_t valeur);

class PiscineWebActionControlerClass {
    public :

        ~PiscineWebActionControlerClass(void);
        PiscineWebActionControlerClass();

        void setStartupApp();
        void initializePiscineParams();

        void refreshData();
        void doChangeDate();
        void OnUpdate();

           
    private :
      uint8_t typePompe3 = 0;                         // 0: OFF, 1 : PH-, 2: Autre  
      uint8_t flgEpochOK = 0;                         // false

      uint32_t lastcheck = 0;
      uint32_t TimeToSynch = 60*60*1000;              // 1 heure
      int32_t timeoutSynch = TimeToSynch;

        
        void getControlerValues();
        void processAction(uint8_t index, int16_t valeur);
        void sendWebValuesToControler();
        void sendManagerValuesToControler();

  };
