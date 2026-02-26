
// Global functions and variables
console.log("📌 piscineScripts.js VERSION 2026-02-07-22:20 loaded");

var debug = true;
var statusErrorMap = {
	'400' : "Server understood the request, but request content was invalid.",
	'401' : "Unauthorized access.",
	'403' : "Forbidden resource can't be accessed.",
	'500' : "Internal server error.",
	'503' : "Service unavailable."
};
var currentLayout = 'mobile-portrait';
var currentMode = null; // 'mobile', 'tablet', 'desktop'


// ---  Fonctions Globales  ---- */

  /**
   * @brief Affiche un toast notification (compatible jQuery Mobile)
   * @param message Texte à afficher
   * @param type Type de message ('success', 'error', 'info')
   */
  function showToast(message, type) {
	var toastClass = 'toast-' + type;
	var $toast = $('<div class="toast ' + toastClass + '">' + message + '</div>');
	
	$('body').append($toast);
	
	setTimeout(function() {
		$toast.addClass('show');
	}, 100);
	
	setTimeout(function() {
		$toast.removeClass('show');
		setTimeout(function() {
			$toast.remove();
		}, 300);
	}, 3000);
  }

  // set the ui according to the user roles
  function setUserUI(){
	var theHtml="";
	var flgExterieur = false;
	var flgFirst = false;

	console.log("[DEBUG] In setUserUI - START");
	theHtml += piscineMenu((flgFirst) ? false : true);
	if (!flgFirst) flgFirst = true;
	if(!flgExterieur) flgExterieur = true;
	theHtml += '<hr class="inset">'
	console.log("[DEBUG] Generated HTML length:", theHtml.length);
	console.log("[DEBUG] Looking for #leftpanelMenu element:", $('#leftpanelMenu').length);
	$('#leftpanelMenu').html(theHtml); 		// .collapsibleset("refresh");
	$('#leftpanelMenu').enhanceWithin(); 	
	console.log("[DEBUG] setUserUI - COMPLETE");
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
	html += '		<li><a href="#pagePiscinePrincipale" data-transition="slide"><h4 class="myh4">Piscine</h4></a></li>';
	html += '		<li><a href="#pagePiscineParametres" data-transition="slide"><h4 class="myh4">Piscine Parametres</h4></a></li>';
	html += '		<li><a href="#pagePiscineMaintenance" data-transition="slide"><h4 class="myh4">Piscine Maintenance</h4></a></li>';
	html += '		<li><a href="#pagePiscineGraphs" data-transition="slide"><h4 class="myh4">Piscine Graphs</h4></a></li>';
	html += '		<li><a href="#pagePiscineDebug" data-transition="slide"><h4 class="myh4">Piscine Debug</h4></a></li>';
	html += '	</ul>';
	html += '</div>';
	return html;
  }	



// --------------------------------  Graphic Pages functions et Vars  ---------------------------------------------------

// --- VARIABLES D'ÉTAT GLOBALES Pour les graphs ---
var g1 = null, g2 = null, g3 = null, gNav = null;
var activeGraphs = [];

let syncHandler = null;
let isInteracting = false;      
let interactionTimeout = null; 
let updateDebounceTimer = null; // Timer de debounce pour éviter les requêtes de fetch data trop fréquentes

var OrigStart;
var OrigEnd;
var CurrStart;
var CurrEnd;

var chartdata=[];           // data to be charted
var dataCache = new Map();  // Cache Map pour stocker les données par jour (clé: "YYYY-MM-DD", valeur: array de lignes)


var chart={}

var dataOrigin=[];      // data returned from server
var currData=[];


/*  ---------------------
    --- CONFIGURATION ---
    ---------------------
*/
/* Couleurs pour le mode sombre 
	Chauds	Rouge Corail	#FF3B30 Alertes, pH acide
			Rouge Rose		#FF2D55	Débit pompe, Chauffage
			Orange Néon		#FF9500	Niveaux critiques, alertes moyennes
			Orange Cuivré	#FF69B4	Éclairage (Puissance)
			Jaune Ambre		#FFCC00	Température Air, Soleil
			Jaune Citron	#E6FF00	Rendement, Intensité
			Or / Moutarde	#D4AF37	Puissance, Intensité
	Verts	Vert Émeraude	#32D74B	Température Eau, État OK
			Vert Menthe		#63E6BE	Débits, FluxVert 
			Vert Lime		#A6FF00	Consommation électrique
			Vert d'Eau		#00FA9A	Oxygène, Propreté
			Citron			#A6FF00	Rendement, Éco
	Bleus	Cyan Électrique	#00FBFF	Chlore, Potabilité
			Bleu Ciel		#5AC8FA	Humidité, Niveau d'eau
			Bleu Indigo		#5E5CE6	Pression, Vitesse
			Bleu Azur		#007AFF	Réseau, Signal
	Violets	Violet Royal	#BF5AF2	Redox, UV, Ozone
			Mauve Clair		#D087FF	Analyse chimique secondaire
			Rose Fuchsia	#FF2D55	Dosage produit, Pompes
			Rose Pastel		#FF9F0A	Éclairage, Auxiliaires
	Neutres	Blanc Pur		#FFFFFF	Lignes de repère, Navigation
			Gris Argent		#A2A2A2	Courbes de référence / Moyennes
			Doré			#FFD700	Temps de fonctionnement
*/

const ALL_Graph_LABELS = ["Chimie", "Température", "Équipement"];

// Ordre : 0:Time, 1:S1, 2:S2, 3:S3, 4:S4, 5:S5, 6:Nav
const ALL_LABELS = ["Time", "PH", "CL",  "Redox", "TempAir", "TempEau", "PP", "Navigation"];
// const ALL_LABELS = ["Date", "TempEau", "TempAir", "TempPAC", "TempInt", "PHVal", "RedoxVal", "CLVal", "PompePH", "PompeCL", "PompeALG", "PP", "PAC", "Auto", "Navigation"];
// colors = ["#ff0000", "#00FF00", "#006FFF", "#FFFF00", "#00FFFF", "#FF00FF", "#FF6F00", "#0000FF", "#6F00FF", "#6FFF00", "#00FF6F", "#FF006F", "#00FF6F"],

const PALETTE = {
    RED_CORAL:    "#FF3B30",	// Famille des Rouges/Oranges (Alertes, Acidité, Chaleur)
    RED_ROSE:     "#FF2D55",
    ORANGE_NEON:  "#FF9500",
    ORANGE_SOFT:  "#FF69B4",
    AMBER:        "#FFCC00",
    YELLOW_LIME:  "#E6FF00",
    GREEN_EMERALD: "#32D74B",	// Famille des Verts (Stabilité, Flux, Énergie)
    GREEN_MINT:    "#63E6BE",
    GREEN_LIME:    "#A6FF00",
    GREEN_SEA:     "#00FA9A",
    CYAN_ELECTRIC: "#00FBFF",	// Famille des Bleus (Eau, Pression, Air)
    BLUE_SKY:      "#5AC8FA",
    BLUE_INDIGO:   "#5E5CE6",
    BLUE_AZURE:    "#007AFF",
    BLUE_DEEP:     "#0055FF",   
    PURPLE_ROYAL:  "#BF5AF2",	 // Famille des Violets/Roses (Chimie, Électronique, Dosage)
    PURPLE_LIGHT:  "#D087FF",
    PINK_FUCHSIA:  "#FF00FF",
    WHITE:         "#FFFFFF",	// Neutres (Navigation, Consignes, Moyennes)
    SILVER:        "#A2A2A2",
    GOLD:          "#FFD700"
};

const SERIES_MAPPING = {
// HIDDEN : L'option n'apparaît même pas dans le menu
    // OFF    : L'option apparaît dans le menu mais n'est pas cochée (pas de courbe)
    // ON     : L'option apparaît et est cochée par défaut (courbe affichée)
    // 			    [PH,    CL,       Redox, TAir   TEau,  PP,       Nav] -> Navigation est toujours "HIDDEN" ici
    "Chimie":       ["ON",  "OFF",    "ON",  "OFF", "ON",  "HIDDEN", "HIDDEN"], 
    "Températures": ["OFF", "OFF",    "OFF", "ON",  "ON",  "HIDDEN", "HIDDEN"], 
    "Équipements":  ["OFF", "HIDDEN", "ON",  "OFF", "OFF", "ON",     "HIDDEN"]  
};

