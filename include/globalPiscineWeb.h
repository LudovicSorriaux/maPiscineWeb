
#define lowByte(w) ((uint8_t) ((w) & 0xff))
#define highByte(w) ((uint8_t) ((w) >> 8))
#define getint(l,m) ((uint16_t) ((m << 8) | l))


// utils 
    #define ON 1
    #define OFF 0
    #define OUVERT 0
    #define FERME 1

    #define JOUR    0
    #define SEMAINE 1
    #define MENSUEL 2
    #define ANNUEL  3 

    #define TOUS 0
    #define CLAVIER 1
    #define RADIO 2
    #define WEB 3
    #define CONTROLEUR 4

    #define NONE 0
    #define PHp 1
    #define ALG 2
        
// definition des indexes pour telecoms
    #define IND_libre 0       // 
    #define IND_Alerte 1          // alerte value : 0 noAlerts, 1 innondation, 2 plus de ph, 3 plus de cl, 4 plus de alg, 5 1+2, 6 1+3, 7 1+4, 8 1+2+3, 9 1+2+4, 10 1+3+4, 11 1+2+3+4, 12 2+3, 13 2+4, 14 2+3+4, 15 3+4 
    #define IND_TempEau 2         // Temp Eau val
    #define IND_TempAir 3         // Temp Air Val
    #define IND_TempPAC 4         // Temp Eau sortie de PAC
    #define IND_TempInt 5         // Temp Interieur Local
    #define IND_PHVal 6           // PH val
    #define IND_RedoxVal 7        // Redox val
    #define IND_CLVal 8           // CL equiv val
    #define IND_RedoxRef 9
    #define IND_PHRef 10
    #define IND_Lampe 11          // Lampe : on = 1
    #define IND_Volet 12          // Volet : fermé = 1
    #define IND_PompePH 13        // Pompe PH : on = 1
    #define IND_PompeCL 14        // Pompe CL : on = 1
    #define IND_PompeALG 15       // Pompe ALG : on = 1
    #define IND_PP 16             // Pompe Principale : on = 1
    #define IND_PAC 17            // Pompe a chaleur : on = 1
    #define IND_Auto 18           // Mode Automatique : auto = 1
    #define IND_Hibernate 19      // hibernate : on = 1
    #define IND_HumInt 20         // Humidité Interieur Local
    #define IND_SYNC_Clavier 20
    #define IND_TypeTemp 21       // 0=tempRelatif, 1=tempFixe
    #define IND_tFixe 22          // PAC temp Fixe
    #define IND_tVar 23           // PAC temp Variable
    #define IND_InvFlowAlert 24         // 
    #define IND_InvInondationAlert 25   // 
    #define IND_InvNivPHAlert 26        // 
    #define IND_InvNivCLAlert 27        // 
    #define IND_InvNivALGAlert 28       // 
    #define IND_InvPACAlert 29          // 
        #define IND_SYNC_CritVals 29
    #define IND_PlageOnPP 30      // Pompe Principale Plage On 
    #define IND_PlageOffPP 31     // Pompe Principale Plage Off
    #define IND_ALGQuantite 32
    #define IND_ALGFrequence 33   // 1 to 48h then 100= hebdo, 1000 = mensuel
    #define IND_PlageLampe 34     // Lampe Plage On 
    #define IND_PlageOnLampe 35   // Lampe Plage On 
    #define IND_PlageOffLampe 36  // Lampe Plage Off
    #define IND_PlageVolet 37     // Volet Plage On 
    #define IND_PlageOuvVolet 38  // Volet Plage On 
    #define IND_PlageFermVolet 39 // Volet Plage Off
    #define IND_TypePompe3 40     // type pompe 3 : 0=off, 1=PH-, 2=ALG
    #define IND_PlageOnPAC 41     // Pompe a Chaleur Plage On  
    #define IND_PlageOffPAC 42    // Pompe a Chaleur Plage Off 
    #define IND_pacViaRouter 43   // Controle PAC via routeur
        #define IND_SYNC_Web 43
    #define IND_PAC_Present 44
    #define IND_dose_PH 45
    #define IND_dose_CL 46
    #define IND_dose_PHm 47
    #define IND_dose_ALG 48
    #define IND_debitPompe_PH 49
    #define IND_debitPompe_CL 50
    #define IND_debitPompe_ALG 51
    #define IND_ClearAlert 52     // to clear Alerts
    #define IND_volume_piscine 53
    #define IND_Defaults 54
    #define IND_Debug 55
    //        #define IND_MAX_PISCINE 55

        // indexes d'info pas besoin de les stocker

    #define IND_WifiStatus 60
    #define IND_EPOCH 61

    #define IND_Graphiques 62    // type x100 : 0 Jour, 1 Semaine, 2 Mois et unite = duree en H(Jour), J(Sem), S(Mois)  
    #define IND_PAGES 63
    #define IND_PagePrincipale 64
    #define IND_PagePP 65
    #define IND_PagePAC 66
    #define IND_PageCL 67
    #define IND_PagePH 68
    #define IND_PageALG 69
    #define IND_PageLampe 70
    #define IND_PageVolet 71
    #define IND_PageSlider 72
    #define IND_PageWeb 73

    #define IND_RefreshCriticalValues 80
    #define IND_Clavier 81
    #define IND_BlinkWifiLed 82

