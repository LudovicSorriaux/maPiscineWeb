	// page PiscinePrincipale create inits
	$(document).delegate("#pagePiscinePrincipale", "pagebeforecreate", function () {
	//$( document ).on('pagecreate','#pagePiscinePrincipale',function() {		// depricated
		$('.screenOutput').empty().append(
			'<h4 class="screenTextTitle"> Piscine Manager</h4>' +
			'<P class="screenTextStatus">' + APP_VERSION + '</P>' +
			'<P class="screenTextLine">Connexion en cours…</P>'
		).trigger('create');
		fetch('/api/info').then(function(r){ return r.json(); }).then(function(d){
			if(d.version) {
				APP_VERSION = d.version;
				$('.screenOutput .screenTextStatus').text(d.version);
			}
		}).catch(function(){});

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
			min: 0,
			max: 14,			// plage complète : affiche toute valeur reçue même hors plage
			value: 7.2,
			label: function(value) {				// label is the center digits ; "---" seulement si jamais lu (0 strict)
				if(value <= 0){
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
			min: 0,
			max: 1000,		// plage complète : affiche toute valeur reçue même hors plage
			value: 700,
			label: function(value) {				// label is the center digits ; "---" seulement si jamais lu (0 strict)
				if(value <= 0){
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

		// --- Bandeau d'alerte : décodage local du masque IND_Alerte reçu du contrôleur ---
		// bit1=inondation, bit2=flux, bit3=PAC, bit4=pH vide, bit5=CL vide, bit6=ALG vide,
		// bit7=fenêtre de filtration trop courte, bit8=sonde pH/Redox figée. Ordre = priorité
		// d'affichage (bit1 en premier).
		var ALERT_LABELS = ["Inondation", "Absence de flux d'eau", "Problème PAC", "Plus de pH+",
		                     "Plus de chlore", "Plus de produit pompe 3", "Fenêtre de filtration trop courte",
		                     "Sonde pH/Redox figée ou illisible"];

		function updateAlertBanner(valAlert){
			if(!valAlert || valAlert === 0){
				$('#alertBanner').fadeOut(200);
				return;
			}
			var messages = [];
			for(var bit = 0; bit < ALERT_LABELS.length; bit++){
				if(valAlert & (1 << bit)){
					messages.push(ALERT_LABELS[bit]);
				}
			}
			$('#alertBannerText').text('ALERTE : ' + messages.join(' — '));
			$('#alertBannerAck').show();
			$('#alertBanner').fadeIn(200);
		}

		$('#alertBannerAck').click(function(){
			$.ajax({
				type: 'POST',
				url: '/setPiscine?action=Parametres',
				data: 'sess=' + sessID + '&param=clearAlert&val=1',
				dataType: "text",
				success: function(data){
					console.log("Call to /clearAlert (banner) is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /clearAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){
						showSessionExpiredDialog("Action utilisateur");
					}
				}
			});
		});

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
					// PH/CL/P3 : -2=invalidée (OFF + croix), -1=manuel forcé (ON), 0=off, >0=durée en cours (ON).
					// Un simple test "!= 0" allumait la LED pour -2 (invalidée) — corrigé, et la LED distingue
					// maintenant visuellement "invalidée" (croix rouge) d'un simple "off" normal.
					function setPumpLed(led, value){
						var $led = $(led);
						if(value == -2){
							$led.removeClass('ledOn').addClass('ledOff ledInvalid');
						} else if(value == 0){
							$led.removeClass('ledOn ledInvalid').addClass('ledOff');
						} else {
							$led.removeClass('ledOff ledInvalid').addClass('ledOn');
						}
					}
					// PP (pompe principale) n'a pas de notion d'"invalidée" ici : -2=forcée (manuel ou PAC
					// autonome), -3=forcée par la PAC hors créneau normal — les deux sont bien "en marche",
					// contrairement à -2 pour les pompes doseuses. Seul 0 est réellement "off".
					if(returnedData.hasOwnProperty('PP')){
						var $ppLed = $('#PPLed');
						if(returnedData.PP == 0){
							$ppLed.removeClass('ledOn ledInvalid').addClass('ledOff');
						} else {
							$ppLed.removeClass('ledOff ledInvalid').addClass('ledOn');
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
						setPumpLed('#PHLed', returnedData.PH);
					}
					if(returnedData.hasOwnProperty('CL')){
						setPumpLed('#CLLed', returnedData.CL);
					}
					if(returnedData.hasOwnProperty('P3')){
						setPumpLed('#P3Led', returnedData.P3);
					}
					if(returnedData.hasOwnProperty('Alerte')){
						updateAlertBanner(parseInt(returnedData.Alerte));
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