const SENSOR_CONFIG = {
    "PH":       { label: "pH",       unit: "pH",   color: PALETTE.RED_CORAL, min: 7.2, max: 7.6 },
    "CL":       { label: "Chlore",   unit: "mg/l", color: PALETTE.PURPLE_ROYAL, min: 1.0, max: 2.0 },
    "Redox":    { label: "Redox",    unit: "mV",   color: PALETTE.CYAN_ELECTRIC, min: 650, max: 750, axis: 'y2'}, // Valeurs réelles
    "TempAir":  { label: "T° Air",   unit: "°C",   color: PALETTE.AMBER,                     axis: 'y2'}, 
    "TempEau":  { label: "T° Eau",   unit: "°C",   color: PALETTE.GREEN_EMERALD, min: 25,  max: 28,  axis: 'y2'},
    "PP":       { label: "Pression", unit: " bar", color: PALETTE.BLUE_INDIGO, min: 0.5, max: 1.5 },
    "Navigation": { label: "Nav",    unit: "",     color: PALETTE.SILVER }
};



/*  ----------------------------------------------
    --- GESTION DES PRÉFÉRENCES (LocalStorage) ---
    ----------------------------------------------
*/
const PREFS_KEY_PREFIX = "pool_dashboard_zone_";

// Sauvegarder les capteurs sélectionnés pour une zone
function saveZonePrefs(zoneIndex, sensorList) {
    localStorage.setItem(PREFS_KEY_PREFIX + zoneIndex, JSON.stringify(sensorList));
}

// Récupérer les préférences ou retourner les capteurs par défaut
function getZonePrefs(zoneIndex, defaultSensors) {
    const saved = localStorage.getItem(PREFS_KEY_PREFIX + zoneIndex);
	console.log(`[PREFS] Lecture Zone ${zoneIndex}:`, saved);
    try {
        return saved ? JSON.parse(saved) : defaultSensors;
    } catch (e) {
		console.error(`[PREFS] Erreur JSON Zone ${zoneIndex}:`, e);
        return defaultSensors;
    }
}


/*  ------------------------
    --- DETERMINE LAYOUT ---
    ------------------------
*/

function determineLayout() {
    const mode = getGraphMode();
	console.log("mode est : "+mode)
    const isLandscape = mode.includes('landscape');
    
    let count = 3; // Par défaut (Desktop)

    // Logique de densité d'affichage
    if (mode === 'mobile-portrait') {
        count = 1; // Un seul gros graphe sur téléphone vertical
    } else if (mode === 'mobile-landscape') {
        count = 2; // Deux graphes côte à côte sur téléphone horizontal
    } else if (mode.includes('tablet')) {
        count = 2; // Sur tablette, 2 graphes sont souvent plus lisibles que 3
    } else {
        count = 3; // Grand écran : on affiche tout
    }
	console.log(isLandscape ? 'orientation:row' : 'orientation:column')
    return { count, orientation: isLandscape ? 'row' : 'column', isLandscape };
}

/*  --------------------
    --- PROGRESS BAR ---
    --------------------
*/

/**
 * Mise à jour progress bar graphique
 * @param {number} current - Étape actuelle
 * @param {number} total - Total d'étapes
 * @param {string} message - Message à afficher
 */
function updateGraphProgress(current, total, message) {
	const percent = Math.round((current / total) * 100);
	
	// Créer progress bar si inexistante
	if (!$('#graphProgressBar').length) {
		const progressHTML = `
			<div id="graphProgressContainer" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
			     background: linear-gradient(145deg, #0a0a0a, #1a1a1a); padding: 24px; border-radius: 10px; 
			     box-shadow: 0 10px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1); 
			     border: 2px solid #1045a9; min-width: 340px; max-width: 90%; z-index: 9999;">
				<div id="graphProgressMessage" style="margin-bottom: 14px; font-weight: bold; text-align: center; 
				     color: #ffffff; font-size: 15px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Chargement...</div>
				<div style="background: #1a1a1a; border-radius: 6px; overflow: hidden; height: 30px; 
				     border: 1px solid #333; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
					<div id="graphProgressBar" style="background: linear-gradient(90deg, #1045a9, #2060d0, #1045a9); 
					     background-size: 200% 100%; animation: shimmer 2s infinite linear;
					     height: 100%; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; 
					     justify-content: center; color: #ffffff; font-weight: bold; font-size: 14px; 
					     box-shadow: 0 0 10px rgba(16,69,169,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3); 
					     text-shadow: 0 1px 2px rgba(0,0,0,0.7);">0%</div>
				</div>
				<div id="graphProgressDetail" style="margin-top: 12px; font-size: 13px; color: #bbbbbb; text-align: center;"></div>
			</div>
		`;
		
		// Ajouter l'animation shimmer si pas déjà présente
		if (!$('style#shimmerAnimation').length) {
			$('head').append(`
				<style id="shimmerAnimation">
					@keyframes shimmer {
						0% { background-position: 200% 0; }
						100% { background-position: -200% 0; }
					}
				</style>
			`);
		}
		
		$('body').append(progressHTML);
	}
	
	$('#graphProgressBar').css('width', percent + '%').text(percent + '%');
	$('#graphProgressMessage').text(message);
	$('#graphProgressDetail').text(`${current} / ${total}`);
}

// Masquer progress bar
function hideGraphProgress() {
	$('#graphProgressContainer').fadeOut(300, function() {
		$(this).remove();
	});
}



/*  ---------------------------  
    --- GESTION DES DONNÉES ---
    ---------------------------
*/

// Génération des données
const globalData = (function() {
    const data = [];
    const t = new Date();
    
    // Valeurs initiales au milieu de leurs plages respectives
    let lastPh = 7.2;
    let lastCl = 1.2;
    let lastRedox = 700;
    let lastTEau = 26.5;
    let lastTAir = 22.0;

    for (let i = 0; i < 500; i++) {
        const x = new Date(t.getTime() + i * 60000); // Pas de 1 minute

        // 1. pH (4 à 12) : très stable, micro-variations
        lastPh += (Math.random() - 0.5) * 0.05;
        lastPh = Math.max(4, Math.min(12, lastPh));

        // 2. CL (0.5 à 2) : variations lentes
        lastCl += (Math.random() - 0.5) * 0.1;
        lastCl = Math.max(0.5, Math.min(2, lastCl));

        // 3. Redox (500 à 900) : lié au chlore mais avec du "bruit"
        // On simule une dérive lente + un petit bruit aléatoire
        lastRedox += (Math.random() - 0.5) * 5;
        lastRedox = Math.max(500, Math.min(900, lastRedox));

        // 4. Températures (Air et Eau)
        // L'eau est beaucoup plus stable que l'air
        lastTEau += (Math.random() - 0.5) * 0.1;
        lastTAir += (Math.random() - 0.5) * 0.2;
        
        // 5. PP (On/Off : 0 ou 1)
        // On simule un cycle : allumé 30 min, éteint 30 min
        const PP = (i % 60 < 30) ? 1 : 0;

        // 6. Navigation (yNav) : Une courbe douce pour le slider
        const yNav = Math.sin(i/10)*40; //Math.sin(i/50) * 10 + 50;

        data.push([x, 
            parseFloat(lastPh.toFixed(2)), 
            parseFloat(lastCl.toFixed(2)), 
            parseFloat(lastRedox.toFixed(1)), 
            parseFloat(lastTAir.toFixed(1)), 
            parseFloat(lastTEau.toFixed(1)), 
            PP, 
            yNav
        ]);
    }
    return data;
})();

function getNormalizedData() {
    return globalData.map(row => {
		let newRow = [...row];
        // On normalise le Redox (index 3 dans globalData : Time, PH, CL, Redox...)
        // if (newRow[3] !== null) newRow[3] = newRow[3] / 100; 
        return newRow;
    });
}

