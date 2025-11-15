/*******************************************************************************
 * @file    controlerTelecomDefs.h
 * @brief   Définitions index Blynk (LEGACY - non utilisé)
 * @details Ancien mapping des Virtual Pins Blynk (V0-V99) vers fonctions piscine.
 *          Code legacy conservé pour référence historique.
 *          Version actuelle utilise API REST au lieu de Blynk.
 * 
 * Usage   : [LEGACY] Mapping Blynk Virtual Pins (inactif)
 * Référencé par : Aucun (code désactivé)
 * Référence     : Blynk library (legacy)
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

// ------------- Indexes pour Blink -----------------

    #define PompeCLLed  V0   // = v32
    #define PHVal  V1         
    #define CLVal  V2         
    #define LampeSW  V3
    #define VoletSW  V4       
    #define LampeLed  V5     // = v53 
    #define VoletLed  V6     // = v54
    #define PPLed  V7        // = v28 
    #define PACLed  V8       // = v29
    #define PompePHLed  V9   // = v15
    #define TempEau  V10     
    #define TempAir  V11
    #define AutoLed  V12        // = v30, v59
    #define HibernateLed  V13   // = v60
    #define PlagePP  V14
    #define PompePHLed2  V15    // = v9, v57
    #define TempFixe  V16
    #define TempRel  V17
    #define PPSW  V18       
    #define PACSW  V19      
    #define PompePHSW  V20
    #define PompeCLSW  V21
    #define PHRef  V22
    #define redoxRef  V23
    #define Pompe3SW  V24
    #define Frequence  V25
    #define Pompe3Type  V26
    #define Quantite  V27
    #define PPLed2  V28      // = v7, v55
    #define PACLed2  V29     // = v8, v56
    #define AutoLed2  V30    // = v12, v59
    #define LCD  V31
    #define PompeCLLed2  V32      // = v0, v58
    #define PompeALGLed  V33      
    #define TypeTemp  V34 
    #define TempInt V35  
    #define TempPAC V36  
    #define LampeSW2  V37
    #define LampeAutoSW  V38
    #define PlageLampe V39  
    #define VoletSW2  V40
    #define VoletAutoSW  V41
    #define PlageVolet V42  
    #define Refresh V43  
    #define LcdEtalonage V44  
    #define EtalonPHSW V45  
    #define EtalonPHType V46  
    #define EtalonRedoxSW V47  
    #define EtalonRedoxType V48  
    #define TempEauHist V49        // for history
    #define TempAirHist V50        // for history
    #define PHVal3 V51              // for history
    #define CLVal3 V52              // for history
    #define LampeLed3  V53     // = v5
    #define VoletLed3  V54     // = v6
    #define PPLed3  V55        // = v28, v7 
    #define PACLed3  V56       // = v29, v8
    #define PompePHLed3  V57   // = v15, v9
    #define PompeCLLed3  V58   // = v32, v0
    #define AutoLed3  V59      // = v12, v30      
    #define HibernateLed3  V60 // = v13
    #define ClearAlertSW  V61  
    #define InvFlowAlertSW  V62  
    #define InvInondationAlertSW  V63  
    #define InvNivPHAlertSW  V64  
    #define InvNivCLAlertSW  V65  
    #define InvNivALGAlertSW  V66  
    #define InvPmpCLAutoSW  V67  
    #define InvPmpPHAutoSW  V68  
    #define InvPmpALGAutoSW V69  
    #define ForcePPSW V70
    #define TerminalBlynk V71
    #define ModeManuSW V72
    
// ------------- ALL Blynk widgets -----------------

  WidgetLCD lcd(LCD);
  WidgetLCD lcdEtalon(LcdEtalonage);
    
  WidgetLED LmpLed(LampeLed);
  WidgetLED LmpLed3(LampeLed3);
  WidgetLED VolLed(VoletLed);
  WidgetLED VolLed3(VoletLed3);
  WidgetLED PmpPrinLed(PPLed);
  WidgetLED PmpPrinLed2(PPLed2);
  WidgetLED PmpPrinLed3(PPLed3);
  WidgetLED PmpAChaleurLed(PACLed);
  WidgetLED PmpAChaleurLed2(PACLed2);
  WidgetLED PmpAChaleurLed3(PACLed3);
  WidgetLED PmpCLLed(PompeCLLed);
  WidgetLED PmpCLLed2(PompeCLLed2);
  WidgetLED PmpCLLed3(PompeCLLed3);
  WidgetLED PmpPHLed(PompePHLed);
  WidgetLED PmpPHLed2(PompePHLed2);
  WidgetLED PmpPHLed3(PompePHLed3);
  WidgetLED PmpALGLed(PompeALGLed);
  WidgetLED ModeAutoLed(AutoLed);
  WidgetLED ModeAutoLed2(AutoLed2);
  WidgetLED ModeAutoLed3(AutoLed3);
  WidgetLED ModeHibernateLed(HibernateLed);
  WidgetLED ModeHibernateLed3(HibernateLed3);

  WidgetTerminal terminalBlynk(TerminalBlynk);
