/*! WOW wow.js - v1.3.0 - 2016-10-04
* https://wowjs.uk
* Copyright (c) 2016 Thomas Grainger; Licensed MIT */
/**
* @version: 3.1
* @author: Dan Grossman http://www.dangrossman.info/
* @copyright: Copyright (c) 2012-2019 Dan Grossman. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
* @website: http://www.daterangepicker.com/
*/


var sessID,ttl,userName,passWord,roles,mainPage,timeoutPPID,maPiscine=maPiscine||{}

,debug=!0,expirationDate=0,userMenu=!1,lampeSWVal=0,voletSWVal=0,statusErrorMap={400:"Server understood the request, but request content was invalid.",401:"Unauthorized access.",403:"Forbidden resource can't be accessed.",500:"Internal server error.",503:"Service unavailable."}

;

function storeUserInfos(){var e=new Date;expirationDate=e.getTime()+1e3*ttl,console.log("In store Infos : now is: "+e.getTime()+"and expiration is: "+expirationDate),maPiscine.Session.getInstance().set({username:userName,passord:passWord,userRoles:roles,sessionId:sessID,theExpirationDate:expirationDate,mainPage:mainPage}

)}



function onError(e,t){var a;console.log("An error occurred."),console.log(e),e.status?(a=statusErrorMap[e.status])||(a="Unknown Error \n."+e.status):a="parsererror"==t?"Error.\nParsing JSON Request failed.":"timeout"==t?"Request Time out.":"abort"==t?"Request was aborted by the server":"Uncaught Error.\n"+e.responseText,alert(a)}



function setCookie(e,t,a){var s=new Date;s.setTime(s.getTime()+60*a*60*1e3);var i="expires="+s.toUTCString();document.cookie=e+"="+t+";"+i+";path=/"}



function getCookie(e){for(var t=e+"=",a=document.cookie.split(";"),s=0;s<a.length;s++){for(var i=a[s];" "==i.charAt(0);)i=i.substring(1);if(0==i.indexOf(t))return i.substring(t.length,i.length)}



return""}



function validateLogin(e,t){console.log(t+"\n"+e.serialize()),$.ajax({type:e.attr("method"),url:t,cache:!1,data:e.serialize(),success:onSuccess,error:onError}



)}



