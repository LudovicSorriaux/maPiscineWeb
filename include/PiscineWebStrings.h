/*******************************************************************************
 * @file    PiscineWebStrings.h
 * @brief   Chaînes de caractères constantes en PROGMEM (optimisation RAM)
 * @details Toutes les String littérales utilisées dans PiscineWeb.cpp sont
 *          stockées en mémoire Flash (PROGMEM) au lieu de RAM pour économiser
 *          ~1-2 KB de RAM sur ESP8266.
 * 
 * @author  Ludovic Sorriaux
 * @date    Février 2026
 *******************************************************************************/

#ifndef PISCINE_WEB_STRINGS_H
#define PISCINE_WEB_STRINGS_H

#include <Arduino.h>

// Messages d'interface LCD
const char STR_MODE_AUTO[] PROGMEM = "Mode Automatique";
const char STR_MODE_MANUEL[] PROGMEM = "Mode Manuel";
const char STR_PP_FOR[] PROGMEM = " PP for ";
const char STR_PH_MINUS_FOR[] PROGMEM = ", PH- for ";
const char STR_PH_PLUS_FOR[] PROGMEM = ", PH+ for ";
const char STR_CL_FOR[] PROGMEM = ", CL for ";

// Messages JSON - Statuts
const char STR_LOG_IN_SUCCESS[] PROGMEM = "Log in Successful";
const char STR_LOG_IN_FAILED[] PROGMEM = "Log in Failed";
const char STR_AUTO_LOGIN_LOCAL[] PROGMEM = "Auto Login Local";
const char STR_AUTH_REQUIRED[] PROGMEM = "Authentication Required";
const char STR_USER_ALREADY_EXIST[] PROGMEM = "User Already Exist";
const char STR_NEW_USER_CREATED[] PROGMEM = "New User Created Succesfully";
const char STR_NO_ROOM_USER[] PROGMEM = "No room for new user";
const char STR_BAD_ADMIN_PW[] PROGMEM = "Bad Admin Password";
const char STR_ADMIN_PW_UPDATED[] PROGMEM = "Admin Password Updated";
const char STR_USER_PROFILE_UPDATED[] PROGMEM = "User Profile Updated";
const char STR_USER_PROFILE_NOT_UPDATED[] PROGMEM = "User Profile not Updated";
const char STR_USER_LIST[] PROGMEM = "User List";
const char STR_USERS_DELETED[] PROGMEM = "User(s) Deleted";
const char STR_NO_USERS_TO_DELETE[] PROGMEM = "No User(s) to Delete";

// Messages JSON - Messages utilisateur
const char STR_WELCOME[] PROGMEM = "Welcome, ";
const char STR_WELCOME_TO[] PROGMEM = "Welcome to ";
const char STR_IN_APP[] PROGMEM = " in the app !";
const char STR_WRONG_CREDENTIALS[] PROGMEM = "Wrong username/password! try again.";
const char STR_USER_ALREADY_MSG[] PROGMEM = "User already exist,updated with new password.";
const char STR_NO_ROOM_MSG[] PROGMEM = "There is no room for a new user, use an existing one !";
const char STR_BAD_ADMIN_MSG[] PROGMEM = "You entered an invalid admin password, please try again !";
const char STR_ADMIN_PW_SUCCESS_MSG[] PROGMEM = "Succesfully updated the admin passord !";
const char STR_USER_PROFILE_MSG[] PROGMEM = "User profile updated";
const char STR_USER_NOT_FOUND_MSG[] PROGMEM = "Can not find existing user, logoff and try again !";
const char STR_USER_CREATED_MSG[] PROGMEM = " created successfully";
const char STR_USERS_DELETED_MSG[] PROGMEM = "User(s) Deleted in the config file";
const char STR_NO_USER_DELETE_MSG[] PROGMEM = "Can not find existing user to delete !";
const char STR_BIENVENUE_LOCAL[] PROGMEM = "Bienvenue (connexion locale automatique)";
const char STR_AUTH_REQUISE[] PROGMEM = "Authentification requise";

