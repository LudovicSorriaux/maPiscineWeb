<!DOCTYPE html>
<html>
<head>
	<title>Ma Piscine main page!</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="author" content="Ludovic Sorriaux">
	<!-- <link rel="icon" type="image/svg+xml" href="favicon.svg"> 
	<link rel="icon" type="image/x-icon" href="favicon.ico">-->
	<meta name="description" content="maPiscine Web Manager application">
	<meta name="keywords" content="Piscine, Pool, Manager, Web, Application, PISCINE MANAGER, maPiscine, Ludovic Sorriaux">

    <meta name="HandheldFriendly" content="True" />
    <meta name="MobileOptimized" content="320" />
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes" />
    <meta name="theme-color" content="#2f434e" />
    <meta http-equiv="cleartype" content="on" />
	<!-- web app icon on ios -->
	<link rel="apple-touch-icon" href="images/maPiscine-apl.png">
	<!-- manifest pour la web app 
	<link rel="manifest" href="/manifest.json" />	
	-->
<!-- font-awesome version4 -->
	<!-- 
	<link rel = "stylesheet" href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" /> <!-- version4 --
	-->
<!-- font-awesome version 5 -->
	<!-- kit --
		<script src="https://kit.fontawesome.com/e8b296d778.js" crossorigin="anonymous"></script>-->
	<!-- solid --
		<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.13.0/css/solid.css" integrity="sha384-fZFUEa75TqnWs6kJuLABg1hDDArGv1sOKyoqc7RubztZ1lvSU7BS+rc5mwf1Is5a" crossorigin="anonymous"> 
	!-- regular --
		<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.13.0/css/regular.css" integrity="sha384-rbtXN6sVGIr49U/9DEVUaY55JgfUhjDiDo3EC0wYxfjknaJamv0+cF3XvyaovFbC" crossorigin="anonymous">
	!-- brands --
		<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.13.0/css/brands.css" integrity="sha384-yZSrIKdp94pouX5Mo4J2MnZUIAuHlZhe3H2c4FRXeUcHvI2k0zNtPrBu8p3bjun5" crossorigin="anonymous">
	!-- all --
		<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.13.0/css/fontawesome.css" integrity="sha384-syoT0d9IcMjfxtHzbJUlNIuL19vD9XQAdOzftC+llPALVSZdxUpVXE0niLOiw/mn" crossorigin="anonymous">
	-->

<!-- font-google metal design -->
	<link rel = "stylesheet" href = "https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css">

<!-- jquery mobile -->
	<script src = "https://code.jquery.com/jquery-1.11.3.min.js"></script>
    <script src = "https://cdn.jsdelivr.net/npm/jquery-validation@1.19.1/dist/jquery.validate.min.js"></script>
	<script src = "https://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.js"></script>
	<link rel="stylesheet" href="https://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.min.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Kaushan+Script" >
<!--  dayjs + plugins -->
	<script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/dayjs@1/plugin/localeData.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/dayjs@1/plugin/isoWeek.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/dayjs@1/plugin/arraySupport.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js"></script>
	<script>dayjs.extend(window.dayjs_plugin_customParseFormat)</script>
<!-- PapaParse for CSV parsing -->
	<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
<!-- dygraph -->
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/dygraph/2.2.1/dygraph.min.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dygraph/2.2.1/dygraph.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dygraph/2.2.1/extras/synchronizer.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<!-- debuger -->
	<script src="https://cdn.jsdelivr.net/gh/arschmitz/jquery-mobile-event-debugger@v0.0.4/jquery.mobile.event.debugger.js"></script>

  <!-- build:css style.css -->
	<link rel="stylesheet" href="./jqm-fluid960.min.css" />	
	<link rel="stylesheet" href="./mystyles.css" />
	<link rel="stylesheet" href="./piscineGraphs.css" />
	<link rel="stylesheet" href="./jquery-clockpicker.css" />
	<link rel="stylesheet" href="./daterangepicker.css" />