function onSuccess(e,t){e=$.trim(e);var a=JSON.parse(e);console.log("returned json is "+JSON.stringify(a)),$.mobile.changePage("#dlg-login"),"Log in Successful"==a.status?($("#mainPageButton").show(),$("#retryButton").hide(),$("#backButton").hide(),$("#loginButton").hide(),userName=a.username,passWord=a.password,sessID=a.sessionID,ttl=a.ttl,roles=a.roles,getMainPage(),console.log("mainPage on success is "+mainPage+"\n"),$("#mainPageButton").prop("href",mainPage),$("#dlg-ttl").html(document.createTextNode("Your Session Time is : "+ttl+" seconds")),storeUserInfos(),setCookie("maPiscine",sessID,ttl)):"Log in Failed"==a.status?($("#mainPageButton").hide(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"User Already Exist"==a.status?($("#mainPageButton").hide(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide(),userName=a.username):"New User Created Succesfully"==a.status?($("#retryButton").hide(),$("#loginButton").hide(),"true"==a.flgLogin?(userName=a.username,passWord=a.password,sessID=a.sessionID,ttl=a.ttl,roles=a.roles,getMainPage(),$("#mainPageButton").prop("href",mainPage),$("#dlg-ttl").html(document.createTextNode("Your Session Time is : "+ttl+" seconds")),storeUserInfos(),setCookie("maPiscine",sessID,ttl),$("#mainPageButton").show(),$("#backButton").hide()):($("#mainPageButton").hide(),$("#backButton").show(),$("#dlg-ttl").hide())):"No room for new user"==a.status?($("#mainPageButton").hide(),$("#retryButton").hide(),$("#backButton").hide(),$("#loginButton").show(),$("#dlg-ttl").hide(),userName=a.username):"Bad AdminPassword"==a.status?($("#mainPageButton").hide(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"Admin Password Updated"==a.status?($("#mainPageButton").hide(),$("#retryButton").hide(),$("#backButton").show(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"Bad Admin Password"==a.status?($("#mainPageButton").hide(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"User Profile Updated"==a.status?($("#mainPageButton").hide(),$("#retryButton").hide(),$("#backButton").show(),$("#loginButton").hide(),$("#dlg-ttl").hide(),userName=a.username,passWord=a.password,roles=a.roles,storeUserInfos(),setCookie("maPiscine",sessID,ttl)):"User Profile not Updated"==a.status?($("#mainPageButton").show(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"User(s) Deleted"==a.status?($("#mainPageButton").hide(),$("#retryButton").hide(),$("#backButton").show(),$("#loginButton").hide(),$("#dlg-ttl").hide()):"No User(s) to Delete"==a.status&&($("#mainPageButton").hide(),$("#retryButton").show(),$("#backButton").hide(),$("#loginButton").hide(),$("#dlg-ttl").hide()),$("#dlg-user").html(document.createTextNode(userName)),$("#dlg-status").html("<H2>"+a.status+"</H2>"),$("#dlg-message").html(document.createTextNode(a.message)),console.log("returned json is "+JSON.stringify(a))}



function getMainPage(){mainPage="#pagePiscinePrincipale",console.log("mainPage is :"+mainPage+"\n")}



function setUserUI(){var e="",t=!1,a=!1;console.log("In set UI\n"),e+=piscineMenu(!a),a||(a=!0),t||(t=!0),e+='<hr class="inset">',$("#leftpanelMenu").html(e),$("#leftpanelMenu").enhanceWithin()}



function piscineMenu(e){var t="";return t+='<div data-role="collapsible" data-collapsed-icon="plus" data-expanded-icon="minus" data-iconpos="right" data-theme="b" data-content-theme="b" ',t+=e?'data-collapsed="false">':">",t+='\t<h3 class="myh3">Piscine</h3>',t+='\t<ul data-role="listview" data-inset="true">',t+='\t\t<li><a href="#pagePiscinePrincipale" data-transition="slide">Piscine</a></li>',t+='\t\t<li><a href="#pagePiscineParametres" data-transition="slide">Piscine Parametres</a></li>',t+='\t\t<li><a href="#pagePiscineMaintenance" data-transition="slide">Piscine Maintenance</a></li>',t+='\t\t<li><a href="#pagePiscineAlertes" data-transition="slide">Piscine Alertes</a></li>',t+='\t\t<li><a href="#pagePiscineDebug" data-transition="slide">Piscuine Debug</a></li>',t+='\t\t<li><a href="#pagePiscineGraphs" data-transition="slide">Graphiques</a></li>',t+="\t</ul>",t+="</div>"}



function onPageSuccess(e){e=$.trim(e);var t=JSON.parse(e);console.log("returned json is "+JSON.stringify(t)),"Error"==t.status&&($.mobile.changePage("#arrosageError-dlg"),$("#ArrosageErrorStatus").val(t.message),$("#ArrosageErrorCorrection").val(t.correction))}



function onPageError(e){"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}



maPiscine.Session=function(){var e;return{getInstance:function(){var t;return e||(t="maPiscine-session",e={set:function(e){window.localStorage.setItem(t,JSON.stringify(e))}



,get:function(){var e=null;try{e=JSON.parse(window.localStorage.getItem(t))}



catch(e){}

return e}

}

),e}

}

}

(),$((function(){$("#loginForm").validate({rules:{username:{minlength:5,required:!0}

,password:{minlength:5,required:!0}

}

,messages:{username:{required:"Please enter your username",minlength:"Your username must be at least 5 chars"}

,password:{required:"Please provide a password",minlength:"Your password must be at least 5 chars"}

}

,submitHandler:function(e){validateLogin($(e),"/logon")}

}

)}

)),$((function(){$("#registrationForm").validate({rules:{username:{required:!0,maxlength:11}

,password:{required:!0,minlength:5,maxlength:11}

,password2:{required:!0,equalTo:"#mainpassword"}

,adminpassword:{required:!0}

}

,messages:{username:{required:"Please enter your username",maxlength:"Your username must be at most 11 chars"}

,password:{required:"Please provide a password",minlength:"Your password must be at least 5 chars",maxlength:"Your password must be at most 11 chars"}

,password2:{required:"Please re-enter the password",equalTo:"Password Check isn't the same"}

,adminpassword:{required:"Please provide the admin password"}

}

,submitHandler:function(e){validateLogin($(e),"/register")}

}

)}

)),$((function(){$("#changeAdminForm").validate({rules:{password:{required:!0,minlength:5,maxlength:11}

,passwordchk:{required:!0,equalTo:"#newadminpassword"}

,adminpassword:{required:!0}

}

,messages:{password:{required:"Please provide a new password for admin",minlength:"Your password must be at least 5 chars",maxlength:"Your password must be at most 11 chars"}

,passwordchk:{required:"Please re-enter the new admin password",equalTo:"Password Check isn't the same"}

,adminpassword:{required:"Please provide the old admin password"}

}

,submitHandler:function(e){validateLogin($(e),"/changeAdmin")}

}

)}

)),$((function(){$("#userProfileForm").validate({rules:{username:{minlength:5,maxlength:11,required:!0}

,password2:{required:!0,equalTo:"#userpasswordprofile"}

,password:{minlength:5,maxlength:11,required:!0}

}

,messages:{username:{required:"Please enter your username",minlength:"Your username must be at least 5 chars",maxlength:"Your username must be at most 11 chars"}

,password2:{required:"Please re-enter the password",equalTo:"Password Check isn't the same"}

,password:{required:"Please provide a password",minlength:"Your password must be at least 5 chars",maxlength:"Your password must be at most 11 chars"}

}

,submitHandler:function(e){$("#UPusername").val(userName),validateLogin($(e),"/userProfile")}

}

)}

)),$((function(){$("#deleteUsersForm").validate({submitHandler:function(e){console.log("/deleteUsers\n"+$(e).serialize()),$.ajax({type:"post",url:"/deleteUsers",cache:!1,data:$(e).serialize(),success:onSuccess,error:onError}

)}

}

)}

));

var OrigStart,OrigEnd,CurrStart,CurrEnd,chartdata=[],chart={}

,dataOrigin=[],currData=[];

function csvToArray1(e,t){return e.split("\\r\\n").map((function(e){return e.split(t)}

))}

function csvToArray2(e){const t=e.split("\r\n"),a=[];for(const e of t){const t=e.split(",");a.push(t)}

return a}

function csvToArray3(e){const t=[];e.split("\n").map((e=>e.split(","))),console.log("Entire Array:",array)}

function csvToArray4(e){const t=e.split("\r\n"),a=[];var s=[];for(i=0;i<t.length;i++)s=t[i].split(";"),a.push(s);return a}

function csvToArray(e){for(var t=e.split("\r\n"),a=[],s=0;s<t.length;s++){var i=t[s];if(0!=i.length){var n=i.split(";");n[0]=dayjs(n[0],"DD/MM/YY HH:mm:ss").toDate();for(var o=1;o<n.length;o++)n[o]=parseFloat(n[o]);a.push(n)}

}

return a}

function syncGraphAjax(e,t){return console.log("Calling /getGraphDatas?sess="+sessID+"&start="+e+"&end="+t),new Promise((function(a,s){$.ajax({type:"POST",url:"/getGraphDatas",data:"sess="+sessID+"&start="+e+"&end="+t,dataType:"text",success:function(e){a(e)}

,error:function(e){s(e)}

}

)}

))}

async function fetchData(e,t){var a=[];curr=dayjs(e),fin=dayjs(t),console.log("   ==> fetching chartdata; start:"+curr.format("DD-MM-YYYY")+" end:"+fin.format("DD-MM-YYYY")),$.mobile.loading("show",{text:"Chargement",textVisible:!0,textonly:!1}

);try{var s=await syncGraphAjax(curr.format("DD-MM-YYYY"),fin.format("DD-MM-YYYY"));if($.mobile.loading("hide"),(s=$.trim(s)).includes("Error")){var i=JSON.parse(s);console.log("returned json is "+JSON.stringify(i)),"Error"==i.status&&($.mobile.changePage("#piscineError-dlg"),$("#PiscineErrorStatus").val(i.message),$("#PiscineErrorCorrection").val(i.correction))}

else a=csvToArray(s)}

catch(e){$.mobile.loading("hide"),console.log("An error occurred while calling /getGraphDatas, data is: "+e.status+" and exception is : "+e.responseText),onPageError(e)}

return 0!=a.length&&(console.log("Updating Origin Data in graph\n"),chart.updateOptions({file:a}

)),a}

function getOriginData(){i=0,now=dayjs().set("minute",0).set("second",0),start=dayjs().subtract(1,"month").startOf("month"),console.log("Fetching Origin Data: start:"+start.format("DD-MM")+" end:"+now.format("DD-MM")),dataOrigin=fetchData(start,now),chartdata=dataOrigin,OrigStart=CurrStart=start,OrigEnd=CurrEnd=now}

function getNewData(e,t){var a=[];console.log("getNewData before; start:"+e.format("DD-MM")+" end:"+t.format("DD-MM")+"\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM")+"\n"),CurrStart==OrigStart?e.isBefore(OrigStart)?t.isAfter(OrigStart)?(a=fetchData(e,OrigStart),dataOrigin=a.concat(dataOrigin),OrigStart=CurrStart=e,CurrEnd=OrigEnd,chartdata=dataOrigin,console.log("getNewData; extend orig data by newStart:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):(a=fetchData(e,t),CurrStart=e,CurrEnd=t,chartdata=currData=a,console.log("getNewData; new data  (NewEnd < OrigStart):\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):(chartdata=dataOrigin,console.log("getNewData; newStart > OrigStart just zoom on dataOrigin:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):e.isAfter(OrigStart)||e.isSame(OrigStart)?(chartdata=dataOrigin,console.log("getNewData; using dataCurr fetching into dataOrigin:\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):t.isAfter(OrigStart)||t.isSame(OrigStart)?(a=fetchData(e,OrigStart),dataOrigin=a.concat(dataOrigin),OrigStart=e,chartdata=dataOrigin,console.log("getNewData; using dataCurr extend dataOrigin by new start :\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):e.isAfter(CurrStart)||e.isSame(CurrStart)?t.isBefore(CurrEnd)||t.isSame(CurrEnd)?(chartdata=currData,console.log("getNewData; outside dataOrigin inside currData, just zoom :\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):e.isBefore(CurrEnd)||e.isSame(CurrEnd)?(a=fetchData(CurrEnd,t),CurrEnd=t,currData=currData.concat(a),chartdata=currData,console.log("getNewData; outside dataOrigin fetching after currEnd\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):(a=fetchData(e,t),CurrStart=e,CurrEnd=t,chartdata=currData=a,console.log("getNewData; outside dataOrigin fetching outside (before) currdata => new currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):t.isAfter(CurrStart)||t.isSame(CurrStart)?t.isBefore(CurrEnd)||t.isSame(CurrEnd)?(a=fetchData(e,CurrStart),CurrStart=e,currData=a.concat(currData),chartdata=currData,console.log("getNewData; outside dataOrigin fetch before currStart but inside cuurEnd\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):(a=fetchData(e,CurrStart),currData=a.concat(currData),a=fetchData(CurrEnd,t),currData=currData.concat(a),CurrStart=e,CurrEnd=t,chartdata=currData,console.log("getNewData; outside dataOrigin fetch before and after currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))):(a=fetchData(e,t),CurrStart=e,CurrEnd=t,chartdata=currData=a,console.log("getNewData; outside dataOrigin fetchig outside of currdata (after) = new currData\nCurrStart:"+CurrStart.format("DD-MM")+" CurrEnd:"+CurrEnd.format("DD-MM")+"\nOrigStart:"+OrigStart.format("DD-MM")+" OrigEnd:"+OrigEnd.format("DD-MM"))),chart.updateOptions({file:chartdata}

)}


$(document).on("mobileinit",(function(e,t){
    $.mobile.defaultPageTransition="slidefade",
    $.mobile.dialog.prototype.options.closeBtnText="Retour",
    $.mobile.loader.prototype.options.theme="b",
    $.mobile.eventLogger({deprecated:!0,showAlert:!0,events:{page:!0,navigation:!0},widgets:{page:!0,pagecontainer:!0}})})),
$("#logoff").keypress((function(e){13==e.which&&$("#logoffButton").click()})),
$("#dlg-login").keypress((function(e){13==e.which&&$("#mainPageButton").click()}
)),

$(document).on("pagecontainerbeforechange",(function(e,t){
    var a,s,i="object"==typeof t.toPage,n=maPiscine.Session.getInstance().get(),o=new Date;
    switch(a=i?t.toPage.attr("id"):t.toPage.substring(t.toPage.indexOf("#")+1),
    console.log("Call Before Change with toPageisObj="+i),
    console.log("move to page id : "+a+"\n"),
    t.prevPage&&console.log("Previous page was :"+t.prevPage.attr("id")+"\n"),
    t.prevPage&&"dlg-login"!==t.prevPage.attr("id")&&"pageLogin"!==t.prevPage.attr("id")&&"dlg-EndSessionAlert"!==t.prevPage.attr("id")&&"leftpanel"!==a&&!debug&&(expirationDate<o.getTime()?(console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+o.getTime()),t.toPage=i?$("#dlg-EndSessionAlert"):"#dlg-EndSessionAlert"):(s=(expirationDate-o.getTime())/1e3,console.log("Session is still valid, time left to run : "+s+" secs"))),a)
    {case"pageLogin":if(!t.prevPage){n=maPiscine.Session.getInstance().get(),o=new Date;n&&n.theExpirationDate>o.getTime()&&(userName=n.username,passWord=n.passord,roles=n.userRoles,sessID=n.sessionId,expirationDate=n.thexpirationDate,mainPage=n.mainPage,t.toPage=$(mainPage))}
    break;
    case"pageRegisterLogin":"pageLogin"==t.prevPage.attr("id")?(console.log("comming from loging"),$("#mainRegisterButton").text("Get Started").trigger("refresh"),$("#pageRegisterTitle").text("Signup").trigger("refresh"),$("#backToLoginButton").show(),$("#rtnButton").hide(),$("#flgLogin").val("true")):(console.log("Not comming from login"),$("#mainRegisterButton").text("Add User").trigger("refresh"),$("#pageRegisterTitle").text("Add New User").trigger("refresh"),$("#backToLoginButton").hide(),$("#rtnButton").show(),$("#flgLogin").val("false"));
    break;
    case"dlg-login":"pageLogin"==t.prevPage.attr("id")?$("#dlg-login .ui-title").text("Login"):$("#dlg-login .ui-title").text("User Management");
    break;
    case"leftpanel":userMenu||(console.log("calling leftpanel, set ui\n"),setUserUI(),userMenu=!0)
    }
})),

$(document).on("pagecontainerbeforeshow",(function(e,t){
    if("object"==typeof t.toPage)
    switch(t.toPage.attr("id")){
        case"leftpanel":userMenu||(setUserUI(),$("#leftpanel").enhanceWithin(),userMenu=!0);
        break;
        case"dlg-login???":"pageLogin"==t.prevPage.attr("id")?$("#dlg-login .ui-title").text("Login"):$("#dlg-login .ui-title").text("User Management"),$("#dlg-login").enhanceWithin()
    }
})),

$(document).delegate("#logoff-dlg","pagebeforecreate",(function(){$("#logoffButton").bind("tap",(function(){console.log("ask for loging off\n"),sessID="",userName="",passWord="",roles=[0,0,0,0,0,0,0,0],mainPage="";var e=new Date;maPiscine.Session.getInstance().set({username:"",sessionId:"",mainPage:"",expirationDate:e})
,userMenu=!1,$.mobile.changePage("#pageLogin")}))})),

$(document).delegate("#pagePiscinePrincipale","pagebeforecreate",(function(){var e,t,a,s=!0,i=!0,n=!0,o=!0,r=Gauge(document.getElementById("PHGauge"),{min:4,max:10.4,value:7.2,label:function(e){return e<=4?"---":Number.parseFloat(e).toFixed(1)}
,color:function(e){return e<5?"#ef4655":e<6.8?"#f7aa38":e<7.6?"#5ee432":e<9?"#f7aa38":"#ef4655"}})
,l=Gauge(document.getElementById("CLGauge"),{min:0,max:2.4,value:1.2,label:function(e){return 0==e?"---":Number.parseFloat(e).toFixed(1)}
,color:function(e){return e<.8?"#ef4655":e<1.1?"#f7aa38":e<1.3?"#5ee432":e<1.6?"#f7aa38":"#ef4655"}})
,c=Gauge(document.getElementById("RedoxGauge"),{min:400,max:900,value:700,label:function(e){return e<=400?"<400":Number.parseInt(e).toFixed(0)}
,color:function(e){return e<600?"#ef4655":e<650?"#f7aa38":e<750?"#5ee432":e<800?"#f7aa38":"#ef4655"}
});

function d(e){$(e).fadeOut("slow",(function(){$(this).fadeIn("slow",(function(){d(this)}))}))}
console.log("First time, showing redox Gauge"),$("#CLGaugeDiv").hide(),$("#RedoxGaugeDiv").show(),$("#RedoxCLDiv").bind("tap",(function(e,t){e.preventDefault(),console.log(i?"AffRedox is true":"AffRedox is false"),i?(console.log("Showing CL Gauge"),$("#CLGaugeDiv").show(),$("#RedoxGaugeDiv").hide(),i=!1):(console.log("Showing Redox Gauge"),$("#CLGaugeDiv").hide(),$("#RedoxGaugeDiv").show(),i=!0)})),
$("#powerSW").click((function(){0==s?($(".screenOutput").removeClass("screenOff").addClass("screenOn"),$(".screenFrame").removeClass("displayOff").addClass("displayOn"),piscineEvent.start(),s=!0):($(".screenOutput").removeClass("screenOn").addClass("screenOff"),$(".screenFrame").removeClass("displayOn").addClass("displayOff"),$("#lampeLed").removeClass("ledOn").addClass("ledOff"),$("#voletLed").removeClass("ledOn").addClass("ledOff"),$("#PPLed").removeClass("ledOn").addClass("ledOff"),$("#PACLed").removeClass("ledOn").addClass("ledOff"),$("#PHLed").removeClass("ledOn").addClass("ledOff"),$("#CLLed").removeClass("ledOn").addClass("ledOff"),$("#P3Led").removeClass("ledOn").addClass("ledOff"),$("#autoLed").removeClass("ledOn").addClass("ledOff"),r.setValueAnimated(0,1),l.setValueAnimated(0,1),c.setValueAnimated(0,1),document.getElementById("tempAir").value="-----",$("#tempEau").val("-----"),$("#tempInt").val("-----"),$("#tempPAC").val("-----"),$("#lampeSwitch").prop("checked")&&$("#lampeSW").click(),$("#voletSwitch").prop("checked")&&$("#voletSW").click(),piscineEvent.stop(),s=!1)})),
$("#lampeSW").click((function(){if(n){$("#lampeSwitch").prop("checked");lampeSWVal=0==lampeSWVal?1:0,$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=lampe&val="+lampeSWVal,dataType:"text",success:function(e){console.log("Call to /setLampe is success value is:"+lampeSWVal)}
,error:function(e,t,a){console.log("An error occurred while calling /setLampe, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else n=!0})),
$("#voletSW").click((function(){if(o){$("#voletSwitch").prop("checked");voletSWVal=0==voletSWVal?1:0,$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=volet&val="+voletSWVal,dataType:"text",success:function(e){console.log("Call to /setVolet is success value is:"+voletSWVal)}
,error:function(e,t,a){console.log("An error occurred while calling /setVolet, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else o=!0})),
piscineEvent=$.SSE("/piscineEvents",{onOpen:function(e){console.log("Open SSE to /piscineEvents"),console.log(e)}
,onEnd:function(e){console.log("Ending SSE PiscineEvent"),console.log(e)}
,onError:function(e){console.log("Could not connect to SSE /piscineEvents")}
,onMessage:function(e){console.log("Message from /piscineEvents"),console.log(e),data=$.trim(e.data),data.includes("hello!")&&$.ajax({type:"POST",url:"/setPiscinePagePrincip",data:"sess="+sessID,dataType:"text",success:function(e){console.log("Call to /setPiscinePagePrincip is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscinePagePrincip, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}
,options:{forceAjax:!1}
,events:{piscineData:function(e){var t,a=new Date;if(console.log("PiscineData"),console.log(e),1==s)if(expirationDate<a.getTime())console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+a.getTime()),$.mobile.changePage("#dlg-EndSessionAlert");else{t=(expirationDate-a.getTime())/1e3,console.log("Session is still valid, time left to run : "+t+" secs"),data=$.trim(e.data);var i=JSON.parse(data);console.log("serverEvent json is "+JSON.stringify(i)),i.hasOwnProperty("phVal")&&r.setValueAnimated(i.phVal/100,1),i.hasOwnProperty("redoxVal")&&(console.log("processing redoxVal:"+parseInt(i.redoxVal)),c.setValueAnimated(parseInt(i.redoxVal),1)),i.hasOwnProperty("clVal")&&l.setValueAnimated(i.clVal/100,1),i.hasOwnProperty("tempAir")&&$("#tempAir").val(i.tempAir/100),i.hasOwnProperty("tempEau")&&$("#tempEau").val(i.tempEau/100),i.hasOwnProperty("tempInt")&&$("#tempInt").val(i.tempInt/100),i.hasOwnProperty("tempPAC")&&$("#tempPAC").val(i.tempPAC/100),i.hasOwnProperty("lampe")&&(0==i.lampe?($("#lampeLed").removeClass("ledOn").addClass("ledOff"),$("#lampeSwitch").is(":checked")&&(n=!1,$("#lampeSW").click()),lampeSWVal=0):1==i.lampe&&($("#lampeLed").removeClass("ledOff").addClass("ledOn"),$("#lampeSwitch").is(":checked")||(n=!1,$("#lampeSW").click()),lampeSWVal=1)),i.hasOwnProperty("volet")&&(0==i.volet?($("#voletLed").removeClass("ledOn").addClass("ledOff"),$("#voletSwitch").is(":checked")&&(o=!1,$("#voletSW").click()),voletSWVal=0):1==i.volet&&($("#voletLed").removeClass("ledOff").addClass("ledOn"),$("#voletSwitch").is(":checked")||(o=!1,$("#voletSW").click()),voletSWVal=1)),i.hasOwnProperty("PP")&&(0==i.PP?$("#PPLed").removeClass("ledOn").addClass("ledOff"):$("#PPLed").removeClass("ledOff").addClass("ledOn")),i.hasOwnProperty("PAC")&&(0==i.PAC?$("#PACLed").removeClass("ledOn").addClass("ledOff"):$("#PACLed").removeClass("ledOff").addClass("ledOn")),i.hasOwnProperty("PH")&&(0==i.PH||-2==i.PH?$("#PHLed").removeClass("ledOn").addClass("ledOff"):$("#PHLed").removeClass("ledOff").addClass("ledOn")),i.hasOwnProperty("CL")&&(0==i.CL||-2==i.CL?$("#CLLed").removeClass("ledOn").addClass("ledOff"):$("#CLLed").removeClass("ledOff").addClass("ledOn")),i.hasOwnProperty("P3")&&(0==i.P3||-2==i.P3?$("#P3Led").removeClass("ledOn").addClass("ledOff"):$("#P3Led").removeClass("ledOff").addClass("ledOn")),i.hasOwnProperty("autoMode")&&(0==i.autoMode?$("#autoLed").removeClass("ledOn").addClass("ledOff"):$("#autoLed").removeClass("ledOff").addClass("ledOn"))}}
,piscineLCDData:function(i){var n,o=new Date;if(console.log("PiscineLCDData"),console.log(i),1==s)if(expirationDate<o.getTime())console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+o.getTime()),$.mobile.changePage("#dlg-EndSessionAlert");else{n=(expirationDate-o.getTime())/1e3,console.log("Session is still valid, time left to run : "+n+" secs"),data=$.trim(i.data);var r=JSON.parse(data);if(console.log("serverEvent json is "+JSON.stringify(r)),r.hasOwnProperty("ligne1")&&(e=r.ligne1,t=r.hasOwnProperty("ligne2")?r.ligne2:"",a=r.hasOwnProperty("ligne3")?r.ligne3:""),r.hasOwnProperty("Alerte")){$(".screenOutput").empty();var l='<h4 class="screenTextTitle"> Piscine Manager</h4><P class="screenTextStatus" id="alertMsg">'+e+'</P><P class="screenTextLine">'+t+"<BR>"+a+"</P>";$(".screenOutput").append(l).trigger("create"),d("#alertMsg")}
else{$("#LCDTextArea").empty();l='<h3 class="screenTextTitle"> Piscine Manager</h3><P class="screenTextLine">'+e+"<br>"+t+"<br>"+a+"</P>";$("#LCDTextArea").append(l).trigger("create")}
}}}}),Math.random(),Math.random()})),


$(document).delegate("#pagePiscineParametres","pagebeforecreate",(function(){var e=!0,t=!0,a=!0,s=!0,i=!0,n=!0,o=!0,r=!0,l=!0,c=!0,d=!0,h=!0,u=!0,p=!0,m=!0,g=!0,f=!0,v=!0,P=!0,S=!0,y=!0,D=!0,k=!0,C=!0,b=!0,x=!0,E=!0;$(".startClockpicker").clockpicker(),$(".stopClockpicker").clockpicker(),$("#lampeSWParam").click((function(){if(e){$("#lampeSwitchParam").is(":checked");lampeSWVal=0==lampeSWVal?1:0,$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=lampe&val="+lampeSWVal,dataType:"text",success:function(e){console.log("Call to /setLampe is success value is:"+lampeSWVal)}
,error:function(e,t,a){console.log("An error occurred while calling /setLampeParam, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else e=!0})),
$("#voletSWParam").click((function(){if(t){$("#voletSwitchParam").is(":checked");voletSWVal=0==voletSWVal?1:0,$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=volet&val="+voletSWVal,dataType:"text",success:function(e){console.log("Call to /setVolet is success value is:"+voletSWVal)}
,error:function(e,t,a){console.log("An error occurred while calling /setVolet, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else t=!0})),
$("#ModeManuSW").click((function(){if(r){var e=$("#ModeManuSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=autoMode&val="+e,dataType:"text",success:function(e){console.log("Call to /setModeManu is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setModeManu, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else r=!0})),
$("#PPSW").click((function(){if(a){var e=$("#PPSWitch").is(":checked")?-1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=PP&val="+e,dataType:"text",success:function(e){console.log("Call to /setPP is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPP, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else a=!0})),
$("#PACSW").click((function(){if(s){var e=$("#PACSWitch").is(":checked")?-1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=PAC&val="+e,dataType:"text",success:function(e){console.log("Call to /setPAC is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPAC, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else s=!0})),
$("#PmpPHSW").click((function(){if(i){var e=$("#PmpPHSWitch").is(":checked")?-1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=PH&val="+e,dataType:"text",success:function(e){console.log("Call to /setPmpPH is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPmpPH, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else i=!0})),
$("#PmpCLSW").click((function(){if(n){var e=$("#PmpCLSWitch").is(":checked")?-1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=CL&val="+e,dataType:"text",success:function(e){console.log("Call to /setPmpCL is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPmpCL, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else n=!0})),
$("#PmpALGSW").click((function(){if(o){var e=$("#PmpALGSWitch").is(":checked")?-1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=P3&val="+e,dataType:"text",success:function(e){console.log("Call to /setPmpALG is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPmpALG, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else o=!0})),
$("#PPstart").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Start Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=strtTPP&val="+e,dataType:"text",success:function(e){console.log("Call to /setPPStartTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPPStartTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})})),
$("#PPstop").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Stop Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=stopTPP&val="+e,dataType:"text",success:function(e){console.log("Call to /setPPStopTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPPStopTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}));
var O=24,A=0,w=!1;$("#TypeTempSW").click((function(){var e=$("#TypeTempSWitch").is(":checked")?1:0;1==e?($("#TempFixRelLabel").text("Temperature Relative"),$("#TempFixRel").prop({min:-20,max:20,value:A}
).slider("refresh"),w=!0):($("#TempFixRelLabel").text("Temperature Absolue"),$("#TempFixRel").prop({min:18,max:30,value:O}
).slider("refresh"),w=!1),h?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=typeTemp&val="+e,dataType:"text",success:function(e){console.log("Call to /setTypeTemp is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setTypeTemp, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
}):h=!0})),
$("#TempFixRelSlider").change((function(){var e=$("#TempFixRel").slider().val();console.log("New temp is "+e),l?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=tempFixRel&val="+e,dataType:"text",success:function(e){console.log("Call to /setTempFixRel is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setTempFixRel, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
}):l=!0})),
$("#PHRefSlider").change((function(){var e=$("#PHRef").slider().val();console.log("New PH ref is "+e),c?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=phRef&val="+10*e,dataType:"text",success:function(e){console.log("Call to /setPHRef is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPHRef, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
}):c=!0})),
$("#redoxRefSlider").change((function(){var e=$("#redoxRef").slider().val();console.log("New CL ref is "+e),d?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=redoxRef&val="+e,dataType:"text",success:function(e){console.log("Call to /setredoxRef is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setredoxRef, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
}):d=!0})),
$("#lampeAutoSW").click((function(){if(x){var e=$("#lampeAutoSWitch").is(":checked")?1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=lampeAuto&val="+e,dataType:"text",success:function(e){console.log("Call to /setLampeAuto is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setLampeAuto, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else x=!0})),
$("#lampeStart").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Start Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=strtLampe&val="+e,dataType:"text",success:function(e){console.log("Call to /setLampeStartTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setLampeStartTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})})),
$("#lampeStop").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Stop Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=stopLampe&val="+e,dataType:"text",success:function(e){console.log("Call to /setLampeStopTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setLampeStopTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})})),
$("#voletAutoSW").click((function(){if(E){var e=$("#voletAutoSWitch").is(":checked")?1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=voletAuto&val="+e,dataType:"text",success:function(e){console.log("Call to /setVoletAuto is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setVoletAuto, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}else E=!0})),
$("#voletOuv").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Ouv Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=ouvVolet&val="+e,dataType:"text",success:function(e){console.log("Call to /setVoletOuvTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setVoletOuvTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})})),
$("#voletFerm").change((function(){var e,t;t=this.value,e=parseInt(t),console.log("New Ferm Time is "+e),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=fermeVolet&val="+e,dataType:"text",success:function(e){console.log("Call to /setVoletFermTime is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setVoletFermTime, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}));
var T=1;
$("#TypeP3SW").click((function(){$("#TypeP3SWitch").prop("checked")?($("#P3QtyDiv").show(),$("#P3FrqDiv").show(),T=2):($("#P3QtyDiv").hide(),$("#P3FrqDiv").hide(),T=1),u?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=typeP3&val="+T,dataType:"text",success:function(e){console.log("Call to /setTypeP3 is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setTypeP3, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}}):u=!0})),
$("#P3ONOFFSW").click((function(){$("#P3ONOFFSWitch").prop("checked")?($("#TypeP3Div").show(),$("#TypeP3SWitch").prop("checked")&&($("#P3QtyDiv").show(),$("#P3FrqDiv").show()),u?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=typeP3&val="+T,dataType:"text",success:function(e){console.log("Call to /setTypeP3 is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setTypeP3, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}}):u=!0):($("#TypeP3Div").hide(),$("#P3QtyDiv").hide(),$("#P3FrqDiv").hide(),u?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=typeP3&val=0",dataType:"text",success:function(e){console.log("Call to /setTypeP3 is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setTypeP3, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}}):u=!0)})),
$("#P3QtySlider").change((function(){var e=$("#P3Qty").slider().val();console.log("New p3Qty is "+e),p?$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=p3Qty&val="+e,dataType:"text",success:function(e){console.log("Call to /setP3Qty is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setP3Qty, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}}):p=!0})),
$("#P3FrqSlider").change((function(){var e;e=$("#P3Frq").slider().val(),console.log("New p3Frq from slider is "+e),m?(console.log("Sending ajax with "+e+"from slider"),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=p3Frq&val="+e,dataType:"text",success:function(e){console.log("Call to /setP3Frq is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setP3Frq, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})):m=!0})),
$("#P3FrqHebdo").click((function(){var e=0;$("#P3FrqHebdo").prop("checked")?(console.log("frqHebdo is checked sending 100"),$("#P3FrqMensuel").prop("checked",!1).checkboxradio("refresh"),$("#P3Frq").slider("disable"),console.log("Sending ajax with 100 from hebdo"),e=100):(console.log("frqHebdo is unChecked should enable slider"),$("#P3Frq").slider("enable"),e=$("#P3Frq").slider().val()),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=p3Frq&val="+e,dataType:"text",success:function(e){console.log("Call to /setP3Frq is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setP3Frq, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})})),
$("#P3FrqMensuel").click((function(){var e=0;$("#P3FrqMensuel").prop("checked")?(console.log("frqMensuel is checked sending 1000"),$("#P3FrqHebdo").prop("checked",!1).checkboxradio("refresh"),$("#P3Frq").slider("disable"),console.log("Sending ajax with 1000 from mensuel"),e=1e3):(console.log("frqMensuel is unChecked should enable slider"),$("#P3Frq").slider("enable"),e=$("#P3Frq").slider().val()),$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=p3Frq&val="+e,dataType:"text",success:function(e){console.log("Call to /setP3Frq is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setP3Frq, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})})),
$("#ClearAlertSW").click((function(){if(g){var e=$("#ClearAlertSWitch").is(":checked")?1:0;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=clearAlert&val="+e,dataType:"text",success:function(e){console.log("Call to /clearAlert is success")}
,error:function(e,t,a){console.log("An error occurred while calling /clearAlert, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else g=!0})),
$("#FlowAlertSW").click((function(){if(f){var e=$("#FlowAlertSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=flowAlert&val="+e,dataType:"text",success:function(e){console.log("Call to /flowAlert is success")}
,error:function(e,t,a){console.log("An error occurred while calling /flowAlert, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else f=!0})),
$("#InnondAlertSW").click((function(){if(v){var e=$("#InnondAlertSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=innondAlert&val="+e,dataType:"text",success:function(e){console.log("Call to /innondAlert is success")}
,error:function(e,t,a){console.log("An error occurred while calling /innondAlert, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else v=!0})),
$("#PACAlertSW").click((function(){if(P){var e=$("#PACAlertSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=pacAlert&val="+e,dataType:"text",success:function(e){console.log("Call to /pacAlert is success")}
,error:function(e,t,a){console.log("An error occurred while calling /pacAlert, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else P=!0})),
$("#NivPHSW").click((function(){if(S){var e=$("#NivPHSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=nivPH&val="+e,dataType:"text",success:function(e){console.log("Call to /nivPH is success")}
,error:function(e,t,a){console.log("An error occurred while calling /nivPH, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else S=!0})),
$("#NivCLSW").click((function(){if(y){var e=$("#NivCLSWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=nivCL&val="+e,dataType:"text",success:function(e){console.log("Call to /nivCL is success")}
,error:function(e,t,a){console.log("An error occurred while calling /nivCL, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else y=!0})),
$("#NivPmp3SW").click((function(){if(D){var e=$("#NivPmp3SWitch").is(":checked")?0:1;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=nivALG&val="+e,dataType:"text",success:function(e){console.log("Call to /nivALG is success")}
,error:function(e,t,a){console.log("An error occurred while calling /nivALG, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else D=!0})),
$("#invPmpPHSW").click((function(){if(k){var e=$("#invPmpPHSWitch").is(":checked")?0:-2;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=pmpPH&val="+e,dataType:"text",success:function(e){console.log("Call to /invPmpPH is success")}
,error:function(e,t,a){console.log("An error occurred while calling /invPmpPH, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else k=!0})),
$("#invPmpCLSW").click((function(){if(C){var e=$("#invPmpCLSWitch").is(":checked")?0:-2;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=pmpCL&val="+e,dataType:"text",success:function(e){console.log("Call to /invPmpCL is success")}
,error:function(e,t,a){console.log("An error occurred while calling /invPmpCL, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else C=!0})),
$("#invPmp3SW").click((function(){if(b){var e=$("#invPmp3SWitch").is(":checked")?0:-2;$.ajax({type:"POST",url:"/setPiscineParam",data:"sess="+sessID+"&param=pmp3&val="+e,dataType:"text",success:function(e){console.log("Call to /invPmp3 is success")}
,error:function(e,t,a){console.log("An error occurred while calling /invPmp3, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}else b=!0})),
piscineParamsEvent=$.SSE("/piscineParamsEvents",{onOpen:function(e){console.log("Open SSE to /piscineParamsEvents"),console.log(e)}
,onEnd:function(e){console.log("Ending SSE PiscineEvent"),console.log(e)}
,onError:function(e){console.log("Could not connect to SSE /piscineParamsEvents")}
,onMessage:function(e){console.log("Message from /piscineParamsEvents"),console.log(e),data=$.trim(e.data),data.includes("hello!")&&$.ajax({type:"POST",url:"/setPiscinePageParams",data:"sess="+sessID,dataType:"text",success:function(e){console.log("Call to /setPiscinePageParams is success")
,error:function(e,t,a){console.log("An error occurred while calling /setPiscinePageParams, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}
,options:{forceAjax:!1}

,events:{piscineParamsData:function(g){var k,C=new Date;if(console.log("PiscineParamsData"),console.log(g),expirationDate<C.getTime())console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+C.getTime()),$.mobile.changePage("#dlg-EndSessionAlert");else{k=(expirationDate-C.getTime())/1e3,console.log("Session is still valid, time left to run : "+k+" secs"),data=$.trim(g.data);var b=JSON.parse(data);if(console.log("serverEvent json is "+JSON.stringify(b)),b.hasOwnProperty("lampe")&&(0==b.lampe?($("#lampeLedParam").removeClass("ledOn").addClass("ledOff"),$("#lampeSwitchParam").prop("checked")&&(e=!1,$("#lampeSWParam").click()),lampeSWVal=0):1==b.lampe&&($("#lampeLedParam").removeClass("ledOff").addClass("ledOn"),$("#lampeSwitchParam").prop("checked")||(e=!1,$("#lampeSWParam").click()),lampeSWVal=1)),b.hasOwnProperty("volet")&&(0==b.volet?($("#voletLedParam").removeClass("ledOn").addClass("ledOff"),$("#voletSwitchParam").prop("checked")&&(t=!1,$("#voletSWParam").click()),voletSWVal=0):1==b.volet&&($("#voletLedParam").removeClass("ledOff").addClass("ledOn"),$("#voletSwitchParam").prop("checked")||(t=!1,$("#voletSWParam").click()),voletSWVal=1)),b.hasOwnProperty("PP")&&(0==b.PP?($("#PPLedParam").removeClass("ledOn").addClass("ledOff"),$("#PPSWitch").prop("checked")&&(a=!1,$("#PPSW").click())):($("#PPLedParam").removeClass("ledOff").addClass("ledOn"),$("#PPSWitch").prop("checked")||(a=!1,$("#PPSW").click()))),b.hasOwnProperty("PAC")&&(0==b.PAC?($("#PACLedParam").removeClass("ledOn").addClass("ledOff"),$("#PACSWitch").prop("checked")&&(s=!1,$("#PACSW").click())):($("#PACLedParam").removeClass("ledOff").addClass("ledOn"),$("#PACSWitch").prop("checked")||(s=!1,$("#PACSW").click()))),b.hasOwnProperty("PH")&&(0==b.PH||-2==b.PH?($("#PHLedParam").removeClass("ledOn").addClass("ledOff"),$("#PmpPHSWitch").prop("checked")&&(i=!1,$("#PmpPHSW").click()),-2==b.PH&&$("#invPmpPHSWitch").prop("checked")&&(i=!1,$("#invPmpPHSW").click())):($("#PHLedParam").removeClass("ledOff").addClass("ledOn"),$("#PmpPHSWitch").prop("checked")||(i=!1,$("#PmpPHSW").click()),$("#invPmpPHSWitch").prop("checked")||(i=!1,$("#invPmpPHSW").click()))),b.hasOwnProperty("CL")&&(0==b.CL||-2==b.CL?($("#CLLedParam").removeClass("ledOn").addClass("ledOff"),$("#PmpCLSWitch").prop("checked")&&(n=!1,$("#PmpCLSW").click()),-2==b.CL&&$("#invPmpCLSWitch").prop("checked")&&(n=!1,$("#invPmpCLSW").click())):($("#CLLedParam").removeClass("ledOff").addClass("ledOn"),$("#PmpCLSWitch").prop("checked")||(n=!1,$("#PmpCLSW").click()),$("#invPmpCLSWitch").prop("checked")||(n=!1,$("#invPmpCLSW").click()))),b.hasOwnProperty("P3")&&(0==b.P3||-2==b.P3?($("#P3LedParam").removeClass("ledOn").addClass("ledOff"),$("#PmpALGSWitch").prop("checked")&&(o=!1,$("#PmpALGSW").click()),-2==b.P3&&($("#invPmp3SWitch").prop("checked")&&(o=!1,$("#invPmp3SW").click()),$("#P3ONOFFSWitch").is(":checked")&&(u=!1,$("#P3ONOFFSW").click()))):($("#P3LedParam").removeClass("ledOff").addClass("ledOn"),$("#PmpALGSWitch").prop("checked")||(o=!1,$("#PmpALGSW").click()),$("#invPmp3SWitch").prop("checked")||(o=!1,$("#invPmp3SW").click()))),b.hasOwnProperty("autoMode")&&(0==b.autoMode?($("#autoLedParam").removeClass("ledOn").addClass("ledOff"),$("#PPSWitch").prop("disabled",!1).checkboxradio("refresh"),$("#PACSWitch").prop("disabled",!1).checkboxradio("refresh"),$("#PmpPHSWitch").prop("disabled",!1).checkboxradio("refresh"),$("#PmpCLSWitch").prop("disabled",!1).checkboxradio("refresh"),$("#PmpALGSWitch").prop("disabled",!1).checkboxradio("refresh"),$("#ModeManuSWitch").is(":checked")||(r=!1,$("#ModeManuSW").click())):($("#autoLedParam").removeClass("ledOff").addClass("ledOn"),$("#PPSWitch").prop("disabled",!0).checkboxradio("refresh"),$("#PACSWitch").prop("disabled",!0).checkboxradio("refresh"),$("#PmpPHSWitch").prop("disabled",!0).checkboxradio("refresh"),$("#PmpCLSWitch").prop("disabled",!0).checkboxradio("refresh"),$("#PmpALGSWitch").prop("disabled",!0).checkboxradio("refresh"),$("#ModeManuSWitch").is(":checked")&&(r=!1,$("#ModeManuSW").click()))),b.hasOwnProperty("strtTPP")&&$("#PPstart").val(b.strtTPP),b.hasOwnProperty("stopTPP")&&$("#PPstop").val(b.stopTPP),b.hasOwnProperty("lampeAuto")&&(0==b.lampeAuto?$("#lampeAutoSWitch").is(":checked")&&(x=!1,$("#lampeAutoSW").click()):1==b.lampeAuto&&($("#lampeAutoSWitch").is(":checked")||(x=!1,$("#lampeAutoSW").click()))),b.hasOwnProperty("strtLampe")&&$("#lampeStart").val(b.strtLampe),b.hasOwnProperty("stopLampe")&&$("#lampeStop").val(b.stopLampe),b.hasOwnProperty("voletAuto")&&(0==b.voletAuto?$("#voletAutoSWitch").is(":checked")&&(E=!1,$("#voletAutoSW").click()):1==b.voletAuto&&($("#voletAutoSWitch").is(":checked")||(E=!1,$("#voletAutoSW").click()))),b.hasOwnProperty("ouvVolet")&&$("#voletOuv").val(b.ouvVolet),b.hasOwnProperty("fermeVolet")&&$("#voletFerm").val(b.fermeVolet),b.hasOwnProperty("typeTemp")&&(1==b.typeTemp?($("#TypeTempSWitch").is(":checked")||(h=!1,$("#TypeTempSW").click()),w=!0):0==b.typeTemp&&($("#TypeTempSWitch").is(":checked")&&(h=!1,$("#TypeTempSW").click()),w=!1)),b.hasOwnProperty("tempFix")&&(O=parseInt(b.tempFix),w||(l=!1,$("#TempFixRel").prop({value:O}).slider("refresh"))),
b.hasOwnProperty("tempRel")&&(A=parseInt(b.tempRel),w&&(l=!1,$("#TempFixRel").prop({value:A}).slider("refresh"))),
b.hasOwnProperty("phRef")){c=!1;var T=parseFloat(b.phRef/10);$("#PHRef").prop({value:T}).slider("refresh")}
b.hasOwnProperty("redoxRef")&&(d=!1,$("#redoxRef").prop({value:parseInt(b.redoxRef)}).slider("refresh")),
b.hasOwnProperty("typeP3")&&(1==b.typeP3?($("#P3ONOFFSWitch").is(":checked")||(u=!1,$("#P3ONOFFSW").click()),$("#TypeP3SWitch").is(":checked")&&(u=!1,$("#TypeP3SW").click()),$("#invPmp3SWitch").prop("checked")||(o=!1,$("#invPmp3SW").click())):2==b.typeP3?($("#P3ONOFFSWitch").is(":checked")||(u=!1,$("#P3ONOFFSW").click()),$("#TypeP3SWitch").is(":checked")||(u=!1,$("#TypeP3SW").click()),$("#invPmp3SWitch").prop("checked")||(o=!1,$("#invPmp3SW").click())):-1==b.typeP3&&$("#P3ONOFFSWitch").is(":checked")&&(u=!1,$("#P3ONOFFSW").click())),b.hasOwnProperty("p3Qty")&&(p=!1,$("#P3Qty").prop({value:parseFloat(b.p3Qty)}).slider("refresh")),
b.hasOwnProperty("p3Frq")&&(m=!1,100==(T=parseFloat(b.p3Frq))?($("#P3FrqHebdo").prop("checked",!0).checkboxradio("refresh"),$("#P3FrqMensuel").prop("checked",!1).checkboxradio("refresh"),$("#P3Frq").slider("disable")):1e3==T?($("#P3FrqMensuel").prop("checked",!0).checkboxradio("refresh"),$("#P3FrqHebdo").prop("checked",!1).checkboxradio("refresh"),$("#P3Frq").slider("disable")):($("#P3FrqHebdo").prop("checked",!1).checkboxradio("refresh"),$("#P3FrqMensuel").prop("checked",!1).checkboxradio("refresh"),$("#P3Frq").slider("enable"),$("#P3Frq").val(T).slider("refresh"))),b.hasOwnProperty("clearAlert")&&1==b.clearAlert&&$("#ClearAlertSWitch").is(":checked")&&$("#ClearAlertSW").click(),b.hasOwnProperty("flowAlert")&&(1==b.flowAlert?$("#FlowAlertSWitch").is(":checked")&&(f=!1,$("#FlowAlertSW").click()):$("#FlowAlertSWitch").is(":checked")||(f=!1,$("#FlowAlertSW").click())),b.hasOwnProperty("innondAlert")&&(1==b.innondAlert?$("#InnondAlertSWitch").is(":checked")&&(v=!1,$("#InnondAlertSW").click()):$("#InnondAlertSWitch").is(":checked")||(v=!1,$("#InnondAlertSW").click())),b.hasOwnProperty("pacAlert")&&(1==b.pacAlert?$("#PACAlertSWitch").is(":checked")&&(P=!1,$("#PACAlertSWitch").click()):$("#PACAlertSWitch").is(":checked")||(P=!1,$("#PACAlertSWitch").click())),b.hasOwnProperty("nivPH")&&(1==b.nivPH?$("#NivPHSWitch").is(":checked")&&(S=!1,$("#NivPHSW").click()):$("#NivPHSWitch").is(":checked")||(S=!1,$("#NivPHSW").click())),b.hasOwnProperty("nivCL")&&(1==b.nivCL?$("#NivCLSWitch").is(":checked")&&(y=!1,$("#NivCLSW").click()):$("#NivCLSWitch").is(":checked")||(y=!1,$("#NivCLSW").click())),b.hasOwnProperty("nivALG")&&(1==b.nivALG?$("#NivPmp3SWitch").is(":checked")&&(D=!1,$("#NivPmp3SW").click()):$("#NivPmp3SWitch").is(":checked")||(D=!1,$("#NivPmp3SW").click()))}}}})})),


$(document).delegate("#pagePiscineGraphs","pagebeforecreate",(function(){$("#daterange").daterangepicker({showDropdowns:!0,minYear:2022,timePicker:!0,timePicker24Hour:!0,timePickerIncrement:15,autoApply:!0,singleDatePicker:!1,singleCalendar:!0,ranges:{"Aujourd'hui":[dayjs().startOf("day"),dayjs()],Hier:[dayjs().subtract(1,"days").startOf("day"),dayjs().subtract(1,"days").endOf("day")],"3 Jours Prec":[dayjs().subtract(2,"days").startOf("day"),dayjs()],"7 Jours Prec":[dayjs().subtract(6,"days").startOf("day"),dayjs()],"Semaine Prec":[dayjs().subtract(1,"week").startOf("week"),dayjs().subtract(1,"week").endOf("week")],"Cette Semaine":[dayjs().startOf("week").startOf("day"),dayjs()],"30 Jours Prec":[dayjs().subtract(29,"days").startOf("day"),dayjs()],"Mois Prec":[dayjs().subtract(1,"month").startOf("month"),dayjs().subtract(1,"month").endOf("month")],"Ce Mois":[dayjs().startOf("month"),dayjs()]}
,locale:{format:"DD/MMM/YY HH:mm",separator:" - ",applyLabel:"OK",cancelLabel:"Cancel",fromLabel:"From",toLabel:"To",customRangeLabel:"Custom",weekLabel:"W",daysOfWeek:["Di","Lu","Ma","Me","Je","Ve","Sa"],monthNames:["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Septembre","Octobre","Novembre","Decembre"],firstDay:1}
,linkedCalendars:!1,alwaysShowCalendars:!1,parentEl:"daterange",minDate:"01/Jan/22 00:00",maxDate:"now",startDate:dayjs().subtract(2,"days").startOf("day"),endDate:dayjs(),autoUpdateInput:!0}
,(function(e,t,a){console.log("New date range selected: "+e.format("DD/MM/YY HH:MM")+" to "+t.format("DD/MM/YY HH:MM")+" (predefined range: "+a+")"),getNewData(e,t);var s=chart.xAxisRange();(dayjs(s[0])!=e||dayjs(s[1]!=t))&&chart.updateOptions({dateWindow:[e,t]}
),console.log("A new date selection from datePicker was made: "+e.toString()+" to "+t.toString())})),
$("#selectItems").on("change",(function(){var e=$(this).val();for(console.log("Selected:"+e),j=0,i=0;i<13;i++)null!=e&&j<e.length&&parseInt(e[j])==i?(chart.setVisibility(i,!0),j++):chart.setVisibility(i,!1)})),
console.log("-- Building the chartdata array from before create --"),getOriginData()})),

$(document).on("pageshow","#pagePiscineGraphs",(function(){function e(e,t,a,s){let i=chart.xAxisRange(),n=dayjs(i[0]),o=dayjs(i[1]);s||Dygraph.defaultInteractionModel.touchend(e,t,a),a.isPanning?(console.log("isPanning end"),console.log("A new date selection from chart (pan) was made: "+n.format("DD/MMM/YY HH:mm")+" to "+o.format("DD/MMM/YY HH:mm")),$("#daterange").data("daterangepicker").setStartDate(n),$("#daterange").data("daterangepicker").setEndDate(o),s&&Dygraph.endPan(e,t,a),getNewData(n,o)):a.isZooming&&(console.log("isZooming end"),console.log("A new date selection from chart (zoom) was made: "+n.format("DD/MMM/YY HH:mm")+" to "+o.format("DD/MMM/YY HH:mm")),$("#daterange").data("daterangepicker").setStartDate(n),$("#daterange").data("daterangepicker").setEndDate(o),s&&Dygraph.endZoom(e,t,a))}
chart=new Dygraph($("#graph1")[0],[[Date.now(),0,0,0,0,0,0,0,0,0,0,0,0,0]],{labels:["Date","TempEau","TempAir","TempPAC","TempInt","PHVal","RedoxVal","CLVal","PompePH","PompeCL","PompeALG","PP","PAC","Auto"],labelsDiv:document.getElementById("legend"),legend:"follow",legendFormatter:function(e){if(null==e.x)return"<br>"+e.series.map((function(e){return e.dashHTML+" "+e.labelHTML}
)).join("<br>");var t=this.getLabels()[0]+": "+e.xHTML;return e.series.forEach((function(e){if(e.isVisible){var a=e.labelHTML+": "+e.yHTML;e.isHighlighted&&(a='<b style="font-size:initial">'+a+"</b>"),t+="<br>"+e.dashHTML+" "+a}})),t}
,series:{TempEau:{axis:"y2"}
,TempAir:{axis:"y2"}
,TempPAC:{axis:"y2"}
,TempInt:{axis:"y2"}
,PHVal:{axis:"y"}
,RedoxVal:{axis:"y2"}
,CLVal:{axis:"y"}
,PompePH:{axis:"y"}
,PompeCL:{axis:"y"}
,PompeALG:{axis:"y"}
,PP:{axis:"y"}
,PAC:{axis:"y"}
,Auto:{axis:"y"}
}
,axes:{y:{valueRange:[0,10],axisLabelColor:"#FF00FF"}
,y2:{valueRange:[10,40],axisLabelColor:"#FFFFFF"}
}
,ylabel:"On/Off",y2label:"Température °C",colors:["#ff0000","#00FF00","#006FFF","#FFFF00","#00FFFF","#FF00FF","#FF6F00","#0000FF","6F00FF","6FFF00","#00FF6F","#FF006F","#00FF6F"],visibility:[!0,!0,!1,!1,!0,!1,!0,!1,!1,!1,!0,!1,!0],rollPeriod:2,strokeWidth:2,highlightSeriesBackgroundAlpha:1,highlightSeriesOpts:{strokeWidth:5,strokeBorderWidth:0,highlightCircleSize:5}
,gridLineColor:"#eee",dateWindow:[dayjs().subtract(2,"days").startOf("day"),dayjs()],showRangeSelector:!0,rangeSelectorHeight:50,interactionModel:{mousedown:Dygraph.defaultInteractionModel.mousedown,mousemove:Dygraph.defaultInteractionModel.mousemove,click:Dygraph.defaultInteractionModel.click,dblclick:Dygraph.defaultInteractionModel.dblclick,mousewheel:Dygraph.defaultInteractionModel.mousewheel,touchstart:function(e,t,a){e.preventDefault(),e.touches.length>1&&(a.startTimeForDoubleTapMs=null);for(var s=[],i=0;i<e.touches.length;i++){var n=e.touches[i];s.push({pageX:n.pageX,pageY:n.pageY,dataX:t.toDataXCoord(n.pageX),dataY:t.toDataYCoord(n.pageY)})}
if(a.initialTouches=s,1==s.length)a.initialPinchCenter=s[0],a.touchDirections={x:!0,y:!0}
,t.mouseMove_(e);else if(s.length>=2){a.initialPinchCenter={pageX:.5*(s[0].pageX+s[1].pageX),pageY:.5*(s[0].pageY+s[1].pageY),dataX:.5*(s[0].dataX+s[1].dataX),dataY:.5*(s[0].dataY+s[1].dataY)};
var o=180/Math.PI*Math.atan2(a.initialPinchCenter.pageY-s[0].pageY,s[0].pageX-a.initialPinchCenter.pageX);(o=Math.abs(o))>90&&(o=90-o),a.touchDirections={x:o<67.5,y:o>22.5}
}
a.initialRange={x:t.xAxisRange(),y:t.yAxisRange()}
}
,touchmove:function(e,t,a){a.startTimeForDoubleTapMs=null;var s,i=[];for(s=0;s<e.touches.length;s++){var n=e.touches[s];i.push({pageX:n.pageX,pageY:n.pageY})}
1==i.length?a.isPanning=!0:i.length>=2&&(a.isZooming=!0,a.isPanning=!1);var o,r=a.initialTouches,l=a.initialPinchCenter;o=1==i.length?i[0]:{pageX:.5*(i[0].pageX+i[1].pageX),pageY:.5*(i[0].pageY+i[1].pageY)}
;
var c,d,h={pageX:o.pageX-l.pageX,pageY:o.pageY-l.pageY}
,u=a.initialRange.x[1]-a.initialRange.x[0],p=a.initialRange.y[0]-a.initialRange.y[1];if(h.dataX=h.pageX/t.plotter_.area.w*u,h.dataY=h.pageY/t.plotter_.area.h*p,1==i.length)c=1,d=1;else if(i.length>=2){var m=r[1].pageX-l.pageX;c=(i[1].pageX-o.pageX)/m;var g=r[1].pageY-l.pageY;d=(i[1].pageY-o.pageY)/g}
c=Math.min(8,Math.max(.125,c)),d=Math.min(8,Math.max(.125,d));var f=!1;if(a.touchDirections.x){var v=l.dataX-h.dataX/c;t.dateWindow_=[v+(a.initialRange.x[0]-l.dataX)/c,v+(a.initialRange.x[1]-l.dataX)/c],f=!0}
if(a.touchDirections.y)for(s=0;s<1;s++){var P=t.axes_[s];if(t.attributes_.getForAxis("logscale",s));else{v=l.dataY-h.dataY/d;P.valueRange=[v+(a.initialRange.y[0]-l.dataY)/d,v+(a.initialRange.y[1]-l.dataY)/d],f=!0}}

if(t.drawGraph_(!1),f&&i.length>1&&t.getFunctionOption("zoomCallback"))t.xAxisRange()}
,mouseup:function(t,a,s){console.log("Mouse up"),e(t,a,s,!0)}
,touchend:function(t,a,s){console.log("Touch end"),e(t,a,s,!1)}}
,zoomCallback:function(e,t,a){let s=dayjs(e),i=dayjs(t);console.log("A new date selection from chart (zoom) was made: "+s.format("DD/MMM/YY HH:mm")+" to "+i.format("DD/MMM/YY HH:mm")),$("#daterange").data("daterangepicker").setStartDate(s),$("#daterange").data("daterangepicker").setEndDate(i)}})})),

$(document).delegate("#pagePiscineDebug","pagebeforecreate",(function(){var e,t=!0;$("#ClearText").click((function(){$("#debugTextArea").val("")})),
$("#FeedSW").click((function(){t=!0!==t})),
piscineDebugEvent=$.SSE("/piscineDebugEvents",{onOpen:function(e){console.log("Open SSE to /piscineDebugEvents"),console.log(e)}
,onEnd:function(e){console.log("Ending SSE piscineDebugEvents"),console.log(e)}
,onError:function(e){console.log("Could not connect to SSE /piscineDebugEvents")}
,onMessage:function(e){console.log("Message from /piscineDebugEvents"),console.log(e),data=$.trim(e.data)}
,options:{forceAjax:!1}
,events:{piscineLCDDebug:function(a){var s,i=new Date;if(console.log("PiscineLCDDebug"),console.log(a),expirationDate<i.getTime())console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+i.getTime()),$.mobile.changePage("#dlg-EndSessionAlert");else{s=(expirationDate-i.getTime())/1e3,console.log("Session is still valid, time left to run : "+s+" secs"),data=$.trim(a.data);var n=JSON.parse(data);console.log("serverEvent json is "+JSON.stringify(n)),n.hasOwnProperty("lignes")&&(e=n.lignes,!0===t&&($("#debugTextArea").append(e),$("#debugTextArea").scrollTop($("#debugTextArea")[0].scrollHeight)))}}}})})),


$(document).delegate("#pagePiscineMaintenance","pagebeforecreate",(function(){var e,t,a,s="N/A",i="N/A",n="N/A",o=!1,r="N/A",l="N/A";function c(e,t,a,s,i){var n="sess="+sessID+"&command="+e;""!==t&&(n+="&"+t+"="+a,""!==s&&(n+="&"+s+"="+i)),console.log("data is :"+n),$.ajax({type:"POST",url:"/setPiscineMaintenance",data:n,dataType:"text",success:function(t){console.log("Call to /setPiscineMaintenance with command="+e+" is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscineMaintenance, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}
$(":input[name= 'PHRadio']").click((function(){switch($("#validRedox").addClass("ui-disabled"),$(":input[name= 'RedoxRadio']").attr("checked",!1),$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),$("#RedoxMesu").val("---"),$("#RedoxAjust").val("---"),$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),l="N/A",$("#cancelPH").removeClass("ui-disabled"),$(this).attr("id")){case"PH4Radio":console.log("You clicked PH4"),r="PH4";break;case"PH7Radio":console.log("You clicked PH7"),r="PH7";break;case"PH9Radio":console.log("You clicked PH9"),r="PH9"}
"N/A"!==r&&(c("scanPH","typePH",r,""),$("#scanPHLed").removeClass("ledOff").addClass("ledOn"))})),
$("#cancelPH").click((function(){$("#validPH").addClass("ui-disabled"),$(":input[name= 'PHRadio']").attr("checked",!1),$(":input[name= 'PHRadio']").checkboxradio("refresh"),r="N/A",$("#PHMesu").val("---"),$("#PHAjust").val("---"),$(scanPHLed).removeClass("ledOn").addClass("ledOff"),c("cancelPH","")})),
$("#validPH").click((function(){isNaN($("#PHMesu").val())||"N/A"===r||($(this).addClass("ui-disabled"),$(":input[name= 'PHRadio']").attr("checked",!1),$(":input[name= 'PHRadio']").checkboxradio("refresh"),$(scanPHLed).removeClass("ledOn").addClass("ledOff"),c("validEtalon","valEtalon",$("#PHMesu").val(),"type",r),$("#PHMesu").val("---"),$("#PHAjust").val("---"),r="N/A")})),
$("#scanPHLed").click((function(){"N/A"!==r&&($("#validPH").addClass("ui-disabled"),$(":input[name= 'PHRadio']").attr("checked",!1),$(":input[name= 'PHRadio']").checkboxradio("refresh"),r="N/A",$("#PHMesu").val("---"),$("#PHAjust").val("---"),$(this).removeClass("ledOn").addClass("ledOff"),c("cancelScan","type","PH"))})),
$("#PHAjust").on("keyup",(function(e){13!=e.keyCode||"N/A"===r||isNaN($("#PHAjust").val())||($("#validPH").addClass("ui-disabled"),$(":input[name= 'PHRadio']").attr("checked",!1),$(":input[name= 'PHRadio']").checkboxradio("refresh"),c("validEtalon","valEtalon",$("#PHAjust").val(),"type",r),$("#PHMesu").val("---"),$("#PHAjust").val("---"),$(scanPHLed).removeClass("ledOn").addClass("ledOff"),r="N/A")})),
$(":input[name= 'RedoxRadio']").click((function(){switch($("#validPH").addClass("ui-disabled"),$(":input[name= 'PHRadio']").attr("checked",!1),$(":input[name= 'PHRadio']").checkboxradio("refresh"),$("#PHMesu").val("---"),$("#PHAjust").val("---"),$(scanPHLed).removeClass("ledOn").addClass("ledOff"),r="N/A",$("#cancelRedox").removeClass("ui-disabled"),$("#RedoxAjust").val("---"),$(this).attr("id")){case"redoxLowRadio":console.log("You clicked RedoxLow"),l="Low";break;case"redoxHighRadio":console.log("You clicked RedoxHigh"),l="High"}
"N/A"!==l&&($("#scanRedoxLed").removeClass("ledOff").addClass("ledOn"),c("scanRedox","typeRedox",l,""))})),
$("#cancelRedox").click((function(){$("#validRedox").addClass("ui-disabled"),$(":input[name= 'RedoxRadio']").attr("checked",!1),$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),l="N/A",$("#RedoxMesu").val("---"),$("#RedoxAjust").val("---"),$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),c("cancelRedox","")})),
$("#validRedox").click((function(){isNaN($("#RedoxMesu").val())||"N/A"===l||($(this).addClass("ui-disabled"),$(":input[name= 'RedoxRadio']").attr("checked",!1),$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"),c("validEtalon","valEtalon",$("#RedoxMesu").val(),"type",l),$("#RedoxMesu").val("---"),$("#RedoxAjust").val("---"),l="N/A")})),
$("#scanRedoxLed").click((function(){"N/A"!==l&&($("#validRedox").addClass("ui-disabled"),$(":input[name= 'RedoxRadio']").attr("checked",!1),$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),l="N/A",$("#RedoxMesu").val("---"),$("#RedoxAjust").val("---"),$(this).removeClass("ledOn").addClass("ledOff"),c("cancelScan","type","Redox"))})),
$("#RedoxAjust").on("keyup",(function(e){13!=e.keyCode||"N/A"===l||isNaN($("#RedoxAjust").val())||($("validRedox").addClass("ui-disabled"),$(":input[name= 'RedoxRadio']").attr("checked",!1),$(":input[name= 'RedoxRadio']").checkboxradio("refresh"),c("validEtalon","valEtalon",$("#RedoxAjust").val(),"type",l),$("#RedoxMesu").val("---"),$("#RedoxAjust").val("---"),l="N/A",$(scanRedoxLed).removeClass("ledOn").addClass("ledOff"))})),
$("#validSondes").click((function(){sondes=[],sonde1={}
,sonde1.printable=$("#sonde1Val").val(),sonde1.other=$("#sonde1Val").attr("value"),sonde1.type=$("#sonde1Type").text(),sonde1.index=e,sondes.push(sonde1),sonde2={}
,sonde2.printable=$("#sonde2Val").val(),sonde2.type=$("#sonde2Type").text(),sonde2.index=t,sondes.push(sonde2),sonde3={}
,sonde3.printable=$("#sonde3Val").val(),sonde3.type=$("#sonde3Type").text(),sonde3.index=a,sondes.push(sonde3),$(this).addClass("ui-disabled"),o=!1,c("validSondes","sondes",JSON.stringify(sondes),"")})),
$("#scanSondes").click((function(){$("#sonde1Val").val(""),$("#sonde2Val").val(""),$("#sonde3Val").val(""),c("scanSondes",""),$("#validSondes").removeClass("ui-disabled")})),
$("#sonde1Type").click((function(){if(o)switch($(this).text()){case"N/A":$(this).text("Eau"),s="eau",("air"!=i&&"N/A"!=i||"pac"!=n&&"N/A"!=n)&&("pac"!=i&&"N/A"!=i||"air"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Eau":$(this).text("Air"),s="air",("eau"!=i&&"N/A"!=i||"pac"!=n&&"N/A"!=n)&&("pac"!=i&&"N/A"!=i||"eau"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Air":$(this).text("Pac"),s="pac",("air"!=i&&"N/A"!=i||"eau"!=n&&"N/A"!=n)&&("eau"!=i&&"N/A"!=i||"air"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Pac":$(this).text("N/A"),s="N/A","N/A"==i&&"N/A"==n||("air"!=i&&"N/A"!=i||"eau"!=n&&"N/A"!=n)&&("air"!=i&&"N/A"!=i||"pac"!=n&&"N/A"!=n)&&("eau"!=i&&"N/A"!=i||"air"!=n&&"N/A"!=n)&&("eau"!=i&&"N/A"!=i||"pac"!=n&&"N/A"!=n)&&("pac"!=i&&"N/A"!=i||"air"!=n&&"N/A"!=n)&&("pac"!=i&&"N/A"!=i||"eau"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled")}})),
$("#sonde2Type").click((function(){if(o)switch($(this).text()){case"N/A":$(this).text("Eau"),i="eau",("air"!=s&&"N/A"!=s||"pac"!=n&&"N/A"!=n)&&("pac"!=s&&"N/A"!=s||"air"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Eau":$(this).text("Air"),i="air",("eau"!=s&&"N/A"!=s||"pac"!=n&&"N/A"!=n)&&("pac"!=s&&"N/A"!=s||"eau"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Air":$(this).text("Pac"),i="pac",("air"!=s&&"N/A"!=s||"eau"!=n&&"N/A"!=n)&&("eau"!=s&&"N/A"!=s||"air"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Pac":$(this).text("N/A"),i="N/A","N/A"==s&&"N/A"==n||("air"!=s&&"N/A"!=s||"eau"!=n&&"N/A"!=n)&&("air"!=s&&"N/A"!=s||"pac"!=n&&"N/A"!=n)&&("eau"!=s&&"N/A"!=s||"air"!=n&&"N/A"!=n)&&("eau"!=s&&"N/A"!=s||"pac"!=n&&"N/A"!=n)&&("pac"!=s&&"N/A"!=s||"air"!=n&&"N/A"!=n)&&("pac"!=s&&"N/A"!=s||"eau"!=n&&"N/A"!=n)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled")}})),
$("#sonde3Type").click((function(){if(o)switch($(this).text()){case"N/A":$(this).text("Eau"),n="eau",("air"!=i&&"N/A"!=i||"pac"!=s&&"N/A"!=s)&&("pac"!=i&&"N/A"!=i||"air"!=s&&"N/A"!=s)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Eau":$(this).text("Air"),n="air",("eau"!=i&&"N/A"!=i||"pac"!=s&&"N/A"!=s)&&("pac"!=i&&"N/A"!=i||"eau"!=s&&"N/A"!=s)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Air":$(this).text("Pac"),n="pac",("air"!=i&&"N/A"!=i||"eau"!=s&&"N/A"!=s)&&("eau"!=i&&"N/A"!=i||"air"!=s&&"N/A"!=s)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled");break;case"Pac":$(this).text("N/A"),n="N/A","N/A"==i&&"N/A"==s||("air"!=i&&"N/A"!=i||"eau"!=s&&"N/A"!=s)&&("air"!=i&&"N/A"!=i||"pac"!=s&&"N/A"!=s)&&("eau"!=i&&"N/A"!=i||"air"!=s&&"N/A"!=s)&&("eau"!=i&&"N/A"!=i||"pac"!=s&&"N/A"!=s)&&("pac"!=i&&"N/A"!=i||"air"!=s&&"N/A"!=s)&&("pac"!=i&&"N/A"!=i||"eau"!=s&&"N/A"!=s)?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled")}})),
piscineMaintenanceEvent=$.SSE("/piscineMaintenanceEvents",{onOpen:function(e){console.log("Open SSE to /piscineMaintenanceEvents"),console.log(e)}
,onEnd:function(e){console.log("Ending SSE piscineMaintenanceEvents"),console.log(e)}
,onError:function(e){console.log("Could not connect to SSE /piscineMaintenanceEvents")}
,onMessage:function(e){console.log("Message from /piscineMaintenanceEvents"),console.log(e),data=$.trim(e.data),data.includes("hello!")&&$.ajax({type:"POST",url:"/setPiscineInitMaintenance",data:"sess="+sessID,dataType:"text",success:function(e){console.log("Call to /setPiscineInitMaintenance is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscinePageMaintenance, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})}
,options:{forceAjax:!1}
,events:{piscineMaintenance:function(c){var d,h,u=new Date,p=0;if(console.log("piscineMaintenanceServer"),console.log(c),expirationDate<u.getTime())console.log("Session ttl expired: go to login diag"),console.log("expiration is "+expirationDate+" and now is "+u.getTime()),$.mobile.changePage("#dlg-EndSessionAlert");else{d=(expirationDate-u.getTime())/1e3,console.log("Session is still valid, time left to run : "+d+" secs"),data=$.trim(c.data);var m=JSON.parse(data);console.log("serverEvent json is "+JSON.stringify(m)),m.hasOwnProperty("sondes")?(m.sondes.length>=1?(h=m.sondes[0],$("#sonde1Val").val(h.printable),$("#sonde1Type").text(h.type),s="N/A"===h.type?h.type:h.type.toLowerCase(),e=h.index):($("#sonde1Val").val(""),$("#sonde1Type").text("N/A"),$("#sonde1Type").addClass("ui-disabled"),e=-1),m.sondes.length>=2?(h=m.sondes[1],$("#sonde2Val").val(h.printable),$("#sonde2Type").text(h.type),i="N/A"===h.type?h.type:h.type.toLowerCase(),t=h.index):($("#sonde2Val").val(""),$("#sonde2Type").text("N/A"),$("#sonde2Type").addClass("ui-disabled"),t=-1),m.sondes.length>=3?(h=m.sondes[2],$("#sonde3Val").val(h.printable),$("#sonde3Type").text(h.type),n="N/A"===h.type?h.type:h.type.toLowerCase(),a=h.index):($("#sonde3Val").val(""),$("#sonde3Type").text("N/A"),$("#sonde3Type").addClass("ui-disabled"),a=-1),o=!0,"N/A"===s&&"N/A"===i&&"N/A"===n?$("#validSondes").addClass("ui-disabled"):$("#validSondes").removeClass("ui-disabled")):(m.hasOwnProperty("phCalc")&&(p=parseFloat(m.phCalc),console.log("Got phClac and theVal is :"+p),$("#PHCalc").val(p.toFixed(2).toString()),"N/A"!==r&&(m.hasOwnProperty("phMesu")&&(p=parseFloat(m.phMesu),$("#PHMesu").val(p.toFixed(3).toString()),$("#validPH").removeClass("ui-disabled")),m.hasOwnProperty("phAjust")&&(p=parseFloat(m.phAjust),$("#PHAjust").val(p.toFixed(3).toString())))),m.hasOwnProperty("redoxCalc")&&(p=parseFloat(m.redoxCalc),console.log("Got redoxClac and theVal is :"+p),$("#RedoxCalc").val(p.toFixed(1).toString()),"N/A"!==l&&(m.hasOwnProperty("redoxMesu")&&(p=parseFloat(m.redoxMesu),$("#RedoxMesu").val(p.toFixed(1).toString()),$("#validRedox").removeClass("ui-disabled")),m.hasOwnProperty("redoxAjust")&&(p=parseFloat(m.redoxAjust),$("#RedoxAjust").val(p.toFixed(1).toString())))))}
}}})})),

$(document).delegate("#pageLogin","pagebeforeshow",(function(){$("#username").val(""),$("#password").val(""),$("#keepAlive").prop("checked",!1).checkboxradio("refresh")})),
$(document).delegate("#pageRegisterLogin","pagebeforeshow",(function(){$("#newuser").val(""),$("#mainpassword").val(""),$("#password2").val(""),$("#adminpassword").val("")})),
$(document).delegate("#pageUserProfile","pagebeforeshow",(function(){$("#nameuserprofile").val(userName),$("#userpasswordprofile").val(passWord),$("#userpassword2profile").val(passWord)})),
$(document).delegate("#pageDeleteUser","pagebeforeshow",(function(){
    var e="";console.log("Calling getUsers"),$.ajax({type:"post",url:"/getUsers",cache:!1,
    success:function(t){
        t=$.trim(t);
        var a=JSON.parse(t);
        console.log("returned json is "+JSON.stringify(a)),
        $.each(a.users,(function(t,a){e+=function(e,t){
            var a,s="";0!=t&&(s+='<hr class="inset">');
            return s+='<li class="ui-field-contain">',s+='<fieldset data-role="controlgroup" class="myControlGroup borderFeild">',s+='<label for="user'+t+'">'+e.username+"</label>",s+='<input type="checkbox" name="user'+t+'" id="user'+t+'" value="'+e.username+'">',s+="</fieldset>",s+='<fieldset data-role="controlgroup" data-type="horizontal" id="UserListRoles'+t+'" class="UsersListRoles">',a=1==e.roles[0]?"checked":"",s+='<input type="checkbox" name="PiscineRoleUser'+t+'" id="PiscineRoleUser'+t+'" value="PiscineRole" disabled '+a+">",s+='<label for="PiscineRoleUser'+t+'" class="myRoles">Pisc.</label>',a=1==e.roles[1]?"checked":"",s+='<input type="checkbox" name="ArrosageRoleUser'+t+'" id="ArrosageRoleUser'+t+'" value="ArrosageRole" disabled '+a+">",s+='<label for="ArrosageRoleUser'+t+'" class="myRoles">Arro.</label>',a=1==e.roles[2]?"checked":"",s+='<input type="checkbox" name="ChauffageRoleUser'+t+'" id="ChauffageRoleUser'+t+'" value="ChauffageRole" disabled '+a+">",s+='<label for="ChauffageRoleUser'+t+'" class="myRoles">Chauf.</label>',a=1==e.roles[3]?"checked":"",s+='<input type="checkbox" name="LampesRoleUser'+t+'" id="LampesRoleUser'+t+'" value="LampesRole" disabled '+a+">",s+='<label for="LampesRoleUser'+t+'" class="myRoles">Lamp.</label>',a=1==e.roles[4]?"checked":"",s+='<input type="checkbox" name="VoletsRoleUser'+t+'" id="VoletsRoleUser'+t+'" value="VoletsRole" disabled '+a+">",s+='<label for="VoletsRoleUser'+t+'" class="myRoles">Volet</label>',s+="</fieldset>",s+="</li>",s}
            (a,t)})),

$("#usersList").empty(),$("#usersList").html(e),$("#usersList").trigger("create"),$("#usersList").listview("refresh")},error:onError})})),

$(document).on("pagebeforeshow","#pagePiscinePrincipale",(function(){console.log("-- STARTING Piscine Server Events --"),piscineEvent.start()})),
$(document).on("pagebeforehide","#pagePiscinePrincipale",(function(){console.log("-- STOPPING Piscine Server Events --"),piscineEvent.stop()})),

$(document).on("pagebeforeshow","#pagePiscineParametres",(function(){console.log("-- STARTING Piscine Params Server Events --"),piscineParamsEvent.start()})),
$(document).on("pagebeforehide","#pagePiscineParametres",(function(){console.log("-- STOPPING Piscine Params Server Events --"),piscineParamsEvent.stop()})),

$(document).on("pagebeforeshow","#pagePiscineDebug",(function(){console.log("-- STARTING Piscine Debug Server Events --"),piscineDebugEvent.start(),$.ajax({type:"POST",url:"/setPiscinePageDebug",data:"sess="+sessID+"&trigger=start",dataType:"text",success:function(e){console.log("Call to /setPiscinePageDebug?trigger=start is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscinePageDebug, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})})),

$(document).on("pagebeforehide","#pagePiscineDebug",(function(){console.log("-- STOPPING Piscine Debug Server Events --"),piscineDebugEvent.stop(),$.ajax({type:"POST",url:"/setPiscinePageDebug",data:"sess="+sessID+"&trigger=stop",dataType:"text",success:function(e){console.log("Call to /setPiscinePageDebug?trigger=stop is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscinePageDebug, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}
})})),

$(document).on("pagebeforeshow","#pagePiscineMaintenance",(function(){console.log("-- STARTING Piscine Maintenance Server Events --"),piscineMaintenanceEvent.start()})),
$(document).on("pagebeforehide","#pagePiscineMaintenance",(function(){function e(e,t,a){var s="sess="+sessID+"&command="+e+"&"+t+"="+a;$.ajax({type:"POST",url:"/setPiscineMaintenance",data:s,dataType:"text",success:function(t){console.log("Call to /setPiscineMaintenance with command="+e+" is success")}
,error:function(e,t,a){console.log("An error occurred while calling /setPiscineMaintenance, data is: "+e.status+" and exception is : "+e.responseText),"400"==e.status&&-1!==e.responseText.indexOf("Invalid Session")&&(console.log("THE SESSIONID EXPIRED NEXT CHANGE PAGE WILL GO TO LOGIN"),$.mobile.changePage("#dlg-EndSessionAlert"))}})}
e("cancelScan","type","PH"),e("cancelScan","type","Redox"),console.log("-- STOPPING Piscine Maintenance Server Events --"),piscineMaintenanceEvent.stop()})),

$(document).on("pagebeforeshow","#pagePiscineGraphs",(function(){Array.isArray(chartdata)&&0==chartdata.length&&(console.log("-- Building the chartdata array from before show --"),getOriginData())})),
$(document).on("pagebeforehide","#pagePiscineGraphs",(function(){console.log("-- Cleaning the chartdata array --"),chartdata=[]})),

console.log("ready to go !");