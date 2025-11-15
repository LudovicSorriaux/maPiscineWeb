
// Global functions and variables

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

  function onError(data, exception){
	var message;
	
	console.log('An error occurred.');
	console.log(data);
  
	if (data.status) {
	  message = statusErrorMap[data.status];
	  if(!message){
		message="Unknown Error \n." + data.status;
	  }
	}else if(exception=='parsererror'){
	  message="Error.\nParsing JSON Request failed.";
	}else if(exception=='timeout'){
	  message="Request Time out.";
	}else if(exception=='abort'){
	  message="Request was aborted by the server";
	}else {
	  message="Uncaught Error.\n" + data.responseText;
	}
	alert(message);
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
		console.log("/deleteUsers\n"+$(form).serialize());
//		$.mobile.loading("show");
		$.ajax({
		  type: 'post',
		  url: "/deleteUsers",
		  cache: false,
		  data: $(form).serialize(),
		  success: onSuccess,
		  error: onError
		});
  	  }        
    });
  });

  function validateLogin(frm,url){
	console.log(url+"\n"+frm.serialize());
//	$.mobile.loading("show");
	$.ajax({
	  type: frm.attr('method'),
	  url: url,
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
	if (returnedData.status == "Log in Successful"){          
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
	  $('#dlg-ttl').html( document.createTextNode('Your Session Time is : ' + ttl + ' seconds'));
	  storeUserInfos();
	  setCookie("maPiscine", sessID, ttl);    // 1 hours by default else 1 day
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

	console.log("In set UI\n");
	theHtml += piscineMenu((flgFirst) ? false : true);
	if (!flgFirst) flgFirst = true;
	if(!flgExterieur) flgExterieur = true;
	theHtml += '<hr class="inset">'
	$('#leftpanelMenu').html(theHtml); 		// .collapsibleset("refresh");
	$('#leftpanelMenu').enhanceWithin(); 	
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
	html += '		<li><a href="#pagePiscinePrincipale" data-transition="slide">Piscine</a></li>';
	html += '		<li><a href="#pagePiscineParametres" data-transition="slide">Piscine Parametres</a></li>';
	html += '		<li><a href="#pagePiscineMaintenance" data-transition="slide">Piscine Maintenance</a></li>';
	html += '		<li><a href="#pagePiscineAlertes" data-transition="slide">Piscine Alertes</a></li>';
	html += '		<li><a href="#pagePiscineDebug" data-transition="slide">Piscuine Debug</a></li>';
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
		$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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

function csvToArray1(e,t){
	return e.split("\\r\\n").map((function(e){return e.split(t)}
	))
};

function csvToArray2(e){
	const t=e.split("\r\n");
	var a=[];
	for(const e of t){
		const t=e.split(",");
		a.push(t)
	}
	return a
};

function csvToArray3(e){
	const t=[];
	e.split("\n").map((e=>e.split(",")));
	console.log("Entire Array:",array);
};

function csvToArray4(e){
	const t=e.split("\r\n");
	var a=[];
	var s=[];
	for(i=0;i<t.length;i++){
		s=t[i].split(";");
		a.push(s);
	}
	return a;
};

function csvToArray(e){
	var t;
	var a=[];
	var s=0;
	for(t=e.split("\r\n");s<t.length;s++){
		var i=t[s];
		if(0!=i.length){
			var n=i.split(";");
			n[0]=dayjs(n[0],"DD/MM/YY HH:mm:ss").toDate();
			for(var o=1;o<n.length;o++){
				n[o]=parseFloat(n[o]);
				a.push(n);
			}
		}
	}
	return a;
}

function syncGraphAjax(e,t){
	console.log("Calling /getGraphDatas?sess="+sessID+"&start="+e+"&end="+t);
	return new Promise(
		function(a,s){
			$.ajax({
				type:"POST",
				url:"/getGraphDatas",
				data:"sess="+sessID+"&start="+e+"&end="+t,
				dataType:"text",
				success:function(e){a(e)},
				error:function(e){s(e)}
			})
		}
	)
};

async function fetchData(e,t){
	var a=[];
	curr=dayjs(e);
	fin=dayjs(t);
	
	console.log("   ==> fetching chartdata; start:"+curr.format("DD-MM-YYYY")+" end:"+fin.format("DD-MM-YYYY"));
	$.mobile.loading("show",{text:"Chargement",textVisible:!0,textonly:!1});
	try{
		var s=await syncGraphAjax(curr.format("DD-MM-YYYY"),fin.format("DD-MM-YYYY"));
		$.mobile.loading("hide");
		if((s=$.trim(s)).includes("Error")){
			var i=JSON.parse(s);
			console.log("returned json is "+JSON.stringify(i));
			if("Error"==i.status){
				$.mobile.changePage("#piscineError-dlg");
				$("#PiscineErrorStatus").val(i.message);
				$("#PiscineErrorCorrection").val(i.correction);
			} 
		} else {
			a=csvToArray(s)
		}
	} catch(e){
		$.mobile.loading("hide");
		console.log("An error occurred while calling /getGraphDatas, data is: "+e.status+" and exception is : "+e.responseText);
		onPageError(e)
	}
	return a;
}

function getOriginData(){
	i=0;
	now=dayjs().set("minute",0).set("second",0);
	start=dayjs().subtract(1,"month").startOf("month");
	console.log("Fetching Origin Data: start:"+start.format("DD-MM-YYYY")+" end:"+now.format("DD-MM-YYYY"));
	dataOrigin=fetchData(start,now);
	chartdata=dataOrigin;
	OrigStart=CurrStart=start;
	OrigEnd=CurrEnd=now
}

function getNewData(e,t){
	var a=[];
	console.log("getNewData before; start:"+e.format("DD-MM")+" end:"+t.format("DD-MM")+"\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM")+"\n");
	if(CurrStart==OrigStart){
		if(e.isBefore(OrigStart)){
			if(t.isAfter(OrigStart)){
				a=fetchData(e,OrigStart),
				dataOrigin=a.concat(dataOrigin);
				OrigStart=CurrStart=e;
				CurrEnd=OrigEnd;
				chartdata=dataOrigin;
				console.log("getNewData; extend orig data by newStart:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
			} else {
				a=fetchData(e,t);
				CurrStart=e;
				CurrEnd=t;
				chartdata=currData=a;
				console.log("getNewData; new data  (NewEnd < OrigStart):\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
			}
		}else{ 
			chartdata=dataOrigin;
			console.log("getNewData; newStart > OrigStart just zoom on dataOrigin:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
		}
	} else {		// curStart != origStart
		if (e.isAfter(OrigStart)||e.isSame(OrigStart)){
			chartdata=dataOrigin;
			console.log("getNewData; using dataCurr fetching into dataOrigin:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
		} else {	// e before origStart
			if(t.isAfter(OrigStart)||t.isSame(OrigStart)){
				a=fetchData(e,OrigStart);
				dataOrigin=a.concat(dataOrigin);
				OrigStart=CurrStart=e;
				chartdata=dataOrigin;
				console.log("getNewData; using dataCurr extend dataOrigin by new start :\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
			} else {	// e and t before origStart
				if(e.isAfter(CurrStart)||e.isSame(CurrStart)){
					if(t.isBefore(CurrEnd)||t.isSame(CurrEnd)){
						chartdata=currData;
						console.log("getNewData; outside dataOrigin inside currData, just zoom :\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
					} else{	 // e after curStart and t after curEnd	
						if(e.isBefore(CurrEnd)||e.isSame(CurrEnd)){
							a=fetchData(CurrEnd,t);
							CurrEnd=t;
							currData=currData.concat(a);
							chartdata=currData;
							console.log("getNewData; outside dataOrigin fetching after currEnd\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
						} else { // e and t after curEnd
							a=fetchData(e,t);
							CurrStart=e;
							CurrEnd=t;
							chartdata=currData=a;
							console.log("getNewData; outside dataOrigin fetching outside (before) currdata => new currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
						}
					}
				} else {	// e before curStart
					if(t.isAfter(CurrEnd)||t.isSame(CurrEnd)){
						a=fetchData(e,CurrStart);
						currData=a.concat(currData);
						a=fetchData(CurrEnd,t);
						currData=currData.concat(a);
						CurrStart=e;
						CurrEnd=t;
						chartdata=currData;
						console.log("getNewData; outside dataOrigin fetch before and after currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
					} else {	// t before curEnd	
						if(t.isAfter(CurrStart)||t.isSame(CurrStart)){
							a=fetchData(e,CurrStart);
							CurrStart=e;
							currData=a.concat(currData);
							chartdata=currData;
							console.log("getNewData; outside dataOrigin fetch before currStart but inside cuurEnd\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
						} else {	// e and t before curStart
							a=fetchData(e,t);
							CurrStart=e;
							CurrEnd=t;
							chartdata=currData=a;
							console.log("getNewData; outside dataOrigin fetchig outside of currdata (after) = new currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"));
						}
					}
				}
			}
		}
	}
	chart.updateOptions({file:chartdata}
)}

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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=lampe&val=' + lampeSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampe is success value is:"+lampeSWVal);
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampe, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=volet&val=' + voletSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVolet is success value is:"+voletSWVal);
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVolet, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
				url: '/setPiscinePagePrincip',
				data: 'sess=' + sessID,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscinePagePrincip is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					$.mobile.changePage( "#dlg-EndSessionAlert" );
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
					$.mobile.changePage( "#dlg-EndSessionAlert" );
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=lampe&val=' + lampeSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampe is success value is:"+lampeSWVal);
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeParam, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=volet&val=' + voletSWVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVolet is success value is:"+voletSWVal);
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVolet, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=autoMode&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setModeManu is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setModeManu, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=PP&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPP is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPP, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=PAC&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPAC is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPAC, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=PH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=CL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=P3&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPmpALG is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPmpALG, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=strtTPP&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPPStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPPStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=stopTPP&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPPStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPPStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=strtTPAC&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPACStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPACStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=stopTPAC&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPACStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPACStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=typeTemp&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTypeTemp is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTypeTemp, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=tempFixRel&val=' + temp,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTempFixRel is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTempFixRel, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=pacViaRouter&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPacViaRouter is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPacViaRouter, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pacViaRouterToServer = true;
		});

	// --- PH et Redox reference ---
		// --- PH ref Slider ---
		$("#PHRefSlider").change(function(){
			var phRef = $("#PHRef").slider().val();
			console.log('New PH ref is '+ phRef);
			if (PHRefToServer){
				$.ajax({
					type: 'POST',
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=phRef&val=' + phRef*10,
					dataType: "text",
					success: function(data){
						console.log("Call to /setPHRef is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setPHRef, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=redoxRef&val=' + redoxRef,
					dataType: "text",
					success: function(data){
						console.log("Call to /setredoxRef is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setredoxRef, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=lampeAuto&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeAuto is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeAuto, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=strtLampe&val=' + startHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeStartTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeStartTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=stopLampe&val=' + stopHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setLampeStopTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setLampeStopTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=voletAuto&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletAuto is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletAuto, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=ouvVolet&val=' + ouvHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletOuvTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletOuvTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=fermeVolet&val=' + fermHour,
					dataType: "text",
					success: function(data){
						console.log("Call to /setVoletFermTime is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setVoletFermTime, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=typeP3&val=' + typeP3,
					dataType: "text",
					success: function(data){
						console.log("Call to /setTypeP3 is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
						url: '/setPiscineParam',
						data: 'sess=' + sessID + '&param=typeP3&val=0',
						dataType: "text",
						success: function(data){
							console.log("Call to /setTypeP3 is success");
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
						url: '/setPiscineParam',
						data: 'sess=' + sessID + '&param=typeP3&val=' + typeP3,
						dataType: "text",
						success: function(data){
							console.log("Call to /setTypeP3 is success");
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setTypeP3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=p3Qty&val=' + p3Qty,
					dataType: "text",
					success: function(data){
						console.log("Call to /setP3Qty is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setP3Qty, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
					dataType: "text",
					success: function(data){
						console.log("Call to /setP3Frq is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
				url: '/setPiscineParam',
				data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
				dataType: "text",
				success: function(data){
					console.log("Call to /setP3Frq is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
				url: '/setPiscineParam',
				data: 'sess=' + sessID + '&param=p3Frq&val=' + p3Frq,
				dataType: "text",
				success: function(data){
					console.log("Call to /setP3Frq is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setP3Frq, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=clearAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /clearAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /clearAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=flowAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /flowAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /flowAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=innondAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /innondAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /innondAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=pacAlert&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /pacAlert is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /pacAlert, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=nivPH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=nivCL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=nivALG&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /nivALG is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /nivALG, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=pmpPH&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmpPH is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmpPH, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=pmpCL&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmpCL is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmpCL, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
					url: '/setPiscineParam',
					data: 'sess=' + sessID + '&param=pmp3&val=' + theVal,
					dataType: "text",
					success: function(data){
						console.log("Call to /invPmp3 is success");
					},
					error: function (xhr, status, errorThrown) {
						console.log('An error occurred while calling /invPmp3, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
						if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
							console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
							$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
						}
					}
				});
			} else pmp3ToServer = true;
		});

	// ----- server side events
		piscineParamsEvent = $.SSE('/piscineParamsEvents', {
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
				url: '/setPiscinePageParams',
				data: 'sess=' + sessID,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscinePageParams is success");
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePageParams, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
				$.mobile.changePage( "#dlg-EndSessionAlert" );
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
						if ($('#pacViaRouterSWitch').is(":checked")){ 
							pacViaRouterToServer = false;
							$('#pacViaRouterSW').click();
						}
					} else if(returnedData.pacViaRouter == 1) {	
						if (!$('#pacViaRouterSWitch').is(":checked")){ 
							pacViaRouterToServer = false;
							$('#pacViaRouterSW').click();
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
			,(function(e,t,a){
				console.log("New date range selected: "+e.format("DD/MM/YY HH:MM")+" to "+t.format("DD/MM/YY HH:MM")+" (predefined range: "+a+")")
				getNewData(e,t);
				var s=chart.xAxisRange();
				if(dayjs(s[0])!=e||dayjs(s[1]!=t)){
					chart.updateOptions({dateWindow:[e,t]});
					console.log("A new date selection from datePicker was made: "+e.toString()+" to "+t.toString());
				}
			})
		);

		$("#selectItems").on("change",(function(){
			var e=$(this).val();
			var i=0,j=0;

			console.log("Selected:"+e);
			for(i=0;i<13;i++){
				if(null!=e && j<e.length && parseInt(e[j])==i){ 
					chart.setVisibility(i,!0);
					j++;
				}else {
					chart.setVisibility(i,!1);
				}
			}
		}));

		console.log("-- Building the chartdata array from before create --");
		getOriginData()
	});
	// page PiscineGraphs pageShow
	$(document).on("pageshow","#pagePiscineGraphs",function(){
		function panAndZoomCallback(event, g, context,isMouse){
			let chartBounds = chart.xAxisRange();
			let startX = dayjs(chartBounds[0]);
			let endX = dayjs(chartBounds[1]);
			if(!isMouse)
				Dygraph.defaultInteractionModel.touchend(event,g,context);
	
			if (context.isPanning) {
				console.log('isPanning end');
				console.log("A new date selection from chart (pan) was made: " + startX.format('DD/MMM/YY HH:mm') + ' to ' + endX.format('DD/MMM/YY HH:mm'));
				$('#daterange').data('daterangepicker').setStartDate(startX);
				$('#daterange').data('daterangepicker').setEndDate(endX);
				if (isMouse) 
					Dygraph.endPan(event, g, context); 
				getNewData(startX,endX);
			} else if (context.isZooming) {
				console.log('isZooming end');
				console.log("A new date selection from chart (zoom) was made: " + startX.format('DD/MMM/YY HH:mm') + ' to ' + endX.format('DD/MMM/YY HH:mm'));
				$('#daterange').data('daterangepicker').setStartDate(startX);
				$('#daterange').data('daterangepicker').setEndDate(endX);
				if(isMouse)
					Dygraph.endZoom(event, g, context);		
			}
		}
		chart=new Dygraph($("#graph1")[0],[[Date.now(),0,0,0,0,0,0,0,0,0,0,0,0,0]],
			{
				labels:["Date","TempEau","TempAir","TempPAC","TempInt","PHVal","RedoxVal","CLVal","PompePH","PompeCL","PompeALG","PP","PAC","Auto"],
				labelsDiv:document.getElementById("legend"),
				legend:"follow",
				legendFormatter:function(data){
					if (data.x == null) {
						// This happens when there's no selection and {legend: 'always'} is set.
						return '<br>' + data.series.map(function(series) { return series.dashHTML + ' ' + series.labelHTML }).join('<br>');
					  }
					
					  var html = this.getLabels()[0] + ': ' + data.xHTML;
					  data.series.forEach(function(series) {
						if (!series.isVisible) return;
						var labeledData = series.labelHTML + ': ' + series.yHTML;
						if (series.isHighlighted) {
						  labeledData = '<b style="font-size:initial">' + labeledData + '</b>';
						}
						html += '<br>' + series.dashHTML + ' ' + labeledData;
					  });
					  return html;
				},
				series:{
					TempEau:{axis:"y2"},
					TempAir:{axis:"y2"},
					TempPAC:{axis:"y2"},
					TempInt:{axis:"y2"},
					PHVal:{axis:"y"},
					RedoxVal:{axis:"y2"},
					CLVal:{axis:"y"},
					PompePH:{axis:"y"},
					PompeCL:{axis:"y"},
					PompeALG:{axis:"y"},
					PP:{axis:"y"},
					PAC:{axis:"y"},
					Auto:{axis:"y"}
				},
				axes:{
					y:{valueRange:[0,10],axisLabelColor:"#FF00FF"},
					y2:{valueRange:[10,40],axisLabelColor:"#FFFFFF"}
				},
				ylabel:"On/Off",
				y2label:"Température °C",
				colors:["#ff0000","#00FF00","#006FFF","#FFFF00","#00FFFF","#FF00FF","#FF6F00","#0000FF","6F00FF","6FFF00","#00FF6F","#FF006F","#00FF6F"],
				visibility:[!0,!0,!1,!1,!0,!1,!0,!1,!1,!1,!0,!1,!0],
				rollPeriod:2,
				strokeWidth:2,
				highlightSeriesBackgroundAlpha:1,
				highlightSeriesOpts:{
					strokeWidth:5,
					strokeBorderWidth:0,
					highlightCircleSize:5
				},
				gridLineColor:"#eee",
				dateWindow:[dayjs().subtract(2,"days").startOf("day"),dayjs()],
				showRangeSelector:!0,
				rangeSelectorHeight:50,
				interactionModel:{
					mousedown:Dygraph.defaultInteractionModel.mousedown,
					mousemove:Dygraph.defaultInteractionModel.mousemove,
					click:Dygraph.defaultInteractionModel.click,
					dblclick:Dygraph.defaultInteractionModel.dblclick,
					mousewheel:Dygraph.defaultInteractionModel.mousewheel,
					touchstart:function(event, g, context) {
						// This right here is what prevents IOS from doing its own zoom/touch behavior
						// It stops the node from being selected too
						event.preventDefault(); // touch browsers are all nice.
						
						if (event.touches.length > 1) {
							context.startTimeForDoubleTapMs = null;		// If the user ever puts two fingers down, it's not a double tap.
						}
						
						var touches = [];
						for (var i = 0; i < event.touches.length; i++) {
							var t = event.touches[i];
				//			var rect = t.target.getBoundingClientRect();
							// we dispense with 'dragGetX_' because all touchBrowsers support pageX
							touches.push({
								pageX: t.pageX,
								pageY: t.pageY,
								dataX: g.toDataXCoord(t.pageX),
								dataY: g.toDataYCoord(t.pageY)
							// identifier: t.identifier
							});
						}
						context.initialTouches = touches;
						
						if (touches.length == 1) {		// This is just a swipe.
							context.initialPinchCenter = touches[0];
							context.touchDirections = { x: true, y: true };
							g.mouseMove_(event);
						} else if (touches.length >= 2) {
							// It's become a pinch!
							// In case there are 3+ touches, we ignore all but the "first" two.
							// only screen coordinates can be averaged (data coords could be log scale).
							context.initialPinchCenter = {
								pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
								pageY: 0.5 * (touches[0].pageY + touches[1].pageY),
							
								// TODO(danvk): remove
								dataX: 0.5 * (touches[0].dataX + touches[1].dataX),
								dataY: 0.5 * (touches[0].dataY + touches[1].dataY)
							};
							
							// Make pinches in a 45-degree swath around either axis 1-dimensional zooms.
							var initialAngle = 180 / Math.PI * Math.atan2(	context.initialPinchCenter.pageY - touches[0].pageY,
																			touches[0].pageX - context.initialPinchCenter.pageX
																		);
							// use symmetry to get it into the first quadrant.
							initialAngle = Math.abs(initialAngle);
							if (initialAngle > 90) initialAngle = 90 - initialAngle;
							context.touchDirections = {
								x: (initialAngle < (90 - 45/2)),
								y: (initialAngle > 45/2)
							};
						}
						
						// save the full x & y ranges.
						context.initialRange = {
							x: g.xAxisRange(),
							y: g.yAxisRange()
						};
					},
					touchmove:function(event, g, context) {
						// If the tap moves, then it's definitely not part of a double-tap.
						context.startTimeForDoubleTapMs = null;
					  
						var i, touches = [];
						for (i = 0; i < event.touches.length; i++) {
						  var t = event.touches[i];
						  touches.push({
							pageX: t.pageX,
							pageY: t.pageY
						  });
						}
				
						if(touches.length == 1){
							context.isPanning = true;
						} else if(touches.length >= 2){
							context.isZooming = true;
							context.isPanning = false;
						}
				
						var initialTouches = context.initialTouches;
					  
						var c_now;
					  
						// old and new centers.
						var c_init = context.initialPinchCenter;
						if (touches.length == 1) {
						  c_now = touches[0];
						} else {
						  c_now = {
							pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
							pageY: 0.5 * (touches[0].pageY + touches[1].pageY)
						  };
						}
					  
						// this is the "swipe" component
						// we toss it out for now, but could use it in the future.
						var swipe = {
						  pageX: c_now.pageX - c_init.pageX,
						  pageY: c_now.pageY - c_init.pageY
						};
						var dataWidth = context.initialRange.x[1] - context.initialRange.x[0];
						var dataHeight = context.initialRange.y[0] - context.initialRange.y[1];
						swipe.dataX = (swipe.pageX / g.plotter_.area.w) * dataWidth;
						swipe.dataY = (swipe.pageY / g.plotter_.area.h) * dataHeight;
						var xScale, yScale;
					  
						// The residual bits are usually split into scale & rotate bits, but we split
						// them into x-scale and y-scale bits.
						if (touches.length == 1) {
						  xScale = 1.0;
						  yScale = 1.0;
						} else if (touches.length >= 2) {
						  var initHalfWidth = (initialTouches[1].pageX - c_init.pageX);
						  xScale = (touches[1].pageX - c_now.pageX) / initHalfWidth;
					  
						  var initHalfHeight = (initialTouches[1].pageY - c_init.pageY);
						  yScale = (touches[1].pageY - c_now.pageY) / initHalfHeight;
						}
					  
						// Clip scaling to [1/8, 8] to prevent too much blowup.
						xScale = Math.min(8, Math.max(0.125, xScale));
						yScale = Math.min(8, Math.max(0.125, yScale));
					  
						var didZoom = false;
						if (context.touchDirections.x) {
						  var cFactor = c_init.dataX - swipe.dataX / xScale;
						  g.dateWindow_ = [
							cFactor + (context.initialRange.x[0] - c_init.dataX) / xScale,
							cFactor + (context.initialRange.x[1] - c_init.dataX) / xScale
						  ];
						  didZoom = true;
						}
					  
						if (context.touchDirections.y) {
						  for (i = 0; i < 1  /*g.axes_.length*/; i++) {
							var axis = g.axes_[i];
							var logscale = g.attributes_.getForAxis("logscale", i);
							if (logscale) {
							  // TODO(danvk): implement
							} else {
							  var cFactor = c_init.dataY - swipe.dataY / yScale;
							  axis.valueRange = [
								cFactor + (context.initialRange.y[0] - c_init.dataY) / yScale,
								cFactor + (context.initialRange.y[1] - c_init.dataY) / yScale
							  ];
							  didZoom = true;
							}
						  }
						}
					  
						g.drawGraph_(false);
					  
						// We only call zoomCallback on zooms, not pans, to mirror desktop behavior.
						if (didZoom && touches.length > 1 && g.getFunctionOption('zoomCallback')) {
						  var viewWindow = g.xAxisRange();
				//		  g.getFunctionOption("zoomCallback").call(g, viewWindow[0], viewWindow[1], g.yAxisRanges());
						}
					},
					mouseup: function (event, g, context) { 
						console.log('Mouse up');
						panAndZoomCallback(event,g,context,true);
					},
					touchend: function (event, g, context) { 
						console.log('Touch end');
						panAndZoomCallback(event,g,context,false);
					},
					zoomCallback: function(startX, endX, yRanges) { 
						let start = dayjs(startX);
						let end = dayjs(endX);
						console.log("A new date selection from chart (zoom) was made: " + start.format('DD/MMM/YY HH:mm') + ' to ' + end.format('DD/MMM/YY HH:mm'));
						$('#daterange').data('daterangepicker').setStartDate(start);
						$('#daterange').data('daterangepicker').setEndDate(end);
					}
				} 	// end interaction model
			}		// end chart
		)
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
				url: '/setPiscineDebug',
				data: 'sess=' + sessID + '&showDebug=' + showDebug,
				dataType: "text",
				success: function(data){
					console.log("Call to /setPiscineDebug is success value is:"+showDebug);
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setLampe, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			});
		}
	)),

		piscineDebugEvent=$.SSE("/piscineDebugEvents",{
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
			},
			onMessage:function(e){
				console.log("Message from /piscineDebugEvents");
				console.log(e);
				data=$.trim(e.data)
			},
			options:{forceAjax:!1},
			events:{
				piscineLCDDebug:function(a){
					var s,
					i=new Date;
					console.log("PiscineLCDDebug");
					console.log(a);
					if(expirationDate<i.getTime()){
						console.log("Session ttl expired: go to login diag");
						console.log("expiration is "+expirationDate+" and now is "+i.getTime());
						$.mobile.changePage("#dlg-EndSessionAlert");
					}else{
						s=(expirationDate-i.getTime())/1e3;
						console.log("Session is still valid, time left to run : "+s+" secs");
						data=$.trim(a.data);
						var n=JSON.parse(data);
						console.log("serverEvent json is "+JSON.stringify(n));
						if(n.hasOwnProperty("lignes")){
							e=n.lignes;
							$("#debugTextArea").append(e);
							$("#debugTextArea").scrollTop($("#debugTextArea")[0].scrollHeight);
						}	
					}
				}
			}
		});
	});


	// page PiscineMaintenance create inits
	$(document).delegate("#pagePiscineMaintenance","pagebeforecreate",function(){
		var e,t,a,
		s="N/A",
		i="N/A",
		n="N/A",
		o=!1,
		r="N/A",
		l="N/A";
		
		function c(e,t,a,s,i){

/*			c("scanPH","typePH",r,"");
			c("cancelPH","");
			c("validEtalon","valEtalon",$("#PHMesu").val(),"type",r)
			c("cancelScan","type","PH")
			c("validEtalon","valEtalon",$("#PHAjust").val(),"type",r),
			c("scanRedox","typeRedox",l,"");
			c("cancelRedox","");
			c("validEtalon","valEtalon",$("#RedoxMesu").val(),"type",l),
			c("cancelScan","type","Redox")
			c("validEtalon","valEtalon",$("#RedoxAjust").val(),"type",l),

			c("validSondes","sondes",JSON.stringify(sondes),"")
			c("scanSondes",""),
*/

			var n="sess="+sessID+"&command="+e;
			if(""!==t){
				n+="&"+t+"="+a
			}
			if(""!==s){
				n+="&"+s+"="+i
			}
			console.log("data is :"+n),
			$.ajax({
				type:"POST",
				url:"/setPiscineMaintenance",
				data:n,
				dataType:"text",
				success:function(t){
					console.log("Call to /setPiscineMaintenance with command="+e+" is success")
				},
				error: function (xhr, status, errorThrown) {
					console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
					if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
			l="N/A";
			$("#cancelPH").removeClass("ui-disabled");
			switch($(this).attr("id")){
				case"PH4Radio":
					console.log("You clicked PH4");
					r="PH4";
				break;
				case"PH7Radio":
					console.log("You clicked PH7");
					r="PH7";
				break;
				case"PH9Radio":
					console.log("You clicked PH9");
					r="PH9";
			}
			if("N/A"!==r){
				c("scanPH","typePH",r,"");
				$("#scanPHLed").removeClass("ledOff").addClass("ledOn");
			}
		})),

		$("#cancelPH").click((function(){
			$("#validPH").addClass("ui-disabled"),
			$(":input[name= 'PHRadio']").attr("checked",!1),
			$(":input[name= 'PHRadio']").checkboxradio("refresh"),
			r="N/A",
			$("#PHMesu").val("---"),
			$("#PHAjust").val("---"),
			$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
			c("cancelPH","");
		}));

		$("#validPH").click((function(){
			if(isNaN($("#PHMesu").val())||"N/A"===r)
				$(this).addClass("ui-disabled")
			else {
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
				c("validEtalon","valEtalon",$("#PHMesu").val(),"type",r)
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				r="N/A"
			}
		}));

		$("#scanPHLed").click((function(){
			if("N/A"!==r){
				$("#validPH").addClass("ui-disabled"),
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				r="N/A",
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				$(this).removeClass("ledOn").addClass("ledOff"),
				c("cancelScan","type","PH");
			}
		}));

		$("#PHAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==r&&!isNaN($("#PHAjust").val())){
				$("#validPH").addClass("ui-disabled"),
				$(":input[name= 'PHRadio']").attr("checked",!1),
				$(":input[name= 'PHRadio']").checkboxradio("refresh"),
				c("validEtalon","valEtalon",$("#PHAjust").val(),"type",r),
				$("#PHMesu").val("---"),
				$("#PHAjust").val("---"),
				$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
				r="N/A"
			}
		}));

		$(":input[name= 'RedoxRadio']").click((function(){
			$("#validPH").addClass("ui-disabled"),
			$(":input[name= 'PHRadio']").attr("checked",!1),
			$(":input[name= 'PHRadio']").checkboxradio("refresh"),
			$("#PHMesu").val("---"),
			$("#PHAjust").val("---"),
			$(scanPHLed).removeClass("ledOn").addClass("ledOff"),
			r="N/A",
			$("#cancelRedox").removeClass("ui-disabled"),
			$("#RedoxAjust").val("---");
			switch($(this).attr("id")){
				case"redoxLowRadio":
					console.log("You clicked RedoxLow"),
					l="Low";
					break;
				case"redoxHighRadio":
					console.log("You clicked RedoxHigh"),
					l="High"
			}
			if("N/A"!==l){
				$("#scanRedoxLed").removeClass("ledOff").addClass("ledOn"),
				c("scanRedox","typeRedox",l,"");
			}
		}));

		$("#cancelRedox").click((function(){
			$("#validRedox").addClass("ui-disabled"),
			$(":input[name= 'RedoxRadio']").attr("checked",!1),
			$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
			l="N/A",
			$("#RedoxMesu").val("---"),
			$("#RedoxAjust").val("---"),
			$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
			c("cancelRedox","");
		}));

		$("#validRedox").click((function(){
			if(!isNaN($("#RedoxMesu").val())&&"N/A"!==l){
				$(this).addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),
				c("validEtalon","valEtalon",$("#RedoxMesu").val(),"type",l),
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				l="N/A"
			}
		}));

		$("#scanRedoxLed").click((function(){
			if("N/A"!==l){
				$("#validRedox").addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				l="N/A",
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				$(this).removeClass("ledOn").addClass("ledOff"),
				c("cancelScan","type","Redox")
			}
		}));

		$("#RedoxAjust").on("keyup",(function(e){
			if(13==e.keyCode&&"N/A"!==l&&!isNaN($("#RedoxAjust").val())){
				$("validRedox").addClass("ui-disabled"),
				$(":input[name= 'RedoxRadio']").attr("checked",!1),
				$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),
				c("validEtalon","valEtalon",$("#RedoxAjust").val(),"type",l),
				$("#RedoxMesu").val("---"),
				$("#RedoxAjust").val("---"),
				l="N/A",
				$(scanRedoxLed).removeClass("ledOn").addClass("ledOff")
			}
		}));

		$("#validSondes").click((function(){
			sondes=[],
			sonde1={}
				sonde1.printable=$("#sonde1Val").val(),
				sonde1.other=$("#sonde1Val").attr("value"),
				sonde1.type=$("#sonde1Type").text(),
				sonde1.index=e,
			sondes.push(sonde1),
			sonde2={}
				sonde2.printable=$("#sonde2Val").val(),
				sonde2.type=$("#sonde2Type").text(),
				sonde2.index=t,
			sondes.push(sonde2),
			sonde3={}
				sonde3.printable=$("#sonde3Val").val(),
				sonde3.type=$("#sonde3Type").text(),
				sonde3.index=a,
			sondes.push(sonde3),
			$(this).addClass("ui-disabled"),
			o=!1,
			c("validSondes","sondes",JSON.stringify(sondes),"")
		}));

		$("#scanSondes").click((function(){
			$("#sonde1Val").val(""),
			$("#sonde2Val").val(""),
			$("#sonde3Val").val(""),
			c("scanSondes",""),
			$("#validSondes").removeClass("ui-disabled")
		}));

		$("#sonde1Type").click((function(){
			if(o){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						s="eau"
						if((("air"==i&&(("N/A"==n)||("pac"==n))) || ("pac"==i&&(("N/A"==n)||("air"==n))) || ("N/A"==i && "eau"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Eau":
						$(this).text("Air"),
						s="air"
						if((("eau"==i&&(("N/A"==n)||("pac"==n))) || ("pac"==i&&(("N/A"==n)||("eau"==n))) || ("N/A"==i && "air"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac"),
						s="pac"
						if((("air"==i&&(("N/A"==n)||("eau"==n))) || ("eau"==i&&(("N/A"==n)||("air"==n))) || ("N/A"==i && "pac"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						s="N/A"
						if(i!=n) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		$("#sonde2Type").click((function(){
			if(o){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						i="eau"
						if((("air"==s&&(("N/A"==n)||("pac"==n))) || ("pac"==s&&(("N/A"==n)||("air"==n))) || ("N/A"==s && "eau"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Eau":
						$(this).text("Air"),
						i="air"
						if((("eau"==s&&(("N/A"==n)||("pac"==n))) || ("pac"==s&&(("N/A"==n)||("eau"==n))) || ("N/A"==s && "air"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac");
						i="pac";
						if((("air"==s&&(("N/A"==n)||("eau"==n))) || ("eau"==s&&(("N/A"==n)||("air"==n))) || ("N/A"==s && "pac"!=n) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						i="N/A"
						if(s!=n) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		$("#sonde3Type").click((function(){
			if(o){
				switch($(this).text()){
					case"N/A":
						$(this).text("Eau"),
						n="eau"
						if((("air"==i&&(("N/A"==s)||("pac"==s))) || ("pac"==i&&(("N/A"==s)||("air"==s))) || ("N/A"==i && "eau"!=s) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
					break;
					case"Eau":
						$(this).text("Air"),
						n="air"
						if((("eau"==i&&(("N/A"==s)||("pac"==s))) || ("pac"==i&&(("N/A"==s)||("eau"==s))) || ("N/A"==i && "air"!=s) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Air":
						$(this).text("Pac"),
						n="pac"
						if((("air"==i&&(("N/A"==s)||("eau"==s))) || ("eau"==i&&(("N/A"==s)||("air"==s))) || ("N/A"==i && "pac"!=s) ))
							$("#validSondes").removeClass("ui-disabled");
						else 
							$("#validSondes").addClass("ui-disabled")
						break;
					case"Pac":
						$(this).text("N/A"),
						n="N/A";
						if(i!=s) 
							$("#validSondes").removeClass("ui-disabled")
						else 
							$("#validSondes").addClass("ui-disabled")
				}
			}
		}));

		piscineMaintenanceEvent=$.SSE("/piscineMaintenanceEvents",{
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
						url:"/setPiscineInitMaintenance",
						data:"sess="+sessID,
						dataType:"text",
						success:function(e){
							console.log("Call to /setPiscineInitMaintenance is success")
						},
						error: function (xhr, status, errorThrown) {
							console.log('An error occurred while calling /setPiscinePagePrincip, data is: ' + xhr.status + ' and exception is : ' + xhr.responseText);
							if ((xhr.status == "400") && (xhr.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
								console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
								$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
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
			var u=new Date;
			var p=0;
			console.log("piscineMaintenanceServer"),
			console.log(c)
			if(expirationDate<u.getTime()){
				console.log("Session ttl expired: go to login diag"),
				console.log("expiration is "+expirationDate+" and now is "+u.getTime()),
				$.mobile.changePage("#dlg-EndSessionAlert");
			} else {
				d=(expirationDate-u.getTime())/1e3,
				console.log("Session is still valid, time left to run : "+d+" secs"),
				data=$.trim(c.data);
				var m=JSON.parse(data);
				console.log("serverEvent json is "+JSON.stringify(m));

				if(m.hasOwnProperty("sondes")){
					if(m.sondes.length>=1){
						h=m.sondes[0]
						if("N/A"===h.type){
							$("#sonde1Val").val(""),
							$("#sonde1Type").text("N/A"),
							$("#sonde1Type").addClass("ui-disabled"),
							e=-1
							s=h.type
						}else{
							$("#sonde1Val").val(h.printable),
							$("#sonde1Type").text(h.type)
							$("#sonde1Type").removeClass("ui-disabled"),
							s=h.type.toLowerCase(),
							e=h.index
						}
					} 
					if(m.sondes.length>=2){
						h=m.sondes[1]
						if("N/A"===h.type){
							$("#sonde2Val").val(""),
							$("#sonde2Type").text("N/A"),
							$("#sonde2Type").addClass("ui-disabled"),
							i=h.type
							t=-1
						}else{
							$("#sonde2Val").val(h.printable),
							$("#sonde2Type").text(h.type),
							$("#sonde2Type").removeClass("ui-disabled"),
							i=h.type.toLowerCase(),
							t=h.index
						}
					}
					if(m.sondes.length>=3){
						h=m.sondes[2];
						if("N/A"===h.type){
							$("#sonde3Val").val(""),
							$("#sonde3Type").text("N/A"),
							$("#sonde3Type").addClass("ui-disabled"),
							a=-1
							n="N/A"
						} else {
							$("#sonde3Val").val(h.printable),
							$("#sonde3Type").text(h.type),
							$("#sonde3Type").removeClass("ui-disabled"),
							h.type=h.type.toLowerCase(),
							a=h.index
						}
					}
					if(o=!0){
						if("N/A"===s&&"N/A"===i&&"N/A"===n)
							$("#validSondes").addClass("ui-disabled")
						else
							$("#validSondes").removeClass("ui-disabled")
					}
				} 
				if(m.hasOwnProperty("phCalc")){
					p=parseFloat(m.phCalc)
					console.log("Got phClac and theVal is :"+p),
					$("#PHCalc").val(p.toFixed(2).toString())
					if("N/A"!==r){
						if(m.hasOwnProperty("phMesu")){
							p=parseFloat(m.phMesu),
							$("#PHMesu").val(p.toFixed(3).toString()),
							$("#validPH").removeClass("ui-disabled")
						}
						if(m.hasOwnProperty("phAjust")){
							p=parseFloat(m.phAjust),
							$("#PHAjust").val(p.toFixed(3).toString())
						}
					}
				}
				if(m.hasOwnProperty("redoxCalc")){
					p=parseFloat(m.redoxCalc),
					console.log("Got redoxClac and theVal is :"+p),
					$("#RedoxCalc").val(p.toFixed(1).toString())
					if("N/A"!==l){
						if(m.hasOwnProperty("redoxMesu")){
							p=parseFloat(m.redoxMesu),
							$("#RedoxMesu").val(p.toFixed(1).toString()),
							$("#validRedox").removeClass("ui-disabled")
						}
						if(m.hasOwnProperty("redoxAjust")){
							p=parseFloat(m.redoxAjust),
							$("#RedoxAjust").val(p.toFixed(1).toString())
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
		url: '/getUsers',
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
	});
	$(document).on('pagebeforehide', '#pagePiscinePrincipale', function(){       
		console.log('-- STOPPING Piscine Server Events --');
		piscineEvent.stop();
	});

	$(document).on('pagebeforeshow', '#pagePiscineParametres', function(){       
		console.log('-- STARTING Piscine Params Server Events --');
		piscineParamsEvent.start();
	});
	$(document).on('pagebeforehide', '#pagePiscineParametres', function(){       
		console.log('-- STOPPING Piscine Params Server Events --');
		piscineParamsEvent.stop();
	});

	$(document).on("pagebeforeshow", "#pagePiscineDebug", function(){
		console.log("-- STARTING Piscine Debug Server Events --");
		piscineDebugEvent.start();
		$.ajax({
			type:"POST",
			url:"/setPiscinePageDebug",
			data:"sess="+sessID+"&trigger=start",
			dataType:"text",
			success:function(e){
				console.log("Call to /setPiscinePageDebug?trigger=start is success");
			},
			error:function(e,t,a){
				console.log("An error occurred while calling /setPiscineMaintenance, data is: "+e.status+" and exception is : "+e.responseText);
				if ((e.status == "400") && (e.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
					console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
					$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
				}
			}
		})
	});
	$(document).on("pagebeforehide","#pagePiscineDebug",function(){
		console.log("-- STOPPING Piscine Debug Server Events --");
		piscineDebugEvent.stop();
		$.ajax({
			type:"POST",
			url:"/setPiscinePageDebug",
			data:"sess="+sessID+"&trigger=stop",
			dataType:"text",
			success:function(e){
				console.log("Call to /setPiscinePageDebug?trigger=stop is success")
			},
			error:function(e,t,a){
				console.log("An error occurred while calling /setPiscineMaintenance, data is: "+e.status+" and exception is : "+e.responseText);
				if ((e.status == "400") && (e.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
					console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
					$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
				}
			}
		})
	});

	$(document).on("pagebeforeshow","#pagePiscineMaintenance",function(){
		console.log("-- STARTING Piscine Maintenance Server Events --");
		piscineMaintenanceEvent.start();
	});
	$(document).on("pagebeforehide","#pagePiscineMaintenance",function(){
		function e(e,t,a){
			var s="sess="+sessID+"&command="+e+"&"+t+"="+a;
			$.ajax({
				type:"POST",
				url:"/setPiscineMaintenance",
				data:s,
				dataType:"text",
				success:function(t){
					console.log("Call to /setPiscineMaintenance with command="+e+" is success")
				},
				error:function(e,t,a){
					console.log("An error occurred while calling /setPiscineMaintenance, data is: "+e.status+" and exception is : "+e.responseText);
					if ((e.status == "400") && (e.responseText.indexOf("Invalid Session") !== -1)){				//400: Invalid Session
						console.log('THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN');
						$.mobile.changePage( "#dlg-EndSessionAlert" );		// 	or $("#popupDialog").popup("open") to stay on same page
					}
				}
			})
		}
		e("cancelScan","type","PH");
		e("cancelScan","type","Redox");
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
console.log( "ready to go !" );
// navigate to a page : $.mobile.navigate(#pageid); (keep history) or $.mobile.changePage( "#pageID", { transition: "slideup"});

