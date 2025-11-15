#define H_A

#include <Arduino.h> //needed for Serial.println
#include <Print.h>
#include "Logger.h"


    LoggerClass::LoggerClass(){
      if(debug){
        println ("  in Logger setup ");
      }
    };

    bool LoggerClass::initDirs() {
      char directory[50];
      String dir;
      bool rtn = false;

        if( cardPresent){
          if (!SDFS.exists("/Log")) {
            SDFS.mkdir("/Log");
          }
          dir = String("/Log/") + (year()+1970);
          dir.toCharArray(directory, 50);
          if (!SDFS.exists(directory)) {
            SDFS.mkdir(directory);
          }
          dir = String("/Log/") + (year()+1970) + "/Alerts";
          dir.toCharArray(directory, 50);
          if (!SDFS.exists(directory)) {
            SDFS.mkdir(directory);
          }
          dir = String("/Log/") + (year()+1970) + "/Logs";
          dir.toCharArray(directory, 50);
          if (!SDFS.exists(directory)) {
            SDFS.mkdir(directory);
          }
          dir = String("/Log/") + (year()+1970) + "/Logs/" + monthStr(month());
          dir.toCharArray(directory, 50);
          if (!SDFS.exists(directory)) {
            SDFS.mkdir(directory);
          }
          rtn = true;
        }
      return rtn;
    }

    void LoggerClass::OnUpdate(){
      String dir;
      String message;
      char theDate[20];

        if (SDFS.exists("/cfg/piscine.cfg")) {      
          File configFile = SDFS.open("/cfg/piscine.cfg","r");  
        }

        if(month() != lastMonth){
          initDirs();                     // change year and month if needed

          alertFileName = String("/Log/") + (year()+1970) + "/Alerts" + "Alerts-" + monthStr(month()) + ".log";;
          alertFile = SDFS.open(alertFileName.c_str(),"w");
          if(alertFile){
            alertFile.close();
          }
          lastMonth = month();
          printf("New AlertFileName : %s\n",alertFileName.c_str());
        }

        if(dayOfWeek(now()) != today){
          logFileName = String("/Log/") + (year()+1970) + "/Logs/" + monthStr(month()) + "/" + dayShortStr(day()) + "-" + day() + ".log";;
          printf("New LogFileName : %s\n",logFileName.c_str());
          logFile = SDFS.open(logFileName.c_str(),"w");
          if(logFile){
            logFile.print("date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto");
            logFile.flush();
            logFile.close();
          }
          logMoyFileName = String("/Log/") + (year()+1970) + "/Logs/" + monthStr(month()) + "/" + dayShortStr(day()) + "-" + day() + "-Moy.log";
          printf("New logMoyFileName : %s\n",logMoyFileName.c_str());
          logMoyFile = SDFS.open(logMoyFileName.c_str(),"w");
          if(logMoyFile){
            logMoyFile.print("date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto");
            logMoyFile.flush();
            logMoyFile.close();
          }
          today = dayOfWeek(now());
        }

        if(hour() != lasthour){                                   // calcul des moyennes
          logMoyFile = SDFS.open(logMoyFileName.c_str(),"w");
          if(logMoyFile){
            printDate(theDate,sizeof(theDate));
            message = String(theDate) + ";"; 
            message += calculMoyenne(TempEauMoy) + ";";
            message += calculMoyenne(TempAirMoy) + ";";
            message += calculMoyenne(TempPACMoy) + ";";
            message += calculMoyenne(TempIntMoy) + ";";
            message += calculMoyenne(PHValMoy) + ";";
            message += calculMoyenne(RedoxValMoy) + ";";
            message += calculMoyenne(CLValMoy) + ";";
            message += calculMoyenne(PompePHMoy) + ";";
            message += calculMoyenne(PompeCLMoy) + ";";
            message += calculMoyenne(PompeALGMoy) + ";";
            message += calculMoyenne(PPMoy) + ";";
            message += calculMoyenne(PACMoy) + ";";
            message += calculMoyenne(AutoMoy);
            logMoyFile.println(message.c_str()); 
            logMoyFile.flush();
            logMoyFile.close();
          }
          nbEchan = 0;
          lasthour = hour();
        }
    } 

    void LoggerClass::logData(){                         // // TempEau,TempAir,TempPAC,TempInt,PHVal,RedoxVal,CLVal,PompePH,PompeCL,PompeALG,PP,PAC,Auto
        String message; 
        float valFloat;
        char theDate[20];

      logFile = SDFS.open(logFileName.c_str(),"w");
      if(logFile){
        printDate(theDate,sizeof(theDate));
        message = String(theDate) + ";"; 
        valFloat = piscineParams[IND_TempEau].valeur / 100;
//        sprintf(array, "%f", 3.123);
        message += String(valFloat) + ";";
        valFloat = piscineParams[IND_TempAir].valeur / 100;
        message += String(valFloat) + ";";
        valFloat = piscineParams[IND_TempPAC].valeur / 100;
        message += String(valFloat) + ";";
        valFloat += piscineParams[IND_TempInt].valeur / 100;
        message += String(valFloat) + ";";
        valFloat += piscineParams[IND_PHVal].valeur / 100;
        message += String(valFloat) + ";";
        message += piscineParams[IND_RedoxVal].valeur + ";";
        valFloat += piscineParams[IND_CLVal].valeur / 100;
        message += String(valFloat) + ";";
        message += String(piscineParams[IND_PompePH].valeur) + ";";
        message += String(piscineParams[IND_PompeCL].valeur) + ";";
        message += String(piscineParams[IND_PompeALG].valeur) + ";";
        message += String(piscineParams[IND_PP].valeur) + ";";
        message += String(piscineParams[IND_PAC].valeur) + ";";
        message += String(piscineParams[IND_Auto].valeur);
        logFile.println(message.c_str()); 
        logFile.flush();
        logFile.close();
      }
      TempEauMoy += piscineParams[IND_TempEau].valeur;
      TempAirMoy += piscineParams[IND_TempAir].valeur;
      TempPACMoy += piscineParams[IND_TempPAC].valeur;
      TempIntMoy += piscineParams[IND_TempInt].valeur;
      PHValMoy += piscineParams[IND_PHVal].valeur;
      RedoxValMoy += piscineParams[IND_RedoxVal].valeur;
      CLValMoy += piscineParams[IND_CLVal].valeur;
      PompePHMoy += piscineParams[IND_PompePH].valeur;
      PompeCLMoy += piscineParams[IND_PompeCL].valeur;
      PompeALGMoy += piscineParams[IND_PompeALG].valeur;
      PPMoy += piscineParams[IND_PP].valeur;
      PACMoy += piscineParams[IND_PAC].valeur;
      AutoMoy += piscineParams[IND_Auto].valeur;
      nbEchan += 1;   
    }
    
    bool LoggerClass::setStartEnd(char *start,char *end){   // format("DD-MM-YYYY")
      struct tm tm;
      bool rtn;

        strptime(start, "%d-%m-%Y", &tm);
        tStart = mktime(&tm);
        strptime(end, "%d-%m-%Y", &tm);
        tEnd =  mktime(&tm);
        if(tStart < tEnd) {
          tCurr = tStart;
          filePointer = 0;
          rtn = true;
        } else {
          rtn = false;
        }
      return rtn; 
    }
    
    size_t LoggerClass::fetchDatas(char *buffer, size_t maxLen){

        String fileName;
        File logFile;
        size_t currLen = 0;
        bool nextFile = false;    // process next file. 
        

      currLen = 0;
      while (maxLen-currLen > 0){
        nextFile = false;
        fileName = String("/Log/") + (year(tCurr)+1970) + "/Logs/" + monthStr(month(tCurr)) + "/" + dayShortStr(tCurr) + "-" + day(tCurr) + "-Moy.log";
        if(SDFS.exists(fileName)){
          logFile = SDFS.open(fileName.c_str(),"r");
          if(logFile){
            if(filePointer != 0){   // file processed patialy start a the end. 
              logFile.seek(filePointer+1);
            } else {
              if(currLen != 0){   // already done a previous file need to skip file's first line of this one
                char c;
                do {
                  c = logFile.read();
                  if(c==-1) {   // gone to end of file process next file;
                    nextFile = true;
                    break;
                  }
                } while((c != '\n') && (c != -1));
              }
            }
            if(!nextFile){
              filePointer = logFile.readBytes(buffer,maxLen-currLen);
              currLen += filePointer;
              if(logFile.available()){    // buffer is full but stil infos in file  
                nextFile = false;
                break;                    // get out return buffer to caller
              } else {      // done with this file;
                filePointer = 0;
                nextFile = true;
              }
            }
          } else {
            break;    // can't open existing file something went wrong !
          }
        } else {    // file doesn't exist process next day
          nextFile = true;
        } 

        if(nextFile){
          tCurr += 24*60*60;  // add one day        
          if(tCurr > tEnd){    // done all files
            currLen = 0;
            break;
          } 
        }
      }     // end while
      return currLen;
    }
    
    String LoggerClass::getDebugMessage(){
      return debugMessage;
    }
    
    void LoggerClass::setDebugMessage(bool onOff){
      if(onOff){ 
        triggerDebugMessage = true;
      } else {
        triggerDebugMessage = false;
        debugMessage = "";
      }
    }
    

    size_t LoggerClass::printf(const char *format, ...) {
      va_list arg;
      size_t rtn = 0;
      va_start(arg, format);
      char temp[64];
      char* buffer = temp;
        size_t len = vsnprintf(temp, sizeof(temp), format, arg);
        va_end(arg);
        if (len > sizeof(temp) - 1) {
            buffer = new (std::nothrow) char[len + 1];
            if (!buffer) {
                return 0;
            }
            va_start(arg, format);
            vsnprintf(buffer, len + 1, format, arg);
            va_end(arg);
        }
        rtn = Serial1.print(buffer);
        logMessage(buffer);
        if (buffer != temp) {
            delete[] buffer;
        }
        return rtn;
    }

    size_t LoggerClass::print(const String &s) {
        size_t rtn;

        rtn = Serial1.print(s);
        logMessage(s.c_str());
        return rtn;
    }

    size_t LoggerClass::print(const char str[]) {
        size_t rtn;

        rtn = Serial1.print(str);
        logMessage(str);
        return rtn;
    }

    size_t LoggerClass::print(char c) {
      size_t rtn;
      char str[2];
        str[0] = c;
        str[1] = 0;
        rtn = Serial1.print(str);
        logMessage(str);
        return rtn;
    }

    size_t LoggerClass::println(unsigned int data) {
      size_t rtn;
      rtn = printf("%d\n",data);
      return rtn;
    }

    size_t LoggerClass::println(void) {
      size_t rtn;
        rtn = print("\r\n");
        if(printStarted) printStarted = false;
        return rtn;
    }

    size_t LoggerClass::println(const String &s) {
      size_t rtn;
        rtn = print(s);
        println();
        return rtn;
    }

    size_t LoggerClass::println(const char c[]) {
      size_t rtn;
        rtn = print(c);
        println();
        return rtn;
    }
    
