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