function initCharts() {
    // 1. Calculer les hauteurs d'abord pour que Dygraph connaisse sa taille
    applyChartHeights();

    // 2. Créer les instances de graphiques (ils vont lire getGraphOptions)
    updateGraphs();
    
    // 3. Synchroniser les multi-sélecteurs d'axes pour qu'ils 
    // reflètent le mapping du groupe par défaut
    for(let i = 1; i <= 3; i++) {
        const $zone = $(`#graph-zone-${i}`);
        
        // On ne configure que les zones réellement affichées
        if($zone.is(':visible')) {
            // CRUCIAL : On récupère la valeur du sélecteur spécifique à CETTE zone
            const currentGroup = $(`#graphSelector${i}`).val();
            
            // On s'assure de passer l'index 'i' pour ne mettre à jour que le sélecteur 'i'
            updateAxesSelectorsVisual(i, currentGroup);
        }
    }
    
    // 4. ResizeObserver (votre code est très bien ici)
    if (!window.chartObserver) {
        const dashboard = document.querySelector('.dashboard-card');
        window.chartObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                if (g1) g1.resize(); 
                if (g2) g2.resize(); 
                if (g3) g3.resize();
                if (gNav) gNav.resize();
            });
        });
        window.chartObserver.observe(dashboard);
    }
}



// transformer les data from csv to array
function csvToArray(csvText) {
	const result = Papa.parse(csvText, {
		delimiter: ";",
		skipEmptyLines: true,
		dynamicTyping: false  // On parse manuellement pour les dates
	});
	
	let validRows = 0;
	let skippedHeaders = 0;
	let skippedInvalid = 0;
	
	// FIX: Filtrer les lignes invalides (headers, mauvais format, nb colonnes incorrect)
	const dataRows = result.data.filter(row => {
		// Skip si première colonne est exactement "date" (header CSV)
		if (row[0] === "date") {
			skippedHeaders++;
			return false;
		}
		
		// Skip si ligne vide ou mauvais nombre de colonnes (doit être exactement 14)
		if (!row[0] || row.length !== 14) {
			skippedInvalid++;
			return false;
		}
		
		// Validation format date (doit correspondre à D-M-YYYY H:m:s)
		// Format ESP8266 corrigé: "8-2-2026 20:15:30" (pas de zéros initiaux)
		const dateRegex = /^\d{1,2}-\d{1,2}-\d{4} \d{1,2}:\d{1,2}:\d{1,2}$/;
		if (!dateRegex.test(row[0])) {
			skippedInvalid++;
			return false;
		}
		
		validRows++;
		return true;
	});
	
	console.log(`✅ Parsing: ${validRows} lignes valides`);
	
	return dataRows.map(row => {
		// Parse date avec format ESP8266 corrigé: "D-M-YYYY H:m:s"
		row[0] = dayjs(row[0], "D-M-YYYY H:m:s").toDate();
		
		// Parse valeurs numériques
		for(let i = 1; i < row.length; i++) {
			row[i] = parseFloat(row[i]);
		}
		return row;
	});
}

// First call to get data
async function getOriginData(){
	i=0;
	now=dayjs().set("minute",0).set("second",0);
	start=dayjs().subtract(7,"day");  // ← API CHUNKED: Maintenant on peut charger 7 jours sans WDT !
	console.log("Fetching Origin Data: start:"+start.format("DD-MM-YYYY")+" end:"+now.format("DD-MM-YYYY"));
	dataOrigin=await fetchDataChunked(start,now);  // ← NOUVELLE API: Chunking multi-requêtes
	chartdata=dataOrigin;
	OrigStart=CurrStart=start;
	OrigEnd=CurrEnd=now;
	
	// Initialiser le cache avec les données d'origine
	populateCache(dataOrigin);
}

// Remplir le cache Map avec un tableau de données
function populateCache(data) {
	data.forEach(row => {
		if (row && row[0] instanceof Date) {
			const dayKey = dayjs(row[0]).format("YYYY-MM-DD");
			if (!dataCache.has(dayKey)) {
				dataCache.set(dayKey, []);
			}
			dataCache.get(dayKey).push(row);
		}
	});
}

// Fonction pour transformer les données avec offset vertical (graphe Équipements)
function applyEquipmentOffset(data) {
	// data format: [Date, TempEau, TempAir, TempPAC, TempInt, PHVal, RedoxVal, CLVal, PompePH, PompeCL, PompeALG, PP, PAC, Auto]
	// Indices: PP=11, PAC=12, Auto=13
	return data.map(row => {
		if (!row || row.length < 14) return row;
		return [
			row[0],  // Date
			row[11] !== null && row[11] !== undefined ? row[11] : null,          // PP reste à 0-1
			row[12] !== null && row[12] !== undefined ? row[12] + 1 : null,      // PAC décalé à 1-2
			row[13] !== null && row[13] !== undefined ? row[13] + 2 : null       // Auto décalé à 2-3
		];
	});
}

/**
 * Nouvelle fonction fetchDataChunked : Charge données par chunks (évite WDT ESP8266)
 * @param {dayjs} debut - Date début
 * @param {dayjs} fin - Date fin
 * @returns {Promise<Array>} Données CSV parsées
 */
async function fetchDataChunked(debut, fin) {
	// PROTECTION: Bloquer re-chargement si déjà en cours (évite navigation jQuery Mobile)
	if (window.chunkLoadingInProgress) {
		console.log("⚠️ [CHUNKED API] Chargement déjà en cours, skip...");
		return [];
	}
	
	window.chunkLoadingInProgress = true;
	
	const datas = [];
	const start = dayjs(debut);
	const end = dayjs(fin);
	
	console.log("📊 [CHUNKED API] Fetching data: " + start.format("DD-MM-YYYY") + " → " + end.format("DD-MM-YYYY"));
	
	try {
		// Étape 1 : Récupérer le plan (start, end, total_days seulement - évite WDT serveur)
		updateGraphProgress(0, 100, "Planification chargement...");
		
		const planResponse = await $.ajax({
			type: "POST",
			url: "/api/graph/plan",
			data: "sess=" + sessID + "&start=" + start.format("DD-MM-YYYY") + "&end=" + end.format("DD-MM-YYYY"),
			dataType: "json"
		});
		
		const totalDays = planResponse.total_days;
		const availableDays = planResponse.available_days || 0;
		const dates = planResponse.dates || [];
		
		console.log(`📋 Plan reçu: ${availableDays}/${totalDays} jours disponibles`);
		
		if (dates.length === 0) {
			hideGraphProgress();
			showToast("Aucune donnée disponible pour cette période", 'warning');
			return datas;
		}
		
		let totalChunks = 0;
		let loadedChunks = 0;
		const fileInfos = [];
		
		// Étape 2 : Récupérer info de chaque fichier
		updateGraphProgress(10, 100, "Analyse fichiers...");
		
		for (const date of dates) {
			const info = await $.ajax({
				type: "GET",
				url: "/api/graph/file-info",
				data: "sess=" + sessID + "&date=" + date + "&chunk_size=1024",
				dataType: "json"
			});
			
			if (info.exists) {
				fileInfos.push(info);
				totalChunks += info.chunks;
				console.log(`  📄 ${date}: ${info.size} bytes, ${info.chunks} chunks`);
			} else {
				console.log(`  ⚠️ ${date}: Fichier absent`);
			}
		}
		
		if (totalChunks === 0) {
			hideGraphProgress();
			showToast("Aucune donnée trouvée", 'warning');
			return datas;
		}
		
		console.log(`📦 Total: ${totalChunks} chunks à charger`);
		
		// Étape 3 : Charger chunks fichier par fichier
		let allData = "";
		
		console.log(`🔄 Début chargement chunks : ${fileInfos.length} fichiers, ${totalChunks} chunks total`);
		
		for (let fileIdx = 0; fileIdx < fileInfos.length; fileIdx++) {
			const fileInfo = fileInfos[fileIdx];
			
			for (let chunkIndex = 0; chunkIndex < fileInfo.chunks; chunkIndex++) {
				const percentComplete = 10 + Math.round((loadedChunks / totalChunks) * 85);  // 10% → 95%
				updateGraphProgress(
					percentComplete, 
					100, 
					`Chargement ${fileInfo.date}... (${loadedChunks + 1}/${totalChunks})`
				);
				
				try {
					// Charger chunk (~100ms, WDT safe)
					const chunkData = await $.ajax({
						type: "GET",
						url: "/api/graph/chunk",
						data: "sess=" + sessID + "&date=" + fileInfo.date + "&index=" + chunkIndex + "&size=1024",
						dataType: "text",
					timeout: 10000  // Timeout 10s
				});
				
				// Vérifier que réponse est CSV valide (pas message d'erreur)
				if (chunkData.startsWith("404:") || chunkData.startsWith("400:") || chunkData.startsWith("500:")) {
					loadedChunks++;
					continue;  // Skip chunk invalide
				}
				
				// FIX: Skip header CSV dans premier chunk de chaque fichier (sauf tout premier fichier)
				if (chunkIndex === 0 && fileIdx > 0 && chunkData.startsWith("date;")) {
					// Retirer première ligne (header dupliqué)
					const firstLineEnd = chunkData.indexOf('\n');
					if (firstLineEnd !== -1) {
						chunkData = chunkData.substring(firstLineEnd + 1);
					}
				}
				
				allData += chunkData;
				loadedChunks++;
			} catch (error) {
				loadedChunks++;
				// Continue avec chunk suivant
			}
		}
	}
	
	// Étape 4 : Parser données
	updateGraphProgress(95, 100, "Traitement données...");
	
	const parsedData = csvToArray(allData.trim());
	
	datas.push(...parsedData);
	
	updateGraphProgress(100, 100, "Terminé !");
		
		setTimeout(hideGraphProgress, 500);
		
		showToast(`✅ ${availableDays} jours chargés (${totalChunks} chunks)`, 'success');
		
		console.log(`✅ [CHUNKED API] Success: ${datas.length} lignes chargées`);
		
	} catch (e) {
		hideGraphProgress();
		console.error("[CHUNKED API ERROR]", e);
		showToast("Échec chargement données", 'error');
		onPageError(e);
		
		// Débloquer immédiatement en cas d'erreur
		window.chunkLoadingInProgress = false;
	}
	
	// PROTECTION: Bloquer re-chargement automatique pendant 2s (évite navigation jQuery Mobile parasite)
	setTimeout(function() {
		window.chunkLoadingInProgress = false;
	}, 2000);
	
	return datas;
}

