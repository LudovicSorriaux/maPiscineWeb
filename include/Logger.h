/*******************************************************************************
 * @file    Logger.h
 * @brief   Système de logging SD Card
 * @details Enregistrement horodaté des données piscine (TempEau, pH, Redox, etc.)
 *          sur carte SD. Fonctions print/printf pour debug. Récupération données
 *          pour affichage web historique. Gestion répertoires par date.
 * 
 * Usage   : Logging automatique toutes les X minutes + debug messages
 * Référencé par : PiscineWeb.cpp, maPiscinev3Web.cpp
 * Référence     : SDFS (carte SD), TimeLib (horodatage), globalPiscineWeb.h
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#include <globalPiscine.h>
#include <globalPiscineWeb.h>
#include <FS.h>                 //this needs to be first, or it all crashes and burns...
#include <SDFS.h>
#include <TimeLib.h>
#include <pgmspace.h>


class LoggerClass {
    public :

        LoggerClass();

        bool initDirs();
        void OnUpdate();

        void logData();                         // // TempEau,TempAir,TempPAC,TempInt,PHVal,RedoxVal,CLVal,PompePH,PompeCL,PompeALG,PP,PAC,Auto
        bool setStartEnd(char *start,char *end);
        size_t fetchDatas(char *buffer, size_t maxLen);
        String getDebugMessage();
        void setDebugMessage(bool onOff);

//        virtual size_t write(const uint8_t character);

        size_t printf(const char * format, ...)  __attribute__ ((format (printf, 2, 3)));
        size_t print(const String &);
        size_t print(const char[]);
        size_t print(char);


        size_t println(const String &s);
        size_t println(const char[]);
        size_t println(unsigned int data); 
        size_t println(void);

    private :

        String logFileName;
        File logFile;
        String logMoyFileName;
        File logMoyFile;
        String alertFileName;
        File alertFile;
        bool printStarted = false;
        uint8_t today=0;        // init to sunday
        int lastMonth=0;
        bool logInited = false;
        time_t tStart, tEnd, tCurr;
        size_t filePointer = 0;

        int16_t TempEauMoy = 0;
        int16_t TempAirMoy = 0;
        int16_t TempPACMoy = 0;
        int16_t TempIntMoy = 0;
        int16_t  PHValMoy = 0;
        int16_t  RedoxValMoy = 0;
        int16_t  CLValMoy = 0;
        int16_t  PompePHMoy = 0;
        int16_t  PompeCLMoy = 0;
        int16_t  PompeALGMoy = 0;
        int16_t  PPMoy = 0;
        int16_t  PACMoy = 0;
        int16_t  AutoMoy = 0;
        int lasthour = 0;
        uint8_t nbEchan = 0;

 
        String debugMessage = "";
        bool triggerDebugMessage = false;

        void logMessage(const char logmessage[]);
        void printDate(char *date,uint8_t length);       
        int calculMoyenne(int16_t valeur);
        void checkSD();                 // reopen SD if card is now present. 
        String getAlertFileName();
        String getLogFileName();
        String getLogFileByDate(time_t date);
};