// private :

    void LoggerClass::logMessage(const char logmessage[]){
      String message;
        if(!alertFile) { 
          alertFile = SDFS.open(alertFileName,"a");
        }
        if(alertFile){
            // Mon,2 10:51:46 mDNS responder started: http://mapiscine.local
          if(!printStarted) {
            message = (String)dayShortStr(day()) + ',' + day() + " " + hour() + ":" + minute() + ":" + second();
            message += logmessage;
            printStarted = true;
          } else {
            message = (String)logmessage;
          }
          alertFile.print(message);
          if(logmessage[strlen(logmessage)-1] == '\n') printStarted = false;
        } else {
          if(debug){
            Serial1.printf(" Can't open alert file : %s\n",alertFileName.c_str());
          }
        }
        if(triggerDebugMessage) {
          debugMessage += logmessage;
        }
    }

    void LoggerClass::printDate(char *date,uint8_t length){
      String theDate;
    
        theDate = String(day()) + "-" + month() + "-" + year()+1970 + " " + hour() + ":" + minute() + ":" + second();
        theDate.toCharArray(date,length);
    }

    int LoggerClass::calculMoyenne(int16_t valeur){
      float valFloat;
      int valInt;

      if(nbEchan != 0){
        valFloat = valeur / nbEchan;
        if(valFloat<1){
          (valFloat<0.5) ? valInt = 0 : valInt = 1;
        } else {
          valInt = (int)valFloat;
        }
      } else {
        valInt = valeur;
      }
      return valInt;
    }

    void LoggerClass::checkSD(){
      if(!cardPresent){
        if(!SDFS.begin()){          // see if the card is present and can be initialized:
          Serial1.println("SDCard Initialization Failed");
          cardPresent = false;
          return;
        } else {
          cardPresent = true;
        }
      }
    }
    
    String LoggerClass::getAlertFileName(){
      return alertFileName;
    }
    
    String LoggerClass::getLogFileName(){
      return logFileName;
    }

    String LoggerClass::getLogFileByDate(time_t date){
      String fileName;

      fileName = String("/Log/") + (year(date)+1970) + "/Logs/" + monthStr(month(date)) + "/" + dayShortStr(date) + "-" + day(date) + ".log";;
        return fileName;
    }

//------------------------------------------------------------------------------

