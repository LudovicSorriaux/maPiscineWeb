#define H_A

#include <Arduino.h> //needed for Serial.println
#include <Print.h>
//#include "logger.h"
//#include "actionPiscine.h"
//#include "heurePiscine.h"

/*
    LOGGERNewClass::LOGGERNewClass(uint32_t timeInterval) :
            Task(MsToTaskTime(timeInterval))
        {};

    size_t LOGGERNewClass::write(const uint8_t character){
      Serial.write(character);
      if( cardPresent){
        if(!alertFile.isOpen()){
          openAlertFile();
        }
        if(alertFile.isOpen()){
           alertFile.write(character);
        }
      }
    }


    void LOGGERNewClass::printTime(){
      tmElements_t theDate;
    
        theDate = heureRTC.getRTCTime();
        print(theDate.Day);
        print("-");
        print(theDate.Month);
        print("-");
        print(theDate.Year+1970);
        print(" ");
        print(theDate.Hour);
        print(":");
        print(theDate.Minute);
        print(":");
        println(theDate.Second);
    }

// private :
 
    bool LOGGERNewClass::OnStart() {
        if(debug){
            Serial.println(F("  in Logger setup "));
        }
        
       Serial.print(F("Initializing SD card..."));
      
        // see if the card is present and can be initialized:
        if (!sd.begin(SDchipSelect)) {
          Serial.println(F("Card failed, or not present"));
          sd.initErrorHalt();
          cardPresent = false;
//          return false;
          return true;
        }
        Serial.println(F("card initialized."));
//        breakTime(now(),lastlogdate );
        RTC.read(lastlogdate);
        minuteLog = lastlogdate.Minute;
        cardPresent = true;
        return true;
    }

    void LOGGERNewClass::OnUpdate(uint32_t deltaTime){
      if ( !cardPresent ) { // check to see if card is back
        if (sd.begin(SDchipSelect)) {
          cardPresent = true;
          if (debug){
            printTime();
            println(F(" SD Card is present"));
          }
        }  
      }
      if( cardPresent){
        if( (second()%5) == 0) {    // every 10 secs
          if(alertFile.isOpen()){
            alertFile.flush();
            alertFile.close();
          }
        }
        if( (second()%10) == 0) {    // every 10 secs
          RTC.read(lastlogdate);
          doSecondsLog();
        }
        if( lastlogdate.Minute != minuteLog ){
          minuteLog = lastlogdate.Minute;
          doMinuteLog();
        }
      }
    } 
//------------------------------------------------------------------------------
    void LOGGERNewClass::openAlertFile() {
      
      char alert_directory[50];
      char alert_filename[25];
      String filename, directory;

        directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970);
        filename = String("Alerts-") + monthStr(lastlogdate.Month) + ".log";
        directory.toCharArray(alert_directory, 50);
        filename.toCharArray(alert_filename, 25);
  
        if (!sd.exists(alert_directory)) sd.mkdir(alert_directory);
        sd.chdir(alert_directory);
        
        if(!alertFile.open(alert_filename, O_WRITE | O_APPEND | O_CREAT) ){ // if file doesn't exist create new one. If can't be open then error cardPresent is probably false
           cardPresent = false; 
           if(debug){
              printTime();
              println(F(" SD Card not present can't open alert file"));
           }
        }
        
    }   
//------------------------------------------------------------------------------
    void LOGGERNewClass::doSecondsLog(){
      String message; 
      char logmessage[100];
      int16_t valeurParamPiscine[50];                 
      char log_directory[2][50];
      char log_filename[2][25];
      String filename, directory;

        ActionPiscine.getStatusPiscine(valeurParamPiscine,50);
        message = String("") + 
                    valeurParamPiscine[IND_Auto] + "," + valeurParamPiscine[IND_PP] + "," +
                    valeurParamPiscine[IND_TempAir] + "," + valeurParamPiscine[IND_TempEau] + "," +
                    valeurParamPiscine[IND_TempPAC] + "," + valeurParamPiscine[IND_PAC] + "," +
                    valeurParamPiscine[IND_PHVal] + "," + valeurParamPiscine[IND_PompePH] + "," +
                    valeurParamPiscine[IND_RedoxVal] + "," + valeurParamPiscine[IND_PompeCL] + "," +
                    valeurParamPiscine[IND_Lampe] + "," + valeurParamPiscine[IND_Volet];
        message.toCharArray(logmessage, sizeof(logmessage));

        // secondes : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970);
            filename = String("CourrantSecondes.log");
            directory.toCharArray(log_directory[0], 50);
            filename.toCharArray(log_filename[0], 25);
        // heureSec : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970) + "/" + monthStr(lastlogdate.Month) ;
            filename = String(lastlogdate.Day) + "-" + monthShortStr(lastlogdate.Month) + "-" + (lastlogdate.Year+1970) + "-" +  lastlogdate.Hour + "h-Sec.log";
            directory.toCharArray(log_directory[1], 50);
            filename.toCharArray(log_filename[1], 25);
  
        for (int i = 0; i<2 ; i++){ 
           // create log DIR if it does not exist
           if (!sd.exists(log_directory[i])) sd.mkdir(log_directory[i]);
          
           // make log DIR the current working directory
           sd.chdir(log_directory[i]);
          
           // open or create logFile in logDir
           if (!sd.exists(log_filename[i])){
              if(logFile.open(log_filename[i], O_WRITE | O_APPEND | O_CREAT) ){ // file doesn't exist create new one with entete. If can't then error cardPresent is probably false
                logFile.println(F("Date, Heure, AUTO, PompePrincipale, Temp Air, Temp Eau, Temp PAC, PAC, Valeur PH, Pompe PH, Valeur CL, Pompe CL, Projecteur, Volet"));
              } else {      // can't open file so error
                cardPresent = false; 
                if(debug){
                  printTime();
                  println(F(" SD Card not present"));
                }
              }
           } else {
              logFile.open(log_filename[i], O_WRITE | O_APPEND | O_CREAT);  // file exist so open it 
           }
    
           if(logFile.isOpen()){
             logThis(logmessage, logFile);
             logFile.flush();
             logFile.close();
           }
        } 
    }
//------------------------------------------------------------------------------
    void LOGGERNewClass::doMinuteLog(){
      String message = String(""); 
      char logmessage[100];
      int16_t valeurParamPiscine[50];                 
      char log_directory[4][50];
      char log_filename[4][25];
      String filename, directory;
        
        ActionPiscine.getStatusPiscine(valeurParamPiscine,50);
        message = String("") + 
                    valeurParamPiscine[IND_Auto] + "," + valeurParamPiscine[IND_PP] + "," +
                    valeurParamPiscine[IND_TempAir] + "," + valeurParamPiscine[IND_TempEau] + "," +
                    valeurParamPiscine[IND_TempPAC] + "," + valeurParamPiscine[IND_PAC] + "," +
                    valeurParamPiscine[IND_PHVal] + "," + valeurParamPiscine[IND_PompePH] + "," +
                    valeurParamPiscine[IND_RedoxVal] + "," + valeurParamPiscine[IND_PompeCL] + "," +
                    valeurParamPiscine[IND_Lampe] + "," + valeurParamPiscine[IND_Volet];
        message.toCharArray(logmessage, sizeof(logmessage));

        // minutes : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970);
            filename = String("CourrantMinutes.log");
            directory.toCharArray(log_directory[0], 50);
            filename.toCharArray(log_filename[0], 25);
        // heureMin : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970) + "/" + monthStr(lastlogdate.Month) ;
            filename = String(lastlogdate.Day) + "-" + monthShortStr(lastlogdate.Month) + "-" + (lastlogdate.Year+1970) + "-" +  lastlogdate.Hour + "h-Mn.log";
            directory.toCharArray(log_directory[1], 50);
            filename.toCharArray(log_filename[1], 25);
        // jour : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970) + "/" + monthStr(lastlogdate.Month) ;
            filename = String(lastlogdate.Day) + "-" + monthShortStr(lastlogdate.Month) + "-" + (lastlogdate.Year+1970) + "-Jour.log";
            directory.toCharArray(log_directory[2], 50);
            filename.toCharArray(log_filename[2], 25);
        // mois : 
            directory = String("/PiscineLog") + "/" + (lastlogdate.Year+1970) + "/" + monthStr(lastlogdate.Month) ;
            filename = String(monthShortStr(lastlogdate.Month)) + "-" + (lastlogdate.Year+1970) + "-Mois.log";
            directory.toCharArray(log_directory[3], 50);
            filename.toCharArray(log_filename[3], 25);
        
       for (int i = 0; i<4 ; i++){ 
         // create log DIR if it does not exist
         if (!sd.exists(log_directory[i])) sd.mkdir(log_directory[i]);
        
         // make log DIR the current working directory
         sd.chdir(log_directory[i]);
        
         // open or create logFile in logDir
         if (!sd.exists(log_filename[i])){
            if(logFile.open(log_filename[i], O_WRITE | O_APPEND | O_CREAT) ){ // file doesn't exist create new one with entete. If can't then error cardPresent is probably false
              logFile.println(F("Date, Heure, AUTO, PompePrincipale, Temp Air, Temp Eau, Temp PAC, PAC, Valeur PH, Pompe PH, Valeur CL, Pompe CL, Projecteur, Volet"));
            } else {      // can't open file so error
              cardPresent = false; 
            }
         } else {
            logFile.open(log_filename[i], O_WRITE | O_APPEND | O_CREAT);  // file exist so open it 
         }
  
         if(logFile.isOpen()){
           logThis(logmessage, logFile);
           logFile.flush();
           logFile.close();
         } 
       }
    }
//------------------------------------------------------------------------------
    void LOGGERNewClass::logThis(char *logmessage, File dataFile){
      char message[120];
      tmElements_t theDate;

      RTC.read(theDate);
      int Year = theDate.Year + 1970;
      int Month = theDate.Month;
      int Day = theDate.Day;
      int Hour = theDate.Hour;
      int Minute = theDate.Minute;
      int Second = theDate.Second;
      sprintf(message, "%d/%d/%d,%02d:%02d:%02d,%s",Year,Month,Day,Hour,Minute,Second,logmessage );
      dataFile.println(message);
    }
*/
