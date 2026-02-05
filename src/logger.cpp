/*******************************************************************************
 * @file    logger.cpp
 * @brief   Implémentation système de logging SD Card
 * @details Enregistrement horodaté sur carte SD, gestion répertoires par date,
 *          fonctions print/printf pour debug, récupération historique pour web.
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#define H_A

#include <Arduino.h> //needed for Serial.println
#include <Print.h>
#include "Logger.h"


/**
 * @brief Constructeur : Initialise la classe LoggerClass (log debug si activé)
 */
    LoggerClass::LoggerClass(){
      if(debug){
        println ("  in Logger setup ");
      }
    };

/**
 * @brief Crée l'arborescence SD /Log/YYYY/Alerts et /Log/YYYY/Logs/MONTH si absente. Retourne true si succès
 */
    bool LoggerClass::initDirs() {
      char directory[50];
      bool rtn = false;

        if( cardPresent){
          if (!SD.exists("/log")) {
            SD.mkdir("/log");
          }
          snprintf(directory, 50, "/log/%d", year());
          if (!SD.exists(directory)) {
            SD.mkdir(directory);
          }
          snprintf(directory, 50, "/log/%d/alerts", year());
          if (!SD.exists(directory)) {
            SD.mkdir(directory);
          }
          snprintf(directory, 50, "/log/%d/logs", year());
          if (!SD.exists(directory)) {
            SD.mkdir(directory);
          }
          snprintf(directory, 50, "/log/%d/logs/%s", year(), monthStr(month()));
          if (!SD.exists(directory)) {
            SD.mkdir(directory);
          }
          rtn = true;
        }
      return rtn;
    }

