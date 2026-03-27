
// Global functions and variables

console.log('[VERSION] piscineScripts v4.3-responsive');

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

// --------------------------------  global init ---------------------------------------------------
	$(document).on("mobileinit", function (event, ui) {
		$.mobile.ajaxEnabled = false;        // toutes les pages sont dans le DOM initial - pas besoin d'AJAX
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
			case "leftpanel":
				if(!userMenu){
					console.log("calling leftpanel, set ui\n")
					setUserUI();
					userMenu = true;
				}
			break;
		}
	});

	$(document).on("pagecontainerbeforeshow", function(event, ui) {

		if (typeof ui.toPage !== "object") return;
		switch (ui.toPage.attr("id")) {
			case "leftpanel":
				if(!userMenu){
					setUserUI();
					$("#leftpanel").enhanceWithin();
					userMenu = true;
				}
			break;
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

  // Forcer flex-direction via style inline — bypass CSS/media queries (fix iOS)
  if (isLandscape) {
    $('.lscape-layout').css({'flex-direction': 'row', 'align-items': 'flex-start', 'gap': '10px'});
    $('.lscape-col').css({'flex': '1', 'min-width': '0', 'width': 'auto'});
  } else {
    $('.lscape-layout').css({'flex-direction': 'column', 'align-items': '', 'gap': '0'});
    $('.lscape-col').css({'flex': '', 'min-width': '', 'width': '100%'});
  }

  if (debug) {
    console.log('[RESPONSIVE] Layout: ' + currentLayout + ' (' + width + 'x' + window.innerHeight + ') landscape=' + isLandscape);
  }

  // Réorganiser grids jQuery Mobile selon le layout
  adaptJQueryMobileGrids();
}

function getGraphMode() {
    var mqDesktopLandscape = window.matchMedia('(min-width: 1101px) and (min-aspect-ratio: 1/1)');
    var mqDesktopPortrait = window.matchMedia('(min-height: 1101px) and (max-aspect-ratio: 1/1)');
    var mqTabletPortrait = window.matchMedia('(min-width: 701px) and (max-width: 1100px) and (max-height: 1100px) and (max-aspect-ratio: 1/1)');
    var mqTabletLandscape = window.matchMedia('(min-width: 701px) and (max-width: 1100px) and (max-height: 1100px) and (min-aspect-ratio: 1/1)');
    var mqMobilePortrait = window.matchMedia('(max-width: 700px) and (max-aspect-ratio: 1/1)');
    var mqMobileLandscape = window.matchMedia('(max-height: 700px) and (min-aspect-ratio: 1/1)');

    if (mqDesktopLandscape.matches) return 'desktop-landscape';
    if (mqDesktopPortrait.matches)  return 'desktop-portrait';
    if (mqTabletLandscape.matches)  return 'tablet-landscape';
    if (mqTabletPortrait.matches)   return 'tablet-portrait';
    if (mqMobileLandscape.matches)  return 'mobile-landscape';
    if (mqMobilePortrait.matches)   return 'mobile-portrait';

    // Fallback
    console.warn("FailBack dans la detection des media");
    var width = window.innerWidth;
    var isLandscape = width > window.innerHeight;
    if (width < 768) return isLandscape ? 'mobile-landscape' : 'mobile-portrait';
    if (width < 1100) return isLandscape ? 'tablet-landscape' : 'tablet-portrait';
    return isLandscape ? 'desktop-landscape' : 'desktop-portrait';
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

// Redimensionner les graphiques selon layout (appelé sur resize/orientationchange)
function resizeDygraphIfNeeded() {
  if ($('#pagePiscineGraphs').hasClass('ui-page-active')) {
    if (typeof applyChartHeights === 'function') applyChartHeights();
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        if (typeof updateGraphs === 'function') updateGraphs();
      });
    });
  }
}

// Détecter le layout au chargement et lors des changements
$(window).on('resize', detectLayout);
$(window).on('orientationchange', function() {
  setTimeout(detectLayout, 300);
});
$(document).on('pagecreate', detectLayout);

// Détection initiale
detectLayout();

