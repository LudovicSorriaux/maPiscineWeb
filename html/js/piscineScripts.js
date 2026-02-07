
// Global functions and variables
console.log("📌 piscineScripts.js VERSION 2026-02-07-19:45 loaded");

var maPiscine = maPiscine || {};

var sessID;
var ttl;
var expirationDate = 0;

var userName;
var passWord;
var roles;
var mainPage;
var userMenu = false;
var timeoutPPID;

var lampeSWVal = 0;
var voletSWVal = 0;

var debug = true;


var statusErrorMap = {
	'400' : "Server understood the request, but request content was invalid.",
	'401' : "Unauthorized access.",
	'403' : "Forbidden resource can't be accessed.",
	'500' : "Internal server error.",
	'503' : "Service unavailable."
};


// maPiscine.session sigleton class to handle session infos
  maPiscine.Session = (function () {
	var instance;

	function init() {
		  var sessionIdKey = "maPiscine-session";
		  return {
			// Public methods and variables.
			set: function (sessionData) {
				window.localStorage.setItem(sessionIdKey, JSON.stringify(sessionData));
			},

			get: function () {
				  var result = null;
				  try {
					result = JSON.parse(window.localStorage.getItem(sessionIdKey));
				} catch(e){}
				  return result;
			}
		};
	};

	return {
		getInstance: function () {
			if (!instance) {
				instance = init();
			}
			return instance;
		}
	};
  }());

  function storeUserInfos(){
	// Store the user infos and session. 
	var today = new Date();
	expirationDate = today.getTime() + (ttl*1000);	// ttl is in sec where setTime is in millis  *1000
	console.log('In store Infos : now is: ' + today.getTime() + 'and expiration is: ' + expirationDate);
	maPiscine.Session.getInstance().set({
		username: userName,
		passord: passWord,
		userRoles: roles,
		sessionId: sessID,
		theExpirationDate: expirationDate,
		mainPage : mainPage
	});
  }

  /**
   * @brief Vérifie session existante au démarrage et tente auto-login local si expirée
   * @details Appelée au $(document).ready() AVANT localAuth.js
   */
  function checkExistingSessionOrAutoLogin() {
	console.log('[PiscineScripts] Vérification session existante...');
	
	// Récupérer session depuis localStorage
	var sessionData = maPiscine.Session.getInstance().get();
	
	if (sessionData && sessionData.sessionId) {
		var now = new Date().getTime();
		
		if (now < sessionData.theExpirationDate) {
			// Session encore valide
			console.log('[PiscineScripts] Session valide trouvée, restauration...');
			userName = sessionData.username;
			passWord = sessionData.passord;
			roles = sessionData.userRoles;
			sessID = sessionData.sessionId;
			expirationDate = sessionData.theExpirationDate;
			mainPage = sessionData.mainPage || '#pagePiscinePrincipale';
			
			// Restaurer cookie
			var remainingTTL = Math.floor((sessionData.theExpirationDate - now) / 1000);
			setCookie("maPiscine", sessID, remainingTTL / 3600); // Convertir en heures
			
			console.log('[PiscineScripts] Session restaurée, redirect vers ' + mainPage);
			return true; // Session valide
		} else {
			console.log('[PiscineScripts] Session expirée, nettoyage...');
			// Session expirée, nettoyer
			window.localStorage.removeItem("maPiscine-session");
			setCookie("maPiscine", "", 0);
		}
	}
	
	console.log('[PiscineScripts] Pas de session valide, localAuth.js va gérer auto-login');
	return false; // Pas de session valide, laisser localAuth.js gérer
  }

  /**
   * @brief Vérifie si l'auto-login local est possible et configure la session
   * @details Appelle /checkLocalAuth (GET) au démarrage de l'application.
   *          Si autoLogin=true, utilise onSuccess() existant.
   *          Sinon, affiche page login normale.
   */
  function checkLocalAuthOnStartup() {
	console.log("[LocalAuth] Vérification auto-login local...");
	
	// Vérifier d'abord si session valide existe déjà
	var hasValidSession = checkExistingSessionOrAutoLogin();
	if (hasValidSession) {
		console.log("[LocalAuth] Session existante valide détectée");
		// Rediriger vers page principale
		var targetPage = mainPage || "#pagePiscinePrincipale";
		setTimeout(function() {
			$.mobile.changePage(targetPage, {transition: "slide"});
		}, 100);
		return;
	}
	
	// Pas de session existante, vérifier auto-login local
	$.ajax({
		url: '/checkLocalAuth',
		type: 'GET',
		dataType: 'json',
		timeout: 5000,
		success: function(response) {
			console.log("[LocalAuth] Réponse serveur:", response);
			
			if (response.autoLogin === true) {
				// Auto-login activé pour client local
				console.log("[LocalAuth] Auto-login local activé, traitement via onSuccess");
				
				// Adapter la réponse pour onSuccess existant
				var loginData = {
					status: "Auto Login Local",
					username: response.username,
					password: "",  // Pas de password pour auto-login
					sessionID: response.sessionID,
					ttl: response.ttl,
					roles: [],
					isLocal: true,
					message: response.message
				};
				
				// Appeler le handler onSuccess existant
				onSuccess(JSON.stringify(loginData), 'success');
				
			} else {
				// Authentification normale requise
				console.log("[LocalAuth] Authentification requise:", response.message);
				
				// Afficher page login (jQuery Mobile)
				$.mobile.changePage("#pageLogin", {transition: "fade"});
			}
		},
		error: function(xhr, status, error) {
			console.error("[LocalAuth] Erreur vérification:", status, error);
			
			// En cas d'erreur, afficher page login par défaut
			$.mobile.changePage("#pageLogin", {transition: "fade"});
		}
	});
  }

  /**
   * @brief Affiche un toast notification (compatible jQuery Mobile)
   * @param message Texte à afficher
   * @param type Type de message ('success', 'error', 'info')
   */
  function showToast(message, type) {
	var toastClass = 'toast-' + type;
	var $toast = $('<div class="toast ' + toastClass + '">' + message + '</div>');
	
	$('body').append($toast);
	
	setTimeout(function() {
		$toast.addClass('show');
	}, 100);
	
	setTimeout(function() {
		$toast.removeClass('show');
		setTimeout(function() {
			$toast.remove();
		}, 300);
	}, 3000);
  }

  /**
   * @brief Vérifie périodiquement la validité de la session
   * @details À appeler toutes les 60 secondes pour vérifier expiration
   *          Utilise le système maPiscine.Session existant
   */
  function checkSessionValidity() {
	// Utiliser le système maPiscine.Session existant
	var sessionData = maPiscine.Session.getInstance().get();
	
	if (!sessionData || !sessionData.sessionId) {
		console.log("[LocalAuth] Pas de session, redirection login");
		$.mobile.changePage("#pageLogin", {transition: "fade"});
		return false;
	}
	
	var now = new Date().getTime();
	var timeRemaining = sessionData.theExpirationDate - now;
	var fiveMinutes = 5 * 60 * 1000;  // 5 minutes en millisecondes
	
	// Alerter 5 minutes avant expiration (une seule fois)
	if (timeRemaining > 0 && timeRemaining <= fiveMinutes) {
		if (!sessionData.warningShown) {
			var minutesLeft = Math.floor(timeRemaining / 60000);
			showToast("⚠️ Session expire dans " + minutesLeft + " min", 'warning');
			// Marquer warning montré
			sessionData.warningShown = true;
			maPiscine.Session.getInstance().set(sessionData);
		}
	}
	
	if (now >= sessionData.theExpirationDate) {
		showSessionExpiredDialog("Invalid Session");
		return false;
	}
	
	return true;
  }

  /**
   * @brief Affiche dialog session expirée avec détails action backend
   * @param action Description de l'action qui a échoué
   * @param xhr Objet XMLHttpRequest contenant erreur serveur
   */
  function showSessionExpiredDialog(action) {

	console.log("[LocalAuth] Session expirée, redirection login");
		
	// Nettoyer session
	window.localStorage.removeItem("maPiscine-session");
	setCookie("maPiscine", "", 0);
	
	// Mettre à jour contenu dialog dynamiquement
	var expiredTime = new Date(sessionData.theExpirationDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
	var expiredDate = new Date(sessionData.theExpirationDate).toLocaleDateString('fr-FR');
	var sessionDuration = Math.floor((sessionData.theExpirationDate - (now - timeRemaining)) / 3600000); // heures
	
	var message = "<p><strong>Votre session a expiré.</strong></p>";
	message += "<p>Heure d'expiration : <strong>" + expiredDate + " à " + expiredTime + "</strong></p>";
	message += "<p>Utilisateur : <strong>" + (sessionData.username || userName) + "</strong></p>";
	message += "<p>Action : <strong>" + action + "</strong></p>";
	message += "<p><em>Veuillez vous reconnecter.</em></p>";
	message += "<p><em>Redirection automatique dans 10 secondes...</em></p>";
	
	$('#dlg-EndSessionAlert-message').html(message);
	
	// Afficher dialog
	$.mobile.changePage("#dlg-EndSessionAlert");
	
	// Auto-redirect après 10 secondes
	setTimeout(function() {
		if ($.mobile.activePage.attr('id') === 'dlg-EndSessionAlert') {
			$.mobile.changePage("#pageLogin", {transition: "fade"});
		}
	}, 10000);
  }

  function onError(data, exception){
	var message;
	var isCritical = false;
	
	console.log('An error occurred.');
	console.log(data);
  
	if (data.status) {
	  message = statusErrorMap[data.status];
	  if(!message){
		message="Unknown Error \n." + data.status;
		isCritical = true;  // Erreur inconnue = critique
	  }
	  // 401/403 = critiques (authentification)
	  if (data.status == 401 || data.status == 403) {
		isCritical = true;
	  }
	}else if(exception=='parsererror'){
	  message="Error.\nParsing JSON Request failed.";
	  isCritical = true;  // Parse error = critique
	}else if(exception=='timeout'){
	  message="Request Time out.";
	  // Timeout = non critique, juste toast
	}else if(exception=='abort'){
	  message="Request was aborted by the server";
	  isCritical = true;  // Abort serveur = critique
	}else {
	  message="Uncaught Error.\n" + data.responseText;
	  isCritical = true;  // Uncaught = critique
	}
	
	// Toast pour erreurs non-critiques, alert pour critiques
	if (isCritical) {
		console.error('[CRITICAL ERROR]', message);
		alert(message);  // Garder alert pour erreurs critiques
	} else {
		console.warn('[Network Error]', message);
		showToast(message.replace(/\n/g, ' '), 'error');
	}
  }
  
  function setCookie(cname, cvalue, exHours) {   // exHours = 0 to delete
	var d = new Date();
	d.setTime(d.getTime() + (exHours * 60 * 60 * 1000));
	var expires = "expires="+d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
  
  function getCookie(cname) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++) {
	  var c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return "";
  }
  

  // -------------------------------- Forms Validation --------------------------------

// login form validation
  $(function() {
    $("#loginForm").validate({
      rules: {
        username: {
          minlength: 5,
          required: true
        },
        password: {
          minlength: 5,
          required: true
        }
      },
      messages: {
        username: {
          required : "Please enter your username",
          minlength: "Your username must be at least 5 chars"
        },  
        password: {
          required: "Please provide a password",
          minlength: "Your password must be at least 5 chars"
        }      },
      submitHandler: function(form){
      validateLogin($(form),"/logon");
      }        
    });
  });
// registration form validation
  $(function() {
    $("#registrationForm").validate({
      rules: {
        username: {
          required: true,
          maxlength: 11
        },
        password: {
          required: true,
          minlength: 5,
          maxlength: 11
        },
        password2: {
          required: true,
          equalTo: "#mainpassword"
        },
        adminpassword: {
          required: true
        }
      },
      messages: {
        username: {
          required : "Please enter your username",
          maxlength: "Your username must be at most 11 chars"
        },  
        password: {
          required: "Please provide a password",
          minlength: "Your password must be at least 5 chars",
          maxlength: "Your password must be at most 11 chars"
        },
        password2: {
          required: "Please re-enter the password",
          equalTo: "Password Check isn't the same"
        },
        adminpassword: {
          required: "Please provide the admin password"
        },
      },
      submitHandler: function(form){
        validateLogin($(form),"/register");
      }  
      
    });
  });
// change admin form validation
  $(function() {
    $("#changeAdminForm").validate({
      rules: {
        password: {
          required: true,
          minlength: 5,
          maxlength: 11
        },
        passwordchk: {
          required: true,
          equalTo: "#newadminpassword"
        },
        adminpassword: {
          required: true
        }
      },
      messages: {
        password: {
          required: "Please provide a new password for admin",
          minlength: "Your password must be at least 5 chars",
          maxlength: "Your password must be at most 11 chars"
        },
        passwordchk: {
          required: "Please re-enter the new admin password",
          equalTo: "Password Check isn't the same"
        },
        adminpassword: {
          required: "Please provide the old admin password"
        },
      },
      submitHandler: function(form){
        validateLogin($(form),"/changeAdmin");
      }
    });
  });
// userProfile form validation
  $(function() {
    $("#userProfileForm").validate({
      rules: {
        username: {
          minlength: 5,
          maxlength: 11,
          required: true
        },
        password2: {
			required: true,
			equalTo: "#userpasswordprofile"
		  },
		password: {
          minlength: 5,
          maxlength: 11,
          required: true
        }
      },
      messages: {
        username: {
          required : "Please enter your username",
          minlength: "Your username must be at least 5 chars",
		  maxlength: "Your username must be at most 11 chars"
        },  
        password2: {
			required: "Please re-enter the password",
			equalTo: "Password Check isn't the same"
		  },
		password: {
          required: "Please provide a password",
          minlength: "Your password must be at least 5 chars",
		  maxlength: "Your password must be at most 11 chars"

        }      },
      submitHandler: function(form){
		$("#UPusername").val(userName);  
        validateLogin($(form),"/userProfile");
      }        
    });
  });
// delete user form validation
  $(function() {
    $("#deleteUsersForm").validate({
      submitHandler: function(form){
		validateLogin($(form),"/deleteUsers");
	  }	
    });
  });

  function validateLogin(frm,url){
	// On transforme "/logon" en "/api/auth?action=logon"
    
    var action = url.replace('/', ''); // On extrait le nom de l'action depuis l'ancienne URL (en enlevant le '/')
    var newUrl = "/api/auth?action=" + action;

    console.log(newUrl + "\n" + frm.serialize());
	$.mobile.loading("show");
	$.ajax({
	  type: frm.attr('method'),
	  url: newUrl,
	  cache: false,
	  data: frm.serialize(),
	  success: onSuccess,
	  error: onError
	});
  }    
  
  function onSuccess(data, status){
	data = $.trim(data);
	var returnedData = JSON.parse(data);
	var setSession = false;
	var setUser = true;
//	$.mobile.loading("hide");
	console.log("returned json is " + JSON.stringify(returnedData));

	// login successful => main.html
	//$.mobile.changePage('#dlg-login', 'pop', true, true); //$("#dlg-login").popup('open');   //   $.mobile.changePage('#dlg-login', 'pop', true, true); //   
	$.mobile.changePage( "#dlg-login" );
	if (returnedData.status == "Log in Successful" || returnedData.status == "Auto Login Local"){          
	  $('#mainPageButton').show();
	  $('#retryButton').hide();
	  $('#backButton').hide();
	  $('#loginButton').hide();
	  userName = returnedData.username;	
	  passWord = returnedData.password;	
	  sessID = returnedData.sessionID;
	  ttl = returnedData.ttl;
	  roles = returnedData.roles;
	  getMainPage();
	  console.log("mainPage on success is " + mainPage + "\n");
	  $('#mainPageButton').prop('href', mainPage);
	  
	  // Adapter message selon contexte local/distant
	  var sessionMessage = 'Your Session Time is : ' + ttl + ' seconds';
	  if (returnedData.isLocal === true) {
		  var ttlDays = Math.floor(ttl / (24 * 60 * 60));
		  if (ttlDays > 300) {
			  sessionMessage = '🏠 Connexion locale (session 1 an)';
		  } else if (ttlDays > 20) {
			  sessionMessage = '🏠 Connexion locale (session ' + ttlDays + ' jours)';
		  } else {
			  sessionMessage = 'Session ' + Math.floor(ttl / 3600) + ' heures';
		  }
	  }
	  $('#dlg-ttl').html(document.createTextNode(sessionMessage));
	  
	  storeUserInfos();
	  setCookie("maPiscine", sessID, ttl / 3600);    // ttl en secondes, cookie en heures
		  	// Login failed => retry
	} else if (returnedData.status == "Log in Failed"){      
	  $('#mainPageButton').hide();
	  $('#retryButton').show();
	  $('#backButton').hide();
	  $('#loginButton').hide();
	  $('#dlg-ttl').hide();	
	  		// Registration user exist => retry
	} else if (returnedData.status == "User Already Exist"){      
		$('#mainPageButton').hide();
		$('#retryButton').show();
		$('#backButton').hide();
		$('#loginButton').hide();
		$('#dlg-ttl').hide();	
		userName = returnedData.username;	
				// Registration new user => main.html
	} else if (returnedData.status == "New User Created Succesfully"){
	  showToast("Nouvel utilisateur créé avec succès", 'success');      
	  $('#retryButton').hide();
	  $('#loginButton').hide();
	  if(returnedData.flgLogin == "true"){
		userName = returnedData.username;	
		passWord = returnedData.password;	
		sessID = returnedData.sessionID;
		ttl = returnedData.ttl;
		roles = returnedData.roles;
		getMainPage();
		$('#mainPageButton').prop('href', mainPage);
		$('#dlg-ttl').html( document.createTextNode('Your Session Time is : ' + ttl + ' seconds'));
		storeUserInfos();
		setCookie("maPiscine", sessID, ttl);    // 1 hours by default else 1 day
		$('#mainPageButton').show();
		$('#backButton').hide();
	} else {			// add user but already login 
		$('#mainPageButton').hide();
		$('#backButton').show();
		$('#dlg-ttl').hide();	
	}  
			// Registration no room for new user => login
	} else if (returnedData.status == "No room for new user"){      
		$('#mainPageButton').hide();
		$('#retryButton').hide();
		$('#backButton').hide();
		$('#loginButton').show();
		$('#dlg-ttl').hide();	
		userName = returnedData.username;	

		// Registration bad adminPassword => retry	
	} else if (returnedData.status == "Bad AdminPassword"){      
	  $('#mainPageButton').hide();
	  $('#retryButton').show();
	  $('#backButton').hide();
	  $('#loginButton').hide();
	  $('#dlg-ttl').hide();	

	  		// change admin password updated => login
	} else if (returnedData.status == "Admin Password Updated"){
	  showToast("Mot de passe administrateur modifié", 'success');      
	  $('#mainPageButton').hide();
	  $('#retryButton').hide();
	  $('#backButton').show();
	  $('#loginButton').hide();
	  $('#dlg-ttl').hide();	
	  		// change admin password bad adminPassword => retry
	} else if (returnedData.status == "Bad Admin Password"){      
	  $('#mainPageButton').hide();
	  $('#retryButton').show();
	  $('#backButton').hide();
	  $('#loginButton').hide();
	  $('#dlg-ttl').hide();	
	  // change user profile => return
	} else if (returnedData.status == "User Profile Updated"){
	  showToast("Profil utilisateur mis à jour", 'success');      
		$('#mainPageButton').hide();
		$('#retryButton').hide();
		$('#backButton').show();
		$('#loginButton').hide();
		$('#dlg-ttl').hide();	
		userName = returnedData.username;	
		passWord = returnedData.password;	
		roles = returnedData.roles;
		storeUserInfos();
		setCookie("maPiscine", sessID, ttl);    // 1 hours by default else 1 day
	} else if (returnedData.status == "User Profile not Updated"){      
		$('#mainPageButton').show();
		$('#retryButton').show();
		$('#backButton').hide();
		$('#loginButton').hide();
		$('#dlg-ttl').hide();	
	} else if (returnedData.status == "User(s) Deleted"){
	  showToast("Utilisateur(s) supprimé(s)", 'success');      
		$('#mainPageButton').hide();
		$('#retryButton').hide();
		$('#backButton').show();
		$('#loginButton').hide();
		$('#dlg-ttl').hide();	
	} else if (returnedData.status == "No User(s) to Delete"){      
		$('#mainPageButton').hide();
		$('#retryButton').show();
		$('#backButton').hide();
		$('#loginButton').hide();
		$('#dlg-ttl').hide();	
	}
	$('#dlg-user').html( document.createTextNode( userName ) ); 
	$('#dlg-status').html( "<H2>"+returnedData.status+"</H2>");  
	$('#dlg-message').html( document.createTextNode( returnedData.message));
	
	console.log("returned json is " + JSON.stringify(returnedData));   	
  }

  function getMainPage(){
	var trouve = false;

		mainPage = '#pagePiscinePrincipale';
		trouve = true;
		(trouve) ? console.log("mainPage is :" + mainPage + "\n") : console.log("mainPage pas trouve\n");	
  }

  // set the ui according to the user roles
  function setUserUI(){
	var theHtml="";
	var flgExterieur = false;
	var flgFirst = false;

	console.log("[DEBUG] In setUserUI - START");
	theHtml += piscineMenu((flgFirst) ? false : true);
	if (!flgFirst) flgFirst = true;
	if(!flgExterieur) flgExterieur = true;
	theHtml += '<hr class="inset">'
	console.log("[DEBUG] Generated HTML length:", theHtml.length);
	console.log("[DEBUG] Looking for #leftpanelMenu element:", $('#leftpanelMenu').length);
	$('#leftpanelMenu').html(theHtml); 		// .collapsibleset("refresh");
	$('#leftpanelMenu').enhanceWithin(); 	
	console.log("[DEBUG] setUserUI - COMPLETE");
	// $('#leftpanelMenu').collapsibleset("destroy").html(theHtml).collapsibleset().enhanceWithin();

		// $('#mainPageButton').prop('href', '#myNewPopup');
		// $("#mainPageButton .ui-btn-text").text('new_text')
		// $("#dlg-login").enhanceWithin();
  }

  function piscineMenu(first) {
	var html = '';
	html += '<div data-role="collapsible" data-collapsed-icon="plus" data-expanded-icon="minus" data-iconpos="right" data-theme="b" data-content-theme="b" ';
	(first) ? html += 'data-collapsed="false">' : html += '>';
	html += '	<h3 class="myh3">Piscine</h3>';
	html += '	<ul data-role="listview" data-inset="true">';
	html += '		<li><a href="#pagePiscinePrincipale" data-transition="slide"><h4 class="myh4">Piscine</h4></a></li>';
	html += '		<li><a href="#pagePiscineParametres" data-transition="slide"><h4 class="myh4">Piscine Parametres</h4></a></li>';
	html += '		<li><a href="#pagePiscineMaintenance" data-transition="slide"><h4 class="myh4">Piscine Maintenance</h4></a></li>';
	html += '		<li><a href="#pagePiscineGraphs" data-transition="slide"><h4 class="myh4">Piscine Graphs</h4></a></li>';
	html += '		<li><a href="#pagePiscineDebug" data-transition="slide"><h4 class="myh4">Piscine Debug</h4></a></li>';
	html += '	</ul>';
	html += '</div>';
	return html;
  }	

// --------------------------------  global Pages functions ---------------------------------------------------

function onPageSuccess(data){
	data = $.trim(data);
	var returnedData = JSON.parse(data);
	console.log("returned json is " + JSON.stringify(returnedData));
	if (returnedData.status == "Error"){          
		$.mobile.changePage("#piscineError-dlg");
		$('#PiscineErrorStatus').val(returnedData.message);
		$('#PiscineErrorCorrection').val(returnedData.correction);
	}
}

function onPageError(xhr) {
	if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
		console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
		showSessionExpiredDialog("Change Page");
	}
}

