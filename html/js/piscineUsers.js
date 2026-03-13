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
	html += '		<li><a href="#pagePiscineGraphs" data-transition="slide">Piscine Graphs</a></li>';
	html += '		<li><a href="#pagePiscineDebug" data-transition="slide">Piscine Debug</a></li>';
	html += '	</ul>';
	html += '</div>';
	return html;
  }	

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