// Nouvelle fonction simplifiée pour récupérer les données avec cache Map
async function fetchDataRange(debut, fin) {
	const start = dayjs(debut).startOf('day');
	const end = dayjs(fin).endOf('day');
	const missingRanges = [];
	const result = [];
	
	// Parcourir chaque jour de la période demandée
	let current = start;
	while (current.isBefore(end) || current.isSame(end, 'day')) {
		const dayKey = current.format("YYYY-MM-DD");
		
		if (dataCache.has(dayKey)) {
			// Données en cache, les ajouter au résultat
			result.push(...dataCache.get(dayKey));
		} else {
			// Jour manquant, identifier la plage à télécharger
			const rangeStart = current;
			while (!dataCache.has(current.format("YYYY-MM-DD")) && (current.isBefore(end) || current.isSame(end, 'day'))) {
				current = current.add(1, 'day');
			}
			missingRanges.push({start: rangeStart, end: current.subtract(1, 'day')});
			current = current.subtract(1, 'day'); // Revenir d'un jour pour le prochain incrément
		}
		
		current = current.add(1, 'day');
	}
	
	// Télécharger les plages manquantes avec API chunked
	for (const range of missingRanges) {
		console.log(`Fetching missing data from ${range.start.format("DD-MM-YYYY")} to ${range.end.format("DD-MM-YYYY")}`);
		const newData = await fetchDataChunked(range.start, range.end);  // ← Utilise API chunked
		populateCache(newData);
		result.push(...newData);
	}
	
	// Trier les résultats par date
	result.sort((a, b) => a[0] - b[0]);
	
	return result;
}

// Mettre à jour les données des graphiques existants
function updateGraphsData(data) {
	var mode = currentMode || getGraphMode();
	
	if (mode === 'mobile' && charts.mobile) {
		var graphType = $('#graphSelector').val() || 'all';
		var graphData = data;
		
		if (graphType === 'chemistry') {
			graphData = extractChemistryData(data);
		} else if (graphType === 'temperature') {
			graphData = extractTemperatureData(data);
		} else if (graphType === 'equipment') {
			graphData = applyEquipmentOffset(data);
		}
		
		charts.mobile.updateOptions({file: graphData});
		
	} else if (mode === 'tablet') {
		var graphs = selectedGraphs.tablet || ['chemistry', 'temperature'];
		
		graphs.forEach(function(graphType) {
			if (charts[graphType]) {
				var graphData;
				if (graphType === 'chemistry') {
					graphData = extractChemistryData(data);
				} else if (graphType === 'temperature') {
					graphData = extractTemperatureData(data);
				} else if (graphType === 'equipment') {
					graphData = applyEquipmentOffset(data);
				}
				charts[graphType].updateOptions({file: graphData});
			}
		});
		
	} else if (mode === 'desktop') {
		if (charts.chemistry) {
			charts.chemistry.updateOptions({file: extractChemistryData(data)});
		}
		if (charts.temperature) {
			charts.temperature.updateOptions({file: extractTemperatureData(data)});
		}
		if (charts.equipment) {
			charts.equipment.updateOptions({file: applyEquipmentOffset(data)});
		}
	}
}

// get and load new data to graphs
function getNewData(debut, fin) {
	// Annuler le timer précédent
	if (updateDebounceTimer) {
		clearTimeout(updateDebounceTimer);
	}
	
	// Debounce de 300ms avant de lancer la requête
	updateDebounceTimer = setTimeout(async () => {
		console.log(`getNewData: fetching from ${debut.format("DD-MM-YYYY")} to ${fin.format("DD-MM-YYYY")}`);
		const data = await fetchDataRange(debut, fin);
		chart.updateOptions({file: data});
		CurrStart = debut;
		CurrEnd = fin;
	}, 300);
}

// Fonction appelée après changement de période (daterange picker)
function updateGraphsDateRange(startDate, endDate) {
	console.log("Updating graphs date range: " + startDate.format('DD/MMM/YY') + " to " + endDate.format('DD/MMM/YY'));
	
	Object.keys(charts).forEach(function(key) {
		if (charts[key] && typeof charts[key].updateOptions === 'function') {
			charts[key].updateOptions({
				dateWindow: [startDate.toDate(), endDate.toDate()]
			});
		}
	});
}

// Mettre à jour les données des graphiques existants
function updateGraphsData(data) {
	var mode = currentMode || getGraphMode();
    
	if (graphModeBase(mode) === 'mobile') {
		// Mobile : mettre à jour le graphique de la zone actuellement visible
		var selectedGraph = $('#graph-zone-1').attr('data-graph-type') || 'chemistry';
		
		if (charts[selectedGraph]) {
			var graphData;
			
			if (selectedGraph === 'chemistry') {
				graphData = extractChemistryData(data);
			} else if (selectedGraph === 'temperature') {
				graphData = extractTemperatureData(data);
			} else if (selectedGraph === 'equipment') {
				graphData = applyEquipmentOffset(data);
			}
			
			charts[selectedGraph].updateOptions({file: graphData});
		}
		
	} else if (graphModeBase(mode) === 'tablet') {
		// Tablette : mettre à jour chemistry + temperature
		if (charts.chemistry) {
			charts.chemistry.updateOptions({file: extractChemistryData(data)});
		}
		if (charts.temperature) {
			charts.temperature.updateOptions({file: extractTemperatureData(data)});
		}
		
	} else if (graphModeBase(mode) === 'desktop') {
		// Desktop : mettre à jour les 3 graphiques
		if (charts.chemistry) {
			charts.chemistry.updateOptions({file: extractChemistryData(data)});
		}
		if (charts.temperature) {
			charts.temperature.updateOptions({file: extractTemperatureData(data)});
		}
		if (charts.equipment) {
			charts.equipment.updateOptions({file: applyEquipmentOffset(data)});
		}
	}
}