/**
 * @brief Mise à jour périodique : Vérifie changement mois/jour, crée nouveaux fichiers log (alerts, logs CSV), écrit les valeurs piscineParams[] sur SD
 */
    void LoggerClass::OnUpdate(){
      String message;
      char theDate[20];
      static uint8_t ramCheckCounter = 0;  // Compteur pour log RAM toutes les 10 minutes

        // RAM monitoring : Surveillance périodique (toutes les 10 min = 600 appels de 1s)
        if(++ramCheckCounter >= 600) {
          ramCheckCounter = 0;
          uint32_t freeHeap = ESP.getFreeHeap();
          printf("[RAM] Surveillance périodique - Free heap: %d bytes (%.1f%%)\n", 
                 freeHeap, (freeHeap * 100.0) / 81920);
          if(freeHeap < 15000) {
            printf("[RAM] ⚠️ ALERTE : RAM faible (< 15 KB) - Risque instabilité !\n");
          }
        }

        if (SD.exists("/cfg/piscine.cfg")) {      
          File configFile = SD.open("/cfg/piscine.cfg",FILE_READ);  
        }

        if(month() != lastMonth){
          initDirs();                     // change year and month if needed

          alertFileName = String("/log/") + year() + "/alerts" + "/Alerts-" + monthStr(month()) + ".log";;
          alertFile = SD.open(alertFileName.c_str(),FILE_WRITE);
          if(alertFile){
            alertFile.close();
          }
          lastMonth = month();
          printf("[LOGGER] New AlertFileName : %s\n",alertFileName.c_str());
        }

        if(dayOfWeek(now()) != today){
          // RAM monitoring : Nouveau jour (création fichiers log - opération mémoire intensive)
          printf("[RAM] Nouveau jour détecté - Free heap avant création logs: %d bytes\n", ESP.getFreeHeap());
          
          logFileName = String("/log/") + year() + "/logs/" + monthStr(month()) + "/" + dayShortStr(day()) + "-" + day() + ".log";;
          printf("[LOGGER] New LogFileName : %s\n",logFileName.c_str());
          logFile = SD.open(logFileName.c_str(),FILE_WRITE);
          if(logFile){
            logFile.print("date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto");
            logFile.flush();
            logFile.close();
          }
          logMoyFileName = String("/log/") + year() + "/logs/" + monthStr(month()) + "/" + dayShortStr(day()) + "-" + day() + "-Moy.log";
          printf("[LOGGER] New logMoyFileName : %s\n",logMoyFileName.c_str());
          logMoyFile = SD.open(logMoyFileName.c_str(), FILE_WRITE);
          if(logMoyFile){
            logMoyFile.print("date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto");
            logMoyFile.flush();
            logMoyFile.close();
          }
          today = dayOfWeek(now());
        }

        if(hour() != lasthour){                                   // calcul des moyennes
          logMoyFile = SD.open(logMoyFileName.c_str(), FILE_WRITE);
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

  /*
   * void LoggerClass::logData
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::logData(){                         // // TempEau,TempAir,TempPAC,TempInt,PHVal,RedoxVal,CLVal,PompePH,PompeCL,PompeALG,PP,PAC,Auto
        char message[256];  // Optimisation RAM #10 : String → char[]
        char theDate[20];

      logFile = SD.open(logFileName.c_str(), FILE_WRITE);
      if(logFile){
        printDate(theDate,sizeof(theDate));
        // Optimisation RAM #10 : Utilisation de snprintf au lieu de concaténations String
        snprintf(message, sizeof(message),
            "%s;%.2f;%.2f;%.2f;%.2f;%.2f;%d;%.2f;%d;%d;%d;%d;%d;%d",
            theDate,
            piscineParams[IND_TempEau].valeur / 100.0,
            piscineParams[IND_TempAir].valeur / 100.0,
            piscineParams[IND_TempPAC].valeur / 100.0,
            piscineParams[IND_TempInt].valeur / 100.0,
            piscineParams[IND_PHVal].valeur / 100.0,
            piscineParams[IND_RedoxVal].valeur,
            piscineParams[IND_CLVal].valeur / 100.0,
            piscineParams[IND_PompePH].valeur,
            piscineParams[IND_PompeCL].valeur,
            piscineParams[IND_PompeALG].valeur,
            piscineParams[IND_PP].valeur,
            piscineParams[IND_PAC].valeur,
            piscineParams[IND_Auto].valeur
        );
        logFile.println(message); 
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
    
  /*
   * bool LoggerClass::setStartEnd
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
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
    
  /*
   * size_t LoggerClass::fetchDatas
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::fetchDatas(char *buffer, size_t maxLen){

        char fileName[80];
        File logFile;
        size_t currLen = 0;
        bool nextFile = false;    // process next file. 
        

      currLen = 0;
      while (maxLen-currLen > 0){
        nextFile = false;
        snprintf(fileName, 80, "/Log/%d/Logs/%s/%s-%d-Moy.log", 
                 (year(tCurr)+1970), monthStr(month(tCurr)), dayShortStr(tCurr), day(tCurr));
        if(SD.exists(fileName)){
          logFile = SD.open(fileName, FILE_READ);
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
    
 /*
   * String LoggerClass::hasDebugMessage
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    bool LoggerClass::hasDebugMessage(){
      bool rtn;
        rtn = (strcmp(debugMessage.c_str(), "") != 0) ? true : false;  // if debugMessage not empty
        return rtn;
    }
    
  /*
   * void LoggerClass::getDebugMessage
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::getDebugMessage(char* output, size_t outputSize){
        strncpy(output, debugMessage.c_str(), outputSize - 1);
        output[outputSize - 1] = '\0';
        debugMessage = "";
    }
    
  /*
   * void LoggerClass::setDebugMessage
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::setDebugMessage(bool onOff){
      if(onOff){ 
        triggerDebugMessage = true;
      } else {
        triggerDebugMessage = false;
        debugMessage = "";
      }
    }
    

  /*
   * size_t LoggerClass::printf
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
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

  /*
   * size_t LoggerClass::print
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::print(const String &s) {
        size_t rtn;

        rtn = Serial1.print(s);
        logMessage(s.c_str());
        return rtn;
    }

  /*
   * size_t LoggerClass::print
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::print(const char str[]) {
        size_t rtn;

        rtn = Serial1.print(str);
        logMessage(str);
        return rtn;
    }

  /*
   * size_t LoggerClass::print
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::print(char c) {
      size_t rtn;
      char str[2];
        str[0] = c;
        str[1] = 0;
        rtn = Serial1.print(str);
        logMessage(str);
        return rtn;
    }

  /*
   * size_t LoggerClass::println
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::println(unsigned int data) {
      size_t rtn;
      rtn = printf("%d\n",data);
      return rtn;
    }

  /*
   * size_t LoggerClass::println
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::println(void) {
      size_t rtn;
        rtn = print("\r\n");
        if(printStarted) printStarted = false;
        return rtn;
    }

  /*
   * size_t LoggerClass::println
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::println(const String &s) {
      size_t rtn;
        rtn = print(s);
        println();
        return rtn;
    }

  /*
   * size_t LoggerClass::println
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    size_t LoggerClass::println(const char c[]) {
      size_t rtn;
        rtn = print(c);
        println();
        return rtn;
    }
    
// private :

  /*
   * void LoggerClass::logMessage
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::logMessage(const char logmessage[]){
      char message[128];
        if(!alertFile) { 
          alertFile = SD.open(alertFileName, FILE_WRITE);
        }
        if(alertFile){
            // Mon,2 10:51:46 mDNS responder started: http://mapiscine.local
          if(!printStarted) {
            snprintf(message, 128, "%s,%d %d:%d:%d%s", 
                     dayShortStr(day()), day(), hour(), minute(), second(), logmessage);
            printStarted = true;
          } else {
            strncpy(message, logmessage, 127);
            message[127] = '\0';
          }
          alertFile.print(message);
          if(logmessage[strlen(logmessage)-1] == '\n') printStarted = false;
        } else {
          if(debug){
            if (nbAlertsFileOpenErrors++ >= 10) {
              Serial1.printf_P(PSTR("[SD] ❌ ERREUR : Can't open alert file : %s\n"),alertFileName.c_str());
              nbAlertsFileOpenErrors = 0;
            }
          }
        }
        if(triggerDebugMessage) {
          debugMessage += logmessage;
        }
    }

  /*
   * void LoggerClass::printDate
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::printDate(char *date,uint8_t length){
    
        snprintf(date, length, "%d-%d-%d %d:%d:%d", 
                 day(), month(), year()+1970, hour(), minute(), second());
    }

  /*
   * int LoggerClass::calculMoyenne
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
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

  /*
   * void LoggerClass::checkSD
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    void LoggerClass::checkSD(){
      if(!cardPresent){
        if(!SD.begin(SDchipSelect)){          // see if the card is present and can be initialized:
          Serial1.println(F("[SD] ❌ ERREUR : SDCard Initialization Failed"));
          cardPresent = false;
          return;
        } else {
          cardPresent = true;
        }
      }
    }
    
  /*
   * String LoggerClass::getAlertFileName
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    String LoggerClass::getAlertFileName(){
      return alertFileName;
    }
    
  /*
   * String LoggerClass::getLogFileName
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    String LoggerClass::getLogFileName(){
      return logFileName;
    }

  /*
   * String LoggerClass::getLogFileByDate
   * But : (description automatique) — expliquer brièvement l'objectif de la fonction
   * Entrées : voir la signature de la fonction (paramètres)
   * Sortie : valeur de retour ou effet sur l'état interne
   */
    String LoggerClass::getLogFileByDate(time_t date){
      String fileName;

      fileName = String("/Log/") + (year(date)+1970) + "/Logs/" + monthStr(month(date)) + "/" + dayShortStr(date) + "-" + day(date) + ".log";;
        return fileName;
    }

//------------------------------------------------------------------------------

