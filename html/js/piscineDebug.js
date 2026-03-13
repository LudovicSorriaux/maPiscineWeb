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
