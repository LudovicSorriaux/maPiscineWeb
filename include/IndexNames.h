/*******************************************************************************
 * @file    IndexNames.h
 * @brief   Noms des index de paramètres piscine en PROGMEM (optimisation RAM)
 * @details Table de 84 noms de paramètres (15 chars max) stockée en Flash
 *          au lieu de RAM pour économiser ~1260 octets.
 * 
 * @author  Ludovic Sorriaux
 * @date    Février 2026
 *******************************************************************************/

#ifndef INDEX_NAMES_H
#define INDEX_NAMES_H

#include <Arduino.h>
#include <globalPiscineWeb.h>

// Optimisation RAM #6 : Table indexName en PROGMEM (84 × 15 = 1260 octets économisés)
const char INDEX_NAME_0[] PROGMEM = "";                    // 0 - libre
const char INDEX_NAME_1[] PROGMEM = "Alerte";              // 1
const char INDEX_NAME_2[] PROGMEM = "tempEau";             // 2
const char INDEX_NAME_3[] PROGMEM = "tempAir";             // 3
const char INDEX_NAME_4[] PROGMEM = "tempPAC";             // 4
const char INDEX_NAME_5[] PROGMEM = "tempInt";             // 5
const char INDEX_NAME_6[] PROGMEM = "phVal";               // 6
const char INDEX_NAME_7[] PROGMEM = "redoxVal";            // 7
const char INDEX_NAME_8[] PROGMEM = "clVal";               // 8
const char INDEX_NAME_9[] PROGMEM = "redoxRef";            // 9
const char INDEX_NAME_10[] PROGMEM = "phRef";              // 10
const char INDEX_NAME_11[] PROGMEM = "lampe";              // 11
const char INDEX_NAME_12[] PROGMEM = "volet";              // 12
const char INDEX_NAME_13[] PROGMEM = "PH";                 // 13
const char INDEX_NAME_14[] PROGMEM = "CL";                 // 14
const char INDEX_NAME_15[] PROGMEM = "P3";                 // 15
const char INDEX_NAME_16[] PROGMEM = "PP";                 // 16
const char INDEX_NAME_17[] PROGMEM = "PAC";                // 17
const char INDEX_NAME_18[] PROGMEM = "autoMode";           // 18
const char INDEX_NAME_19[] PROGMEM = "Hibernate";          // 19
const char INDEX_NAME_20[] PROGMEM = "HumInt";             // 20
const char INDEX_NAME_21[] PROGMEM = "typeTemp";           // 21
const char INDEX_NAME_22[] PROGMEM = "tempFix";            // 22
const char INDEX_NAME_23[] PROGMEM = "tempRel";            // 23
const char INDEX_NAME_24[] PROGMEM = "flowAlert";          // 24
const char INDEX_NAME_25[] PROGMEM = "innondAlert";        // 25
const char INDEX_NAME_26[] PROGMEM = "nivPH";              // 26
const char INDEX_NAME_27[] PROGMEM = "nivCL";              // 27
const char INDEX_NAME_28[] PROGMEM = "nivALG";             // 28
const char INDEX_NAME_29[] PROGMEM = "pacAlert";           // 29
const char INDEX_NAME_30[] PROGMEM = "strtTPP";            // 30
const char INDEX_NAME_31[] PROGMEM = "stopTPP";            // 31
const char INDEX_NAME_32[] PROGMEM = "p3Qty";              // 32
const char INDEX_NAME_33[] PROGMEM = "p3Frq";              // 33
const char INDEX_NAME_34[] PROGMEM = "lampeAuto";          // 34
const char INDEX_NAME_35[] PROGMEM = "strtLampe";          // 35
const char INDEX_NAME_36[] PROGMEM = "stopLampe";          // 36
const char INDEX_NAME_37[] PROGMEM = "voletAuto";          // 37
const char INDEX_NAME_38[] PROGMEM = "ouvVolet";           // 38
const char INDEX_NAME_39[] PROGMEM = "fermeVolet";         // 39
const char INDEX_NAME_40[] PROGMEM = "typeP3";             // 40
const char INDEX_NAME_41[] PROGMEM = "strtTPAC";           // 41
const char INDEX_NAME_42[] PROGMEM = "stopTPAC";           // 42
const char INDEX_NAME_43[] PROGMEM = "PacViaRouter";       // 43
const char INDEX_NAME_44[] PROGMEM = "PAC_Present";        // 44
const char INDEX_NAME_45[] PROGMEM = "dose_PH";            // 45
const char INDEX_NAME_46[] PROGMEM = "dose_CL";            // 46
const char INDEX_NAME_47[] PROGMEM = "dose_PHm";           // 47
const char INDEX_NAME_48[] PROGMEM = "dose_ALG";           // 48
const char INDEX_NAME_49[] PROGMEM = "debitPompe_PH";      // 49
const char INDEX_NAME_50[] PROGMEM = "debitPompe_CL";      // 50
const char INDEX_NAME_51[] PROGMEM = "debitPompe_ALG";     // 51
const char INDEX_NAME_52[] PROGMEM = "ClearAlert";         // 52
const char INDEX_NAME_53[] PROGMEM = "volumePiscine";      // 53
const char INDEX_NAME_54[] PROGMEM = "Set Defaults";       // 54
const char INDEX_NAME_55[] PROGMEM = "Set Debug";          // 55
const char INDEX_NAME_56[] PROGMEM = "";                   // 56
const char INDEX_NAME_57[] PROGMEM = "";                   // 57
const char INDEX_NAME_58[] PROGMEM = "";                   // 58
const char INDEX_NAME_59[] PROGMEM = "";                   // 59
const char INDEX_NAME_60[] PROGMEM = "WifiStatus";         // 60
const char INDEX_NAME_61[] PROGMEM = "EPOCH";              // 61
const char INDEX_NAME_62[] PROGMEM = "Graphiques";         // 62
const char INDEX_NAME_63[] PROGMEM = "PAGES";              // 63
const char INDEX_NAME_64[] PROGMEM = "PagePrincipale";     // 64
const char INDEX_NAME_65[] PROGMEM = "PagePP";             // 65
const char INDEX_NAME_66[] PROGMEM = "PagePAC";            // 66
const char INDEX_NAME_67[] PROGMEM = "PageCL";             // 67
const char INDEX_NAME_68[] PROGMEM = "PagePH";             // 68
const char INDEX_NAME_69[] PROGMEM = "PageALG";            // 69
const char INDEX_NAME_70[] PROGMEM = "PageLampe";          // 70
const char INDEX_NAME_71[] PROGMEM = "PageVolet";          // 71
const char INDEX_NAME_72[] PROGMEM = "PageSlider";         // 72
const char INDEX_NAME_73[] PROGMEM = "PageWeb";            // 73
const char INDEX_NAME_74[] PROGMEM = "";                   // 74
const char INDEX_NAME_75[] PROGMEM = "";                   // 75
const char INDEX_NAME_76[] PROGMEM = "";                   // 76
const char INDEX_NAME_77[] PROGMEM = "";                   // 77
const char INDEX_NAME_78[] PROGMEM = "";                   // 78
const char INDEX_NAME_79[] PROGMEM = "";                   // 79
const char INDEX_NAME_80[] PROGMEM = "RefreshCritVal";     // 80
const char INDEX_NAME_81[] PROGMEM = "Clavier";            // 81
const char INDEX_NAME_82[] PROGMEM = "BlinkWifiLed";       // 82
const char INDEX_NAME_83[] PROGMEM = "";                   // 83