// --------------------------------  Graphic Pages functions et Vars  ---------------------------------------------------



var OrigStart;
var OrigEnd;
var CurrStart;
var CurrEnd;
var chartdata=[];
var chart={}

var dataOrigin=[];
var currData=[];

// Cache Map pour stocker les données par jour (clé: "YYYY-MM-DD", valeur: array de lignes)
var dataCache = new Map();

// Gestion multi-graphes responsive
var charts = {
	mobile: null,
	chemistry: null,
	temperature: null,
	equipment: null
};
var currentMode = null; // 'mobile', 'tablet', 'desktop'
var selectedGraphs = {
	tablet: ['chemistry', 'temperature'] // Graphes sélectionnés en mode tablette
};

// Définition des graphes avec axes primaires et optionnels
const GRAPH_DEFINITIONS = {
	chemistry: {
		primaryAxes: ["PHVal", "RedoxVal", "TempEau"],
		optionalAxes: ["PompePH", "PompeCL", "PompeALG", "PAC", "TempAir"],
		config: null // Sera assigné dynamiquement
	},
	temperature: {
		primaryAxes: ["TempEau", "TempAir", "TempPAC", "TempInt"],
		optionalAxes: ["PAC", "PP", "PHVal"],
		config: null
	},
	equipment: {
		primaryAxes: ["PP", "PAC", "PompePH", "PompeCL"],
		optionalAxes: ["Auto", "PompeALG", "TempPAC", "TempEau", "PHVal"],
		config: null
	}
};

// Configuration centralisée du graphique Dygraph (Mobile - graph unique)
const DYGRAPH_CONFIG = {
	labels: ["Date", "TempEau", "TempAir", "TempPAC", "TempInt", "PHVal", "RedoxVal", "CLVal", "PompePH", "PompeCL", "PompeALG", "PP", "PAC", "Auto"],
	legend: "follow",
	series: {
		TempEau: {axis: "y2"},
		TempAir: {axis: "y2"},
		TempPAC: {axis: "y2"},
		TempInt: {axis: "y2"},
		PHVal: {axis: "y"},
		RedoxVal: {axis: "y2"},
		CLVal: {axis: "y"},
		PompePH: {axis: "y"},
		PompeCL: {axis: "y"},
		PompeALG: {axis: "y"},
		PP: {axis: "y"},
		PAC: {axis: "y"},
		Auto: {axis: "y"}
	},
	axes: {
		y: {valueRange: [0, 10], axisLabelColor: "#FF00FF"},
		y2: {valueRange: [10, 40], axisLabelColor: "#FFFFFF"}
	},
	ylabel: "On/Off",
	y2label: "Température °C",
	colors: ["#ff0000", "#00FF00", "#006FFF", "#FFFF00", "#00FFFF", "#FF00FF", "#FF6F00", "#0000FF", "#6F00FF", "#6FFF00", "#00FF6F", "#FF006F", "#00FF6F"],
	visibility: [true, true, false, false, true, false, true, false, false, false, true, false, true],
	rollPeriod: 2,
	strokeWidth: 2,
	highlightSeriesBackgroundAlpha: 1,
	highlightSeriesOpts: {
		strokeWidth: 5,
		strokeBorderWidth: 0,
		highlightCircleSize: 5
	},
	gridLineColor: "#eee",
	showRangeSelector: true,
	rangeSelectorHeight: 50
};

// Configuration graphe Chimie (Desktop)
const DYGRAPH_CHEMISTRY_CONFIG = {
	labels: ["Date", "PHVal", "RedoxVal", "PompePH", "PompeCL", "PompeALG"],
	legend: "follow",
	series: {
		PHVal: {axis: "y1", color: "#00FFFF", strokeWidth: 2},
		RedoxVal: {axis: "y2", color: "#FF00FF", strokeWidth: 2},
		PompePH: {axis: "y1", stepPlot: true, fillGraph: true, color: "#0000FF", fillAlpha: 0.15, strokeWidth: 1.5},
		PompeCL: {axis: "y2", stepPlot: true, fillGraph: true, color: "#6F00FF", fillAlpha: 0.15, strokeWidth: 1.5},
		PompeALG: {axis: "y1", stepPlot: true, fillGraph: true, color: "#6FFF00", fillAlpha: 0.15, strokeWidth: 1.5}
	},
	axes: {
		y1: {valueRange: [3, 10], axisLabelColor: "#00FFFF", axisLabelWidth: 50, pixelsPerLabel: 30},
		y2: {valueRange: [150, 1050], axisLabelColor: "#FF00FF", axisLabelWidth: 50, independentTicks: true, pixelsPerLabel: 30}
	},
	ylabel: "pH / Pompes",
	y2label: "Redox (mV)",
	rollPeriod: 2,
	strokeWidth: 2,
	highlightSeriesBackgroundAlpha: 1,
	highlightSeriesOpts: {strokeWidth: 5, strokeBorderWidth: 0, highlightCircleSize: 5},
	gridLineColor: "#eee",
	showRangeSelector: true,
	rangeSelectorHeight: 40
};

// Configuration graphe Températures (Desktop)
const DYGRAPH_TEMPERATURE_CONFIG = {
	labels: ["Date", "TempEau", "TempAir", "TempPAC", "TempInt"],
	legend: "follow",
	series: {
		TempEau: {axis: "y", color: "#FF0000", strokeWidth: 3},
		TempAir: {axis: "y", color: "#00FF00", strokeWidth: 2},
		TempPAC: {axis: "y", color: "#006FFF", strokeWidth: 2},
		TempInt: {axis: "y", color: "#FFFF00", strokeWidth: 2}
	},
	axes: {
		y: {valueRange: [0, 55], axisLabelColor: "#FF0000", pixelsPerLabel: 30}
	},
	ylabel: "Température (°C)",
	rollPeriod: 2,
	highlightSeriesBackgroundAlpha: 1,
	highlightSeriesOpts: {strokeWidth: 5, strokeBorderWidth: 0, highlightCircleSize: 5},
	gridLineColor: "#eee",
	showRangeSelector: true,
	rangeSelectorHeight: 40
};

// Configuration graphe Équipements avec offset vertical (Desktop)
const DYGRAPH_EQUIPMENT_CONFIG = {
	labels: ["Date", "PP", "PAC", "Auto"],
	legend: "follow",
	series: {
		PP: {axis: "y", stepPlot: true, fillGraph: true, color: "#00FF6F", fillAlpha: 0.4, strokeWidth: 2},
		PAC: {axis: "y", stepPlot: true, fillGraph: true, color: "#FF006F", fillAlpha: 0.4, strokeWidth: 2},
		Auto: {axis: "y", stepPlot: true, fillGraph: true, color: "#6F00FF", fillAlpha: 0.4, strokeWidth: 2}
	},
	axes: {
		y: {
			valueRange: [-0.5, 3.5],
			axisLabelFormatter: function(y) {
				if (y >= -0.5 && y < 0.5) return "PP";
				if (y >= 0.5 && y < 1.5) return "PAC";
				if (y >= 1.5 && y < 2.5) return "Auto";
				return "";
			},
			ticker: function() {
				return [{v: 0, label: "PP"}, {v: 1, label: "PAC"}, {v: 2, label: "Auto"}];
			}
		}
	},
	ylabel: "État",
	rollPeriod: 1,
	highlightSeriesBackgroundAlpha: 1,
	highlightSeriesOpts: {strokeWidth: 5, strokeBorderWidth: 0, highlightCircleSize: 5},
	gridLineColor: "#eee",
	showRangeSelector: true,
	rangeSelectorHeight: 40
};

// Fonction pour transformer les données avec offset vertical (graphe Équipements)
function applyEquipmentOffset(data) {
	// data format: [Date, TempEau, TempAir, TempPAC, TempInt, PHVal, RedoxVal, CLVal, PompePH, PompeCL, PompeALG, PP, PAC, Auto]
	// Indices: PP=11, PAC=12, Auto=13
	return data.map(row => {
		if (!row || row.length < 14) return row;
		return [
			row[0],  // Date
			row[11] !== null && row[11] !== undefined ? row[11] : null,          // PP reste à 0-1
			row[12] !== null && row[12] !== undefined ? row[12] + 1 : null,      // PAC décalé à 1-2
			row[13] !== null && row[13] !== undefined ? row[13] + 2 : null       // Auto décalé à 2-3
		];
	});
}

