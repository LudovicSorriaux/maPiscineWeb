
BLYNK_CONNECTED() {
    Logger.println(F("Blynk connected, start sync"));
    ActionControler.setStartupApp();
    blynkMgr.needToSync = true;
}

// auto refresh web app
BLYNK_READ(Refresh){
  blynkMgr.ManageLcd();
  ActionControler.refreshData();
}


// When App button 
BLYNK_WRITE(LampeSW) {
  ActionControler.doLampe(param.asInt()); 
}

BLYNK_WRITE(LampeSW2) {
  ActionControler.doLampe(param.asInt()); 
}

BLYNK_WRITE(LampeAutoSW) {
  ActionControler.doLampeAuto(param.asInt()); 
}

BLYNK_WRITE(PlageLampe) {
  TimeInputParam t(param);

  ActionControler.doChangePlageLampeOn(t.getStartHour()); 
  ActionControler.doChangePlageLampeOff(t.getStopHour()); 
}

BLYNK_WRITE(VoletSW) {
  ActionControler.doVolet(param.asInt()); 
}

BLYNK_WRITE(VoletSW2) {
  ActionControler.doVolet(param.asInt()); 
}

BLYNK_WRITE(VoletAutoSW) {
  ActionControler.doVoletAuto(param.asInt()); 
}

BLYNK_WRITE(PlageVolet) {
  TimeInputParam t(param);

  ActionControler.doChangePlageVoletFerme(t.getStartHour()); 
  ActionControler.doChangePlageVoletOuvert(t.getStopHour()); 
}

BLYNK_WRITE(ModeManuSW) {
  ActionControler.doModeManu(param.asInt()); 
}

BLYNK_WRITE(PPSW) {
  ActionControler.doManuPP(param.asInt()); 
}

BLYNK_WRITE(ForcePPSW) {
  ActionControler.doForcePP(param.asInt()); 
}

BLYNK_WRITE(PlagePP) {
  TimeInputParam t(param);

  ActionControler.doChangePlageOn(t.getStartHour()); 
  ActionControler.doChangePlageOff(t.getStopHour()); 
}

BLYNK_WRITE(PACSW) {
  ActionControler.doForcePAC(param.asInt()); 
}

BLYNK_WRITE(PompePHSW) {
  ActionControler.doForcePH(param.asInt()); 
}

BLYNK_WRITE(PompeCLSW) {
  ActionControler.doForceCL(param.asInt()); 
}

BLYNK_WRITE(ClearAlertSW) {
  ActionControler.doClearAlerts(param.asInt()); 
}

BLYNK_WRITE(InvFlowAlertSW) {
  ActionControler.doInvalidAlerts(1,param.asInt()); 
}

BLYNK_WRITE(InvInondationAlertSW) {
  ActionControler.doInvalidAlerts(2,param.asInt()); 
}

BLYNK_WRITE(InvNivPHAlertSW) {
  ActionControler.doInvalidAlerts(3,param.asInt()); 
}

BLYNK_WRITE(InvNivCLAlertSW) {
  ActionControler.doInvalidAlerts(4,param.asInt()); 
}

BLYNK_WRITE(InvNivALGAlertSW) {
  ActionControler.doInvalidAlerts(5,param.asInt()); 
}

BLYNK_WRITE(InvPmpPHAutoSW) {
  ActionControler.doInvalidPompes(1,param.asInt()); 
}

BLYNK_WRITE(InvPmpCLAutoSW) {
  ActionControler.doInvalidPompes(2,param.asInt()); 
}

BLYNK_WRITE(InvPmpALGAutoSW) {
  ActionControler.doInvalidPompes(3,param.asInt()); 
}

// When App sliders or text vals

BLYNK_WRITE(TempFixe) {
  ActionControler.doChangePACTemp(1, param.asInt()*100);    // 1: Temp fixe, -1: TempRel
}
BLYNK_WRITE(TempRel) {
  ActionControler.doChangePACTemp(-1, map(param.asInt(),0,1023,-10,10) );
}
BLYNK_WRITE(TypeTemp) {
  int16_t typeTemp;
    
  if( param.asInt() == 1) {
    typeTemp = valeurParametres[IND_TypeTemp];
    typeTemp++;
    if (typeTemp > 1) typeTemp = 0;
    switch(typeTemp) {
      case 1 : 
          Blynk.setProperty(TypeTemp, "offLabel", "Relatif");  
        break;  
      case 0 : 
          Blynk.setProperty(TypeTemp, "offLabel", "Fixe");  
        break;  
    }
      ActionControler.doChangeTypeTemp(typeTemp);   
  }  

}
BLYNK_WRITE(PHRef) {
  ActionControler.doChangePHRef(param.asInt()); 
}
BLYNK_WRITE(redoxRef) {
  ActionControler.doChangeredoxRef(param.asInt()); 
}
BLYNK_WRITE(Pompe3SW) {
  ActionControler.doForceALG(param.asInt()); 
}
BLYNK_WRITE(Frequence) {
  int val = map(param.asInt(),0,1023,1,24);
  ActionControler.doChangeALGFreq(val); 
}
BLYNK_WRITE(Quantite) {
  int val = param.asInt();
  if(val < 15) {
    val=10;
  } else if (val<25) {
    val = 20;
  } else if (val<35) {
    val = 30;
  } else if (val<45) {
    val = 40;
  } else if (val<75) {
    val = 50;
  } else if (val< 150) {
    val = 100;
  } else if (val< 250) {
    val = 200;
  } else if (val< 350) {
    val = 300;
  } else if (val< 450) {
    val = 400;
  } else if (val< 750) {
    val = 500;
  } else {
    val = 1000;
  }
  ActionControler.doChangeALGQuantite(val); 
}

