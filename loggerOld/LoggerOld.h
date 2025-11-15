
#include "globalPiscine.h"

//#ifndef maPiscineLogger
//#define maPiscineLogger

#include <FS.h>                 //this needs to be first, or it all crashes and burns...
#include <TimeLib.h>
#include <EEPROM.h>   
#include <SPI.h>
#include <SDFS.h>

class LoggerClass : public Print {

    public :
      ~LoggerClass(void);
      LoggerClass();
      virtual size_t write(const uint8_t character);
      using Print::write; // pull in write(str) and write(buf, size) from Print

    private :

      void startSD();
};

//#endif
