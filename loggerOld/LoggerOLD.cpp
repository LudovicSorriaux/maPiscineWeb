#include <Arduino.h> 
#include <Print.h>

#include "LoggerOld.h"
//#include "controlerTelecom.h"


    LoggerClass::~LoggerClass(void)
      {};
    LoggerClass::LoggerClass(){
      if(debug){
          Serial1.println("  in Logger setup : ");
      }
      if(!cardPresent) startSD();
    }
    
    size_t LoggerClass::write(const uint8_t character){
      size_t rtn;
      rtn = Serial1.write(character);
//      ControlerTelecomMgr.writeContent(char(character));
      return rtn;
    }

    void LoggerClass::startSD() {            // Start the SD and list all contents

        SDFSConfig cfg;
        File root;

      cfg.setCSPin(SDchipSelect);
      SDFS.setConfig(cfg);
      if(!SDFS.begin()){          // see if the card is present and can be initialized:
        Serial1.println(F("SD from logger Initialization Failed"));
        cardPresent = false;
        return;
      }
      cardPresent = true;
    }