BLYNK_WRITE(Pompe3Type) {
  int16_t typeP3;
    
  if( param.asInt() == 1) {
    typeP3 = valeurParametres[IND_TypePompe3];
    typeP3++;
    if (typeP3 > 2) typeP3 = 0;
    switch(typeP3) {
      case 1 : 
          Blynk.setProperty(Pompe3Type, "offLabel", "PH -");  
        break;  
      case 2 : 
          Blynk.setProperty(Pompe3Type, "offLabel", "Other");  
        break;  
      case 0 : 
          Blynk.setProperty(Pompe3Type, "offLabel", "Off");  
        break;  
    }
    ActionControler.doChangeTypePompe3(typeP3);  
  }  
}

BLYNK_WRITE(EtalonPHSW) {
  if(param.asInt() == 1) {
    lcdEtalon.clear();
    lcdEtalon.print(0,0,"Mode Etalon. PH ");
    lcdEtalon.print(0,1,"Choisir PH et OK");
    blynkMgr.modeEtalonPH = true;
  } else {
    lcdEtalon.clear();
    lcdEtalon.print(2,0,"Controle");
    lcdEtalon.print(5,1,"Etalonage");
    Blynk.setProperty(EtalonPHType, "offLabel", " ");  
    blynkMgr.modeEtalonPH = false;
  }
  ActionControler.doChangePHEtalon(param.asInt()); 
}

BLYNK_WRITE(EtalonPHType) {
  int16_t typePH;
    
  if( (param.asInt() == 1) && (blynkMgr.modeEtalonPH) ) {
    typePH = valeurParametres[IND_TypePHEtalon];
    typePH++;
    if (typePH > 4) typePH = 0;
    switch(typePH) {
      case 1 : 
          lcdEtalon.print(0,1,"PH 4: OK=Mesure ");
          Blynk.setProperty(EtalonPHType, "offLabel", "PH 4"); 
          valeurParametres[IND_TypePHEtalon] = 1; 
        break;  
      case 2 : 
          lcdEtalon.print(0,1,"PH 7: OK=Mesure ");
          Blynk.setProperty(EtalonPHType, "offLabel", "PH 7");  
          valeurParametres[IND_TypePHEtalon] = 2;
        break;  
      case 3 : 
          lcdEtalon.print(0,1,"PH 9: OK=Mesure ");
          Blynk.setProperty(EtalonPHType, "offLabel", "PH 9");  
          valeurParametres[IND_TypePHEtalon] = 3;
        break;  
      case 4 : 
          lcdEtalon.print(0,1,"Reset : OK=Valid ");
          Blynk.setProperty(EtalonPHType, "offLabel", "Reset");  
          valeurParametres[IND_TypePHEtalon] = 4;
        break;  
      case 0 : 
          lcdEtalon.print(0,1,"Annul: OK=Cancel");
          Blynk.setProperty(EtalonPHType, "offLabel", "Cancel"); 
          valeurParametres[IND_TypePHEtalon] = 0; 
        break;  
    }
    ActionControler.doChangeTypePHEtalon(typePH); 
  }
}

BLYNK_WRITE(EtalonRedoxSW) {
  if(param.asInt() == 1) {
    lcdEtalon.clear();
    lcdEtalon.print(0,0,"Mode Etalon. CL ");
    lcdEtalon.print(0,1,"Choisir CL et OK");
    blynkMgr.modeEtalonCL = true;
  } else {
    lcdEtalon.clear();
    lcdEtalon.print(2,0,"Controle");
    lcdEtalon.print(5,1,"Etalonage");
    Blynk.setProperty(EtalonRedoxType, "offLabel", " ");  
    blynkMgr.modeEtalonCL = false;
  }
  ActionControler.doChangeCLEtalon(param.asInt()); 
}

BLYNK_WRITE(EtalonRedoxType) {
  int16_t typeCL;
    
  if( (param.asInt() == 1) && (blynkMgr.modeEtalonCL) ) {
    typeCL = valeurParametres[IND_TypeCLEtalon];
    typeCL++;
    if (typeCL > 3) typeCL = 0;
    switch(typeCL) {
      case 1 : 
          lcdEtalon.print(0,1,"650mv: OK=Mesure");
          Blynk.setProperty(EtalonRedoxType, "offLabel", "650mv");  
          valeurParametres[IND_TypeCLEtalon] = 1;
        break;  
      case 2 : 
          lcdEtalon.print(0,1,"468mv: OK=Mesure");
          Blynk.setProperty(EtalonRedoxType, "offLabel", "468mv");  
          valeurParametres[IND_TypeCLEtalon] = 2;
        break;  
      case 3 : 
          lcdEtalon.print(0,1,"Reset : OK=Valid ");
          Blynk.setProperty(EtalonRedoxType, "offLabel", "Reset");  
          valeurParametres[IND_TypeCLEtalon] = 3;
        break;  
      case 0 : 
          lcdEtalon.print(0,1,"Annul: OK=Valid ");
          Blynk.setProperty(EtalonRedoxType, "offLabel", "Cancel");  
          valeurParametres[IND_TypeCLEtalon] = 0;
        break;  
    }
    ActionControler.doChangeTypeCLEtalon(typeCL); 
  }
}