// Fonction de détection du mode responsive
function getGraphMode() {
	let width = window.innerWidth;
	let orientation = (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';
	
	if (width < 768) return 'mobile';
	if (width < 1024 || orientation === 'portrait') return 'tablet';
	return 'desktop';
}

// Fonction pour extraire données Chimie
function extractChemistryData(data) {
	// Extraire colonnes: Date(0), PHVal(5), RedoxVal(6), PompePH(8), PompeCL(9), PompeALG(10)
	return data.map(row => {
		if (!row || row.length < 11) return null;
		return [row[0], row[5], row[6], row[8], row[9], row[10]];
	}).filter(r => r !== null);
}

// Fonction pour extraire données Températures
function extractTemperatureData(data) {
	// Extraire colonnes: Date(0), TempEau(1), TempAir(2), TempPAC(3), TempInt(4)
	return data.map(row => {
		if (!row || row.length < 5) return null;
		return [row[0], row[1], row[2], row[3], row[4]];
	}).filter(r => r !== null);
}

function csvToArray(csvText) {
	const result = Papa.parse(csvText, {
		delimiter: ";",
		skipEmptyLines: true,
		dynamicTyping: false  // On parse manuellement pour les dates
	});
	
	return result.data.map(row => {
		row[0] = dayjs(row[0], "DD/MM/YY HH:mm:ss").toDate();
		for(let i = 1; i < row.length; i++) {
			row[i] = parseFloat(row[i]);
		}
		return row;
	});
}

// Fonction de création des graphiques selon le mode
function createGraphs(data, forceMode, mobileSelectedGraph) {
	var mode = forceMode || currentMode || getGraphMode();
	currentMode = mode;
	
	console.log("Creating graphs in mode: " + mode);
	
	// Détruire les graphiques existants
	Object.keys(charts).forEach(function(key) {
		if (charts[key] && typeof charts[key].destroy === 'function') {
			charts[key].destroy();
			charts[key] = null;
		}
	});
	
	var startDate = dayjs().subtract(2, "days").startOf("day");
	var endDate = dayjs();
	
	// Configuration commune pour tous les graphes
	var commonCallbacks = {
		zoomCallback: function(minDate, maxDate, yRanges) {
			var startX = dayjs(minDate);
			var endX = dayjs(maxDate);
			console.log("Zoom: " + startX.format('DD/MMM/YY HH:mm') + ' to ' + endX.format('DD/MMM/YY HH:mm'));
			$('#daterange').data('daterangepicker').setStartDate(startX);
			$('#daterange').data('daterangepicker').setEndDate(endX);
			updateGraphsDateRange(startX, endX);
		},
		drawCallback: function(g, is_initial) {
			if (!is_initial) {
				var chartBounds = g.xAxisRange();
				var startX = dayjs(chartBounds[0]);
				var endX = dayjs(chartBounds[1]);
				console.log("Pan: " + startX.format('DD/MMM/YY HH:mm') + ' to ' + endX.format('DD/MMM/YY HH:mm'));
				$('#daterange').data('daterangepicker').setStartDate(startX);
				$('#daterange').data('daterangepicker').setEndDate(endX);
			}
		}
	};
	
	if (mode === 'mobile') {
		// Mode mobile: 1 seul graphe sélectionnable
		var graphType = mobileSelectedGraph || $('#graphSelector').val() || 'all';
		
		if (graphType === 'all') {
			// Graphe multiaxes par défaut
			var config = Object.assign({}, DYGRAPH_CONFIG, commonCallbacks, {
				labelsDiv: document.getElementById("legend-mobile"),
				dateWindow: [startDate.toDate(), endDate.toDate()],
				interactionModel: Dygraph.defaultInteractionModel
			});
			charts.mobile = new Dygraph($("#graph1")[0], data, config);
		} else {
			// Graphe spécialisé (chemistry/temperature/equipment)
			var graphData, graphConfig, legendId;
			
			if (graphType === 'chemistry') {
				graphData = extractChemistryData(data);
				graphConfig = DYGRAPH_CHEMISTRY_CONFIG;
				legendId = "legend-mobile";
			} else if (graphType === 'temperature') {
				graphData = extractTemperatureData(data);
				graphConfig = DYGRAPH_TEMPERATURE_CONFIG;
				legendId = "legend-mobile";
			} else if (graphType === 'equipment') {
				graphData = applyEquipmentOffset(data);
				graphConfig = DYGRAPH_EQUIPMENT_CONFIG;
				legendId = "legend-mobile";
			}
			
			var config = Object.assign({}, graphConfig, commonCallbacks, {
				labelsDiv: document.getElementById(legendId),
				dateWindow: [startDate.toDate(), endDate.toDate()],
				interactionModel: Dygraph.defaultInteractionModel
			});
			charts.mobile = new Dygraph($("#graph1")[0], graphData, config);
		}
		
	} else if (mode === 'tablet') {
		// Mode tablette: 2 graphes sélectionnables
		var graphs = selectedGraphs.tablet || ['chemistry', 'temperature'];
		var graphInstances = [];
		
		graphs.forEach(function(graphType, idx) {
			var elementId = idx === 0 ? "graph-chemistry" : "graph-temperature";
			var legendId = idx === 0 ? "legend-chemistry" : "legend-temperature";
			var graphData, graphConfig;
			
			if (graphType === 'chemistry') {
				graphData = extractChemistryData(data);
				graphConfig = DYGRAPH_CHEMISTRY_CONFIG;
			} else if (graphType === 'temperature') {
				graphData = extractTemperatureData(data);
				graphConfig = DYGRAPH_TEMPERATURE_CONFIG;
			} else if (graphType === 'equipment') {
				graphData = applyEquipmentOffset(data);
				graphConfig = DYGRAPH_EQUIPMENT_CONFIG;
			}
			
			var config = Object.assign({}, graphConfig, commonCallbacks, {
				labelsDiv: document.getElementById(legendId),
				dateWindow: [startDate.toDate(), endDate.toDate()],
				interactionModel: Dygraph.defaultInteractionModel
			});
			
			charts[graphType] = new Dygraph($("#" + elementId)[0], graphData, config);
			graphInstances.push(charts[graphType]);
		});
		
		// Synchroniser les 2 graphes
		if (graphInstances.length === 2) {
			Dygraph.synchronize(graphInstances, {selection: true, zoom: true});
		}
		
	} else if (mode === 'desktop') {
		// Mode desktop: 3 graphes fixes
		var graphConfigs = [
			{type: 'chemistry', elementId: 'graph-chemistry', legendId: 'legend-chemistry'},
			{type: 'temperature', elementId: 'graph-temperature', legendId: 'legend-temperature'},
			{type: 'equipment', elementId: 'graph-equipment', legendId: 'legend-equipment'}
		];
		
		var graphInstances = [];
		
		graphConfigs.forEach(function(cfg) {
			var graphData, graphConfig;
			
			if (cfg.type === 'chemistry') {
				graphData = extractChemistryData(data);
				graphConfig = DYGRAPH_CHEMISTRY_CONFIG;
			} else if (cfg.type === 'temperature') {
				graphData = extractTemperatureData(data);
				graphConfig = DYGRAPH_TEMPERATURE_CONFIG;
			} else if (cfg.type === 'equipment') {
				graphData = applyEquipmentOffset(data);
				graphConfig = DYGRAPH_EQUIPMENT_CONFIG;
			}
			
			var config = Object.assign({}, graphConfig, commonCallbacks, {
				labelsDiv: document.getElementById(cfg.legendId),
				dateWindow: [startDate.toDate(), endDate.toDate()],
				interactionModel: Dygraph.defaultInteractionModel
			});
			
			charts[cfg.type] = new Dygraph($("#" + cfg.elementId)[0], graphData, config);
			graphInstances.push(charts[cfg.type]);
		});
		
		// Synchroniser les 3 graphes
		Dygraph.synchronize(graphInstances, {selection: true, zoom: true});
		
		// Initialiser les sélecteurs d'axes avec valeurs par défaut
		initializeAxisSelectors();
	}
	
	console.log("Graphs created successfully");
}

// Initialiser les sélecteurs d'axes avec valeurs par défaut (desktop)
function initializeAxisSelectors() {
	// Chimie: PHVal, RedoxVal, TempEau sélectionnés par défaut
	var chemistryDefaults = ["PHVal", "RedoxVal", "TempEau"];
	$("#selectChemistry").val(chemistryDefaults).selectmenu('refresh');
	
	// Température: tous sélectionnés par défaut
	var temperatureDefaults = ["TempEau", "TempAir", "TempPAC", "TempInt"];
	$("#selectTemperature").val(temperatureDefaults).selectmenu('refresh');
	
	// Équipements: PP, PAC, PompePH, PompeCL par défaut
	var equipmentDefaults = ["PP", "PAC", "PompePH", "PompeCL"];
	$("#selectEquipment").val(equipmentDefaults).selectmenu('refresh');
}

// Mettre à jour les données des graphiques existants
function updateGraphsData(data) {
	var mode = currentMode || getGraphMode();
	
	if (mode === 'mobile' && charts.mobile) {
		var graphType = $('#graphSelector').val() || 'all';
		var graphData = data;
		
		if (graphType === 'chemistry') {
			graphData = extractChemistryData(data);
		} else if (graphType === 'temperature') {
			graphData = extractTemperatureData(data);
		} else if (graphType === 'equipment') {
			graphData = applyEquipmentOffset(data);
		}
		
		charts.mobile.updateOptions({file: graphData});
		
	} else if (mode === 'tablet') {
		var graphs = selectedGraphs.tablet || ['chemistry', 'temperature'];
		
		graphs.forEach(function(graphType) {
			if (charts[graphType]) {
				var graphData;
				if (graphType === 'chemistry') {
					graphData = extractChemistryData(data);
				} else if (graphType === 'temperature') {
					graphData = extractTemperatureData(data);
				} else if (graphType === 'equipment') {
					graphData = applyEquipmentOffset(data);
				}
				charts[graphType].updateOptions({file: graphData});
			}
		});
		
	} else if (mode === 'desktop') {
		if (charts.chemistry) {
			charts.chemistry.updateOptions({file: extractChemistryData(data)});
		}
		if (charts.temperature) {
			charts.temperature.updateOptions({file: extractTemperatureData(data)});
		}
		if (charts.equipment) {
			charts.equipment.updateOptions({file: applyEquipmentOffset(data)});
		}
	}
}

// Mettre à jour la plage de dates de tous les graphiques
function updateGraphsDateRange(startDate, endDate) {
	fetchDataRange(startDate, endDate).then(function(data) {
		updateGraphsData(data);
	});
}

function syncGraphAjax(debut,fin){
	console.log("Calling /getGraphDatas?sess="+sessID+"&start="+debut+"&end="+fin);
	return new Promise(
		function(a,s){
			$.ajax({
				type:"POST",
				url:"/setPiscine?action=getGraphDatas",
				data:"sess="+sessID+"&start="+debut+"&end="+fin,
				dataType:"text",
				success:function(e){a(e)},
				error:function(e){s(e)}
			})
		}
	)
};

async function fetchData(debut, fin){
	var datas=[];
	curr=dayjs(debut);
	end=dayjs(fin);
	
	console.log("   ==> fetching chartdata; start:"+curr.format("DD-MM-YYYY")+" end:"+end.format("DD-MM-YYYY"));
	$.mobile.loading("show",{text:"Chargement",textVisible:!0,textonly:!1});
	try{
		var returnedData=await syncGraphAjax(curr.format("DD-MM-YYYY"),end.format("DD-MM-YYYY"));
		$.mobile.loading("hide");
		showToast("Données chargées", 'success');
		if((returnedData=$.trim(returnedData)).includes("Error")){
			var returnedDataJson=JSON.parse(returnedData);
			console.log("returned json is "+returnedData);
			if("Error"==returnedDataJson.status){
				$.mobile.changePage("#piscineError-dlg");
				$("#PiscineErrorStatus").val(returnedDataJson.message);
				$("#PiscineErrorCorrection").val(returnedDataJson.correction);
			} 
		} else {
			datas=csvToArray(returnedData)
		}
	} catch(e){
		$.mobile.loading("hide");
		console.error("[CRITICAL] An error occurred while calling /getGraphDatas, data is: "+e.status+" and exception is : "+e.responseText);
		showToast("Échec chargement données", 'error');
		onPageError(e)
	}
	return datas;
}

async function getOriginData(){
	i=0;
	now=dayjs().set("minute",0).set("second",0);
	start=dayjs().subtract(1,"month").startOf("month");
	console.log("Fetching Origin Data: start:"+start.format("DD-MM-YYYY")+" end:"+now.format("DD-MM-YYYY"));
	dataOrigin=await fetchData(start,now);  // ← FIX: await pour récupérer le tableau, pas la Promise
	chartdata=dataOrigin;
	OrigStart=CurrStart=start;
	OrigEnd=CurrEnd=now;
	
	// Initialiser le cache avec les données d'origine
	populateCache(dataOrigin);
}

// Remplir le cache Map avec un tableau de données
function populateCache(data) {
	data.forEach(row => {
		if (row && row[0] instanceof Date) {
			const dayKey = dayjs(row[0]).format("YYYY-MM-DD");
			if (!dataCache.has(dayKey)) {
				dataCache.set(dayKey, []);
			}
			dataCache.get(dayKey).push(row);
		}
	});
}

// Nouvelle fonction simplifiée pour récupérer les données avec cache Map
async function fetchDataRange(debut, fin) {
	const start = dayjs(debut).startOf('day');
	const end = dayjs(fin).endOf('day');
	const missingRanges = [];
	const result = [];
	
	// Parcourir chaque jour de la période demandée
	let current = start;
	while (current.isBefore(end) || current.isSame(end, 'day')) {
		const dayKey = current.format("YYYY-MM-DD");
		
		if (dataCache.has(dayKey)) {
			// Données en cache, les ajouter au résultat
			result.push(...dataCache.get(dayKey));
		} else {
			// Jour manquant, identifier la plage à télécharger
			const rangeStart = current;
			while (!dataCache.has(current.format("YYYY-MM-DD")) && (current.isBefore(end) || current.isSame(end, 'day'))) {
				current = current.add(1, 'day');
			}
			missingRanges.push({start: rangeStart, end: current.subtract(1, 'day')});
			current = current.subtract(1, 'day'); // Revenir d'un jour pour le prochain incrément
		}
		
		current = current.add(1, 'day');
	}
	
	// Télécharger les plages manquantes
	for (const range of missingRanges) {
		console.log(`Fetching missing data from ${range.start.format("DD-MM-YYYY")} to ${range.end.format("DD-MM-YYYY")}`);
		const newData = await fetchData(range.start, range.end);
		populateCache(newData);
		result.push(...newData);
	}
	
	// Trier les résultats par date
	result.sort((a, b) => a[0] - b[0]);
	
	return result;
}

// Timer de debounce pour éviter les requêtes trop fréquentes
let updateDebounceTimer = null;

function getNewData(debut, fin) {
	// Annuler le timer précédent
	if (updateDebounceTimer) {
		clearTimeout(updateDebounceTimer);
	}
	
	// Debounce de 300ms avant de lancer la requête
	updateDebounceTimer = setTimeout(async () => {
		console.log(`getNewData: fetching from ${debut.format("DD-MM-YYYY")} to ${fin.format("DD-MM-YYYY")}`);
		const data = await fetchDataRange(debut, fin);
		chart.updateOptions({file: data});
		CurrStart = debut;
		CurrEnd = fin;
	}, 300);
}

// --------------------------------  global init ---------------------------------------------------
	$(document).on("mobileinit", function (event, ui) {
		$.mobile.defaultPageTransition = "slidefade";
		$.mobile.dialog.prototype.options.closeBtnText = "Retour";
		$.mobile.loader.prototype.options.theme = "b";
		$.mobile.eventLogger({deprecated:!0,showAlert:!0,events:{page:!0,navigation:!0},widgets:{page:!0,pagecontainer:!0}});
	});

	$('#logoff').keypress(function(e) {
		if(e.which == 13)  {		//Close dialog and/or submit here...
			// or if (e.keyCode == $.ui.keyCode.ENTER)
			$('#logoffButton').click();
		}
	});

	$('#dlg-login').keypress(function(e) {
		if(e.which == 13)  {		//Close dialog and/or submit here...
			// or if (e.keyCode == $.ui.keyCode.ENTER)
			$('#mainPageButton').click();
		}
	});

	
	// used to manage the keep alive and same page from diff contexts
	$(document).on("pagecontainerbeforechange", function (event, ui) {
		var toPageIsObj = (typeof ui.toPage == "object");							
		var toThePage;
		var session = maPiscine.Session.getInstance().get();
		var today = new Date();
		var timeLeft;

		(toPageIsObj) ? toThePage = ui.toPage.attr("id") : toThePage = ui.toPage.substring(ui.toPage.indexOf('#')+1);
		console.log("Call Before Change with toPageisObj="+toPageIsObj);
		console.log("move to page id : " + toThePage + "\n");
		if(ui.prevPage) console.log("Previous page was :"+ui.prevPage.attr("id")+"\n");

		// don't do check test if
		if( (ui.prevPage && ((ui.prevPage.attr("id") !== 'dlg-login') && 			// comming from dlg_login (regular login) 
							(ui.prevPage.attr("id") !== 'pageLogin')  && 			// or pageLogin
							(ui.prevPage.attr("id") !== 'dlg-EndSessionAlert') &&	// or in the re-login pannel
	//						 (ui.prevPage.attr("id") !== 'leftpanel') &&			// or to and from leftpannel
							(toThePage !== 'leftpanel') 
							) 
			) 
		){		// fin de la condition du If ..	
			if (expirationDate < today.getTime()) {						// check that the ttl is still valid move to login if not. 
				console.log('Session ttl expired: go to login diag');
				console.log('expiration is ' + expirationDate + ' and now is ' + today.getTime());
				(toPageIsObj) ? ui.toPage = $('#dlg-EndSessionAlert') : ui.toPage = '#dlg-EndSessionAlert';
			} else {																// session is still valid !
				timeLeft = 	(expirationDate - today.getTime())/1000;
				console.log('Session is still valid, time left to run : ' + timeLeft + ' secs');
			}
		}

		// now do regular stuff
		switch (toThePage) {
			case "pageLogin":
				if (!ui.prevPage) {                // Check session.keepSignedIn and redirect to main menu.
					var session = maPiscine.Session.getInstance().get(),
					today = new Date();
					if (session && (session.theExpirationDate > today.getTime())) {
						userName = session.username;
						passWord = session.passord;
						roles= session.userRoles;
						sessID= session.sessionId;
						expirationDate= session.thexpirationDate;
						mainPage= session.mainPage;
						ui.toPage = $(mainPage);	// the users page Principale
					}
				}
			break;

			case "pageRegisterLogin":
				if(ui.prevPage.attr("id") == "pageLogin"){
					console.log("comming from loging");
					$("#mainRegisterButton").text("Get Started").trigger('refresh');
					$("#pageRegisterTitle").text("Signup").trigger('refresh');
					$('#backToLoginButton').show();
					$('#rtnButton').hide();
					$("#flgLogin").val("true");  
				} else {
					console.log("Not comming from login");
					$("#mainRegisterButton").text("Add User").trigger('refresh');
					$("#pageRegisterTitle").text("Add New User").trigger('refresh');
					$('#backToLoginButton').hide();
					$('#rtnButton').show();
					$("#flgLogin").val("false");  
				}
			break;
			case "dlg-login":
				if(ui.prevPage.attr("id") == "pageLogin"){
					$("#dlg-login .ui-title").text("Login");
				} else {
					$("#dlg-login .ui-title").text("User Management");
				}
			break;
		}
	});

	// Event handler for left panel opening
	$(document).on("panelbeforeopen", "#leftpanel", function(event, ui) {
		console.log("[DEBUG] panelbeforeopen - leftpanel triggered, userMenu=", userMenu);
		if(!userMenu){
			console.log("[DEBUG] calling setUserUI from panelbeforeopen");
			setUserUI();
			userMenu = true;
		}
	});

	// Event handler for Options button - open panel of active page
	$(document).on("vclick", "a[href='#optionsPiscineManager']", function(event) {
		event.preventDefault();
		event.stopPropagation();
		
		console.log("[DEBUG] Options button vclick!");
		
		// Find panel in the button's parent page
		var currentPage = $(this).closest("[data-role='page']");
		var pageId = currentPage.attr("id");
		console.log("[DEBUG] Current page ID:", pageId);
		
		// Select panel within this specific page (use .find() instead of .children())
		var activePanel = currentPage.find("#optionsPiscineManager");
		console.log("[DEBUG] Panel found:", activePanel.length);
		
		if (activePanel.length) {
			console.log("[DEBUG] Opening panel on page:", pageId);
			activePanel.panel('open');
		} else {
			console.warn("[WARN] No panel found on page:", pageId);
		}
		
		return false;
	});

	$(document).on("pagecontainerbeforeshow", function(event, ui) {

		if (typeof ui.toPage !== "object") return;
		console.log("[DEBUG] pagecontainerbeforeshow triggered for:", ui.toPage.attr("id"));
		
		switch (ui.toPage.attr("id")) {
			case "dlg-login???":
				if(ui.prevPage.attr("id") == "pageLogin"){
					$("#dlg-login .ui-title").text("Login");
				} else {
					$("#dlg-login .ui-title").text("User Management");
				}
				$("#dlg-login").enhanceWithin();
			break;
		}

	});

// -------------- pages create inits (once for all ... )  ------------

// dialog logoff create inits
	$(document).delegate("#logoff-dlg", "pagebeforecreate", function () {
	//	$( document ).on('pageinit','#logoff-dlg',function() {		/ deprecated
		$( "#logoffButton" ).bind( "tap", function() {		// $btnSubmit.off("tap").on("tap", function () {
			console.log("ask for loging off\n");
			sessID = "";
			userName = "";
			passWord = "";
			roles = [0,0,0,0,0,0,0,0];
			mainPage = "";
			var expirationDate = new Date();
			maPiscine.Session.getInstance().set({										// reset user credentials
				username: "",
				sessionId: "",
				mainPage: "",
				expirationDate: expirationDate
			});
	//		$('#leftpanelMenu').collapsibleset("destroy");
			userMenu = false;
			$.mobile.changePage("#pageLogin");
		});  
	
	});	
		
	// page PiscinePrincipale create inits
	$(document).delegate("#pagePiscinePrincipale", "pagebeforecreate", function () {
	//$( document ).on('pagecreate','#pagePiscinePrincipale',function() {		// depricated 
		var power = true;
		var affRedox = true;
		var lampeSWToServer = true;
		var voletSWToServer = true;
		var EcranLigne1;
		var EcranLigne2;
		var EcranLigne3;


		// --- Gauges ---
			// PHgauge.setValue(75);

		var PHgauge = Gauge(document.getElementById("PHGauge"), {
			min: 4,
			max: 10.4,			// 7.2 centré
			value: 7.2,
			label: function(value) {				// label is the center digits
				if(value <= 4){
					return "---"
				} else {
					return Number.parseFloat(value).toFixed(1);
				}
			},  				
			color: function(value) {
			if(value < 5) {
					return "#ef4655"; // red
				}else if(value < 6.8) {
					return "#f7aa38"; // orange"  	        
			}else if(value < 7.6) {
					return "#5ee432"; // green	        
			}else if(value < 9) {
				return "#f7aa38"; // orange
			}else {
				return "#ef4655"; // red
			}
			}
		});
		
		var CLgauge = Gauge(document.getElementById("CLGauge"), {
			min: 0,
			max: 2.4,		// 1.2 centré
			value: 1.2,
			label: function(value) {				// label is the center digits
				if(value == 0){
					return "---"
				} else {
					return Number.parseFloat(value).toFixed(1);
				}
			},  				
			color: function(value) {
			if(value < 0.8) {
					return "#ef4655"; // red
				}else if(value < 1.1) {
					return "#f7aa38"; // orange"  	        
			}else if(value < 1.3) {
					return "#5ee432"; // green	        
			}else if(value < 1.6) {
				return "#f7aa38"; // orange
			}else {
				return "#ef4655"; // red
			}
		}
		});

		var RedoxGauge = Gauge(document.getElementById("RedoxGauge"), {
			min: 500,
			max: 900,		// 700 centré
			value: 700,
			label: function(value) {				// label is the center digits
				if(value <= 500){
					return "---"
				} else {
					return Number.parseInt(value).toFixed(0);
				}
			},  				
			color: function(value) {
			if(value < 600) {
				return "#ef4655"; // red
			}else if(value < 650) {
				return "#f7aa38"; // orange"  	        
			}else if(value < 750) {
					return "#5ee432"; // green	        
			}else if(value < 800) {
				return "#f7aa38"; // orange
			}else {
				return "#ef4655"; // red
			}
		}
		});

	// first init with redox gauge on
		console.log("First time, showing redox Gauge");
		$("#CLGaugeDiv").hide();
		$("#RedoxGaugeDiv").show();


	// switch redox/cl gauges on div tap

		$("#RedoxCLDiv").bind('tap',function(event, ui){
			event.preventDefault();
			console.log((affRedox) ? "AffRedox is true" : "AffRedox is false");
			if(!affRedox){
				console.log("Showing Redox Gauge");
				$("#CLGaugeDiv").hide();
				$("#RedoxGaugeDiv").show();
				affRedox = true;	
			} else {
				console.log("Showing CL Gauge")
				$("#CLGaugeDiv").show();
				$("#RedoxGaugeDiv").hide();
				affRedox = false;
			}
		})


	// --- Power switch ---

		$('#powerSW').click( function () {
			if (power == false) {										// then power on
				$('.screenOutput').removeClass('screenOff').addClass('screenOn');
				$('.screenFrame').removeClass('displayOff').addClass('displayOn');
				piscineEvent.start();
				power = true;
			} else {													// then power off
				$('.screenOutput').removeClass('screenOn').addClass('screenOff');
				$('.screenFrame').removeClass('displayOn').addClass('displayOff');
				$('#lampeLed').removeClass('ledOn').addClass('ledOff');
				$('#voletLed').removeClass('ledOn').addClass('ledOff');
				$('#PPLed').removeClass('ledOn').addClass('ledOff');
				$('#PACLed').removeClass('ledOn').addClass('ledOff');
				$('#PHLed').removeClass('ledOn').addClass('ledOff');
				$('#CLLed').removeClass('ledOn').addClass('ledOff');
				$('#P3Led').removeClass('ledOn').addClass('ledOff');
				$('#autoLed').removeClass('ledOn').addClass('ledOff');
				PHgauge.setValueAnimated(0, 1);
				CLgauge.setValueAnimated(0, 1);
				RedoxGauge.setValueAnimated(0, 1);
				document.getElementById("tempAir").value = '-----';
				$('#tempEau').val("-----");
				$('#tempInt').val("-----");
				$('#tempPAC').val("-----");
				if ($('#lampeSwitch').prop("checked")){
					$('#lampeSW').click();
				}
				if ($('#voletSwitch').prop("checked")){
					$('#voletSW').click();
				}
				piscineEvent.stop();
				power = false;
			}
		});

	// --- Lampe switch ---

		$('#lampeSW').click( function () {
			if (lampeSWToServer){
				var theVal = ($('#lampeSwitch').prop("checked")) ? 1 : 0;
				(lampeSWVal==0) ? lampeSWVal=1 : lampeSWVal=0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=lampe&val=' + lampeSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampe is success value is:"+lampeSWVal);
						var etat = (lampeSWVal == 1) ? "activée" : "désactivée";
						showToast("Lampe " + etat, 'success');
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampe, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						showToast("Échec commande lampe", 'error');
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else lampeSWToServer = true;
		});

	// --- Volet switch ---

		$('#voletSW').click( function () {
			if (voletSWToServer){
				var theVal = ($('#voletSwitch').prop("checked")) ? 1 : 0;
				(voletSWVal==0) ? voletSWVal=1 : voletSWVal=0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=volet&val=' + voletSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVolet is success value is:"+voletSWVal);
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVolet, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						showToast("Échec commande volet", 'error');
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else voletSWToServer = true;
		});

		function blink(selector){
			$(selector).fadeOut('slow', function(){
				$(this).fadeIn('slow', function(){
					blink(this);
				});
			});
		}
		
	// ----- server side events
		piscineEvent = $.SSE('/piscineEvents', {
			onOpen: function (e) {
				console.log("Open SSE to /piscineEvents");
				console.log(e);
			},
			onEnd: function (e) {
				console.log("Ending SSE PiscineEvent");
				console.log(e);
			},
			onError: function (e) {
				console.log("Could not connect to SSE /piscineEvents");
			},
			onMessage: function (e) {
				console.log("Message from /piscineEvents");
				console.log(e);
				data = $.trim(e.data);
				if(data.includes('hello!')){
					initPagePParams();
				}
			},
			options: {
				forceAjax: false
			},
			events: {
				piscineData: piscineDataServer,
				piscineLCDData: piscineDataLCDServer
			},
		});


		function initPagePParams(){
		// ------ init page ----
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=InitPagePrincipale',
				data: 'sess=' + sessID,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscinePagePrincip is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
		}

		function piscineDataServer(evt){
			var today = new Date();
			var timeLeft;
		
			console.log("PiscineData");
			console.log(evt);
			if(power == true){	
				if (expirationDate < today.getTime()) {						// check that the ttl is still valid move to login if not. 
					console.log('Session ttl expired: go to login diag');
					console.log('expiration is ' + expirationDate + ' and now is ' + today.getTime());
					showSessionExpiredDialog("Action utilisateur");
				} else {													// session is still valid so perform data!
					timeLeft = 	(expirationDate - today.getTime())/1000;
					console.log('Session is still valid, time left to run : ' + timeLeft + ' secs');
		
					data = $.trim(evt.data);
					var returnedData = JSON.parse(data);
					console.log("serverEvent json is " + JSON.stringify(returnedData));

					if(returnedData.hasOwnProperty('phVal')){
						PHgauge.setValueAnimated(returnedData.phVal/100, 1);
					}
					if(returnedData.hasOwnProperty('redoxVal')){
						console.log("processing redoxVal:" + parseInt(returnedData.redoxVal));
						RedoxGauge.setValueAnimated(parseInt(returnedData.redoxVal), 1);
					}
					if(returnedData.hasOwnProperty('clVal')){
						CLgauge.setValueAnimated(returnedData.clVal/100, 1);
					}
					if(returnedData.hasOwnProperty('tempAir')){
						$('#tempAir').val(returnedData.tempAir/100);
					}
					if(returnedData.hasOwnProperty('tempEau')){
						$('#tempEau').val(returnedData.tempEau/100);
					}
					if(returnedData.hasOwnProperty('tempInt')){
						$('#tempInt').val(returnedData.tempInt/100);
					}
					if(returnedData.hasOwnProperty('tempPAC')){
						$('#tempPAC').val(returnedData.tempPAC/100);
					}
					if(returnedData.hasOwnProperty('lampe')){
						if(returnedData.lampe == 0) {
							$('#lampeLed').removeClass('ledOn').addClass('ledOff');
							if ($('#lampeSwitch').is(":checked")){ 
								lampeSWToServer = false;
								$('#lampeSW').click();
							}
							lampeSWVal = 0;
						} else if(returnedData.lampe == 1) {	
							$('#lampeLed').removeClass('ledOff').addClass('ledOn');
							if (!$('#lampeSwitch').is(":checked")){ 
								lampeSWToServer = false;
								$('#lampeSW').click();
							}
							lampeSWVal = 1;
						}	
					}
					if(returnedData.hasOwnProperty('volet')){
						if(returnedData.volet == 0) {
							$('#voletLed').removeClass('ledOn').addClass('ledOff');
							if ($('#voletSwitch').is(":checked")){ 
								voletSWToServer = false;
								$('#voletSW').click();
							}
							voletSWVal = 0;
						} else if(returnedData.volet == 1) {	
							$('#voletLed').removeClass('ledOff').addClass('ledOn');
							if (!$('#voletSwitch').is(":checked")){ 
								voletSWToServer = false;
								$('#voletSW').click();
							}
							voletSWVal = 1;
						}	
					}
					if(returnedData.hasOwnProperty('PP')){
						if(returnedData.PP == 0) {
							$('#PPLed').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#PPLed').removeClass('ledOff').addClass('ledOn');
						}	
					}
					if(returnedData.hasOwnProperty('PAC')){
						if(returnedData.PAC == 0) {
							$('#PACLed').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#PACLed').removeClass('ledOff').addClass('ledOn');
						}	
					}
					if(returnedData.hasOwnProperty('PH')){
						if(returnedData.PH == 0) {
							$('#PHLed').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#PHLed').removeClass('ledOff').addClass('ledOn');
						}	
					}
					if(returnedData.hasOwnProperty('CL')){
						if(returnedData.CL == 0) {
							$('#CLLed').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#CLLed').removeClass('ledOff').addClass('ledOn');
						}	
					}
					if(returnedData.hasOwnProperty('P3')){
						if(returnedData.P3 == 0) {
							$('#P3Led').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#P3Led').removeClass('ledOff').addClass('ledOn');
						}	
					}
					if(returnedData.hasOwnProperty('autoMode')){
						if(returnedData.autoMode == 0) {
							$('#autoLed').removeClass('ledOn').addClass('ledOff');
						} else {	
							$('#autoLed').removeClass('ledOff').addClass('ledOn');
						}	
					}
				}
			}	
		}

		function piscineDataLCDServer(evt){
			var today = new Date();
			var timeLeft;
		
			console.log("PiscineLCDData");
			console.log(evt);
			if(power == true){	
				if (expirationDate < today.getTime()) {						// check that the ttl is still valid move to login if not. 
					console.log('Session ttl expired: go to login diag');
					console.log('expiration is ' + expirationDate + ' and now is ' + today.getTime());
					showSessionExpiredDialog("Action utilisateur");
				} else {													// session is still valid so perform data!
					timeLeft = 	(expirationDate - today.getTime())/1000;
					console.log('Session is still valid, time left to run : ' + timeLeft + ' secs');
		
					data = $.trim(evt.data);
					var returnedData = JSON.parse(data);
					console.log("serverEvent json is " + JSON.stringify(returnedData));

					if(returnedData.hasOwnProperty('ligne1')){
						EcranLigne1 = returnedData.ligne1;
						if(returnedData.hasOwnProperty('ligne2')){
							EcranLigne2 = returnedData.ligne2;
						} else {
							EcranLigne2 = "";
						}
						if(returnedData.hasOwnProperty('ligne3')){
							EcranLigne3 = returnedData.ligne3;
						} else {
							EcranLigne3 = "";
						}
					}
					if(returnedData.hasOwnProperty('Alerte')){										// mode Alerte 
						$('.screenOutput').empty();
						var wordDiv = '<h4 class="screenTextTitle"> Piscine Manager</h4>'+
						'<P class="screenTextStatus" id="alertMsg">' + EcranLigne1 +'</P>'+
						'<P class="screenTextLine">' + EcranLigne2 + '<BR>' + EcranLigne3 +'</P>';
						$('.screenOutput').append(wordDiv).trigger( "create" );
						blink('#alertMsg');
					} else {																		// mode normal Auto ou manuel	
						$('.screenOutput').empty();
						var wordDiv = '<h4 class="screenTextTitle"> Piscine Manager</h4>'+
						'<P class="screenTextStatus">' + EcranLigne1 +'</P>'+
						'<P class="screenTextLine">' + EcranLigne2 + '<BR>' + EcranLigne3 +'</P>';
						$('.screenOutput').append(wordDiv).trigger( "create" );
					}
				}	
			}
		}


		(function loop() {
			
				var value1 = Math.random() * 10;
				var value2 = Math.random() * 2;
				
			if(power == true){	
	//			PHgauge.setValueAnimated(value1, 1);
	//			CLgauge.setValueAnimated(value2, 1);
			}
	//		window.setTimeout(loop, 4000);
			
		})();
			
		
	});	 

	// page PiscineParametres create inits
	$(document).delegate("#pagePiscineParametres", "pagebeforecreate", function () {

		var lampeParamSWToServer = true;
		var voletParamSWToServer = true;
		var PPSWToServer = true;
		var PACSWToServer = true;
		var PmpPHSWToServer = true;
		var PmpCLSWToServer = true;
		var PmpALGSWToServer = true;
		var ModeManuSWToServer = true;
		var tempFixRelToServer = true;
		var PHRefToServer = true;
		var redoxRefToServer = true;
		var typeTempToServer = true;
		var typeP3ToServer = true;
		var p3QtyToServer = true;
		var p3FrqToServer = true;
		var clearAlertToServer = true;
		var flowAlertToServer = true;
		var innondAlertToServer = true;
		var pacAlertToServer = true;
		var nivPHToServer = true;
		var nivCLToServer = true;
		var nivALGToServer = true;
		var pmpPHToServer = true;
		var pmpCLToServer = true;
		var pmp3ToServer = true;
		var lampeAutoToServer = true;
		var voletAutoToServer = true;
		var pacViaRouterToServer = true;
		var localAutoLoginToServer = true;


				

	// inits
		$('.startClockpicker').clockpicker();
		$('.stopClockpicker').clockpicker();
		$('.startPACClockpicker').clockpicker();
		$('.stopPACClockpicker').clockpicker();


	// --- Lampe et volet Switches ---
		// --- Lampe switch ---
		$('#lampeSWParam').click( function () {
			if (lampeParamSWToServer){
				var theVal = $('#lampeSwitchParam').is(":checked") ? 1 : 0;
				(lampeSWVal == 0) ? lampeSWVal=1 : lampeSWVal=0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=lampe&val=' + lampeSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampe is success value is:"+lampeSWVal);
						var etat = (lampeSWVal == 1) ? "activée" : "désactivée";
						showToast("Lampe " + etat, 'success');
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeParam, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						showToast("Échec commande lampe", 'error');
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else lampeParamSWToServer = true;
		});

		// --- Volet switch ---
		$('#voletSWParam').click( function () {
			if (voletParamSWToServer){
				var theVal = $('#voletSwitchParam').is(":checked") ? 1 : 0;
				(voletSWVal == 0) ? voletSWVal=1 : voletSWVal=0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=volet&val=' + voletSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVolet is success value is:"+voletSWVal);
						var etat = (voletSWVal == 1) ? "ouvert" : "fermé";
						showToast("Volet " + etat, 'success');
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVolet, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						showToast("Échec commande volet", 'error');
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else voletParamSWToServer = true;
		});

	// --- Leds et Mode Manu Switches ---
		// --- ModeManu switch ---
		$('#ModeManuSW').click( function () {
			if (ModeManuSWToServer){
				var theVal = $('#ModeManuSWitch').is(":checked") ? 0 : 1; 	// if manu is checker then auto is off
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=autoMode&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setModeManu is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setModeManu, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else ModeManuSWToServer = true;
		});

		// --- PPSWitch switch ---
		$('#PPSW').click( function () {
			if (PPSWToServer){
				var theVal = $('#PPSWitch').is(":checked") ? -1 : 0;		// -1 is pp on in manual mode, 0 is off
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=PP&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPP is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPP, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PPSWToServer = true;
		});

		// --- PACSWitch switch ---
		$('#PACSW').click( function () {
			if (PACSWToServer){
//				var theState = $('#PACSWitch').prop("checked") ? "ON" : "OFF";
				var theVal = $('#PACSWitch').is(":checked") ? -1 : 0;		// -1 is manu, 0 is off, XX is on auto
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=PAC&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPAC is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPAC, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PACSWToServer = true;
		});

		// --- PmpPHSWitch switch ---
		$('#PmpPHSW').click( function () {
			if (PmpPHSWToServer){
				var theVal = $('#PmpPHSWitch').is(":checked") ? -1 : 0;	// -1 is manu, 0 is off, XX is on auto
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=PH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PmpPHSWToServer = true;
		});

		// --- PmpCLSWitch switch ---
		$('#PmpCLSW').click( function () {
			if (PmpCLSWToServer){
				var theVal = $('#PmpCLSWitch').is(":checked") ? -1 : 0;			// -1 is manu, 0 is off, XX is on auto
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=CL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PmpCLSWToServer = true;
		});
	
		// --- PmpALGSWitch switch ---
		$('#PmpALGSW').click( function () {
			if (PmpALGSWToServer){
				var theVal = $('#PmpALGSWitch').is(":checked") ? -1 : 0;		// -1 is manu, 0 is off, XX is on auto
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=P3&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpALG is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpALG, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PmpALGSWToServer = true;
		});

	// --- Pompe principale ---

		// --- Start Time ---
		$('#PPstart').change(function(){
			var startHour = 0;
			var startTime = "";

			startTime = this.value;
			startHour = parseInt(startTime);			// get only hours
			console.log('New Start Time is '+startHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=strtTPP&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPPStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPPStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

		// --- Stop Time ---
		$('#PPstop').change(function(){
			var stopHour = 0;
			var stopTime = "";

			stopTime = this.value;
			stopHour = parseInt(stopTime);			// get only hours
			console.log('New Stop Time is '+stopHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=stopTPP&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPPStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPPStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

	// --- PAC ---
		// --- Start Time ---
		$('#PACstart').change(function(){
			var startHour = 0;
			var startTime = "";

			startTime = this.value;
			startHour = parseInt(startTime);			// get only hours
			console.log('New PAC Start Time is '+startHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=strtTPAC&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPACStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPACStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

		// --- Stop Time ---
		$('#PACstop').change(function(){
			var stopHour = 0;
			var stopTime = "";

			stopTime = this.value;
			stopHour = parseInt(stopTime);			// get only hours
			console.log('New PAC Stop Time is '+stopHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=stopTPAC&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPACStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPACStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

	// --- PAC Temperature ---
		var tempFix = 24;
		var tempRel = 0;
		var tempFixRel = false;		// false:fixe; true:relatif

		// --- TypeTempSW ---
		$('#TypeTempSW').click( function () {			// TypeTemp : false=fixe, true=rel
			var theVal = $('#TypeTempSWitch').is(":checked") ? 1 : 0;
			if (theVal == 1) {												// Then moving from fixe to rel
				$('#TempFixRelLabel').text("Temperature Relative");
				$("#TempFixRel").prop({
					min: -20,
					max: 20,
					value: tempRel
				}).slider("refresh");
				tempFixRel = true;		// false:fixe; true:relatif
			} else {														// then moving from Rel to Fixe
				$('#TempFixRelLabel').text("Temperature Absolue");
				$("#TempFixRel").prop({
					min: 18,
					max: 30,
					value: tempFix
				}).slider("refresh");
				tempFixRel = false;		// false:fixe; true:relatif
			}
			if (typeTempToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=typeTemp&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTypeTemp is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTypeTemp, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else typeTempToServer = true;
		});

		// --- TempFixRel Slider ---
		$("#TempFixRelSlider").change(function(){
			var temp = $("#TempFixRel").slider().val();
			console.log('New temp is '+ temp);
			if (tempFixRelToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=tempFixRel&val=' + temp,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTempFixRel is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTempFixRel, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else tempFixRelToServer = true;
		});

		// --- Pac via Router ---
		$('#pacViaRouterSW').click( function () {
			if (pacViaRouterToServer){
				var theVal = $('#pacViaRouterSWitch').is(":checked") ? 1 : 0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=pacViaRouter&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPacViaRouter is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPacViaRouter, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pacViaRouterToServer = true;
		});

		// --- Local Auto Login ---
		$('#localAutoLoginSW').click( function () {
			if (localAutoLoginToServer){
				var theVal = $('#localAutoLoginSWitch').is(":checked") ? 1 : 0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=localAutoLogin&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLocalAutoLogin is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLocalAutoLogin, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else localAutoLoginToServer = true;
		});



	// --- PH et Redox reference ---
		// --- PH ref Slider ---
		$("#PHRefSlider").change(function(){
			var phRef = $("#PHRef").slider().val();
			console.log('New PH ref is '+ phRef);
			if (PHRefToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=phRef&val=' + phRef*10,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPHRef is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPHRef, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else PHRefToServer = true;
		});
		
		// --- Redox ref Slider ---
		$("#redoxRefSlider").change(function(){
			var redoxRef = $("#redoxRef").slider().val();
			console.log('New CL ref is '+ redoxRef);
			if (redoxRefToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=redoxRef&val=' + redoxRef,
					dataType: "text",
					success: function(data){
						console.log("Call to /setredoxRef is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setredoxRef, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else redoxRefToServer = true;
		});
		
	// --- Lampe Auto ---
		// --- lampeAuto switch ---
		$('#lampeAutoSW').click( function () {
			if (lampeAutoToServer){
				var theVal = $('#lampeAutoSWitch').is(":checked") ? 1 : 0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=lampeAuto&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeAuto is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeAuto, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else lampeAutoToServer = true;
		});

		// --- Lampe Start Time ---
		$('#lampeStart').change(function(){
			var startHour = 0;
			var startTime = "";

			startTime = this.value;
			startHour = parseInt(startTime);			// get only hours
			console.log('New Start Time is '+startHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=strtLampe&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

		// --- Lampe Stop Time ---
		$('#lampeStop').change(function(){
			var stopHour = 0;
			var stopTime = "";

			stopTime = this.value;
			stopHour = parseInt(stopTime);			// get only hours
			console.log('New Stop Time is '+stopHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=stopLampe&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});


	// --- Volet Auto ---
		// --- voletAuto switch ---
		$('#voletAutoSW').click( function () {
				if (voletAutoToServer){
				var theVal = $('#voletAutoSWitch').is(":checked") ? 1 : 0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=voletAuto&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletAuto is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletAuto, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else voletAutoToServer = true;
		});

		// --- volet ouv Time ---
		$('#voletOuv').change(function(){
			var ouvHour = 0;
			var ouvTime = "";

			ouvTime = this.value;
			ouvHour = parseInt(ouvTime);			// get only hours
			console.log('New Ouv Time is '+ouvHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=ouvVolet&val=' + ouvHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletOuvTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletOuvTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});

		// --- volet ferm Time ---
		$('#voletFerm').change(function(){
			var fermHour = 0;
			var fermTime = "";

			fermTime = this.value;
			fermHour = parseInt(fermTime);			// get only hours
			console.log('New Ferm Time is '+fermHour);
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=fermeVolet&val=' + fermHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletFermTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletFermTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
		});



	// --- P3 SWitches ---
																			
		var typeP3 = 1;														

		// --- P3TYPE Switch ---
		$('#TypeP3SW').click( function () {									// type pompe 3 : 0=off, 1=PH-, 2=ALG -1:INV
			if (!$('#TypeP3SWitch').prop("checked")){						// switch P3 PH-
				$("#P3QtyDiv").hide();
				$("#P3FrqDiv").hide();
				typeP3 = 1;
			} else {														// switch P3 Other
				$("#P3QtyDiv").show();
				$("#P3FrqDiv").show();
				typeP3 = 2;
			}
			if (typeP3ToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=typeP3&val=' + typeP3,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTypeP3 is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else typeP3ToServer = true;
		});

		// --- P3ONOFF Switch ---
		$('#P3ONOFFSW').click( function () {								// type pompe 3 : 0=off, 1=PH-, 2=ALG -1:INV
			if (!$('#P3ONOFFSWitch').prop("checked")){						// switch P3 OFF
				$("#TypeP3Div").hide();
				$("#P3QtyDiv").hide();
				$("#P3FrqDiv").hide();
				if (typeP3ToServer){
					$.ajax({
						type: 'POST',
						url: '/setPiscine?action=Parametres',
						data: 'sess=' + sessID + '&param=typeP3&val=0',
						dataType: "text",
						success: function(data){
							console.log("Call to /setTypeP3 is success");
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
							}
						}
					});
				} else typeP3ToServer = true;
			} else {														// switch P3 OFF to ON
				$("#TypeP3Div").show();
				if ($('#TypeP3SWitch').prop("checked")){					// switch P3 Other
					$("#P3QtyDiv").show();
					$("#P3FrqDiv").show();
				}
				if (typeP3ToServer){
					$.ajax({
						type: 'POST',
						url: '/setPiscine?action=Parametres',
						data: 'sess=' + sessID + '&param=typeP3&val=' + typeP3,
						dataType: "text",
						success: function(data){
							console.log("Call to /setTypeP3 is success");
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
							}
						}
					});
				} else typeP3ToServer = true;
			}	
		});

		// --- Quantite Slider ---
		$("#P3QtySlider").change(function(){
			var p3Qty = $("#P3Qty").slider().val();
			console.log('New p3Qty is '+ p3Qty);
			if (p3QtyToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=p3Qty&val=' + p3Qty,
					dataType: "text",
					success: function(data){
						console.log("Call to /setP3Qty is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setP3Qty, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else p3QtyToServer = true;
		});
		
		// --- Frequence Slider ---
		$("#P3FrqSlider").change(function(){
			var p3Frq = 0; 

			p3Frq = $("#P3Frq").slider().val();
			console.log('New p3Frq from slider is '+ p3Frq);
			if (p3FrqToServer){
				console.log('Sending ajax with '+ p3Frq + 'from slider');
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
					dataType: "text",
					success: function(data){
						console.log("Call to /setP3Frq is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else p3FrqToServer = true;
		});

		$('#P3FrqHebdo').click( function () {							
			var p3Frq = 0; 

			if ($('#P3FrqHebdo').prop("checked")){						
				console.log("frqHebdo is checked sending 100");
				$('#P3FrqMensuel').prop("checked", false).checkboxradio('refresh');
				$('#P3Frq').slider('disable');
				console.log('Sending ajax with 100 from hebdo');
				p3Frq = 100;
			} else {
				console.log("frqHebdo is unChecked should enable slider");
				$('#P3Frq').slider('enable');			
				p3Frq = $("#P3Frq").slider().val();
			}	
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=Parametres',
				data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
				dataType: "text",
				success: function(data){
					console.log("Call to /setP3Frq is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
		});

		$('#P3FrqMensuel').click( function () {							
			var p3Frq = 0; 

			if ($('#P3FrqMensuel').prop("checked")){						
				console.log("frqMensuel is checked sending 1000");
				$('#P3FrqHebdo').prop("checked", false).checkboxradio('refresh');
				$('#P3Frq').slider('disable');
				console.log('Sending ajax with 1000 from mensuel');
				p3Frq = 1000;
			} else {
				console.log("frqMensuel is unChecked should enable slider");
				$('#P3Frq').slider('enable');			
				p3Frq = $("#P3Frq").slider().val();
			}	
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=Parametres',
				data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
				dataType: "text",
				success: function(data){
					console.log("Call to /setP3Frq is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
});

		// --- Alertes ---
		// --- ClearAlertSWitch switch ---
		$('#ClearAlertSW').click( function () {
			if (clearAlertToServer){
				var theVal = $('#ClearAlertSWitch').is(":checked") ? 1 : 0;
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=clearAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /clearAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /clearAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else clearAlertToServer = true;
		});

		// --- FlowAlertSWitch switch ---
		$('#FlowAlertSW').click( function () {
			if (flowAlertToServer){
				var theVal = $('#FlowAlertSWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=flowAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /flowAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /flowAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else flowAlertToServer = true;
		});

		// --- InnondAlertSWitch switch ---
		$('#InnondAlertSW').click( function () {
			if (innondAlertToServer){
				var theVal = $('#InnondAlertSWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=innondAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /innondAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /innondAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else innondAlertToServer = true;
		});

		// --- PacAlertSWitch switch ---
		$('#PACAlertSW').click( function () {
			if (pacAlertToServer){
				var theVal = $('#PACAlertSWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=pacAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /pacAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /pacAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pacAlertToServer = true;
		});

		// --- NivPHSWitch switch ---
		$('#NivPHSW').click( function () {
			if (nivPHToServer){
				var theVal = $('#NivPHSWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=nivPH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else nivPHToServer = true;
		});

		// --- NivCLSWitch switch ---
		$('#NivCLSW').click( function () {
			if (nivCLToServer){
				var theVal = $('#NivCLSWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=nivCL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else nivCLToServer = true;
		});

		// --- NivALGSWitch switch ---
		$('#NivPmp3SW').click( function () {
			if (nivALGToServer){
				var theVal = $('#NivPmp3SWitch').is(":checked") ? 0 : 1;		// checked means OK unchecked is invalid
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=nivALG&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivALG is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivALG, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else nivALGToServer = true;
		});


	// --- Pompes ---
		// --- PmpPHSWitch switch ---
		$('#invPmpPHSW').click( function () {
			if (pmpPHToServer){
				var theVal = $('#invPmpPHSWitch').is(":checked") ? 0 : -2;				// unchecked means invalid (-2)
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=pmpPH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmpPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmpPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pmpPHToServer = true;
		});

		// --- PmpCLSWitch switch ---
		$('#invPmpCLSW').click( function () {
			if (pmpCLToServer){
				var theVal = $('#invPmpCLSWitch').is(":checked") ? 0 : -2;				// unchecked means invalid (-2)
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=pmpCL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmpCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmpCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pmpCLToServer = true;
		});

		// --- Pmp3SWitch switch ---
		$('#invPmp3SW').click( function () {
			if (pmp3ToServer){
				var theVal = $('#invPmp3SWitch').is(":checked") ? 0 : -2;				// unchecked means invalid (-2)
				$.ajax({
					type: 'POST',
					url: '/setPiscine?action=Parametres',
					data: 'sess=' + sessID + '&param=pmp3&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmp3 is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmp3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							showSessionExpiredDialog("Action utilisateur");		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pmp3ToServer = true;
		});

	// ----- server side events
		piscineParamsEvent = $.SSE('/piscineEvents ', {	//piscineParamsEvents
			onOpen: function (e) {
				console.log("Open SSE to /piscineParamsEvents");
				console.log(e);
			},
			onEnd: function (e) {
				console.log("Ending SSE PiscineEvent");
				console.log(e);
			},
			onError: function (e) {
				console.log("Could not connect to SSE /piscineParamsEvents");
			},
			onMessage: function (e) {
				console.log("Message from /piscineParamsEvents");
				console.log(e);
				data = $.trim(e.data);
				if(data.includes('hello!')){
					initPageParamParams();
				}
			},
			options: {
				forceAjax: false
			},
			events: {
				piscineParamsData: piscineParamsDataServer
			},
		});

		function initPageParamParams(){
		// ------ init page ----
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=InitPageParams',
				data: 'sess=' + sessID,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscinePageParams is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePageParams, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
		}

		function piscineParamsDataServer(evt){
			var today = new Date();
			var timeLeft;

			console.log("PiscineParamsData");
			console.log(evt);
			if (expirationDate < today.getTime()) {						// check that the ttl is still valid move to login if not. 
				console.log('Session ttl expired: go to login diag');
				console.log('expiration is ' + expirationDate + ' and now is ' + today.getTime());
				showSessionExpiredDialog("Action utilisateur");
			} else {													// session is still valid so perform data!
				timeLeft = 	(expirationDate - today.getTime())/1000;
				console.log('Session is still valid, time left to run : ' + timeLeft + ' secs');

				data = $.trim(evt.data);
				var returnedData = JSON.parse(data);
				console.log("serverEvent json is " + JSON.stringify(returnedData));

				if(returnedData.hasOwnProperty('lampe')){
					if(returnedData.lampe == 0) {
						$('#lampeLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#lampeSwitchParam').prop("checked")){ 
							lampeParamSWToServer = false;
							$('#lampeSWParam').click();
						}
						lampeSWVal = 0;
					} else if(returnedData.lampe == 1) {	
						$('#lampeLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#lampeSwitchParam').prop("checked")){ 
							lampeParamSWToServer = false;
							$('#lampeSWParam').click();
						}
						lampeSWVal = 1;
					}	
				}
				if(returnedData.hasOwnProperty('volet')){
					if(returnedData.volet == 0) {
						$('#voletLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#voletSwitchParam').prop("checked")){ 
							voletParamSWToServer = false;
							$('#voletSWParam').click();
						}
						voletSWVal = 0;
					} else if(returnedData.volet == 1) {	
						$('#voletLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#voletSwitchParam').prop("checked")){ 
							voletParamSWToServer = false;
							$('#voletSWParam').click();
						}
						voletSWVal = 1;
					}	
				}
				if(returnedData.hasOwnProperty('PP')){
					if(returnedData.PP == 0) {											// PP is stoped
						$('#PPLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#PPSWitch').prop("checked")){ 
							PPSWToServer = false;
							$('#PPSW').click();
						}
					} else {	
						$('#PPLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#PPSWitch').prop("checked")){ 
							PPSWToServer = false;
							$('#PPSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('PAC')){
					if(returnedData.PAC == 0) {
						$('#PACLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#PACSWitch').prop("checked")){ 
							PACSWToServer = false;
							$('#PACSW').click();
						}
					} else {	
						$('#PACLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#PACSWitch').prop("checked")){ 
							PACSWToServer = false;
							$('#PACSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('PH')){					//valeur: -2=invalid,-1=manu,0=off,X=on duree en mn
					if((returnedData.PH == 0) || (returnedData.PH == -2)) {
						$('#PHLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#PmpPHSWitch').prop("checked")){ 
							PmpPHSWToServer = false;
							$('#PmpPHSW').click();
						}
						if(returnedData.PH == -2) {			// pmp is invalidated
							if ($('#invPmpPHSWitch').prop("checked")){ 
								PmpPHSWToServer = false;
								$('#invPmpPHSW').click();
							}
						}
					} else {	
						$('#PHLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#PmpPHSWitch').prop("checked")){ 
							PmpPHSWToServer = false;
							$('#PmpPHSW').click();
						}
						if (!$('#invPmpPHSWitch').prop("checked")){ 
							PmpPHSWToServer = false;
							$('#invPmpPHSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('CL')){					//valeur: -2=invalid,-1=manu,0=off,X=on duree en mn
					if((returnedData.CL == 0) || (returnedData.CL == -2)) {
						$('#CLLedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#PmpCLSWitch').prop("checked")){ 
							PmpCLSWToServer = false;
							$('#PmpCLSW').click();
						}
						if(returnedData.CL == -2) {			// pmp is invalidated
							if ($('#invPmpCLSWitch').prop("checked")){ 
								PmpCLSWToServer = false;
								$('#invPmpCLSW').click();
							}
						}
					} else {	
						$('#CLLedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#PmpCLSWitch').prop("checked")){ 
							PmpCLSWToServer = false;
							$('#PmpCLSW').click();
						}
						if (!$('#invPmpCLSWitch').prop("checked")){ 
							PmpCLSWToServer = false;
							$('#invPmpCLSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('P3')){					//valeur: -2=invalid,-1=manu,0=off,X=on duree en mn
					if((returnedData.P3 == 0) || (returnedData.P3 == -2)){
						$('#P3LedParam').removeClass('ledOn').addClass('ledOff');
						if ($('#PmpALGSWitch').prop("checked")){ 
							PmpALGSWToServer = false;
							$('#PmpALGSW').click();
						}
						if(returnedData.P3 == -2) {			// pmp is invalidated
							if ($('#invPmp3SWitch').prop("checked")){ 
								PmpALGSWToServer = false;
								$('#invPmp3SW').click();
							}
							if ($('#P3ONOFFSWitch').is(":checked")){ 					// if ON set to OFF 
								typeP3ToServer = false;
								$('#P3ONOFFSW').click();
							}
						}
					} else {	
						$('#P3LedParam').removeClass('ledOff').addClass('ledOn');
						if (!$('#PmpALGSWitch').prop("checked")){ 
							PmpALGSWToServer = false;
							$('#PmpALGSW').click();
						}
						if (!$('#invPmp3SWitch').prop("checked")){ 
							PmpALGSWToServer = false;
							$('#invPmp3SW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('autoMode')){
					if(returnedData.autoMode == 0) {									// if auto is 0 then manu is on 
						$('#autoLedParam').removeClass('ledOn').addClass('ledOff');
						$('#PPSWitch').prop('disabled', false).checkboxradio('refresh');
						$('#PACSWitch').prop('disabled', false).checkboxradio('refresh');
						$('#PmpPHSWitch').prop('disabled', false).checkboxradio('refresh');
						$('#PmpCLSWitch').prop('disabled', false).checkboxradio('refresh');
						$('#PmpALGSWitch').prop('disabled', false).checkboxradio('refresh');
						if (!$('#ModeManuSWitch').is(":checked")){ 
							ModeManuSWToServer = false;
							$('#ModeManuSW').click();									// set manusw to on
						}
				} else {															// auto is 1 so manu should be off					
						$('#autoLedParam').removeClass('ledOff').addClass('ledOn');
						$('#PPSWitch').prop('disabled', true).checkboxradio('refresh');
						$('#PACSWitch').prop('disabled', true).checkboxradio('refresh');
						$('#PmpPHSWitch').prop('disabled', true).checkboxradio('refresh');
						$('#PmpCLSWitch').prop('disabled', true).checkboxradio('refresh');
						$('#PmpALGSWitch').prop('disabled', true).checkboxradio('refresh');
						if ($('#ModeManuSWitch').is(":checked")){ 
							ModeManuSWToServer = false;
							$('#ModeManuSW').click();									// set manu sw to off
						}
				}	
				}
				if(returnedData.hasOwnProperty('strtTPP')){
					$('#PPstart').val(returnedData.strtTPP);
				}
				if(returnedData.hasOwnProperty('stopTPP')){
					$('#PPstop').val(returnedData.stopTPP);
				}
				if(returnedData.hasOwnProperty('strtTPAC')){
					$('#PACstart').val(returnedData.strtTPAC);
				}
				if(returnedData.hasOwnProperty('stopTPAC')){
					$('#PACstop').val(returnedData.stopTPAC);
				}
				if(returnedData.hasOwnProperty('pacViaRouter')){
					if(returnedData.pacViaRouter == 0) {
						if ($('#pacViaRouterSWitch').prop("checked")){ 
							pacViaRouterToServer = false;
							$('#pacViaRouterSW').click();
						}
					} else if(returnedData.pacViaRouter == 1) {	
						if (!$('#pacViaRouterSWitch').prop("checked")){ 
							pacViaRouterToServer = false;
							$('#pacViaRouterSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('localAutoLogin')){
					if(returnedData.localAutoLogin == 0) {
						if ($('#localAutoLoginSWitch').prop("checked")){ 
							localAutoLoginToServer = false;
							$('#localAutoLoginSW').click();
						}
					} else if(returnedData.localAutoLogin == 1) {	
						if (!$('#localAutoLoginSWitch').prop("checked")){ 
							localAutoLoginToServer = false;
							$('#localAutoLoginSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('lampeAuto')){
					if(returnedData.lampeAuto == 0) {
						if ($('#lampeAutoSWitch').is(":checked")){ 
							lampeAutoToServer = false;
							$('#lampeAutoSW').click();
						}
					} else if(returnedData.lampeAuto == 1) {	
						if (!$('#lampeAutoSWitch').is(":checked")){ 
							lampeAutoToServer = false;
							$('#lampeAutoSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('strtLampe')){
					$('#lampeStart').val(returnedData.strtLampe);
				}
				if(returnedData.hasOwnProperty('stopLampe')){
					$('#lampeStop').val(returnedData.stopLampe);
				}
				if(returnedData.hasOwnProperty('voletAuto')){
					if(returnedData.voletAuto == 0) {
						if ($('#voletAutoSWitch').is(":checked")){ 
							voletAutoToServer = false;
							$('#voletAutoSW').click();
						}
					} else if(returnedData.voletAuto == 1) {	
						if (!$('#voletAutoSWitch').is(":checked")){ 
							voletAutoToServer = false;
							$('#voletAutoSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('ouvVolet')){
					$('#voletOuv').val(returnedData.ouvVolet);
				}
				if(returnedData.hasOwnProperty('fermeVolet')){
					$('#voletFerm').val(returnedData.fermeVolet);
				}
				if(returnedData.hasOwnProperty('typeTemp')){					// type temp controler : 0=tempRelatif, 1=tempFixe 
																				// web 0=fixe, 1=rel    
					if(returnedData.typeTemp == 1) {							// ask to move to rel
						if (!$('#TypeTempSWitch').is(":checked")){ 
							typeTempToServer = false;
							$('#TypeTempSW').click();
						}
						tempFixRel = true;									// relatif
					} else if (returnedData.typeTemp == 0){						// move to fix
						if ($('#TypeTempSWitch').is(":checked")){ 
							typeTempToServer = false;
							$('#TypeTempSW').click();
						}
						tempFixRel = false;									// fixe
					}	
				}
				if(returnedData.hasOwnProperty('tempFix')){						// new TempFix value 
					tempFix = parseInt(returnedData.tempFix);					// save new temp fix
					if (!tempFixRel){										// if type temp is fix	then update slider
						tempFixRelToServer = false;
						$("#TempFixRel").prop({
							value: tempFix
						}).slider("refresh");
					}
				}
				if(returnedData.hasOwnProperty('tempRel')){						// new TempRel value 
					tempRel = parseInt(returnedData.tempRel);					// save new temp fix
					if (tempFixRel){										// if type temp is Rel	then update slider 
						tempFixRelToServer = false;
						$("#TempFixRel").prop({
							value: tempRel
						}).slider("refresh");
					}
				}
				if(returnedData.hasOwnProperty('phRef')){						 
					PHRefToServer = false;
					var theVal = parseFloat(returnedData.phRef/10);
					$("#PHRef").prop({
						value: theVal					// new phref value
					}).slider("refresh");
				}
				if(returnedData.hasOwnProperty('redoxRef')){						 
					redoxRefToServer = false;
					$("#redoxRef").prop({
						value: parseInt(returnedData.redoxRef)					// new phref value
					}).slider("refresh");
				}
				if(returnedData.hasOwnProperty('typeP3')){						// type pompe 3 : 0=off, 1=PH-, 2=ALG -1:INV
					if(returnedData.typeP3 == 1) {								// move to PH-
						if (!$('#P3ONOFFSWitch').is(":checked")){ 					// if OFF set to on 
							typeP3ToServer = false;
							$('#P3ONOFFSW').click();
						}
						if ($('#TypeP3SWitch').is(":checked")){ 					// if set to Other then click to move to PH- 
							typeP3ToServer = false;
							$('#TypeP3SW').click();
						}
						if (!$('#invPmp3SWitch').prop("checked")){ 
							PmpALGSWToServer = false;
							$('#invPmp3SW').click();
						}
					} else if(returnedData.typeP3 == 2) {						// move to Other
						if (!$('#P3ONOFFSWitch').is(":checked")){ 					// if OFF set to on 
							typeP3ToServer = false;
							$('#P3ONOFFSW').click();
						}
						if (!$('#TypeP3SWitch').is(":checked")){ 					// if set to PH- then click to move to Other
							typeP3ToServer = false;
							$('#TypeP3SW').click();
						}
						if (!$('#invPmp3SWitch').prop("checked")){ 
							PmpALGSWToServer = false;
							$('#invPmp3SW').click();
						}
					} else if(returnedData.typeP3 == -1){							// move to invalid
						if ($('#P3ONOFFSWitch').is(":checked")){ 					// if ON set to OFF 
							typeP3ToServer = false;
							$('#P3ONOFFSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('p3Qty')){						 
					p3QtyToServer = false;
					$("#P3Qty").prop({
						value: parseFloat(returnedData.p3Qty)					// new p3Qty value
					}).slider("refresh");
				}
				if(returnedData.hasOwnProperty('p3Frq')){						 
					p3FrqToServer = false;
					theVal = parseFloat(returnedData.p3Frq);
					if(theVal==100){			// hebdo
						$('#P3FrqHebdo').prop("checked",true).checkboxradio('refresh');
						$('#P3FrqMensuel').prop("checked", false).checkboxradio('refresh');
						$('#P3Frq').slider('disable');		
					} else if(theVal==1000){	// mensuel
						$('#P3FrqMensuel').prop("checked", true).checkboxradio('refresh');
						$('#P3FrqHebdo').prop("checked", false).checkboxradio('refresh');
						$('#P3Frq').slider('disable');		
					} else {					// heures
						$('#P3FrqHebdo').prop("checked", false).checkboxradio('refresh');
						$('#P3FrqMensuel').prop("checked", false).checkboxradio('refresh');
						$('#P3Frq').slider('enable');		
						$("#P3Frq").val(theVal).slider( "refresh" );		// new p3Frq value
					}
				}
				if(returnedData.hasOwnProperty('clearAlert')){					// Cleared : 1 then switch back the switch
					if(returnedData.clearAlert == 1) {							// Alerts cleared 
						if ($('#ClearAlertSWitch').is(":checked")){ 			// if ON set it to OFF (cleared) 
//							clearAlertToServer = false;
							$('#ClearAlertSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('flowAlert')){					// flowAlert : 0 invalided, 1 valided 
					if(returnedData.flowAlert == 1) {							// FlowAlerts invalided  
						if ($('#FlowAlertSWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							flowAlertToServer = false;
							$('#FlowAlertSW').click();
						}
					} else {													// FlowAlerts valided
						if (!$('#FlowAlertSWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							flowAlertToServer = false;
							$('#FlowAlertSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('innondAlert')){					// innondAlert : 0 invalided, 1 valided 
					if(returnedData.innondAlert == 1) {							// innondAlert invalided  
						if ($('#InnondAlertSWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							innondAlertToServer = false;
							$('#InnondAlertSW').click();
						}
					} else {													// innondAlert valided
						if (!$('#InnondAlertSWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							innondAlertToServer = false;
							$('#InnondAlertSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('pacAlert')){					// innondAlert : 0 invalided, 1 valided 
					if(returnedData.pacAlert == 1) {							// innondAlert invalided  
						if ($('#PACAlertSWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							pacAlertToServer = false;
							$('#PACAlertSWitch').click();
						}
					} else {													// innondAlert valided
						if (!$('#PACAlertSWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							pacAlertToServer = false;
							$('#PACAlertSWitch').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('nivPH')){						// nivPH : 0 invalided, 1 valided 
					if(returnedData.nivPH == 1) {								// nivPH invalided  
						if ($('#NivPHSWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							nivPHToServer = false;
							$('#NivPHSW').click();
						}
					} else {													// nivPH valided
						if (!$('#NivPHSWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							nivPHToServer = false;
							$('#NivPHSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('nivCL')){						// nivCL : 0 invalided, 1 valided 
					if(returnedData.nivCL == 1) {								// nivCL invalided  
						if ($('#NivCLSWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							nivCLToServer = false;
							$('#NivCLSW').click();
						}
					} else {													// nivCL valided
						if (!$('#NivCLSWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							nivCLToServer = false;
							$('#NivCLSW').click();
						}
					}	
				}
				if(returnedData.hasOwnProperty('nivALG')){						// nivALG : 0 invalided, 1 valided 
					if(returnedData.nivALG == 1) {								// nivALG invalided  
						if ($('#NivPmp3SWitch').is(":checked")){ 				// if ON set it to OFF (invalided) 
							nivALGToServer = false;
							$('#NivPmp3SW').click();
						}
					} else {													// nivALG valided
						if (!$('#NivPmp3SWitch').is(":checked")){ 				// if OFF set it to ON (valided) 
							nivALGToServer = false;
							$('#NivPmp3SW').click();
						}
					}	
				}

			}	
		}
	});		// end delegate pagePiscineParametres

	// page PiscineGraphs create inits
	$(document).delegate("#pagePiscineGraphs","pagebeforecreate",function(){
		$("#daterange").daterangepicker({
			showDropdowns:!0,
			minYear:2022,
			timePicker:!0,
			timePicker24Hour:!0,
			timePickerIncrement:15,
			autoApply:!0,
			singleDatePicker:!1,
			singleCalendar:!0,
			ranges:{
				"Aujourd'hui":[dayjs().startOf("day"),dayjs()],
				"Hier":[dayjs().subtract(1,"days").startOf("day"),dayjs().subtract(1,"days").endOf("day")],
				"3 Jours Prec":[dayjs().subtract(2,"days").startOf("day"),dayjs()],
				"7 Jours Prec":[dayjs().subtract(6,"days").startOf("day"),dayjs()],
				"Semaine Prec":[dayjs().subtract(1,"week").startOf("week"),dayjs().subtract(1,"week").endOf("week")],
				"Cette Semaine":[dayjs().startOf("week").startOf("day"),dayjs()],
				"30 Jours Prec":[dayjs().subtract(29,"days").startOf("day"),dayjs()],
				"Mois Prec":[dayjs().subtract(1,"month").startOf("month"),dayjs().subtract(1,"month").endOf("month")],
				"Ce Mois":[dayjs().startOf("month"),dayjs()]
			},
			locale:{
				format:"DD/MMM/YY HH:mm",
				separator:" - ",
				applyLabel:"OK",
				cancelLabel:"Cancel",
				fromLabel:"From",
				toLabel:"To",
				customRangeLabel:"Custom",
				weekLabel:"W",
				daysOfWeek:["Di","Lu","Ma","Me","Je","Ve","Sa"],
				monthNames:["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"],
				firstDay:1
			},
			linkedCalendars:!1,
			alwaysShowCalendars:!1,
			parentEl:"daterange",
			minDate:"01/Jan/22 00:00",
			maxDate:"now",
			startDate:dayjs().subtract(2,"days").startOf("day"),
			endDate:dayjs(),
			autoUpdateInput:!0
			}
			,(function(debut,fin,a){
				console.log("New date range selected: "+debut.format("DD/MM/YY HH:MM")+" to "+fin.format("DD/MM/YY HH:MM")+" (predefined range: "+a+")");
				updateGraphsDateRange(debut, fin);
			})
		);

		// Event handlers pour sélecteurs d'axes (mobile)
		$("#selectItems").on("change", function(){
			var selected = $(this).val();
			if (charts.mobile) {
				for(var i=0; i<13; i++){
					var isSelected = selected && selected.includes(i.toString());
					charts.mobile.setVisibility(i, isSelected);
				}
			}
		});

		// Event handlers pour sélecteurs d'axes (desktop)
		["selectChemistry", "selectTemperature", "selectEquipment"].forEach(function(selectorId){
			$("#" + selectorId).on("change", function(){
				var graphType = selectorId.replace("select", "").toLowerCase();
				var selected = $(this).val() || [];
				if (charts[graphType]) {
					var def = GRAPH_DEFINITIONS[graphType];
					var allAxes = def.primaryAxes.concat(def.optionalAxes);
					allAxes.forEach(function(axisName, idx){
						charts[graphType].setVisibility(idx, selected.includes(axisName));
					});
				}
			});
		});

		// Event handlers sélecteurs de graphes (mobile/tablette)
		$("#graphSelector").on("change", function(){
			var selectedGraph = $(this).val();
			console.log("Mobile: graphe sélectionné = " + selectedGraph);
			// Recharger les données pour ce graphe
			var startDate = dayjs().subtract(2, "days").startOf("day");
			var endDate = dayjs();
			fetchDataRange(startDate, endDate).then(function(data){
				createGraphs(data, 'mobile', selectedGraph);
			});
		});

		$("#graphSelector1, #graphSelector2").on("change", function(){
			var graph1 = $("#graphSelector1").val();
			var graph2 = $("#graphSelector2").val();
			
			// Validation: les deux graphes doivent être différents
			if (graph1 === graph2) {
				alert("Veuillez sélectionner deux graphes différents");
				return;
			}
			
			selectedGraphs.tablet = [graph1, graph2];
			console.log("Tablette: graphes sélectionnés = " + selectedGraphs.tablet.join(", "));
			
			// Recharger les données
			var startDate = dayjs().subtract(2, "days").startOf("day");
			var endDate = dayjs();
			fetchDataRange(startDate, endDate).then(function(data){
				createGraphs(data, 'tablet');
			});
		});

		// Gestion resize/orientation
		$(window).on('resize orientationchange', function(){
			var newMode = getGraphMode();
			if (newMode !== currentMode) {
				console.log("Mode change: " + currentMode + " -> " + newMode);
				currentMode = newMode;
				var startDate = dayjs().subtract(2, "days").startOf("day");
				var endDate = dayjs();
				fetchDataRange(startDate, endDate).then(function(data){
					createGraphs(data);
				});
			}
		});

		console.log("-- Building the chartdata array from before create --");
		getOriginData();
		
		// Créer les graphiques selon le mode détecté
		currentMode = getGraphMode();
		console.log("Initial graph mode: " + currentMode);
		createGraphs(dataOrigin);
	});
	
	// page PiscineGraphs pageShow
	$(document).on("pageshow","#pagePiscineGraphs",function(){
		console.log("PageShow: updating chart data");
		const startDate = dayjs().subtract(2, "days").startOf("day");
		const endDate = dayjs();
		fetchDataRange(startDate, endDate).then(function(data){
			updateGraphsData(data);
		});
	});

	// page PiscineDebug create inits
	$(document).delegate("#pagePiscineDebug","pagebeforecreate",function(){
		var e;
		var showDebug = 1;
		
		$("#ClearText").click((function(){
			$("#debugTextArea").val("")}
		)),

		$("#FeedSW").click((function(){
			(showDebug == 0) ? showDebug=1 : showDebug=0;
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=Debug',
				data: 'sess=' + sessID + '&showDebug=' + showDebug,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscineDebug is success value is:"+showDebug);
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setLampe, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
		}
	)),

		piscineDebugEvent=$.SSE("/piscineEvents",{		//piscineDebugEvents
			onOpen:function(e){
				console.log("Open SSE to /piscineDebugEvents");
				console.log(e)
			},
			onEnd:function(e){
				console.log("Ending SSE piscineDebugEvents");
				console.log(e)
			},
			onError:function(e){
				console.log("Could not connect to SSE /piscineDebugEvents")
				console.log(e)
			},
			onMessage:function(e){
				console.log("Message from /piscineDebugEvents");
				console.log(e);
				console.log($.trim(e.data))
			},
			options:{forceAjax:!1},
			events:{
				piscineLCDDebug:function(evt){
					var timeLeft,
					today=new Date;
					console.log("PiscineLCDDebug");
					console.log(evt);
					if(expirationDate<today.getTime()){
						console.log("Session ttl expired: go to login diag");
						console.log("expiration is "+expirationDate+" and now is "+today.getTime());
						showSessionExpiredDialog("Invalid Session");
					}else{
						timeLeft=(expirationDate-today.getTime())/1e3;
						console.log("Session is still valid, time left to run : "+timeLeft+" secs");
						data=$.trim(evt.data);
						var returnedData=JSON.parse(data);
						console.log("serverEvent json is "+JSON.stringify(returnedData));
						if(returnedData.hasOwnProperty("lignes")){
							lignes=returnedData.lignes;
							$("#debugTextArea").append(lignes);
							$("#debugTextArea").scrollTop($("#debugTextArea")[0].scrollHeight);
						}	
					}
				}
			}
		});
	});

	// page PiscineMaintenance create inits
	$(document).delegate("#pagePiscineMaintenance","pagebeforecreate",function(){
		var sonde1index,sonde2index,sonde3index,
		sonde1Type="N/A",
		sonde2Type="N/A",
		sonde3Type="N/A",
		gotSonde=false,	
		typePHRedox="N/A";

		
		function doAction(action,param,valParam,param2,valParam2){

/*			doAction("scanPH","typePH",PH4,"");
			doAction("cancelPH","");
			doAction("validEtalon","valEtalon",$("#PHMesu").val(),"type","PH4")
			doAction("cancelScan","type","PH")
			doAction("validEtalon","valEtalon",$("#PHAjust").val(),"type","PH4"),
			doAction("scanRedox","typeRedox","low","");
			doAction("cancelRedox","");
			doAction("validEtalon","valEtalon",$("#RedoxMesu").val(),"type","low"),
			doAction("cancelScan","type","Redox")
			doAction("validEtalon","valEtalon",$("#RedoxAjust").val(),"type","low"),

			doAction("validSondes","sondes",JSON.stringify(sondes),"")
			doAction("scanSondes",""),
*/

			var command="sess="+sessID+"&command="+action;
			if(""!==param){
				command+="&"+param+"="+valParam
			}
			if(""!==param2){
				command+="&"+param2+"="+valParam2
			}
			console.log("data is :"+command),
			$.ajax({
				type:"POST",
				url:"/setPiscine?action=Maintenance",
				data:command,
				dataType:"text",
				success:function(type){
					console.log("Call to /setPiscineMaintenance with command="+action+" is success")
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			})
		}

		$(":input[name= 'PHRadio']").click((function(){
			$("#validRedox").addClass("ui-disabled");
			$(":input[name= 'RedoxRadio']").attr("checked",!1);
			$(":input[name= 'RedoxRadio']").checkboxradio("refresh");
			$("#RedoxMesu").val("---");
			$("#RedoxAjust").val("---");
			$(scanRedoxLed).removeClass("ledOn").addClass("ledOff");
			typePHRedox="N/A";
			$("#cancelPH").removeClass("ui-disabled");
			switch($(this).attr("id")){
				case"PH4Radio":
					console.log("You clicked PH4");
					typePHRedox="PH4";
				break;
				case"PH7Radio":
					console.log("You clicked PH7");
					typePHRedox="PH7";
				break;
				case"PH9Radio":
					console.log("You clicked PH9");
					typePHRedox="PH9";
			}
			if("N/A"!==typePHRedox){
				doAction("scanPH","typePH",typePHRedox,"");
				$("#scanPHLed").removeClass("ledOff").addClass("ledOn");
			}
		})),

		$("#cancelPH").click((function(){
			$("#validPH").addClass("ui-disabled"),
			$(":input[name= 'PHRadio']").attr("checked",!1),
			$(":input[name= 'PHRadio']").checkboxradio("refresh"),
			typePHRedox="N/A",
			$("#PHMesu").val("---"),
			$("#PHAjust").val("---"),
			$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
			doAction("cancelPH","");
		}));

		$("#validPH").click((function(){
			if(isNaN($("#PHMesu").val())||"N/A"===typePHRedox)
				$(this).addClass("ui-disabled")
			else {
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
				doAction("validEtalon","valEtalon",$("#PHMesu").val(),"type",typePHRedox),
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				typePHRedox="N/A"
			}
		}));

		$("#scanPHLed").click((function(){
			if("N/A"!==typePHRedox){
				$("#validPH").addClass("ui-disabled"),
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				typePHRedox="N/A",
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				$(this).removeClass("ledOn").addClass("ledOff"),
				doAction("cancelScan","type","PH");
			}
		}));

		$("#PHAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==typePHRedox&&!isNaN($("#PHAjust").val())){
				$("#validPH").addClass("ui-disabled"),
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				doAction("validEtalon","valEtalon",$("#PHAjust").val(),"type",typePHRedox),
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
				typePHRedox="N/A"
			}
		}));

		$(":input[name= 'RedoxRadio']").click((function(){
			$("#validPH").addClass("ui-disabled"),
			$(":input[name= 'PHRadio']").attr("checked",!1),
			$(":input[name= 'PHRadio']").checkboxradio("refresh"),
			$("#PHMesu").val("---"),
			$("#PHAjust").val("---"),
			$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
			typePHRedox="N/A",
			$("#cancelRedox").removeClass("ui-disabled"),
			$("#RedoxAjust").val("---");
			switch($(this).attr("id")){
				case"redoxLowRadio":
					console.log("You clicked RedoxLow"),
					typePHRedox="Low";
					break;
				case"redoxHighRadio":
					console.log("You clicked RedoxHigh"),
					typePHRedox="High"
			}
			if("N/A"!==typePHRedox){
				$("#scanRedoxLed").removeClass("ledOff").addClass("ledOn"),
				doAction("scanRedox","typeRedox",typePHRedox,"");
			}
		}));

		$("#cancelRedox").click((function(){
			$("#validRedox").addClass("ui-disabled"),
			$(":input[name= 'RedoxRadio']").attr("checked",!1),
			$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
			typePHRedox="N/A",
			$("#RedoxMesu").val("---"),
			$("#RedoxAjust").val("---"),
			$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
			doAction("cancelRedox","");
		}));

		$("#validRedox").click((function(){
			if(!isNaN($("#RedoxMesu").val())&&"N/A"!==typePHRedox){
				$(this).addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
				doAction("validEtalon","valEtalon",$("#RedoxMesu").val(),"type",typePHRedox),
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				typePHRedox="N/A"
			}
		}));

		$("#scanRedoxLed").click((function(){
			if("N/A"!==typePHRedox){
				$("#validRedox").addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				typePHRedox="N/A",
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				$(this).removeClass("ledOn").addClass("ledOff"),
				doAction("cancelScan","type","Redox")
			}
		}));

		$("#RedoxAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==l&&!isNaN($("#RedoxAjust").val())){
				$("validRedox").addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				doAction("validEtalon","valEtalon",$("#RedoxAjust").val(),"type",typePHRedox),
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				typePHRedox="N/A",
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff")
			}
		}));

		$("#validSondes").click((function(){
			sondes=[],
			sonde1={}
				sonde1.printable=$("#sonde1Val").val(),
				sonde1.other=$("#sonde1Val").attr("value"),
				sonde1.type=$("#sonde1Type").text(),
				sonde1.index=sonde1index,
			sondes.push(sonde1),
			sonde2={}
				sonde2.printable=$("#sonde2Val").val(),
				sonde2.type=$("#sonde2Type").text(),
				sonde2.index=sonde2index,
			sondes.push(sonde2),
			sonde3={}
				sonde3.printable=$("#sonde3Val").val(),
				sonde3.type=$("#sonde3Type").text(),
				sonde3.index=sonde3index,
			sondes.push(sonde3),
			$(this).addClass("ui-disabled"),
			gotSonde = false;
			doAction("validSondes","sondes",JSON.stringify(sondes),"");
		}));

		$("#scanSondes").click((function(){
			$("#sonde1Val").val(""),
			$("#sonde2Val").val(""),
			$("#sonde3Val").val(""),
			doAction("scanSondes",""),
			$("#validSondes").removeClass("ui-disabled")
		}));

		$("#sonde1Type").click((function(){
			if(gotSonde){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						sonde1Type="eau"
						if((("air"==sonde2Type&&(("N/A"==sonde3Type)||("pac"==sonde3Type))) || ("pac"==sonde2Type&&(("N/A"==sonde3Type)||("air"==sonde3Type))) || ("N/A"==sonde2Type && "eau"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Eau":
						$(this).text("Air"),
						sonde1Type="air"
						if((("eau"==sonde2Type&&(("N/A"==sonde3Type)||("pac"==sonde3Type))) || ("pac"==sonde2Type&&(("N/A"==sonde3Type)||("eau"==sonde3Type))) || ("N/A"==sonde2Type && "air"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac"),
						sonde1Type="pac"
						if((("air"==sonde2Type&&(("N/A"==sonde3Type)||("eau"==sonde3Type))) || ("eau"==sonde2Type&&(("N/A"==sonde3Type)||("air"==sonde3Type))) || ("N/A"==sonde2Type && "pac"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						sonde1Type="N/A"
						if(sonde2Type!=sonde3Type) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		$("#sonde2Type").click((function(){
			if(gotSonde){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						sonde2Type="eau"
						if((("air"==sonde1Type&&(("N/A"==sonde3Type)||("pac"==sonde3Type))) || ("pac"==sonde1Type&&(("N/A"==sonde3Type)||("air"==sonde3Type))) || ("N/A"==sonde1Type && "eau"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Eau":
						$(this).text("Air"),
						sonde2Type="air"
						if((("eau"==sonde1Type&&(("N/A"==sonde3Type)||("pac"==sonde3Type))) || ("pac"==sonde1Type&&(("N/A"==sonde3Type)||("eau"==sonde3Type))) || ("N/A"==sonde1Type && "air"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac");
						sonde2Type="pac";
						if((("air"==sonde1Type&&(("N/A"==sonde3Type)||("eau"==sonde3Type))) || ("eau"==sonde1Type&&(("N/A"==sonde3Type)||("air"==sonde3Type))) || ("N/A"==sonde1Type && "pac"!=sonde3Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						sonde2Type="N/A"
						if(sonde1Type!=sonde3Type) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		$("#sonde3Type").click((function(){
			if(gotSonde){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						sonde3Type="eau"
						if((("air"==sonde2Type&&(("N/A"==sonde1Type)||("pac"==sonde1Type))) || ("pac"==sonde2Type&&(("N/A"==sonde1Type)||("air"==sonde1Type))) || ("N/A"==sonde2Type && "eau"!=sonde1Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
					break;
					case"Eau":
						$(this).text("Air"),
						sonde3Type="air"
						if((("eau"==sonde2Type&&(("N/A"==sonde1Type)||("pac"==sonde1Type))) || ("pac"==sonde2Type&&(("N/A"==sonde1Type)||("eau"==sonde1Type))) || ("N/A"==sonde2Type && "air"!=sonde1Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac"),
						sonde3Type="pac"
						if((("air"==sonde2Type&&(("N/A"==sonde1Type)||("eau"==sonde1Type))) || ("eau"==sonde2Type&&(("N/A"==sonde1Type)||("air"==sonde1Type))) || ("N/A"==sonde2Type && "pac"!=sonde1Type) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						sonde3Type="N/A";
						if(sonde2Type!=sonde1Type) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		piscineMaintenanceEvent=$.SSE("/piscineEvents",{		// piscineMaintenanceEvents
			onOpen:function(e){
				console.log("Open SSE to /piscineMaintenanceEvents"),
				console.log(e)
			},
			onEnd:function(e){
				console.log("Ending SSE piscineMaintenanceEvents"),
				console.log(e)
			},
			onError:function(e){
				console.log("Could not connect to SSE /piscineMaintenanceEvents")
			},
			onMessage:function(e){
				console.log("Message from /piscineMaintenanceEvents"),
				console.log(e),
				data=$.trim(e.data)
				if(data.includes('hello!')){
					$.ajax({
						type:"POST",
						url:"/setPiscine?action=InitMaintenance",
						data:"sess="+sessID,
						dataType:"text",
						success:function(e){
							console.log("Call to /setPiscineInitMaintenance is success")
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
							}
						}
					})
				}
			},
			options:{forceAjax:!1},
			events: {
				piscineMaintenance: piscineDataMaintenance
			},
		});
		

		function piscineDataMaintenance(evt){
			var today=new Date;
			var value=0;
			var sonde;
			console.log("piscineMaintenanceServer"),
			console.log(evt)
			if(expirationDate<today.getTime()){
				console.log("Session ttl expired: go to login diag"),
				console.log("expiration is "+expirationDate+" and now is "+today.getTime()),
				showSessionExpiredDialog("Invalid Session");
			} else {
				timeLeft=(expirationDate-today.getTime())/1e3,
				console.log("Session is still valid, time left to run : "+timeLeft+" secs"),
				data=$.trim(evt.data);
				var returnedData=JSON.parse(data);
				console.log("serverEvent json is "+JSON.stringify(returnedData));

				if(returnedData.hasOwnProperty("sondes")){
					if(returnedData.sondes.length>=1){
						sonde=returnedData.sondes[0]
						if("N/A"===sonde.type){
							$("#sonde1Val").val(""),
							$("#sonde1Type").text("N/A"),
							$("#sonde1Type").addClass("ui-disabled"),
							sonde1index=-1
							sonde1Type=sonde.type
						}else{
							$("#sonde1Val").val(sonde.printable),
							$("#sonde1Type").text(sonde.type)
							$("#sonde1Type").removeClass("ui-disabled"),
							sonde1Type=sonde.type.toLowerCase(),
							sonde1index=sonde.index
						}
						gotSonde = true;
					} 
					if(returnedData.sondes.length>=2){
						sonde=returnedData.sondes[1]
						if("N/A"===sonde.type){
							$("#sonde2Val").val(""),
							$("#sonde2Type").text("N/A"),
							$("#sonde2Type").addClass("ui-disabled"),
							sonde2Type=sonde.type
							sonde2index=-1
						}else{
							$("#sonde2Val").val(sonde.printable),
							$("#sonde2Type").text(sonde.type),
							$("#sonde2Type").removeClass("ui-disabled"),
							sonde2Type=sonde.type.toLowerCase(),
							sonde2index=sonde.index
						}
					}
					if(returnedData.sondes.length>=3){
						sonde=returnedData.sondes[2];
						if("N/A"===sonde.type){
							$("#sonde3Val").val(""),
							$("#sonde3Type").text("N/A"),
							$("#sonde3Type").addClass("ui-disabled"),
							sonde3index=-1
							sonde3Type="N/A"
						} else {
							$("#sonde3Val").val(sonde.printable),
							$("#sonde3Type").text(sonde.type),
							$("#sonde3Type").removeClass("ui-disabled"),
							sonde3Type=sonde.type.toLowerCase(),
							sonde3index=sonde.index
						}
					}
					if(gotSonde){	
						if("N/A"===sonde1Type&&"N/A"===sonde2Type&&"N/A"===sonde3Type)
							$("#validSondes").addClass("ui-disabled")
						else
							$("#validSondes").removeClass("ui-disabled")
					}
				} 
				if(m.hasOwnProperty("phCalc")){
					value=parseFloat(m.phCalc)
					console.log("Got phClac and theVal is :"+value),
					$("#PHCalc").val(value.toFixed(2).toString())
					if("N/A"!==r){
						if(m.hasOwnProperty("phMesu")){
							value=parseFloat(m.phMesu),
							$("#PHMesu").val(value.toFixed(3).toString()),
							$("#validPH").removeClass("ui-disabled")
						}
						if(m.hasOwnProperty("phAjust")){
							value=parseFloat(m.phAjust),
							$("#PHAjust").val(value.toFixed(3).toString())
						}
					}
				}
				if(m.hasOwnProperty("redoxCalc")){
					value=parseFloat(m.redoxCalc),
					console.log("Got redoxClac and theVal is :"+value),
					$("#RedoxCalc").val(value.toFixed(1).toString())
					if("N/A"!==l){
						if(m.hasOwnProperty("redoxMesu")){
							value=parseFloat(m.redoxMesu),
							$("#RedoxMesu").val(value.toFixed(1).toString()),
							$("#validRedox").removeClass("ui-disabled")
						}
						if(m.hasOwnProperty("redoxAjust")){
							value=parseFloat(m.redoxAjust),
							$("#RedoxAjust").val(value.toFixed(1).toString())
						}
					}
				}
			}
		};

	});	

// -------------- pages refresh inits (resets etc ... )  ------------

	// page Login refresh inits
	$(document).delegate("#pageLogin", "pagebeforeshow", function () {
		// Reset the login form.
		$("#username").val('');
		$("#password").val('');
		$("#keepAlive").prop("checked",false).checkboxradio("refresh");
	});	

	// page registration refresh inits
	$(document).delegate("#pageRegisterLogin", "pagebeforeshow", function () {
		// Reset the registration form.
			$("#newuser").val('');
		$("#mainpassword").val('');
		$("#password2").val('');
		$("#adminpassword").val('');
	});	

	// dialog userProfile refresh inits
	$(document).delegate("#pageUserProfile", "pagebeforeshow", function () {
		$("#nameuserprofile").val(userName);
		$("#userpasswordprofile").val(passWord);
		$("#userpassword2profile").val(passWord);
	});	

	// page delete users refresh from server
	$(document).delegate("#pageDeleteUser", "pagebeforeshow", function () {
		var html = "";

		console.log("Calling getUsers");
	//	$.mobile.loading("show");
		$.ajax({
		type: 'post',
		url: '/api/auth?action=getUsers',
		cache: false,
		success: function ( response ) {
			response = $.trim(response);
			var returnedData = JSON.parse(response);
			console.log("returned json is " + JSON.stringify(returnedData));
			$.each( returnedData.users, function ( i, obj ) {
				html += constructUserList(obj,i);
			});
			$('#usersList').empty();
			$('#usersList').html( html );
			$('#usersList').trigger('create');
			$('#usersList').listview('refresh');
			//$('#dataView ul').listview('refresh');
	//		$.mobile.loading("hide");
			},
		error: onError
		});		// end Ajax

		function constructUserList(obj, index){
			var html = "";
			var role;

			if (index != 0) {
				html += '<hr class="inset">';
			}
			html += '<li class="ui-field-contain">';
			html += '<fieldset data-role="controlgroup" class="myControlGroup borderFeild">';
			html += '<label for="user'+index+'">'+obj.username+'</label>';
			html += '<input type="checkbox" name="user'+index+'" id="user'+index+'" value="'+obj.username+'">';
			html += '</fieldset>';
			html += '<fieldset data-role="controlgroup" data-type="horizontal" id="UserListRoles'+index+'" class="UsersListRoles">';
			role = (obj.roles[0] == 1) ? "checked" : "";
			html += '<input type="checkbox" name="PiscineRoleUser'+index+'" id="PiscineRoleUser'+index+'" value="PiscineRole" disabled '+role+'>';
			html += '<label for="PiscineRoleUser'+index+'" class="myRoles">Pisc.</label>';
			role = (obj.roles[1] == 1) ? "checked" : "";
			html += '<input type="checkbox" name="ArrosageRoleUser'+index+'" id="ArrosageRoleUser'+index+'" value="ArrosageRole" disabled '+role+'>';
			html += '<label for="ArrosageRoleUser'+index+'" class="myRoles">Arro.</label>';
			role = (obj.roles[2] == 1) ? "checked" : "";
			html += '<input type="checkbox" name="ChauffageRoleUser'+index+'" id="ChauffageRoleUser'+index+'" value="ChauffageRole" disabled '+role+'>';
			html += '<label for="ChauffageRoleUser'+index+'" class="myRoles">Chauf.</label>';
			role = (obj.roles[3] == 1) ? "checked" : "";
			html += '<input type="checkbox" name="LampesRoleUser'+index+'" id="LampesRoleUser'+index+'" value="LampesRole" disabled '+role+'>';
			html += '<label for="LampesRoleUser'+index+'" class="myRoles">Lamp.</label>';
			role = (obj.roles[4] == 1) ? "checked" : "";
			html += '<input type="checkbox" name="VoletsRoleUser'+index+'" id="VoletsRoleUser'+index+'" value="VoletsRole" disabled '+role+'>';
			html += '<label for="VoletsRoleUser'+index+'" class="myRoles">Volet</label>';
			html += '</fieldset>';
			html += '</li>';

			return html;

		}
	});

// manage Server events start and stop
	$(document).on('pagebeforeshow', '#pagePiscinePrincipale', function(){       
		console.log('-- STARTING Piscine Server Events --');
		piscineEvent.start();
		fetch('/setPiscine?action=setActivePage&page=principale', {method: 'POST'});
		showToast("Mise à jour temps réel activée", 'info');
	});
	$(document).on('pagebeforehide', '#pagePiscinePrincipale', function(){       
		console.log('-- STOPPING Piscine Server Events --');
		piscineEvent.stop();
	});

	$(document).on('pagebeforeshow', '#pagePiscineParametres', function(){       
		console.log('-- STARTING Piscine Params Server Events --');
		piscineParamsEvent.start();
		fetch('/setPiscine?action=setActivePage&page=parametres', {method: 'POST'});
		showToast("Mise à jour données depuis serveur", 'info');
	});
	$(document).on('pagebeforehide', '#pagePiscineParametres', function(){       
		console.log('-- STOPPING Piscine Params Server Events --');
		piscineParamsEvent.stop();
	});

	$(document).on("pagebeforeshow", "#pagePiscineDebug", function(){
		console.log("-- STARTING Piscine Debug Server Events --");
		piscineDebugEvent.start();
		fetch('/setPiscine?action=setActivePage&page=debug', {method: 'POST'});
		fetch('/setPiscine?action=Debug&trigger=start&sess='+sessID, {method: 'POST'});
		showToast("Mise à jour temps réel des logs activée", 'info');
	});
	$(document).on("pagebeforehide","#pagePiscineDebug",function(){
		console.log("-- STOPPING Piscine Debug Server Events --");
		piscineDebugEvent.stop();
		fetch('/setPiscine?action=Debug&trigger=stop&sess='+sessID, {method: 'POST'});
	});

	$(document).on("pagebeforeshow","#pagePiscineMaintenance",function(){
		console.log("-- STARTING Piscine Maintenance Server Events --");
		piscineMaintenanceEvent.start();
		fetch('/setPiscine?action=setActivePage&page=maintenance', {method: 'POST'});
		showToast("Mise à jour temps réel des étalonnages activée", 'info');
	});
	$(document).on("pagebeforehide","#pagePiscineMaintenance",function(){
		function doCmd(action,type,PHRedox){
			var cmd="sess="+sessID+"&command="+action+"&"+type+"="+PHRedox;
			$.ajax({
				type:"POST",
				url:"/setPiscine?action=Maintenance",
				data:cmd,
				dataType:"text",
				success:function(t){
					console.log("Call to /setPiscineMaintenance with command="+action+" is success")
				},
				error:function(xhr, status, errorThrown){
					console.log("An error occurred while calling /setPiscineMaintenance, data is: "+xhr.status+" and exception is : "+xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						showSessionExpiredDialog("Invalid Session");		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			})
		}
		doCmd("cancelScan","type","PH");
		doCmd("cancelScan","type","Redox");
		console.log("-- STOPPING Piscine Maintenance Server Events --");
		piscineMaintenanceEvent.stop()
	});

	$(document).on("pagebeforeshow","#pagePiscineGraphs",function(){
		if(Array.isArray(chartdata) && chartdata.length == 0){
			console.log("-- Building the chartdata array from before show --");
			getOriginData();
		}
	});
	$(document).on("pagebeforehide","#pagePiscineGraphs",function(){
		console.log("-- Cleaning the chartdata array --");
		chartdata=[]
	});
	
// ---------------------------------------- Ok ready ! ----------------------------------

// === AUTO-LOGIN LOCAL : Vérification au démarrage ===
// Appeler la vérification auto-login dès le chargement
checkLocalAuthOnStartup();

// Vérifier périodiquement la session (toutes les 60 secondes)
setInterval(checkSessionValidity, 60000);

console.log( "ready to go !" );
// navigate to a page : $.mobile.navigate(#pageid); (keep history) or $.mobile.changePage( "#pageID", { transition: "slideup"});


// ========================================
// RESPONSIVE LAYOUT DETECTION
// ========================================

var currentLayout = 'mobile-portrait';

function detectLayout() {
  var width = window.innerWidth;
  var isLandscape = width > window.innerHeight;
  
  if (width >= 1024) {
    currentLayout = 'desktop';
  } else if (width >= 768) {
    currentLayout = isLandscape ? 'tablet-landscape' : 'tablet-portrait';
  } else if (isLandscape) {
    currentLayout = 'mobile-landscape';
  } else {
    currentLayout = 'mobile-portrait';
  }
  
  $('body').attr('data-layout', currentLayout);
  
  if (debug) {
    console.log('[RESPONSIVE] Layout détecté: ' + currentLayout + ' (' + width + 'x' + window.innerHeight + ')');
  }
  
  // Réorganiser grids jQuery Mobile selon le layout
  adaptJQueryMobileGrids();
}

// Adaptation dynamique des grids jQuery Mobile
function adaptJQueryMobileGrids() {
  if (currentLayout === 'desktop' || currentLayout === 'tablet-landscape') {
    // Page principale : garder LEDs en 8 colonnes (ui-grid-g)
    // Ne rien changer pour préserver le layout portrait
    
    // Autres pages : convertir ui-grid-b (33-33-33) en ui-grid-a (50-50)
    $('#pagePiscineParametres .ui-grid-b').removeClass('ui-grid-b').addClass('ui-grid-a');
    $('#pagePiscineMaintenance .ui-grid-b').removeClass('ui-grid-b').addClass('ui-grid-a');
    
  } else {
    // Mode mobile/tablette portrait : restaurer grids originales
    $('#pagePiscineParametres .ui-grid-a').removeClass('ui-grid-a').addClass('ui-grid-b');
    $('#pagePiscineMaintenance .ui-grid-a').removeClass('ui-grid-a').addClass('ui-grid-b');
  }
  
  // Adapter les panels selon le layout
  adaptPanels();
}

// Optimisation des panels pour desktop
function adaptPanels() {
  var $panels = $('[data-role="panel"]');
  
  if (currentLayout === 'desktop') {
    // Desktop : panels en mode reveal persistant (non-overlay)
    $panels.panel({
      display: 'reveal',
      dismissible: true,
      swipeClose: false
    });
    
    if (debug) {
      console.log('[RESPONSIVE] Panels mode reveal (desktop)');
    }
  } else {
    // Mobile/Tablette : panels en mode overlay
    $panels.panel({
      display: 'overlay',
      dismissible: true,
      swipeClose: true
    });
    
    if (debug) {
      console.log('[RESPONSIVE] Panels mode overlay (mobile/tablette)');
    }
  }
  
  // Redimensionner Dygraph si page Graphs active
  resizeDygraphIfNeeded();
}

// Redimensionner Dygraph selon layout
function resizeDygraphIfNeeded() {
  if ($('#pagePiscineGraphs').hasClass('ui-page-active') && typeof chart !== 'undefined' && chart !== null) {
    setTimeout(function() {
      chart.resize();
      if (debug) {
        console.log('[RESPONSIVE] Dygraph redimensionné pour layout: ' + currentLayout);
      }
    }, 100);
  }
}

// Détecter le layout au chargement et lors des changements
$(window).on('resize orientationchange', detectLayout);
$(document).on('pagecreate', detectLayout);

// Détection initiale
detectLayout();