/*  -----------------------
    --- LOGIQUE DYGRAPH ---
    -----------------------
*/
/** Calcule l'objet options complet pour l'instanciation ou l'update */
function getGraphOptions(type, isNavigator, zoneIndex) {

	let vis;
    if (isNavigator) {
   		vis = [false, false, false, false, false, false, true];		// Il faut 7 éléments ! Navigation est le 7ème (index 6 du tableau de visibilité)
	} else {
		vis = SERIES_MAPPING[type];
		if (!vis) {
            console.warn("Type de graphique non trouvé dans le mapping :", type);
            vis = [true, true, true, true, true, false]; // Affiche tout pour débugger
        }
    }
		
	const seriesConfig = {};
    Object.keys(SENSOR_CONFIG).forEach(key => {
        seriesConfig[key] = {
            color: SENSOR_CONFIG[key].color,
			axis: SENSOR_CONFIG[key].axis || 'y' // Utilise y2 si défini, sinon y
        };
    });
	
	const mapping = SERIES_MAPPING[type] || SERIES_MAPPING["Chimie"];
    
	// Définition des unités pour les titres des axes Y
	const y1Title = "pH / Chlore (mg/L)";
	const y2Title = type === "Chimie" ? "Redox (mV)" : "Température (°C)";

    // 1. Options de base communes
    const commonOptions = {
        labels: ALL_LABELS,
        visibility: vis,
		gridLineColor: '#222',
        axisLineColor: '#FFFFFF', // Axe blanc
        axisLabelColor: '#FFFFFF', // Indices blancs        
        highlightSeriesOpts: {
            strokeWidth: 3,
            highlightCircleSize: 5
        },
		highlightSeriesBackgroundAlpha: 1.0, // Empêche l'assombrissement/changement de fond
    };

    // 2. Configuration spécifique pour le NAVIGATEUR
    if (isNavigator) {
        return {
            ...commonOptions,
            colors: ['#00FBFF'],
            strokeWidth: 1,
            fillGraph: true,
            fillAlpha: 0.3,
            backgroundColor: '#111',
            showRangeSelector: true,
            rangeSelectorHeight: 40,
            rangeSelectorHandleWidth: 15,
            rangeSelectorAlpha: 0.5,
            rangeSelectorHandleColor: '#00FBFF',
            rangeSelectorAddIn: 10,
			showLabelsOnHighlight: false, // Empêche l'affichage des points au survol
        	labelsSeparateLines: false,
        	legend: 'none',               // Désactive totalement la légende
            axes: {
                x: { drawAxis: true, axisLabelFontSize: 10, axisLabelColor: '#eee' },
                y: { drawAxis: false, drawGrid: false }
            },
            margin: { left: 45, right: 15, top: 0, bottom: 5 }
        };
    } 

    // 3. Configuration pour les graphiques de DONNÉES
    return {
        ...commonOptions,
        series: seriesConfig,
        connectSeparatedPoints: true,
		animatedZooms: true,		
        drawPoints: false,
        fillGraph: false,
        fillAlpha: 0.15,
        backgroundColor: '#000',
        strokeWidth: 2,
        margin: { left: 45, right: 15, top: 10, bottom: 15 },
        showRangeSelector: false,
		title: null,
		margin: { left: 50, right: 15, top: 15, bottom: 15 },
		ylabel: y1Title,
        y2label: y2Title,
		labelsDivStyles: { 'textAlign': 'right' },
        yAxisLabelWidth: 60,  // Espace pour le titre à gauche
        y2AxisLabelWidth: 60, // Espace pour le titre à droite		
        axes: {
            x: { drawAxis: true },
			y: { 
				drawAxis: true,		// L'axe ne se dessine que s'il y a des données correspondantes
                valueRange: [0, 14],
                drawGrid: true,
                axisLabelFormatter: function(y) { return y; },		
            	axisLabelColor: '#FFFFFF', // Force le blanc pour les chiffres Y
            	axisLineColor: '#FFFFFF' ,  // Force le blanc pour la ligne de l'axe
			},
			y2: { 
				drawAxis: true,
                independentTicks: true,
                axisLabelFormatter: function(y) { return y; },
                drawGrid: false
            }
		},
		// --- GESTION NATIVE DES LABELS ---
        // On définit la div de destination si ce n'est pas le navigator
        labelsDiv: `status-val-${zoneIndex}`,
        labelsSeparateLines: false,
        legend: 'always', // Affiche toujours la valeur sous le doigt
		legendFormatter: function(data) {
            refreshStaticLegend(this, data);
            return "";
		},		
		highlightCallback: function(event, x, points, row, seriesName) {
		},
		underlayCallback: function(canvas, area, g) {
            drawLimitLines(canvas, area, g);
        },
		
	};
}

/** Gère l'affichage/masquage des courbes et des axes Y/Y2 */
function updateGraphVisibility(zone, source, isInit = false) {
    const g = (zone == 1) ? g1 : (zone == 2) ? g2 : g3;
    if (!g) return;

    let visibilityArray;
	let sensorsToSave = [];

    if (typeof source === "string") {
        // CAS 1 : C'est un nom de groupe (ex: "Chimie")
        const mapping = SERIES_MAPPING[source];
        if (!mapping) return;

        // On ne met 'true' (tracé) que si l'état est "ON"
        visibilityArray = mapping.map(state => state === "ON");

		// On prépare la liste des noms de capteurs ON pour la sauvegarde
        ALL_LABELS.slice(1).forEach((label, i) => {
            if (mapping[i] === "ON") sensorsToSave.push(label);
        });
		
    } else if (Array.isArray(source)) {
        // CAS 2 : C'est un tableau de labels (ex: ["PH", "Redox"])
        // Provient du sélecteur multiple quand l'utilisateur coche manuellement
        visibilityArray = ALL_LABELS.slice(1).map(label => {
            if (label === "Navigation") return false;
            return source.includes(label);
        });
		sensorsToSave = source; // C'est déjà notre liste
	}

    if (visibilityArray) {
		console.log(`[GRAPH] Envoi updateOptions à la Zone ${zone}`);
        g.updateOptions({ visibility: visibilityArray });
        refreshStaticLegend(g);
		
		if (!isInit) {
			console.log(`[PREFS] Sauvegarde manuelle Zone ${zone}`);
            saveZonePrefs(zone, sensorsToSave);	// --- SAUVEGARDE DES PRÉFÉRENCES ---
        }
	}
}

/** Génère le code HTML de la légende statique sous le graphique */
function refreshStaticLegend(g, data) {
    if (!g || !g.maindiv_) return;

    const container = g.maindiv_;
    let frame = container.querySelector('.static-legend-frame');
    
    if (!frame) {
        frame = document.createElement('div');
        frame.className = 'static-legend-frame';
        container.style.position = "relative"; 
        container.appendChild(frame);
    }

    // Si data existe, on est en train de survoler
    const isHovering = (data && data.x !== undefined);
    
    const labels = g.getLabels();
    const visibility = g.visibility();

    if (!labels || !visibility) return;

    let html = "";
    // On commence à i=1 pour ignorer "Time"
    for (let i = 1; i < labels.length; i++) {
        const labelName = labels[i];
        
        // On vérifie la visibilité (index i-1 car visibility ne contient pas Time)
        if (visibility[i-1] && labelName !== "Navigation") {
            
            // SOLUTION : On récupère la couleur définie dans SENSOR_CONFIG
            // Si le label n'existe pas dans la config, on met du blanc par défaut
            const sensorCfg = SENSOR_CONFIG[labelName];
            const color = sensorCfg ? sensorCfg.color : "#FFFFFF";
            
// RÉCUPÉRATION DE LA VALEUR
            let valueStr = "";
            if (isHovering) {
                const config = SENSOR_CONFIG[labelName] || { color: "#FFF", label: labelName, unit: "" };
                // On cherche la série correspondante dans les données de survol
                const series = data.series.find(s => s.label === labelName);
                if (series && series.y !== undefined && series.y !== null) {
                    // On formate la valeur (ex: 2 décimales)
                    valueStr = `<span class="legend-value" style="color:${color} !important;">: ${series.yHTML}${config.unit}</span>`;
                } else {
                    valueStr = `<span class="legend-value">: --</span>`;
                }
            }
			    

            html += `<div class="legend-row">
                        <span class="legend-label">${labelName}</span>
                        <div class="legend-dot" style="background-color:${color} !important;"></div>
                        ${valueStr}
                     </div>`;
        }
    }
    frame.innerHTML = html;
}

