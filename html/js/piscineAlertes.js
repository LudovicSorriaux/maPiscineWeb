// Page Alertes : état des 8 alertes (masque IND_Alerte, bit0=Inondation..bit7=Sonde figée)
// + interrupteurs de surveillance (6 des 8 types, fenêtre de filtration et sonde figée sont informatives seules).

$(document).delegate("#pagePiscineAlertes", "pagebeforecreate", function () {

	// bit -> { ledId, badgeId, switchId, switchInputId, param }. param=null => pas d'interrupteur (bit6).
	var ALERT_ROWS = [
		{ ledId:'#alertLed0', badgeId:'#alertBadge0', switchId:'#invInnondSW', inputId:'#invInnondSWitch', param:'innondAlert' },
		{ ledId:'#alertLed1', badgeId:'#alertBadge1', switchId:'#invFlowSW',   inputId:'#invFlowSWitch',   param:'flowAlert' },
		{ ledId:'#alertLed2', badgeId:'#alertBadge2', switchId:'#invPacSW',    inputId:'#invPacSWitch',    param:'pacAlert' },
		{ ledId:'#alertLed3', badgeId:'#alertBadge3', switchId:'#invNivPHSW',  inputId:'#invNivPHSWitch',  param:'nivPH' },
		{ ledId:'#alertLed4', badgeId:'#alertBadge4', switchId:'#invNivCLSW',  inputId:'#invNivCLSWitch',  param:'nivCL' },
		{ ledId:'#alertLed5', badgeId:'#alertBadge5', switchId:'#invNivALGSW', inputId:'#invNivALGSWitch', param:'nivALG' },
		{ ledId:'#alertLed6', badgeId:'#alertBadge6', switchId:null,           inputId:null,               param:null },
		{ ledId:'#alertLed7', badgeId:'#alertBadge7', switchId:null,           inputId:null,               param:null }
	];
	var ALERT_LABELS = ["Inondation", "Absence de flux d'eau", "Problème PAC", "Plus de pH+",
	                     "Plus de chlore", "Plus de produit pompe 3", "Fenêtre de filtration trop courte",
	                     "Sonde pH/Redox figée ou illisible"];

	var currentAlertMask = 0;
	var invalidState = [false,false,false,false,false,false,false,false];   // true = ignorée (interrupteur off)
	var switchToServer = [true,true,true,true,true,true,true,true];         // anti-écho, un par ligne

	// Applique classes + checked directement (pas de .click() simulé) : évite le risque de flag
	// anti-écho bloqué constaté ailleurs dans l'appli quand le sync et le clic utilisateur interagissent.
	function setSwitchState(switchDivId, checked){
		var $sw = $(switchDivId);
		if(checked){
			$sw.find("label").removeClass('switchUnchecked').addClass('switchChecked');
			$sw.find("span").removeClass('switchUnchecked').addClass('switchChecked');
			$sw.find("i").removeClass('switchUnchecked').addClass('switchChecked');
		} else {
			$sw.find("label").removeClass('switchChecked').addClass('switchUnchecked');
			$sw.find("span").removeClass('switchChecked').addClass('switchUnchecked');
			$sw.find("i").removeClass('switchChecked').addClass('switchUnchecked');
		}
		$sw.find("input").prop('checked', checked);
	}

	// LED : vert fixe = surveillée/OK, rouge clignotant = alerte active, rouge barré = ignorée.
	// (avant : simplement éteinte quand OK — passage au vert testé à la demande, réversible.)
	function renderRow(bit){
		var row = ALERT_ROWS[bit];
		var $led = $(row.ledId);
		var $badge = $(row.badgeId);
		var active = (currentAlertMask & (1 << bit)) !== 0;

		if(invalidState[bit]){
			$led.removeClass('ledOn blink ledVertSombre').addClass('ledRouge ledOff ledInvalid');
			$badge.removeClass('ok bad').addClass('ignored').text('IGNORÉE');
		} else if(active){
			$led.removeClass('ledOff ledInvalid ledVertSombre').addClass('ledRouge ledOn blink');
			$badge.removeClass('ok ignored').addClass('bad').text('ALERTE');
		} else {
			$led.removeClass('ledOff ledInvalid blink ledRouge').addClass('ledVertSombre ledOn');
			$badge.removeClass('bad ignored').addClass('ok').text('Surveillée');
		}
	}

	function renderBanner(){
		var messages = [];
		for(var bit = 0; bit < ALERT_LABELS.length; bit++){
			if(!invalidState[bit] && (currentAlertMask & (1 << bit))){
				messages.push(ALERT_LABELS[bit]);
			}
		}
		if(messages.length === 0){
			$('#alertesGlobalBanner').fadeOut(150);
		} else {
			$('#alertesGlobalText').text(messages.length + ' ALERTE(S) : ' + messages.join(' — '));
			$('#alertesGlobalBanner').fadeIn(150);
		}
	}

	$('#alertesAckAll').click(function(){
		$.ajax({
			type: 'POST',
			url: '/setPiscine?action=Parametres',
			data: 'sess=' + sessID + '&param=clearAlert&val=1',
			dataType: "text",
			success: function(){ console.log("[Alertes] clearAlert success"); },
			error: function (xhr) {
				console.log('[Alertes] clearAlert error: ' + xhr.status);
				if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){
					showSessionExpiredDialog("Action utilisateur");
				}
			}
		});
	});

	// Un clic = un switch : validé (coché) => val=0, ignorée (décoché) => val=1
	ALERT_ROWS.forEach(function(row, bit){
		if(!row.param) return;
		$(row.switchId).click(function(){
			if(!switchToServer[bit]){ switchToServer[bit] = true; return; }
			var checked = $(row.inputId).prop('checked');
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=Parametres',
				data: 'sess=' + sessID + '&param=' + row.param + '&val=' + (checked ? 0 : 1),
				dataType: "text",
				success: function(){ console.log("[Alertes] " + row.param + " success"); },
				error: function (xhr) {
					console.log('[Alertes] ' + row.param + ' error: ' + xhr.status);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){
						showSessionExpiredDialog("Action utilisateur");
					}
				}
			});
		});
	});

	function initPageAlertes(){
		$.ajax({
			type: 'POST',
			url: '/setPiscine?action=InitPageAlertes',
			data: 'sess=' + sessID,
			dataType: "text",
			success: function(){ console.log("[Alertes] InitPageAlertes success"); },
			error: function (xhr) { console.log('[Alertes] InitPageAlertes error: ' + xhr.status); }
		});
	}

	function piscineAlertesDataServer(evt){
		var data = $.trim(evt.data);
		var returnedData = JSON.parse(data);
		console.log("[Alertes] serverEvent json is " + JSON.stringify(returnedData));

		var indexByParam = {'innondAlert':0,'flowAlert':1,'pacAlert':2,'nivPH':3,'nivCL':4,'nivALG':5};

		if(returnedData.hasOwnProperty('Alerte')){
			currentAlertMask = parseInt(returnedData.Alerte);
			for(var b=0;b<ALERT_ROWS.length;b++) renderRow(b);
			renderBanner();
		}
		Object.keys(indexByParam).forEach(function(param){
			if(returnedData.hasOwnProperty(param)){
				var bit = indexByParam[param];
				invalidState[bit] = (parseInt(returnedData[param]) !== 0);
				switchToServer[bit] = false;
				setSwitchState(ALERT_ROWS[bit].switchId, !invalidState[bit]);
				renderRow(bit);
			}
		});
		renderBanner();
	}

	var piscineAlertesEvent = $.SSE('/piscineEvents', {
		onOpen: function(e){ console.log("[Alertes] Open SSE"); },
		onEnd: function(e){ console.log("[Alertes] Ending SSE"); },
		onError: function(e){ console.log("[Alertes] SSE error"); },
		onMessage: function(e){
			var data = $.trim(e.data);
			if(data.includes('hello!')){
				initPageAlertes();
			}
		},
		options: { forceAjax: false },
		events: { piscineAlertesData: piscineAlertesDataServer }
	});

	$(document).on('pagebeforeshow', '#pagePiscineAlertes', function(){
		console.log('-- STARTING Piscine Alertes Server Events --');
		piscineAlertesEvent.start();
		fetch('/setPiscine?action=setActivePage&page=alertes', {method: 'POST'});
		// Pas d'appel direct à initPageAlertes() ici : la connexion SSE qu'on vient de
		// démarrer n'est pas forcément établie côté serveur au moment où la réponse
		// arriverait, et la diffusion serait perdue pour cette connexion (constaté :
		// état pas à jour tant qu'on ne rechargeait pas complètement la page). On ne
		// compte que sur le "hello!" envoyé par le serveur une fois la connexion
		// réellement active (même pattern que piscineParametres.js).
	});
	$(document).on('pagebeforehide', '#pagePiscineAlertes', function(){
		console.log('-- STOPPING Piscine Alertes Server Events --');
		piscineAlertesEvent.stop();
	});

});
