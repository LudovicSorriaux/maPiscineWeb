	// page PiscineMaintenance create inits
	$(document).delegate("#pagePiscineMaintenance","pagebeforecreate",function(){
		var sonde1index,sonde2index,sonde3index,sonde4index,
		sonde1Type="N/A",
		sonde2Type="N/A",
		sonde3Type="N/A",
		sonde4Type="N/A",
		sonde1Found=true,
		sonde2Found=true,
		sonde3Found=true,
		sonde4Found=true,
		gotSonde=false,
		typePHRedox="N/A";

		
		// Retourne le texte de bouton pour une sonde absente configurée
		function absentLabel(type){ return type + " !"; }
		// Retourne le type serveur depuis la variable interne
		function typeForServer(t){
			if(t==="eau") return "Eau";
			if(t==="air") return "Air";
			if(t==="pac") return "Pac";
			if(t==="suppr") return "Suppr";
			return "N/A";
		}
		// Active/désactive le bouton validSondes
		function updateValidSondes(){
			if(!gotSonde){ $("#validSondes").addClass("ui-disabled"); return; }
			var hasAction=["eau","air","pac","suppr"].indexOf(sonde1Type)!==-1||
			              ["eau","air","pac","suppr"].indexOf(sonde2Type)!==-1||
			              ["eau","air","pac","suppr"].indexOf(sonde3Type)!==-1||
			              ["eau","air","pac"].indexOf(sonde4Type)!==-1;
			hasAction ? $("#validSondes").removeClass("ui-disabled") : $("#validSondes").addClass("ui-disabled");
		}

		function doAction(action,param,valParam,param2,valParam2,param3,valParam3){

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
			if(param3 && ""!==param3){
				command+="&"+param3+"="+valParam3
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
			$("#RedoxTampon").val("");
			$(scanRedoxLed).removeClass("ledOn").addClass("ledOff");
			typePHRedox="N/A";
			$("#cancelPH").removeClass("ui-disabled");
			switch($(this).attr("id")){
				case"PH4Radio": typePHRedox="PH4"; break;
				case"PH7Radio": typePHRedox="PH7"; break;
				case"PH9Radio": typePHRedox="PH9"; break;
			}
			$("#PHtampon").val("");
			if("N/A"!==typePHRedox){
				doAction("scanPH","typePH",typePHRedox,"tampon",$("#PHtampon").val());
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
			$("#PHtampon").val(""),
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
				doAction("validEtalon","valEtalon",$("#PHMesu").val(),"type",typePHRedox,"tampon",$("#PHtampon").val()),
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
				$("#PHtampon").val(""),
				$(this).removeClass("ledOn").addClass("ledOff"),
				doAction("cancelScan","type","PH");
			}
		}));

		$("#PHAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==typePHRedox&&!isNaN($("#PHAjust").val())){
				$("#validPH").addClass("ui-disabled"),
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				doAction("validEtalon","valEtalon",$("#PHAjust").val(),"type",typePHRedox,"tampon",$("#PHtampon").val()),
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
			$("#PHtampon").val(""),
			$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
			typePHRedox="N/A",
			$("#cancelRedox").removeClass("ui-disabled"),
			$("#RedoxAjust").val("---");
			switch($(this).attr("id")){
				case"redoxLowRadio":  typePHRedox="Low";  break;
				case"redoxHighRadio": typePHRedox="High"; break;
			}
			$("#RedoxTampon").val("");
			if("N/A"!==typePHRedox){
				$("#scanRedoxLed").removeClass("ledOff").addClass("ledOn"),
				doAction("scanRedox","typeRedox",typePHRedox,"tampon",$("#RedoxTampon").val());
			}
		}));

		$("#cancelRedox").click((function(){
			$("#validRedox").addClass("ui-disabled"),
			$(":input[name= 'RedoxRadio']").attr("checked",!1),
			$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
			typePHRedox="N/A",
			$("#RedoxMesu").val("---"),
			$("#RedoxAjust").val("---"),
			$("#RedoxTampon").val(""),
			$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
			doAction("cancelRedox","");
		}));

		$("#validRedox").click((function(){
			if(!isNaN($("#RedoxMesu").val())&&"N/A"!==typePHRedox){
				$(this).addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
				doAction("validEtalon","valEtalon",$("#RedoxMesu").val(),"type",typePHRedox,"tampon",$("#RedoxTampon").val()),
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
				$("#RedoxTampon").val(""),
				$(this).removeClass("ledOn").addClass("ledOff"),
				doAction("cancelScan","type","Redox")
			}
		}));

		$("#RedoxAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==l&&!isNaN($("#RedoxAjust").val())){
				$("validRedox").addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				doAction("validEtalon","valEtalon",$("#RedoxAjust").val(),"type",typePHRedox,"tampon",$("#RedoxTampon").val()),
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				typePHRedox="N/A",
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff")
			}
		}));

		var phTamponTimer = null;
		var redoxTamponTimer = null;

		$("#PHtampon").on("input", function(){
			if(typePHRedox === "N/A") return;
			clearTimeout(phTamponTimer);
			phTamponTimer = setTimeout(function(){
				var val = $("#PHtampon").val();
				if(val !== "" && !isNaN(parseFloat(val))){
					doAction("setTampon","typePH",typePHRedox,"tampon",val);
				}
			}, 1500);
		});

		$("#RedoxTampon").on("input", function(){
			if(typePHRedox === "N/A") return;
			clearTimeout(redoxTamponTimer);
			redoxTamponTimer = setTimeout(function(){
				var val = $("#RedoxTampon").val();
				if(val !== "" && !isNaN(parseFloat(val))){
					doAction("setTampon","typeRedox",typePHRedox,"tampon",val);
				}
			}, 1500);
		});

		$("#validSondes").click((function(){
			var sondes=[], s1={}, s2={}, s3={};
			s1.printable=$("#sonde1Val").val(); s1.type=typeForServer(sonde1Type); s1.index=sonde1index; sondes.push(s1);
			s2.printable=$("#sonde2Val").val(); s2.type=typeForServer(sonde2Type); s2.index=sonde2index; sondes.push(s2);
			s3.printable=$("#sonde3Val").val(); s3.type=typeForServer(sonde3Type); s3.index=sonde3index; sondes.push(s3);
			if(sonde4index!==undefined && "N/A"!==sonde4Type){
				var s4={};
				s4.printable=$("#sonde4Val").val(); s4.type=typeForServer(sonde4Type); s4.index=sonde4index; sondes.push(s4);
			}
			$(this).addClass("ui-disabled");
			gotSonde = false;
			doAction("validSondes","sondes",JSON.stringify(sondes),"");
		}));

		$("#scanSondes").click((function(){
			$("#sonde1Val").val(""),
			$("#sonde2Val").val(""),
			$("#sonde3Val").val(""),
			$("#sonde4Val").val(""),
			$("#sonde4Row").hide(), $("#sonde4TypeRow").hide(),
			sonde4Type="N/A", sonde4index=undefined,
			doAction("scanSondes",""),
			$("#validSondes").removeClass("ui-disabled")
		}));

		$("#sonde1Type").click((function(){
			if(gotSonde){
				if(!sonde1Found && "N/A"!==sonde1Type){
					// Sonde configurée absente : basculer entre type configuré et Suppr
					if(sonde1Type==="suppr"){
						var orig=sonde1index===0?"Air":sonde1index===1?"Eau":"Pac";
						$(this).text(absentLabel(orig)); sonde1Type=orig.toLowerCase();
					} else {
						$(this).text("Suppr"); sonde1Type="suppr";
					}
					updateValidSondes();
					return;
				}
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
				if(!sonde2Found && "N/A"!==sonde2Type){
					if(sonde2Type==="suppr"){
						var orig=sonde2index===0?"Air":sonde2index===1?"Eau":"Pac";
						$(this).text(absentLabel(orig)); sonde2Type=orig.toLowerCase();
					} else {
						$(this).text("Suppr"); sonde2Type="suppr";
					}
					updateValidSondes();
					return;
				}
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
				if(!sonde3Found && "N/A"!==sonde3Type){
					if(sonde3Type==="suppr"){
						var orig=sonde3index===0?"Air":sonde3index===1?"Eau":"Pac";
						$(this).text(absentLabel(orig)); sonde3Type=orig.toLowerCase();
					} else {
						$(this).text("Suppr"); sonde3Type="suppr";
					}
					updateValidSondes();
					return;
				}
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

		$("#sonde4Type").click((function(){
			if(gotSonde && sonde4index!==undefined){
				switch($(this).text()){
					case"N/A": $(this).text("Eau"); sonde4Type="eau"; break;
					case"Eau": $(this).text("Air"); sonde4Type="air"; break;
					case"Air": $(this).text("Pac"); sonde4Type="pac"; break;
					case"Pac": $(this).text("N/A"); sonde4Type="N/A"; break;
				}
				updateValidSondes();
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
				if(returnedData === null) return;

				if(returnedData.hasOwnProperty("sondes")){
					if(returnedData.sondes.length===0){
						showToast("Aucune sonde DS18B20 trouvée sur le bus OneWire", 'error');
						$("#sonde1Val").val(""); $("#sonde1Type").text("N/A"); $("#sonde1Type").addClass("ui-disabled"); sonde1Type="N/A"; sonde1index=-1; sonde1Found=true;
						$("#sonde2Val").val(""); $("#sonde2Type").text("N/A"); $("#sonde2Type").addClass("ui-disabled"); sonde2Type="N/A"; sonde2index=-1; sonde2Found=true;
						$("#sonde3Val").val(""); $("#sonde3Type").text("N/A"); $("#sonde3Type").addClass("ui-disabled"); sonde3Type="N/A"; sonde3index=-1; sonde3Found=true;
						$("#validSondes").addClass("ui-disabled");
						gotSonde=false;
					}
					if(returnedData.sondes.length>=1){
						sonde=returnedData.sondes[0];
						sonde1Found=(sonde.found!==false);
						sonde1index=sonde.index;
						if(!sonde1Found && "N/A"!==sonde.type){
							// Configurée mais absente du bus : affiche avec marqueur "!"
							$("#sonde1Val").val(sonde.printable);
							$("#sonde1Type").text(absentLabel(sonde.type));
							$("#sonde1Type").removeClass("ui-disabled");
							sonde1Type=sonde.type.toLowerCase();
						} else {
							$("#sonde1Val").val(sonde.printable);
							$("#sonde1Type").text("N/A"===sonde.type?"N/A":sonde.type);
							$("#sonde1Type").removeClass("ui-disabled");
							sonde1Type="N/A"===sonde.type?"N/A":sonde.type.toLowerCase();
						}
						gotSonde=true;
					}
					if(returnedData.sondes.length>=2){
						sonde=returnedData.sondes[1];
						sonde2Found=(sonde.found!==false);
						sonde2index=sonde.index;
						if(!sonde2Found && "N/A"!==sonde.type){
							$("#sonde2Val").val(sonde.printable);
							$("#sonde2Type").text(absentLabel(sonde.type));
							$("#sonde2Type").removeClass("ui-disabled");
							sonde2Type=sonde.type.toLowerCase();
						} else {
							$("#sonde2Val").val(sonde.printable);
							$("#sonde2Type").text("N/A"===sonde.type?"N/A":sonde.type);
							$("#sonde2Type").removeClass("ui-disabled");
							sonde2Type="N/A"===sonde.type?"N/A":sonde.type.toLowerCase();
						}
					}
					if(returnedData.sondes.length>=3){
						sonde=returnedData.sondes[2];
						sonde3Found=(sonde.found!==false);
						sonde3index=sonde.index;
						if(!sonde3Found && "N/A"!==sonde.type){
							$("#sonde3Val").val(sonde.printable);
							$("#sonde3Type").text(absentLabel(sonde.type));
							$("#sonde3Type").removeClass("ui-disabled");
							sonde3Type=sonde.type.toLowerCase();
						} else {
							$("#sonde3Val").val(sonde.printable);
							$("#sonde3Type").text("N/A"===sonde.type?"N/A":sonde.type);
							$("#sonde3Type").removeClass("ui-disabled");
							sonde3Type="N/A"===sonde.type?"N/A":sonde.type.toLowerCase();
						}
					}
					if(returnedData.sondes.length>=4){
						sonde=returnedData.sondes[3];
						sonde4Found=(sonde.found!==false);
						sonde4index=sonde.index;
						$("#sonde4Val").val(sonde.printable);
						$("#sonde4Type").text("N/A"===sonde.type?"N/A":sonde.type);
						$("#sonde4Type").removeClass("ui-disabled");
						sonde4Type="N/A"===sonde.type?"N/A":sonde.type.toLowerCase();
						$("#sonde4Row").show(); $("#sonde4TypeRow").show();
					} else {
						$("#sonde4Row").hide(); $("#sonde4TypeRow").hide();
						sonde4Type="N/A"; sonde4index=undefined;
					}
					updateValidSondes();
				} 
				if(returnedData.hasOwnProperty("phCalc")){
					value=parseFloat(returnedData.phCalc)
					console.log("Got phCalc and theVal is :"+value),
					$("#PHCalc").val(value.toFixed(2).toString())
					if("N/A"!==returnedData.phMesu && parseFloat(returnedData.phMesu) !== 0){
						if(returnedData.hasOwnProperty("phMesu")){
							value=parseFloat(returnedData.phMesu),
							$("#PHMesu").val(value.toFixed(3).toString()),
							$("#validPH").removeClass("ui-disabled")
						}
						if(returnedData.hasOwnProperty("phAjust")){
							value=parseFloat(returnedData.phAjust),
							$("#PHAjust").val(value.toFixed(3).toString())
						}
					}
				}
				if(returnedData.hasOwnProperty("phTampon") && returnedData.phTampon !== 0 && $("#PHtampon").val() === ""){
					$("#PHtampon").val(parseFloat(returnedData.phTampon).toFixed(2).toString())
				}
				if(returnedData.hasOwnProperty("redoxCalc")){
					value=parseFloat(returnedData.redoxCalc),
					console.log("Got redoxCalc and theVal is :"+value),
					$("#RedoxCalc").val(value.toFixed(1).toString())
					if("N/A"!==returnedData.redoxMesu && parseFloat(returnedData.redoxMesu) !== 0){
						if(returnedData.hasOwnProperty("redoxMesu")){
							value=parseFloat(returnedData.redoxMesu),
							$("#RedoxMesu").val(value.toFixed(1).toString()),
							$("#validRedox").removeClass("ui-disabled")
						}
						if(returnedData.hasOwnProperty("redoxAjust")){
							value=parseFloat(returnedData.redoxAjust),
							$("#RedoxAjust").val(value.toFixed(1).toString())
						}
					}
				}
				if(returnedData.hasOwnProperty("redoxTampon") && returnedData.redoxTampon !== 0 && $("#RedoxTampon").val() === ""){
					$("#RedoxTampon").val(parseFloat(returnedData.redoxTampon).toFixed(0).toString())
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