// Table de pointeurs vers les chaînes PROGMEM
const char* const INDEX_NAMES_PROGMEM[] PROGMEM = {
    INDEX_NAME_0, INDEX_NAME_1, INDEX_NAME_2, INDEX_NAME_3, INDEX_NAME_4,
    INDEX_NAME_5, INDEX_NAME_6, INDEX_NAME_7, INDEX_NAME_8, INDEX_NAME_9,
    INDEX_NAME_10, INDEX_NAME_11, INDEX_NAME_12, INDEX_NAME_13, INDEX_NAME_14,
    INDEX_NAME_15, INDEX_NAME_16, INDEX_NAME_17, INDEX_NAME_18, INDEX_NAME_19,
    INDEX_NAME_20, INDEX_NAME_21, INDEX_NAME_22, INDEX_NAME_23, INDEX_NAME_24,
    INDEX_NAME_25, INDEX_NAME_26, INDEX_NAME_27, INDEX_NAME_28, INDEX_NAME_29,
    INDEX_NAME_30, INDEX_NAME_31, INDEX_NAME_32, INDEX_NAME_33, INDEX_NAME_34,
    INDEX_NAME_35, INDEX_NAME_36, INDEX_NAME_37, INDEX_NAME_38, INDEX_NAME_39,
    INDEX_NAME_40, INDEX_NAME_41, INDEX_NAME_42, INDEX_NAME_43, INDEX_NAME_44,
    INDEX_NAME_45, INDEX_NAME_46, INDEX_NAME_47, INDEX_NAME_48, INDEX_NAME_49,
    INDEX_NAME_50, INDEX_NAME_51, INDEX_NAME_52, INDEX_NAME_53, INDEX_NAME_54,
    INDEX_NAME_55, INDEX_NAME_56, INDEX_NAME_57, INDEX_NAME_58, INDEX_NAME_59,
    INDEX_NAME_60, INDEX_NAME_61, INDEX_NAME_62, INDEX_NAME_63, INDEX_NAME_64,
    INDEX_NAME_65, INDEX_NAME_66, INDEX_NAME_67, INDEX_NAME_68, INDEX_NAME_69,
    INDEX_NAME_70, INDEX_NAME_71, INDEX_NAME_72, INDEX_NAME_73, INDEX_NAME_74,
    INDEX_NAME_75, INDEX_NAME_76, INDEX_NAME_77, INDEX_NAME_78, INDEX_NAME_79,
    INDEX_NAME_80, INDEX_NAME_81, INDEX_NAME_82, INDEX_NAME_83
};

/**
 * @brief Récupère un nom d'index depuis PROGMEM
 * @param index Index du paramètre (0-83)
 * @param buffer Buffer destination (min MAX_KEY_LEN octets)
 * @return Pointeur vers buffer pour chaînage
 * 
 * Utilisation:
 *   char name[MAX_KEY_LEN];
 *   getIndexName(IND_PHVal, name);
 *   jsonRoot[name] = value;
 */
inline char* getIndexName(uint8_t index, char* buffer) {
    if (index > IND_TOTAL) {
        buffer[0] = '\0';
        return buffer;
    }
    strcpy_P(buffer, (char*)pgm_read_ptr(&INDEX_NAMES_PROGMEM[index]));
    return buffer;
}

/**
 * @brief Variante retournant directement le pointeur PROGMEM (pour usage immédiat)
 * @param index Index du paramètre (0-83)
 * @return const __FlashStringHelper* pour utilisation avec F() macros
 * 
 * Utilisation:
 *   jsonRoot[getIndexNameF(IND_PHVal)] = value;
 */
inline const __FlashStringHelper* getIndexNameF(uint8_t index) {
    if (index > IND_TOTAL) return F("");
    return (const __FlashStringHelper*)pgm_read_ptr(&INDEX_NAMES_PROGMEM[index]);
}

#endif // INDEX_NAMES_H