/** Redessine tous les graphiques (utile après un resize) */
function updateGraphs() {
    // Verrou de sécurité
    if (isInteracting) return;

    const layout = determineLayout();
    
    // 1. On coupe la synchro avant de toucher au DOM
    if (syncHandler) { 
        try { syncHandler.detach(); } catch(e) {} 
        syncHandler = null; 
    }

	
    // 2. Gestion des graphes de DONNÉES (1, 2, 3)
	const normalizedData = getNormalizedData(); // Préparez les données une fois
	
    for (let i = 1; i <= 3; i++) {
        const $zone = $(`#graph-zone-${i}`);
        const container = document.getElementById(`graph-canvas-${i}`);
        
        if (i <= layout.count && container) {
            $zone.show().css('display', 'flex');
            const type = $zone.find('select.zone-graph-selector').val();
            const options = getGraphOptions(type, false, i);
            
            let gObj = (i === 1 ? g1 : (i === 2 ? g2 : g3));

            if (!gObj) {
                // Création
                if (gNav) options.dateWindow = gNav.xAxisRange(); // On s'aligne sur le maître
                gObj = new Dygraph(container, normalizedData, options);
                if (i === 1) g1 = gObj; else if (i === 2) g2 = gObj; else g3 = gObj;
				console.log("Graphique créé, tentative de légende...");
				refreshStaticLegend(gObj);
			} else {
                // Update
                delete options.dateWindow; // On ne force pas le zoom ici
                gObj.updateOptions({ file: normalizedData, ...options });
            }
            activeGraphs.push(gObj);
        } else {
            $zone.hide();
        }
    }

    // 3. Gestion du NAVIGATOR (Maître)
    const navContainer = document.getElementById('graph-canvas-nav');
    if (navContainer) {
        const navOptions = getGraphOptions(null, true);
        if (!gNav) {
            gNav = new Dygraph(navContainer, globalData, navOptions);
        } else {
            gNav.updateOptions(navOptions);
        }
        activeGraphs.push(gNav);
    }

    // 4. Synchronisation : Tout le monde écoute le maître
    if (activeGraphs.length >= 2) {
        window.requestAnimationFrame(() => {
            syncHandler = Dygraph.synchronize(activeGraphs, {
                selection: true, // Barre verticale partagée
                zoom: true,      // Zoom partagé
                range: false     // IMPORTANT: range:false car seul gNav a un slider
            });
        });
    }
}

/** Trace les lignes min max sur les courbes */
function drawLimitLines(canvas, area, g) {
    const labels = g.getLabels();
    const visibility = g.visibility();

    for (let i = 1; i < labels.length; i++) {
        const label = labels[i];
        const config = SENSOR_CONFIG[label];

        // On vérifie si la série est visible et si elle a des limites configurées
        if (visibility[i - 1] && config && (config.min !== undefined || config.max !== undefined)) {
            canvas.save();
            canvas.beginPath();
            
// --- NOUVEAU RÉGLAGE ÉQUILIBRÉ ---
            canvas.setLineDash([8, 4]);    // Tirets un peu plus courts
            canvas.lineWidth = 1.5;        // Plus fin que 2.5, mais plus que l'original
            canvas.strokeStyle = config.color;
            canvas.globalAlpha = 0.8;      // Légère transparence pour laisser respirer la courbe            // --------------------------------------

            // Détection de l'axe (0 = gauche, 1 = droite)
            const axisNum = config.axis === 'y2' ? 1 : 0;
            
            // Dessin de la ligne Max
            if (config.max !== undefined) {
                // La conversion vers les coordonnées du canvas gère automatiquement l'échelle de l'axe choisi
                const y = g.toDomYCoord(config.max, axisNum);
                // On ne dessine que si la ligne est dans la zone visible du graphique
                if (y >= area.y && y <= area.y + area.h) {
                    canvas.moveTo(area.x, y); canvas.lineTo(area.x + area.w, y);
                }
            }
            
            // Dessin de la ligne Min
            if (config.min !== undefined) {
                const y = g.toDomYCoord(config.min, axisNum);
                if (y >= area.y && y <= area.y + area.h) {
                    canvas.moveTo(area.x, y); canvas.lineTo(area.x + area.w, y);
                }
            }
            
            canvas.stroke();
            canvas.restore();
        }
    }
}


/*  ----------------------------------
    --- LOGIQUE INTERFACE & LAYOUT ---
    ----------------------------------
*/

// Cette fonction reconstruit le contenu du sélecteur d'axes
function updateAxesSelectorsVisual(zone, groupName) {
    const mapping = SERIES_MAPPING[groupName];
    if (!mapping) return;

    const $select = $(`#axesSelector${zone}`);
    
    // 1. Calculer les labels par défaut (ceux qui sont "ON")
    const defaultLabels = [];
    ALL_LABELS.slice(1).forEach((label, i) => {
        if (mapping[i] === "ON") defaultLabels.push(label);
    });

    // 2. Récupérer les préférences sauvegardées
    const savedLabels = getZonePrefs(zone, defaultLabels);

    let labelsToSelect = [];

    // 3. Filtrer les options
    $select.find('option').each(function() {
        const label = $(this).val();
        if (!label) return;

        const indexInLabels = ALL_LABELS.indexOf(label);
        if (indexInLabels > 0) {
            const state = mapping[indexInLabels - 1];

            if (state === "HIDDEN") {
                // MODIFICATION ICI : On désactive l'option pour que JQM ne l'affiche pas dans son menu
                $(this).prop('disabled', true).prop('selected', false).hide();
            } else {
                // On réactive les options qui ne sont plus HIDDEN
                $(this).prop('disabled', false).show();

                // On sélectionne si présent dans les préférences
                if (savedLabels.includes(label)) {
                    labelsToSelect.push(label);
                }
            }
        }
    });

    // 4. Appliquer à l'UI et FORCER le rafraîchissement du widget JQM
    // Le selectmenu("refresh") va reconstruire la liste en ignorant les options "disabled"
    $select.val(labelsToSelect).selectmenu("refresh", true);
    
    // 5. Appliquer au graphique
    updateGraphVisibility(zone, labelsToSelect, true);
}

/** Calcule et applique les hauteurs CSS pour le plein écran */
function applyChartHeights() {
    const headerH = $('#graphHeader').outerHeight() || 40;
    const periodH = $('#periodControlBox').outerHeight() || 0;
    const navH = $('#navZone').outerHeight() || 65; // Hauteur fixe pour le Navigator (wrapper + marges)
	const margin = 0; // Marges et paddings cumulés
	
	
    const availableDataH = window.innerHeight - headerH - navH - periodH - margin;	// On calcule la hauteur disponible pour les graphiques Y1, Y2, Y3
    console.log("Window:",window.innerHeight, "headerH:",headerH,", periodH:", periodH, ", Nav:", navH, ", availableDataH:",availableDataH)
    // 1. On force la hauteur pour les graphiques de données uniquement
    $('.dashboard-card').css({
        'height': (window.innerHeight - headerH - periodH - 5) + 'px',	//'height': Math.max(availableH, 200) + 'px',
        'width': '100%' 
    });

    const layout = determineLayout();
    
    // 2. Logique de wrapper pour la zone de données
    $('.charts-wrapper').css({
        'flex-direction': layout.orientation,
        'width': '100%',
        'height': availableDataH + 'px',
        'box-sizing': 'border-box'
    });
	
	// 3. On s'assure que le Navigator occupe bien sa place fixe
    $('#navZone').css({
        'height': '25px',
        'width': '100%'
    });

    // 4. Ton loop de visibilité (y1, y2, y3) est conservé
    for (let i = 1; i <= 3; i++) {
        const $zone = $(`#graph-zone-${i}`);
		// Si c'est la zone 1, on FORCE l'affichage quoi qu'il arrive
	    // Si c'est 2 ou 3, on suit le layout.count
	    if (i === 1 || i <= layout.count) {
	        $zone.prop('style', 'display: flex !important'); // Écrase tout inline style existant
	        $zone.css('height', layout.height + 'px');
	    } else {
	        $zone.hide();
	    }
    }
}