<!-- endbuild -->

  <!-- build:js script.js -->
	<script src="./jquery-clockpicker.js"></script>
	<script src="./moment.min.js"></script>
	<script src="./daterangepicker.js"></script>
	<script src="./dataGenerator.js"></script> 
	<script src="./piscineScripts.js"></script>
  <!-- endbuild -->

	
</head>
<body>

<!-- ----------------------- Pages --------------------- -->

		
	<!-- Page Piscine Graphs -->
	<div data-role="page" id="pagePiscineGraphs" data-theme="b" nextleft="#pagePiscinePrincipale" nextright="#pagePiscineDebug">
		<!-- Menu Panel (profile, about, logoff -->
		<div data-role="panel" id="optionsPiscineManager" data-display="reveal" data-position="right" data-theme="b">
			<ul data-role="listview">
				<li><a href="#about-dlg" class="ui-btn ui-shadow ui-corner-all ui-icon-info ui-btn-icon-right">About maPiscine</a></li>
				<hr class="inset">
				<li><a href="#logoff-dlg" id="logoff" class="ui-btn ui-shadow ui-corner-all ui-icon-action ui-btn-icon-right">Logoff</a></li>
				<li><a href="#pageUserProfile" id="profile" class="ui-btn ui-shadow ui-corner-all ui-icon-user ui-btn-icon-right">User Profile</a></li>
				<hr class="inset">
				<li><a href="#pageRegisterLogin" id="addUsr" class="ui-btn ui-shadow ui-corner-all ui-icon-plus ui-btn-icon-right">Add User</a></li>
				<li><a href="#pageDeleteUser" id="deleteUsr" class="ui-btn ui-shadow ui-corner-all ui-icon-delete ui-btn-icon-right">Delete Users</a></li>
				<li><a href="#pageChangeAdminPW" id="adminUsrPasswd" class="ui-btn ui-shadow ui-corner-all ui-icon-lock ui-btn-icon-right">Admin Passwd</a></li>
				<hr class="inset">
				<li><a href="#" data-rel="close" class="ui-btn ui-shadow ui-corner-all ui-icon-back ui-btn-icon-right">Close panel</a></li>
			</ul>
		</div> <!-- Menu panel -->

		<div data-role="header" id="graphHeader" data-position="fixed" data-theme="b">
			<a href="#leftpanel" data-icon="bars" class="ui-btn-left">Pages</a>
			<h1 class="myh1">Piscine Manager</h1>
			<a href="#optionsPiscineManager" data-icon="gear" class="ui-btn-right">Options</a>
		</div>
		
		<div role="main" id="graphContent" class="ui-content" data-inset="false" style="font-size:14px">
			<!-- Sélecteur de période (commun à tous modes) -->
            <div id="periodControlBox" class="graph-selector-box">
                <div class="selector-side">
                    <select name="periodSelector1" id="periodSelector1" data-mini="true" data-theme="b" data-inline="false">
                        <option value="today">Aujourd'hui</option>
                        <option value="yesterday">Hier</option>
                        <option value="last3d">3 jours précédents</option>
                        <option value="last7d">7 jours précédents</option>
                        <option value="lastWeek">Semaine précédente</option>
                        <option value="thisWeek">Cette semaine</option>
                        <option value="last30d">30 jours précédents</option>
                        <option value="lastMonth">Mois précédent</option>
                        <option value="thisMonth">Ce mois</option>
                    </select>
                </div>

                <div class="display-side">
                    <div id="dateDisplayRange" class="inset-textbox">
                    </div>
                </div>
            </div>
        
            <div class="dashboard-card">
	            <div class="charts-wrapper" id="dataChartsArea">
			        <div id="graph-zone-1" class="graph-zone">
						<div class="graph-header-mini">
							<div class="header-top-row">
							    <div class="title-container">
							        <select id="graphSelector1" class="zone-graph-selector" data-zone="1" data-native-menu="false" data-theme="b" data-mini="true" data-icon="arrow-d" data-iconpos="right" >
										<option value="Chimie" selected>Chimie</option>
						                <option value="Températures">Températures</option>
						                <option value="Équipements">Équipements</option>
							        </select>
							    </div>
								<div class="axes-container">
									<select id="axesSelector1" class="axes-multi-selector" data-zone="1" multiple="multiple" data-native-menu="false" data-theme="b" data-icon="gear" data-iconpos="left">
										<option data-placeholder="true">Courbes...</option> 
										<option value="PH">PH</option>
										<option value="CL">Chlore</option>
										<option value="Redox">Redox</option>
										<option value="TempAir">Temp Air</option>
										<option value="TempEau">Temp Eau</option>
										<option value="PP">Pression</option>
									</select>
								</div>
								<div class="export-container">
								    <select id="exportAction1" data-zone="1" class="export-selector" data-native-menu="false" data-mini="true" data-icon="camera" data-iconpos="notext">
								        <option value="" data-placeholder="true">Type d'Export...</option>
								        <option value="png">Image PNG</option>
								        <option value="csv">Données CSV</option>
								    </select>
							    </div>
							</div>							
						    <div id="status-val-1" class="local-status-val"></div>
						</div>
			            <div class="graph-content"><div id="graph-canvas-1" class="graph-canvas"></div></div>
					</div>
					
			        <div id="graph-zone-2" class="graph-zone">
			            <div class="graph-header-mini">
							<div class="header-top-row">
							    <div class="title-container">
					                <select id="graphSelector2" class="zone-graph-selector" data-zone="2" data-native-menu="false" data-theme="b" data-mini="true" data-icon="arrow-d" data-iconpos="right">
					                    <option value="Chimie">Chimie</option>
					                    <option value="Températures" selected>Températures</option>
					                    <option value="Équipements">Équipements</option>
					                </select>
								</div>
								<div class="axes-container">
									<select id="axesSelector2" class="axes-multi-selector" data-zone="2" multiple="multiple" data-native-menu="false" data-theme="b" data-icon="gear" data-iconpos="left">
											<option data-placeholder="true">Courbes...</option> 
											<option value="PH">PH</option>
											<option value="CL">Chlore</option>
											<option value="Redox">Redox</option>
											<option value="TempAir">Temp Air</option>
											<option value="TempEau">Temp Eau</option>
											<option value="PP">Pression</option>
									</select>
								</div>
								<div class="export-container">
								    <select id="exportAction2" data-zone="2" class="export-selector" data-native-menu="false" data-mini="true" data-icon="camera" data-iconpos="notext">
								        <option value="" data-placeholder="true">Type d'Export...</option>
								        <option value="png">Image PNG</option>
								        <option value="csv">Données CSV</option>
								    </select>
							    </div>
							</div>
							<div id="status-val-2" class="local-status-val"></div>
			            </div>
			            <div class="graph-content"><div id="graph-canvas-2" class="graph-canvas"></div></div>
			        </div>
			
			        <div id="graph-zone-3" class="graph-zone">
			            <div class="graph-header-mini">
							<div class="header-top-row">
							    <div class="title-container">
									<select id="graphSelector3" class="zone-graph-selector" data-zone="3" data-native-menu="false" data-theme="b" data-mini="true" data-icon="arrow-d" data-iconpos="right">
					                    <option value="Chimie">Chimie</option>
					                    <option value="Températures">Températures</option>
					                    <option value="Équipements" selected>Équipements</option>
					                </select>
								</div>
								<div class="axes-container">
									<select id="axesSelector3" class="axes-multi-selector" data-zone="3" multiple="multiple" data-native-menu="false" data-theme="b" data-icon="gear" data-iconpos="left">
											<option data-placeholder="true">Courbes...</option> 
											<option value="PH">PH</option>
											<option value="CL">Chlore</option>
											<option value="Redox">Redox</option>
											<option value="TempAir">Temp Air</option>
											<option value="TempEau">Temp Eau</option>
											<option value="PP">Pression</option>
									</select>
								</div>
								<div class="export-container">
								    <select id="exportAction3" data-zone="3" class="export-selector" data-native-menu="false" data-mini="true" data-icon="camera" data-iconpos="notext">
								        <option value="" data-placeholder="true">Type d'Export...</option>
								        <option value="png">Image PNG</option>
								        <option value="csv">Données CSV</option>
								    </select>
							    </div>
							</div>
							<div id="status-val-3" class="local-status-val"></div>
			            </div>
			            <div class="graph-content"><div id="graph-canvas-3" class="graph-canvas"></div></div>
			        </div>
				</div>	
	            <div class="nav-wrapper" id="navZone">
	                <div id="graph-canvas-nav" style="width:100%; height:100%;"></div>
	            </div>
	        </div>
		</div>
	</div>	<!-- page -->


<!-- Left Panel (menu pages) -->

	<div data-role="panel" id="leftpanel" data-display="overlay" data-position-fixed="true" data-theme="b">
		<div data-role="collapsibleset" id="leftpanelMenu">
			<div data-role="collapsible" data-collapsed="false" data-collapsed-icon="plus" data-expanded-icon="minus" data-iconpos="right" data-theme="b" data-content-theme="b">
				<h3 class="myh3">Piscine</h3>
				<ul data-role="listview" data-inset="true">
					<li><a href="#pagePiscinePrincipale" data-transition="flip">Page Principale</a></li>
					<li><a href="#pagePiscineParametres" data-transition="flip">Parametres Piscine</a></li>
					<li><a href="#pagePiscineMaintenance" data-transition="flip">Maintenance Piscine</a></li>
					<li><a href="#pagePiscineGraphs" data-transition="flip">Graphs Piscine</a></li>
					<li><a href="#pagePiscineDebug" data-transition="flip">Debug Piscine</a></li>
				</ul>
			</div>
		</div>
	</div> <!-- left panel -->
	

<!-- ------------------------- Dialogs -------------------- -->
<!-- Dialog End Session Alert -->
	<div data-role="dialog" id="dlg-EndSessionAlert" data-transition="slidefade" data-close-btn="none" data-dismissible="false" data-theme="b" >
		<div data-role="header">	
			<h1>ALERT !</h1>
		</div>        
		<div data-role="content">
			<div id="dlg-EndSessionAlert-message">Your Session has Expired, Need to login again</div>	   
			<a href="#pageLogin" id="reloginButton" data-role="button"> Login Again </a>            
		</div>
	</div> <!-- End Session Alert -->
<!-- Piscine Error Dialog -->
	<div data-role="dialog" id="piscineError-dlg" data-transition="slidefade" data-close-btn="none" data-dismissible="false" data-theme="b">
		<div data-role="header">
			<h1>Erreur</h1>
		</div>
		<div data-role="content">
			<div class="mypanel">
				<fieldset class="container_12">
					<div class="prefix_1 grid_4" style="margin:1em 0 0 0">Erreur Status :</div>
					<div class="grid_4 suffix_1">
						<input type="text" name="PiscineErrorStatus" class="myinput borderFeild" id="PiscineErrorStatus" placeholder="Status" style="width:20ch">
					</div>
				</fieldset>
				<fieldset class="container_12">
					<div class="prefix_1 grid_4" style="margin:1em 0 0 0">Correction :</div>
					<div class="grid_4 suffix_1">
						<input type="text" name="PiscineErrorCorrection" class="myinput borderFeild" id="PiscineErrorCorrection" placeholder="Correction" style="width:40ch">
					</div>
				</fieldset>
				<fieldset class="container_12">
					<div class="prefix_2 grid_10">
						<div class="ui-field-contain">
							<fieldset data-role="controlgroup" data-type="horizontal">
								<a href="javascript:window.history.go(-2);" id="backButton" data-role="button">OK</a>
							</fieldset>
						</div>
					</div>
				</fieldset>
			</div>
		</div>
	</div>	<!-- End Piscine Error Dialog -->

<!-- Loader --> 
	<div class="ui-loader ui-body-a ui-corner-all" style="top: 560px;">
		<span class="ui-icon ui-icon-loading spin"></span>
		<h1>loading</h1>
	</div>		


</body>
</html>