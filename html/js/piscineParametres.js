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