// Messages d'erreur HTTP
const char STR_INVALID_REQUEST[] PROGMEM = "400: Invalid Request";
const char STR_INVALID_SESSION[] PROGMEM = "400: Invalid Session";

// Noms de clés JSON
const char STR_JSON_STATUS[] PROGMEM = "status";
const char STR_JSON_USERNAME[] PROGMEM = "username";
const char STR_JSON_PASSWORD[] PROGMEM = "password";
const char STR_JSON_MESSAGE[] PROGMEM = "message";
const char STR_JSON_SESSIONID[] PROGMEM = "sessionID";
const char STR_JSON_TTL[] PROGMEM = "ttl";
const char STR_JSON_ISLOCAL[] PROGMEM = "isLocal";
const char STR_JSON_AUTOLOGIN[] PROGMEM = "autoLogin";
const char STR_JSON_FLGLOGIN[] PROGMEM = "flgLogin";
const char STR_JSON_USERS[] PROGMEM = "users";

// Logs de diagnostic
const char STR_LOG_LOCAL_CLIENT[] PROGMEM = "Client local détecté : TTL = 1 an (IP: %s)\n";
const char STR_LOG_LOCAL_30D[] PROGMEM = "Client local : TTL = 30 jours";
const char STR_LOG_DISTANT_KEEP[] PROGMEM = "Client distant avec keepAlive : TTL = 1 jour";
const char STR_LOG_DISTANT_1H[] PROGMEM = "Client distant : TTL = 1 heure";
const char STR_LOG_SUCCESS[] PROGMEM = "Log in Successful";
const char STR_LOG_FAILED[] PROGMEM = "Log in Failed";
const char STR_LOG_AUTO_LOCAL[] PROGMEM = "Auto-login local : IP=%s, TTL=1 an\n";
const char STR_LOG_AUTH_REQ[] PROGMEM = "Authentification requise : IP=%s, Local=%s, Config=%s\n";
const char STR_LOG_ADMIN_UPDATED[] PROGMEM = "Admin Password Updated";
const char STR_LOG_BAD_ADMIN[] PROGMEM = "Bad AdminPassword";
const char STR_LOG_USER_UPDATED[] PROGMEM = "User profile updated";
const char STR_LOG_USER_NOT_FOUND[] PROGMEM = "User not found so can't update";
const char STR_LOG_USER_EXIST[] PROGMEM = "User already Exist,updated with new password";
const char STR_LOG_USER_CREATED[] PROGMEM = "New User Created Succesfully";
const char STR_LOG_NO_ROOM[] PROGMEM = "No room for new user";
const char STR_LOG_USER_DELETED[] PROGMEM = "User(s) deleted";
const char STR_LOG_NO_DELETE[] PROGMEM = "Can not find existing user to delete !";

// Headers HTTP
const char STR_HEADER_CACHE[] PROGMEM = "Cache-Control";
const char STR_HEADER_NOCACHE[] PROGMEM = "no-cache";
const char STR_HEADER_CORS[] PROGMEM = "Access-Control-Allow-Origin";
const char STR_HEADER_CORS_ALL[] PROGMEM = "*";

// Content types
const char STR_CONTENT_PLAIN[] PROGMEM = "text/plain";
const char STR_CONTENT_JSON[] PROGMEM = "application/json";

// Valeurs diverses
const char STR_LOCAL_USER[] PROGMEM = "local_user";
const char STR_TRUE[] PROGMEM = "true";
const char STR_FALSE[] PROGMEM = "false";
const char STR_ENABLED[] PROGMEM = "enabled";
const char STR_DISABLED[] PROGMEM = "disabled";

// Messages de diagnostic
const char STR_OK_INIT_PP[] PROGMEM = "OK initPiscinePPParams done";
const char STR_OK_INIT_PARAMS[] PROGMEM = "OK initPiscinePParamParams done";
const char STR_OK_SET_PARAMS[] PROGMEM = "OK setPiscineParams done";
const char STR_OK_INIT_MAINTENANCE[] PROGMEM = "OK InitPiscinePageMaintenance done";

#endif // PISCINE_WEB_STRINGS_H
