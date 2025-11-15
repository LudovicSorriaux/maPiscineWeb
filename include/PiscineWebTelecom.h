#include <Arduino.h>
#include <globalPiscine.h>
#include <globalPiscineWeb.h>

//#include <SoftwareSerial.h>
#include <ICSC.h>


#define MAX_READ_DATA 50
#define MAX_WRITE_DATA 20

class PiscineWebTelecomClass {
    public :


        ~PiscineWebTelecomClass(void);
        PiscineWebTelecomClass(void);

        void initTelecom();
        void OnUpdate();

        bool getReadData(dataStruct *tabRead, uint8_t taille);
        void setWriteData(uint8_t index, int16_t value);
        bool isControleurPresent();

        void receiveData(unsigned char src, char command, unsigned char len, char *data);
        void receiveTime(unsigned char src, char command, unsigned char len, char *data);
        void receiveSync(unsigned char src, char command, unsigned char len, char *data);
        void receiveHello(unsigned char src, char command, unsigned char len, char *data);
        void receiveTempAdd(unsigned char src, char command, unsigned char len, char *data);
        void receiveEtalonData(unsigned char src, char command, unsigned char len, char *data);

        void sendTimeMess();
        void sendAskSyncMess(char typeSync);
        void sendRouteurData(bool data);
        void sendHelloMess();
        void sendTempAddMess(bool set, char *theMessage, uint8_t len);
        void sendEtalonMode();     
           
    private :
      bool waitToTransmit = false;
      bool controleurPresent = false;
      
      dataStruct readData[MAX_READ_DATA],writeData[MAX_WRITE_DATA];                 
      uint8_t maxReadData =0;      
      uint8_t maxWriteData =0;    

      bool flgWaitAckSync = false;
      char flgAckSyncInd = 0;
      uint8_t nbWaitACKSync = 0;

      ICSC telecom;

    
};
