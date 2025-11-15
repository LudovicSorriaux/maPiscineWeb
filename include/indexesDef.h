/*******************************************************************************
 * @file    indexesDef.h
 * @brief   Définitions chaînes PROGMEM pour labels des index
 * @details Table de correspondance index → labels (Alertes, temp Eau, PH val, etc.)
 *          Stocké en PROGMEM pour économiser RAM. Utilisé pour affichage web.
 * 
 * Usage   : Affichage noms paramètres dans interface web
 * Référencé par : PiscineWeb.cpp, interface HTML/JS
 * Référence     : pgmspace.h (PROGMEM)
 * 
 * @author  Ludovic Sorriaux
 * @date    2024
 *******************************************************************************/

#if (defined(__AVR__))
#include <avr\pgmspace.h>
#else
#include <pgmspace.h>
#endif

const char ind0[] PROGMEM = "";
const char ind1[] PROGMEM = "Alertes";
const char ind2[] PROGMEM = "temp Eau";
const char ind3[] PROGMEM = "temp Air";
const char ind4[] PROGMEM = "PH val";
const char ind5[] PROGMEM = "cl val";
const char ind6[] PROGMEM = "lampe";
const char ind7[] PROGMEM = "volet";
const char ind8[] PROGMEM = "pompe ph";
const char ind9[] PROGMEM = "pompe cl";
const char ind10[] PROGMEM = "pompe alg";
const char ind11[] PROGMEM = "pac";
const char ind12[] PROGMEM = "pp";
const char ind13[] PROGMEM = "mode auto";
const char ind14[] PROGMEM = "plage pp on";
const char ind15[] PROGMEM = "plage pp off";
const char ind16[] PROGMEM = "tempFixe";
const char ind17[] PROGMEM = "tempVariable";
const char ind18[] PROGMEM = "redoxRef";
const char ind19[] PROGMEM = "PHRef";
const char ind20[] PROGMEM = "ALGQuantite";
const char ind21[] PROGMEM = "ALGFrequence";
const char ind22[] PROGMEM = "mode hivernage";
const char ind23[] PROGMEM = "lampeAuto";
const char ind24[] PROGMEM = "plage lampe on";
const char ind25[] PROGMEM = "plage lampe off";
const char ind26[] PROGMEM = "voletAuto";
const char ind27[] PROGMEM = "plage volet ouvert";
const char ind28[] PROGMEM = "plage volet ferme";
const char ind29[] PROGMEM = "Type Pompe3";
const char ind30[] PROGMEM = "Type Temp";
const char ind31[] PROGMEM = "ChagePHEtalon";
const char ind32[] PROGMEM = "TypePHEtalon";
const char ind33[] PROGMEM = "ChangeCLEtalon";
const char ind34[] PROGMEM = "TypeCLEtalon";
const char ind35[] PROGMEM = "temp PAC";
const char ind36[] PROGMEM = "temp Int";
const char ind37[] PROGMEM = "Humid Int";
const char ind38[] PROGMEM = "InvFlowAlert";
const char ind39[] PROGMEM = "InvInondationAlert";
const char ind40[] PROGMEM = "InvNivPHAlert";
const char ind41[] PROGMEM = "InvNivCLAlert";
const char ind42[] PROGMEM = "InvNivALGAlert";
const char ind43[] PROGMEM = "IND_InvPACAlert";
const char* const nomParam[] PROGMEM = {ind0, ind1, ind2, ind3, ind4, ind5, ind6, ind7, ind8, ind9, ind10, ind11, ind12, ind13, ind14, ind15, ind16, ind17, ind18, ind19, ind20, ind21, ind22, ind23, ind24, ind25, ind26, ind27, ind28, ind29, ind30, ind31, ind32, ind33, ind34, ind35, ind36, ind37, ind38, ind39, ind40, ind41, ind42, ind43};