/* Afficher la periode dans le bon formet */
function updatePeriodDisplay() {
    const period = $("#periodSelector1").val();
    const range = getPeriodDates(period); // Votre fonction de calcul de timestamps
    
    // Formatage JJ/MM/YY HH:MM
    const format = (ts) => {
        const d = new Date(ts * 1000);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear().toString().slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const text = format(range.start) + " ➜ " + format(range.end);
    
    // Mise à jour de la textbox
    $("#dateDisplayRange").text(text);
    
    if (debug) console.log("[PERIOD] Update UI:", text);

    // Lancement du fetch avec les dates calculées
 //   fetchGraphData(range.start, range.end);
}
/* traduire tes 9 options du selecteur de periode en dates réelles */
function getPeriodDates(periodValue) {
    let start = new Date();
    let end = new Date();
    let now = new Date();

    switch(periodValue) {
        case 'today':
            start.setHours(0,0,0,0); break;
        case 'yesterday':
            start.setDate(now.getDate() - 1); start.setHours(0,0,0,0);
            end.setDate(now.getDate() - 1); end.setHours(23,59,59,999); break;
        case 'last3d':
            start.setDate(now.getDate() - 3); break;
        case 'last7d':
            start.setDate(now.getDate() - 7); break;
        case 'lastWeek': // Lundi à Dimanche dernier
            let dayLW = now.getDay() || 7;
            start.setDate(now.getDate() - dayLW - 6); start.setHours(0,0,0,0);
            end.setDate(now.getDate() - dayLW); end.setHours(23,59,59,999); break;
        case 'thisWeek': // Lundi à aujourd'hui
            let dayTW = now.getDay() || 7;
            start.setDate(now.getDate() - dayTW + 1); start.setHours(0,0,0,0); break;
        case 'last30d':
            start.setDate(now.getDate() - 30); break;
        case 'lastMonth':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
        case 'thisMonth':
            start = new Date(now.getFullYear(), now.getMonth(), 1); start.setHours(0,0,0,0); break;
    }
//     return { start: start.getTime(), end: end.getTime() };

    return { start: Math.floor(start.getTime()/1000), end: Math.floor(end.getTime()/1000) };
}


/*  ---------------  
    --- EXPORTS ---
    ---------------
*/

// pour exporter l'image d'un graphe
function exportGraphPNG(zoneIndex) {
    // On cible toute la zone (qui contient le header, les axes et le graph)
    const element = document.getElementById(`graph-zone-${zoneIndex}`);
    
    if (!element) return;

    // html2canvas prend une "photo" de l'élément HTML complet
    html2canvas(element, {
        backgroundColor: "#1a1a1a", // Force le fond sombre de votre dashboard
        scale: 2, // Augmente la qualité de l'image (Retina)
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Transformation en lien de téléchargement
        const link = document.createElement('a');
        const date = new Date().getTime();
        link.download = `dashboard_piscine_z${zoneIndex}_${date}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

// Pour exporter les données d'un graphe en csv. 
function exportGraphCSV(zoneIndex) {
    const g = activeGraphs[zoneIndex - 1];
    if (!g) {
        console.error("Graphique non trouvé pour l'index corrigé :", zoneIndex - 1);
        return;
    }

    try {
        let csvContent = "";
        const allLabels = g.getLabels(); // [Date, PH, CL, TempAir, ...]
        const visibility = g.visibility(); // [true, false, true, ...]
        
        // 1. Filtrer les en-têtes (La date à l'index 0 est toujours visible)
        let activeLabels = [allLabels[0]];
        for (let i = 0; i < visibility.length; i++) {
            if (visibility[i]) {
                activeLabels.push(allLabels[i + 1]); 
            }
        }
        csvContent += activeLabels.join(",") + "\n";

        // 2. Filtrer les données ligne par ligne
        const rowCount = g.numRows();
        for (let i = 0; i < rowCount; i++) {
            let rowData = [];
            
            // Toujours ajouter la date (colonne 0)
            let d = new Date(g.getValue(i, 0));
            rowData.push(d.toISOString());

            // Ajouter uniquement les colonnes visibles
            for (let j = 0; j < visibility.length; j++) {
                if (visibility[j]) {
                    let val = g.getValue(i, j + 1);
                    rowData.push(val === null ? "" : val);
                }
            }
            csvContent += rowData.join(",") + "\n";
        }

        // 3. Procédure de téléchargement (identique à la précédente)
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export_filtre_zone${zoneIndex}.csv`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (err) {
        console.error("Erreur export CSV filtré:", err);
    }
}


/*  ------------------  
    --- ÉVÉNEMENTS ---
    ------------------
*/

// A. Verrouillage (On garde la sécurité pour les mobiles lents)
	$(document).on('pointerdown', '.dygraph-rangesel-fgcanvas, .dygraph-rangesel-zoomhandle', function() {
	    isInteracting = true;
	    if (interactionTimeout) clearTimeout(interactionTimeout);
	});

	$(document).on('pointerup pointercancel', function() {
	    interactionTimeout = setTimeout(() => { isInteracting = false; }, 150); 
	});

// B. Changements utilisateur
	// quand on clique sur le titre
	$(document).on('click', '.graph-title-button', function(e) {
	    e.preventDefault();
	    const zone = $(this).data('zone');
	    const $select = $(`#graphSelector${zone}`);
    
	    if ($select.length) {
	        $select.selectmenu('open'); // Ouvre le menu JQM
	    } else {
	        console.error("Sélecteur introuvable pour la zone " + zone);
	    }
	});

	// A. Quand on change de graphe (ex: de Chimie à Températures)
	$(document).on('change', '.zone-graph-selector', function() {
		const zone = $(this).data('zone');
    	const type = $(this).val();
    
	    // 1. On met à jour les graphes et les cases cochées du sélecteur d'axes
	    updateGraphVisibility(zone, type);
    	// Si vous avez besoin de reconstruire pour d'autres raisons :
    	// updateGraphs();
		
	});
	
	// quand on selectionne de axes 
	$(document).on('change', '.axes-multi-selector', function() {
		const zone = $(this).data('zone');
    	const type = $(this).val();
    
	    // 1. On met à jour les graphes et les cases cochées du sélecteur d'axes
	    updateGraphVisibility(zone, type);
		
	});
	
	// choix du type d'export
	$(document).on("change", ".export-selector", function() {
	    // Force la conversion en nombre pour éviter les erreurs de type "1" vs 1
	    const zoneIndex = parseInt($(this).data("zone"), 10); 
	    const mode = $(this).val();
	
	    if (!mode) return;
	
	    // Log de debug pour vérifier qui appelle quoi
	    console.log("Zone détectée :", zoneIndex, "Mode :", mode);
	    console.log("Graphique visé :", activeGraphs[zoneIndex]);
	
	    if (mode === "png") {
	        exportGraphPNG(zoneIndex); 
	    } else if (mode === "csv") {
	        exportGraphCSV(zoneIndex);
	    }
	
	    $(this).val("").selectmenu("refresh");
	});

    // Détection du changement de période
    $(document).on("change", "#periodSelector1", function() {
        updatePeriodDisplay();
        var period = $(this).val();
        if (debug) console.log("[PERIOD] Nouvelle période sélectionnée :", period);

        // 1. On calcule les dates start/end
        var range = getPeriodDates(period);

        // 2. On met à jour tes variables globales de requête (si tu en as)
        // ou on passe directement les dates à la fonction fetch
//        fetchGraphData(range.start, range.end);
    });

    $(document).on("click", "#btnRefreshGraph", function(e) {
        e.preventDefault();
        updatePeriodDisplay();
    });


// --------------------------------  global init ---------------------------------------------------
	$(document).on("mobileinit", function (event, ui) {
		$.mobile.defaultPageTransition = "slidefade";
		$.mobile.dialog.prototype.options.closeBtnText = "Retour";
		$.mobile.loader.prototype.options.theme = "b";
		$.mobile.eventLogger({deprecated:!0,showAlert:!0,events:{page:!0,navigation:!0},widgets:{page:!0,pagecontainer:!0}});
	});

	// Layout / Orientation Change
	$(window).on('resize orientationchange', function() {
        currentLayout = getGraphMode();
        adaptJQueryMobileGrids();
        adaptPanels();
        if ($('#pagePiscineGraphs').hasClass('ui-page-active')) { 
            applyChartHeights();
            updateGraphs();
            // Force resize final
            setTimeout(() => {
                if (g1) g1.resize(); 
                if (g2) g2.resize(); 
                if (g3) g3.resize();
                if (gNav) gNav.resize();
            }, 100);
        }
	});


	// Event handler for left panel opening
	$(document).on("panelbeforeopen", "#leftpanel", function(event, ui) {
		console.log("[DEBUG] panelbeforeopen - leftpanel triggered, userMenu=", userMenu);
		if(!userMenu){
			console.log("[DEBUG] calling setUserUI from panelbeforeopen");
			setUserUI();
			userMenu = true;
		}
	});

	// Event handler for Options button - open panel of active page
	$(document).on("vclick", "a[href='#optionsPiscineManager']", function(event) {
		event.preventDefault();
		event.stopPropagation();
		
		console.log("[DEBUG] Options button vclick!");
		
		// Find panel in the button's parent page
		var currentPage = $(this).closest("[data-role='page']");
		var pageId = currentPage.attr("id");
		console.log("[DEBUG] Current page ID:", pageId);
		
		// Select panel within this specific page (use .find() instead of .children())
		var activePanel = currentPage.find("#optionsPiscineManager");
		console.log("[DEBUG] Panel found:", activePanel.length);
		
		if (activePanel.length) {
			console.log("[DEBUG] Opening panel on page:", pageId);
			activePanel.panel('open');
		} else {
			console.warn("[WARN] No panel found on page:", pageId);
		}
		
		return false;
	});

	
// -------------- pages create inits (once for all ... )  ------------

	// page PiscineGraphs create inits
    $(document).delegate("#pagePiscineGraphs","pagebeforecreate", function() {
		console.log("PageShow: updating chart data");
	       // 1. Affiche le spinner JQM
	    $.mobile.loading('show', {
	        text: "Fetch des Données pour les graphiques...",
	        textVisible: true,
	        theme: "b" // Thème sombre
	    });
			
		// 2. On laisse un peu de temps au spinner pour s'afficher avant de bloquer le thread avec initCharts
	    setTimeout(function() {
	        try {
//                getOriginData();
                
	        } finally {
	            // 3. Cache le spinner quoi qu'il arrive
	            $.mobile.loading('hide');
	        }
	    }, 200);
	});

	// page PiscineGraphs pageShow
	$(document).on("pageshow","#pagePiscineGraphs",function(){
	    $.mobile.loading('show', {
	        text: "Initialisation des graphiques...",
	        textVisible: true,
	        theme: "b" // Thème sombre
	    });
        // 1. Forcer le sélecteur sur "7 jours" à l'init
        $("#periodSelector1").val("last7d").selectmenu("refresh");

        // 2. Calculer les dates et mettre à jour la textbox + fetch
        updatePeriodDisplay();
        
		// 3. On laisse un peu de temps au spinner pour s'afficher avant de bloquer le thread avec initCharts
	    setTimeout(function() {
	        try {
	            initCharts();
	        } finally {
	            // 3. Cache le spinner quoi qu'il arrive
	            $.mobile.loading('hide');
	        }
	    }, 200);
	});

/*  //Appeler adaptJQueryMobileGrids / adaptPanels lors des transitions de page pertinentes
	$(document).on('pagebeforeshow', '#pagePiscineParametres, #pagePiscineMaintenance, #pagePiscinePrincipale, #pagePiscineGraphs', function() {
		// Lire le variant précis pour diagnostics (getGraphMode met à jour currentLayout)
		var detectedVariant = getGraphMode();
		if (debug) console.log('[RESPONSIVE] pagebeforeshow for', this.id, 'variant=', detectedVariant, 'currentLayout=', currentLayout);
		try { adaptJQueryMobileGrids(); } catch(e) { if (debug) console.warn('[RESPONSIVE] adaptJQueryMobileGrids failed on pagebeforeshow', e); }
		try { adaptPanels(); } catch(e) { if (debug) console.warn('[RESPONSIVE] adaptPanels failed on pagebeforeshow', e); }

		// Si on va afficher la page des graphs, ajuster hauteurs et normaliser canvases
		if (this.id === 'pagePiscineGraphs') {
			try { setGraphContainerHeight(); } catch(e) { if (debug) console.warn('[GRAPH-DIAG] setGraphContainerHeight failed on pagebeforeshow', e); }
			try { normalizeAllCanvases(); } catch(e) { if (debug) console.warn('[GRAPH-DIAG] normalizeAllCanvases failed on pagebeforeshow', e); }
		}
	});
*/
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

// -------------- pages refresh inits (resets etc ... )  ------------

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


// ========================================
// RESPONSIVE LAYOUT DETECTION
// ========================================

function getGraphMode() {
    var mqDesktopLandscape = window.matchMedia('(min-width: 1101px) and (orientation: landscape)');
    var mqDesktopPortrait = window.matchMedia('(min-height: 1101px) and (orientation: portrait)');
    var mqTabletPortrait = window.matchMedia('(min-width: 701px) and (max-width: 1100px) and (max-height: 1100px) and (orientation: portrait)');
    var mqTabletLandscape = window.matchMedia('(min-width: 701px) and (max-width: 1100px) and (max-height: 1100px) and (orientation: landscape)');
    var mqMobilePortrait = window.matchMedia('(max-width: 700px) and (orientation: portrait)');
    var mqMobileLandscape = window.matchMedia('(max-height: 700px) and (orientation: landscape)');

    if (mqDesktopLandscape.matches) return 'desktop-landscape';
    if (mqDesktopPortrait.matches)  return 'desktop-portrait';
    if (mqTabletLandscape.matches)  return 'tablet-landscape';
    if (mqTabletPortrait.matches)   return 'tablet-portrait';
    if (mqMobileLandscape.matches)  return 'mobile-landscape';
    if (mqMobilePortrait.matches)   return 'mobile-portrait';

    // Fallback
    // Breakpoints standards : 768px (iPad Mini/Mobile) et 1100px (iPad Pro/Laptop)
	console.log("FailBack dans la detection des media")
    if (width < 768) return isLandscape ? 'mobile-landscape' : 'mobile-portrait';
    if (width < 1100) return isLandscape ? 'tablet-landscape' : 'tablet-portrait';
    return isLandscape ? 'desktop-landscape' : 'desktop-portrait';
}

// Adaptation dynamique des grids jQuery Mobile
function adaptJQueryMobileGrids() {
	try {
		if (debug) console.log('[RESPONSIVE] adaptJQueryMobileGrids currentLayout=', currentLayout);

		// Pages à adapter (ne traiter que si présentes dans le DOM)
		var pagesToAdapt = ['#pagePiscineParametres', '#pagePiscineMaintenance'];

		pagesToAdapt.forEach(function(pageId) {
			if (!$(pageId) || $(pageId).length === 0) {
				// Page pas présente dans le DOM — ignorer silencieusement
				return;
			}

			var selB = pageId + ' .ui-grid-b';
			var selA_rev = pageId + ' .ui-grid-a';

			if (currentLayout === 'desktop' || currentLayout === 'tablet-landscape') {
				// Convertir ui-grid-b (33-33-33) en ui-grid-a (50-50)
				var $el = $(selB);
				if ($el && $el.length) {
					$el.removeClass('ui-grid-b').addClass('ui-grid-a');
					if (debug) console.log('[RESPONSIVE] adaptJQueryMobileGrids: converted', selB);
				}
			} else {
				// Restaurer grids originales (si présents)
				var $elRev = $(selA_rev);
				if ($elRev && $elRev.length) {
					$elRev.removeClass('ui-grid-a').addClass('ui-grid-b');
					if (debug) console.log('[RESPONSIVE] adaptJQueryMobileGrids: reverted', selA_rev);
				}
			}
		});

		// Adapter les panels selon le layout
		try { adaptPanels(); } catch(e) { if (debug) console.warn('[RESPONSIVE] adaptPanels failed', e); }
	} catch (e) {
		if (debug) console.error('[RESPONSIVE] adaptJQueryMobileGrids failed', e);
	}
}

// Optimisation des panels pour desktop
function adaptPanels() {
  var $panels = $('[data-role="panel"]');
  
  if (currentLayout === 'desktop') {
    // Desktop : panels en mode reveal persistant (non-overlay)
    $panels.panel({
      display: 'reveal',
      dismissible: true,
      swipeClose: false
    });
    
    if (debug) {
      console.log('[RESPONSIVE] Panels mode reveal (desktop)');
    }
  } else {
    // Mobile/Tablette : panels en mode overlay
    $panels.panel({
      display: 'overlay',
      dismissible: true,
      swipeClose: true
    });
    
    if (debug) {
      console.log('[RESPONSIVE] Panels mode overlay (mobile/tablette)');
    }
  }
  
  // Redimensionner Dygraph si page Graphs active
  //resizeDygraphIfNeeded();
}


// ---------------------------------------- Ok ready ! ----------------------------------
currentLayout = getGraphMode();
$('body').attr('data-layout', currentLayout);
setUserUI();
console.log( "ready to go !" );
// navigate to a page : $.mobile.navigate(#pageid); (keep history) or $.mobile.changePage( "#pageID", { transition: "slideup"});
$.mobile.changePage("#pagePiscineGraphs", {transition: "fade"});

