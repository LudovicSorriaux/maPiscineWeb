
// Global functions and variables
console.log("📌 piscineScripts.js VERSION 2026-02-26-22:20 loaded");

// NOTE: CSS for the axes pulse indicator and close button is now placed in piscineGraphs.css

var debug = true;
var statusErrorMap = {
	'400' : "Server understood the request, but request content was invalid.",
	'401' : "Unauthorized access.",
	'403' : "Forbidden resource can't be accessed.",
	// PiscineDebug removed: debug SSE and related handlers disabled in this build
	};

// Encapsulation d'un graphe — class re-inserted after refactor
class GraphInstance {
	constructor(zoneIndex, type, data, mapping, config, displayed, y1Title, y2Title) {
		this.y1Title = y1Title;
		this.y2Title = y2Title;
		this.zoneIndex = zoneIndex;
		this.type = type;
		this.data = data;
		this.mapping = mapping;
		this.config = config;
		this.displayed = displayed;
		this.axesSelected = Array.isArray(displayed) ? [...displayed] : (displayed ? [displayed] : []);
		this.dygraph = null;
	}

	getData() {
		return this.data;
	}

	createDygraph(container, options, displayZone) {
		// Retourne une promesse résolue après création effective du Dygraph
		return new Promise(resolve => {
			if (!container) {
				console.warn(`[Dygraph] Container DOM manquant pour ${this.type} (zone ${displayZone || 'unknown'}), Dygraph non créé.`);
				resolve(null);
				return;
			}
			const create = () => {
				const rect = container.getBoundingClientRect();
				console.debug && console.debug(`[Dygraph] Création sur ${container.id} (zone ${displayZone||'?'} ) : ${rect.width}x${rect.height}`);
				this.dygraph = new Dygraph(container, this.data, options);
				resolve(this.dygraph);
			};
			if (window.requestAnimationFrame) {
				requestAnimationFrame(() => {
					requestAnimationFrame(create); // Double frame pour garantir le layout
				});
			} else {
				setTimeout(create, 20);
			}
		});
	}

	updateData(globalData) {
		this.data = this.extractData(globalData);
		if (this.dygraph) this.dygraph.updateOptions({ file: this.data });
	}

	updateVisibility(labels) {
		// labels: tableau de capteurs à afficher
		this.visibility = ALL_LABELS.slice(1).map(label => labels.includes(label));
		if (this.dygraph) this.dygraph.updateOptions({ visibility: this.visibility });
		this.prefs = labels;
	}

	updateAxesVisibility() {
		// Centralise la logique d'affichage des axes Y / Y2 selon les séries visibles
		// Skip if explicitly marked not-ready
		if (this.ready === false) return;
		if (!this.dygraph) return;
		try {
			const g = this.dygraph;
			// Defensive guards: ensure dygraph is ready and DOM attached
			if (!g || typeof g.getOption !== 'function' || typeof g.updateOptions !== 'function') return;
			if (!g.maindiv_ || !g.maindiv_.parentNode) return;
			const labels = g.getLabels ? g.getLabels() : [];
			const visibility = (typeof g.visibility === 'function') ? g.visibility() : [];
			const seriesOpts = (g.getOption && g.getOption('series')) ? g.getOption('series') : {};
			let needY = false;
			let needY2 = false;
			for (let i = 1; i < labels.length; i++) {
				if (!visibility || !visibility[i-1]) continue;
				const lbl = labels[i];
				const axis = (seriesOpts[lbl] && seriesOpts[lbl].axis) || 'y';
				if (axis === 'y2') needY2 = true; else needY = true;
			}
			if (!this.__lastAxes || this.__lastAxes.y !== needY || this.__lastAxes.y2 !== needY2) {
				// Mémoriser l'état et appliquer l'update de façon asynchrone
				this.__lastAxes = { y: needY, y2: needY2 };
				if (!this.__updatingAxes) {
					this.__updatingAxes = true;
					try {
						requestAnimationFrame(() => {
							try {
								// Ensure dygraph DOM still present before updating to avoid internal null refs
								if (g && g.maindiv_ && g.maindiv_.parentNode) {
									try {
										g.updateOptions({ axes: { y: { drawAxis: needY }, y2: { drawAxis: needY2 } } });
									} catch (err) {
										// Suppress noisy Dygraph internal errors here
										console.warn('[Diag] updateAxesVisibility suppressed dygraph error', err);
									}
								} else {
									console.debug && console.debug('[Diag] updateAxesVisibility skipped - dygraph DOM missing');
								}
							} catch (e) { /* ignore */ }
							this.__updatingAxes = false;
						});
					} catch (e) {
						this.__updatingAxes = false;
					}
				}
			}
		} catch (e) {
			// ignore errors
		}
	}
}

// NOTE: closing is handled via jQuery Mobile popup close button; custom close button removed.

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
const ALL_LABELS = [
  "Date", "TempEau", "TempAir", "TempPAC", "TempInt", "PHVal", "RedoxVal", "CLVal", "PompePH", "PompeCL", "PompeALG", "PP", "PAC", "Auto", "Navigation"
];
// --- Mappings et configs statiques pour chaque graphe ---

/** Construire le menu utilisateur dans le panneau gauche */
function setUserUI(){
		try{
				console.debug && console.debug("[DEBUG] In setUserUI - START");
				let theHtml = '';
				theHtml += '<div data-role="collapsible" data-collapsed-icon="plus" data-expanded-icon="minus" data-iconpos="right" data-theme="b" data-content-theme="b">';
				theHtml += '  <h3 class="myh3">Piscine</h3>';
				theHtml += '  <ul data-role="listview" data-inset="true">';
				theHtml += '    <li><a href="#pagePiscinePrincipale" data-transition="slide"><h4 class="myh4">Piscine</h4></a></li>';
				theHtml += '    <li><a href="#pagePiscineParametres" data-transition="slide"><h4 class="myh4">Piscine Parametres</h4></a></li>';
				theHtml += '    <li><a href="#pagePiscineMaintenance" data-transition="slide"><h4 class="myh4">Piscine Maintenance</h4></a></li>';
				theHtml += '    <li><a href="#pagePiscineGraphs" data-transition="slide"><h4 class="myh4">Piscine Graphs</h4></a></li>';
				theHtml += '  </ul>';
				theHtml += '</div>';
				$('#leftpanelMenu').html(theHtml);
				$('#leftpanelMenu').enhanceWithin();
				console.debug && console.debug("[DEBUG] setUserUI - COMPLETE");
		}catch(e){console.warn('[setUserUI] error',e);}
}

const MAPPINGS = {
	chimie:     ["PHVal", "RedoxVal", "PompePH", "PompeCL", "PompeALG"],
	temperature:["TempEau", "TempAir", "TempPAC", "TempInt", "PAC", "PP", "PHVal"],
	equipment:  ["PP", "PAC", "PompePH", "PompeCL", "Auto", "PompeALG", "TempPAC", "TempEau", "PHVal"]
};
const DISPLAYED = {
	chimie:     ["PHVal", "RedoxVal"],
	temperature:["TempEau", "TempAir", "TempPAC", "TempInt"],
	equipment:  ["PP", "PAC", "PompePH", "PompeCL"]
};
const SENSOR_CONFIG = {
    "TempEau":  { label: "T° Eau",   unit: "°C",   color: PALETTE.GREEN_EMERALD, min: 25,  max: 29,  axis: 'y2'},
    "TempAir":  { label: "T° Air",   unit: "°C",   color: PALETTE.GREEN_MINT,                     axis: 'y2'}, 
    "TempPAC":  { label: "T° PAC",   unit: "°C",   color: PALETTE.GREEN_LIME,                     axis: 'y2'}, 
    "TempInt":  { label: "T° Int",   unit: "°C",   color: PALETTE.GREEN_SEA,                     axis: 'y2'}, 
    "PHVal":    { label: "pH",       unit: "pH",   color: PALETTE.RED_CORAL, min: 7.2, max: 7.6 },
    "RedoxVal": { label: "Redox",    unit: "mV",   color: PALETTE.CYAN_ELECTRIC, min: 650, max: 750, axis: 'y2'}, // Valeurs réelles
    "CLVal":    { label: "Chlore",   unit: "mg/l", color: PALETTE.PURPLE_ROYAL, min: 1.0, max: 2.0 },
    "PompePH":  { label: "Pompe PH", unit: "", color: PALETTE.BLUE_INDIGO },
    "PompeCL":  { label: "Pompe CL", unit: "", color: PALETTE.BLUE_SKY },
    "PompeALG": { label: "Pompe ALG", unit: "", color: PALETTE.BLUE_DEEP },
    "PP":       { label: "Pompe Piscine", unit: "", color: PALETTE.BLUE_AZURE},
    "PAC":      { label: "PAC", unit: "", color: PALETTE.ORANGE_SOFT},
	"Auto":     { label: "Auto", unit: "", color: PALETTE.ORANGE_NEON},
    "Navigation": { label: "Nav",    unit: "",     color: PALETTE.SILVER }
};


let syncHandler = null;
let isInteracting = false;      
let interactionTimeout = null; 

var chartdata=[];
var dataOrigin=[];
var dataCache = new Map();
// Mapping zoneIndex -> { type, dygraph, template, axesSelected }
window.displayedGraphs = {};


/*  ------------------------
    --- DETERMINE LAYOUT ---
    ------------------------
*/

function determineLayout() {
	const mode = getGraphMode();
	console.debug && console.debug("mode est : "+mode)
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
	console.debug && console.debug(isLandscape ? 'orientation:row' : 'orientation:column')
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
// Génération des données pour le navigateur
function generateNavigatorData(start, end, options = {}) {
  const debug = options.debug || false;
  const intervalMinutes = options.intervalMinutes || 1;
  const rows = [];
  const n = Math.floor((end - start) / (intervalMinutes * 60000));
	if (debug) console.debug(`[dataGen] Génération de ${n} points de ${new Date(start).toLocaleString()} à ${new Date(end).toLocaleString()}`);

  // Valeurs initiales réalistes
  let navigation = 0;

	for (let i = 0; i < n; i++) {
		const t = new Date(start + i * intervalMinutes * 60000);
		// Simulations réalistes
		navigation = Math.sin(i / 50) * 50;
		rows.push([
			t,
			parseFloat(navigation.toFixed(2))
		]);
	}
	return rows;
}

async function initData() {
	// 1. Générer les données simulées (ou les charger depuis le serveur)
	await getOriginData();	// ← Cette fonction remplit dataOrigin et normalise dans chartdata
	// 2. Initialiser les graphiques avec les données normalisées
	window.graphInstances = [];
		["chimie", "temperature", "equipment", "navigator"].forEach((type, idx) => {
			if(idx < 3){
				const mapping = MAPPINGS[type];
				let displayed = DISPLAYED[type];
				const config = extractConfig(type, mapping);
				const data = extractColumns(mapping);
				if(type === "temperature"){
					y1Title = "Température (°C)";
					y2Title = "Pompes / PAC (ON/OFF)";
				} else if (type === "chimie"){
					y1Title = "pH / Chlore (mg/L)";
					y2Title = "Redox (mV)";
				} else if (type === "equipment"){
					y1Title = "Équipements (ON/OFF)";
					y2Title = "Température (°C) / pH";
				}
				// constructor(zoneIndex, type, data, mapping, config, displayed,y1Title,y2Title)
				window.graphInstances.push(new GraphInstance(idx+1, type, data, mapping, config, displayed, y1Title, y2Title));
			} else {
				console.debug && console.debug('Initializing navigator graph data');
				const mapping = ['Navigation'];
				const displayed = ['Navigation'];
				const config = { Navigation: { color: '#00FBFF', axis: 'y' } };
				const data = generateNavigatorData(start, now, { intervalMinutes: 1, debug });
				window.graphInstances.push(new GraphInstance(4, 'navigator', data, mapping, config, displayed, "", ""));
			}
		});
}

// First call to get data
async function getOriginData(){
	i=0;
	now=dayjs().set("minute",0).set("second",0);
	start=dayjs().subtract(7,"day");  // ← API CHUNKED: Maintenant on peut charger 7 jours sans WDT !
	console.debug && console.debug("Fetching Origin Data: start:"+start.format("DD-MM-YYYY")+" end:"+now.format("DD-MM-YYYY"));
	dataOrigin = window.generatePoolData(start, now, { intervalMinutes: 1, debug });
//	dataOrigin=await fetchDataChunked(start,now);  // ← NOUVELLE API: Chunking multi-requêtes
	chartdata=getNormalizedData();  // Normalisation (ex: décalage PAC/PP pour éviter chevauchement)	
	// Initialiser le cache avec les données d'origine
	populateCache(dataOrigin);
}

// Génération des données simulées via dataGenerator.js (usage global)
// Assurez-vous d'inclure <script src="dataGenerator.js"></script> AVANT ce fichier dans main.html
function getNormalizedData() {
	return dataOrigin.map(row => {
		let newRow = [...row];
		// Indices selon ALL_LABELS: 0=Date,1=TempEau,2=TempAir,3=TempPAC,4=TempInt,5=PHVal,6=RedoxVal,7=CLVal,
		// 8=PompePH,9=PompeCL,10=PompeALG,11=PP,12=PAC,13=Auto,14=Navigation
		// Appliquer offsets pour les séries "equipment" afin de séparer visuellement les ON/OFF
		newRow[11] = (row[11] !== null && row[11] !== undefined) ? row[11] : null;                // PP 0-1
		newRow[12] = (row[12] !== null && row[12] !== undefined) ? row[12] + 1 : null;          // PAC -> +1
		newRow[13] = (row[13] !== null && row[13] !== undefined) ? row[13] + 2 : null;          // Auto -> +2
		newRow[8]  = (row[8]  !== null && row[8]  !== undefined) ? row[8]  + 3 : null;          // PompePH -> +3
		newRow[9]  = (row[9]  !== null && row[9]  !== undefined) ? row[9]  + 4 : null;          // PompeCL -> +4
		newRow[10] = (row[10] !== null && row[10] !== undefined) ? row[10] + 5 : null;          // PompeALG -> +5
		return newRow;
	});

}

// --- Extrait la config des capteurs pour un type de graphe donné ---
function extractConfig(type, mapping) {
	const result = {};
	mapping.forEach(label => {
		if (SENSOR_CONFIG[label]) {
			result[label] = { ...SENSOR_CONFIG[label] };
		}
	});
	return result;
}


// --- Extraction des colonnes utiles pour chaque graphe ---
function extractColumns(mapping) {
	// mapping = liste des colonnes à extraire (ex: ["PHVal", "RedoxVal", ...])
	// chartdata = tableau de lignes (chaque ligne = [Date, PHVal, ...])
	// On suppose que la première colonne est Date 
	const indices = [0]; // Date toujours
	mapping.forEach(label => {
		const idx = ALL_LABELS.indexOf(label);
		if (idx > 0) indices.push(idx);
	});
	return chartdata.map(row => indices.map(idx => row[idx]));
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

/**
 * Nouvelle fonction fetchDataChunked : Charge données par chunks (évite WDT ESP8266)
 * @param {dayjs} debut - Date début
 * @param {dayjs} fin - Date fin
 * @returns {Promise<Array>} Données CSV parsées
 */
async function fetchDataChunked(debut, fin) {
	// PROTECTION: Bloquer re-chargement si déjà en cours (évite navigation jQuery Mobile)
	if (window.chunkLoadingInProgress) {
		console.warn("⚠️ [CHUNKED API] Chargement déjà en cours, skip...");
		return [];
	}
	
	window.chunkLoadingInProgress = true;
	
	const datas = [];
	const start = dayjs(debut);
	const end = dayjs(fin);
	
	console.debug && console.debug("📊 [CHUNKED API] Fetching data: " + start.format("DD-MM-YYYY") + " → " + end.format("DD-MM-YYYY"));
	
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
		
		console.debug && console.debug(`📋 Plan reçu: ${availableDays}/${totalDays} jours disponibles`);
		
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
				console.debug && console.debug(`  📄 ${date}: ${info.size} bytes, ${info.chunks} chunks`);
			} else {
				console.debug && console.debug(`  ⚠️ ${date}: Fichier absent`);
			}
		}
		
		if (totalChunks === 0) {
			hideGraphProgress();
			showToast("Aucune donnée trouvée", 'warning');
			return datas;
		}
		
		console.debug && console.debug(`📦 Total: ${totalChunks} chunks à charger`);
		
		// Étape 3 : Charger chunks fichier par fichier
		let allData = "";
		
		console.debug && console.debug(`🔄 Début chargement chunks : ${fileInfos.length} fichiers, ${totalChunks} chunks total`);
		
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
		
		console.info && console.info(`✅ [CHUNKED API] Success: ${datas.length} lignes chargées`);
		
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
		console.debug && console.debug(`Fetching missing data from ${range.start.format("DD-MM-YYYY")} to ${range.end.format("DD-MM-YYYY")}`);
		const newData = await fetchDataChunked(range.start, range.end);  // ← Utilise API chunked
		populateCache(newData);
		result.push(...newData);
	}
	
	// Trier les résultats par date
	result.sort((a, b) => a[0] - b[0]);
	
	return result;
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
	
	console.debug && console.debug(`✅ Parsing: ${validRows} lignes valides`);
	
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
		console.debug && console.debug(`getNewData: fetching from ${debut.format("DD-MM-YYYY")} to ${fin.format("DD-MM-YYYY")}`);
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

function initCharts() {

	const layout = determineLayout();
    // 1. Calculer les hauteurs d'abord pour que Dygraph connaisse sa taille
	applyChartHeights();

	// Construire les selecteurs d'axes dynamiquement pour chaque zone (1..3)
	for (let z = 1; z <= 3; z++) createAxesSelectorForZone(z);

    // 2. Créer les instances de graphiques (ils vont lire getGraphOptions)
    // 2.1. On coupe la synchro avant de toucher au DOM
    if (syncHandler) { 
        try { syncHandler.detach(); } catch(e) {} 
        syncHandler = null; 
    }
	// 2.2 Création des Dygraphs affichés par zone (1..3) + navigator
	const dygraphPromises = [];
	// Only create dygraphs for zones that are valid for the current layout (use existing `layout`)
	for (let z = 1; z <= 3; z++) {
		// Zone 1 is always created; other zones follow layout.count
		if (z !== 1 && z > layout.count) {
			console.log(`[initCharts] skipping creation for zone ${z} due to layout.count=${layout.count}`);
			continue;
		}
		dygraphPromises.push(createDygraphForZone(z));
	}
	// navigator
	const navTemplate = window.graphInstances.find(inst => inst.type === 'navigator');
	if (navTemplate) {
		const navContainer = document.getElementById('graph-canvas-nav');
		const opts = getGraphOptions(navTemplate, true, 4);
		dygraphPromises.push(navTemplate.createDygraph(navContainer, opts, 4).then(dy => {
			if (!window.displayedGraphs) window.displayedGraphs = {};
			window.displayedGraphs[4] = { type: 'navigator', template: navTemplate, dygraph: dy, axesSelected: [] };
			if (dy) refreshStaticLegend(dy);
		}));
	}

	Promise.all(dygraphPromises).then(() => {
		// Afficher/masquer les zones selon le layout
		for (let z = 1; z <= 3; z++) {
			const $zone = $(`#graph-zone-${z}`);
			if (z <= layout.count) $zone.show().css('display', 'flex'); else $zone.hide();
		}
		requestAnimationFrame(() => scheduleGraphResize());
	});
   
    
	// 5. ResizeObserver (votre code est très bien ici) — ajouter des logs de diagnostic
	if (!window.chartObserver) {
		const dashboard = document.querySelector('.dashboard-card');
		window.chartObserver = new ResizeObserver((entries) => {
			// On attend un raf pour laisser le navigateur finaliser le layout
			requestAnimationFrame(() => {
				try {
					console.log('[ResizeObserver] déclenché, entries:', entries.map(e => e.target && (e.target.id || e.target.className)));
				} catch (e) {}
					// Utiliser le scheduler pour coalescer les resizes
					scheduleGraphResize();
			});
		});
		window.chartObserver.observe(dashboard);
	}
}

function synchronizeGraphs() {
	console.log('[synchronizeGraphs] État des zones affichées :');
	const activeGraphs = [];
	Object.keys(window.displayedGraphs || {}).forEach(zone => {
		const d = window.displayedGraphs[zone];
		const containerId = zone == 4 ? 'graph-canvas-nav' : `graph-canvas-${zone}`;
		const container = document.getElementById(containerId);
		console.log(`  zone=${zone} type=${d && d.type} dygraph=`, !!(d && d.dygraph), 'container=', !!container);
		if (d && d.dygraph) activeGraphs.push(d.dygraph);
	});
	console.log('[synchronizeGraphs] Dygraph valides trouvés :', activeGraphs.length, activeGraphs);
	if (activeGraphs.length === 0) {
		console.warn('[synchronizeGraphs] Aucun Dygraph valide à synchroniser.');
		return;
	}
	window.requestAnimationFrame(() => {
		try {
			// Détacher l'ancien handler s'il existe pour éviter les duplications
			if (syncHandler) {
				try { syncHandler.detach(); } catch (e) {}
				syncHandler = null;
			}
			syncHandler = Dygraph.synchronize(activeGraphs, {
				selection: true,
				zoom: true,
				range: false
			});
		} catch (e) {
			console.error('[synchronizeGraphs] Erreur Dygraph.synchronize:', e);
		}
	});
}
/** Calcule l'objet options complet pour l'instanciation ou l'update */
function getGraphOptions(instance, isNavigator, zoneIndex) {
	let labels, vis, seriesConfig, y1Title, y2Title;
	// Init variables communes
	let mapping = null;
	let displayed = null;
	let config = null;
	seriesConfig = {};
	let anyY = false;
	let anyY2 = false;

	if (!isNavigator) {
		mapping = instance.mapping; // instance = objet GraphInstance déjà préparé
		if (!mapping) return {}; // Protection pour navigator ou cas non initialisé
		displayed = instance.displayed || mapping;
		config = instance.config || {};

		// Visibilité : tableau de même longueur que mapping (hors Date)
		vis = mapping.map(label => displayed.includes(label));

		// Construction du seriesConfig à partir de la config de l'instance
		mapping.forEach(label => {
			if (config[label]) {
				seriesConfig[label] = {
					color: config[label].color,
					axis: config[label].axis || 'y'
				};
			}
		});

		// Labels dynamiques : Date + mapping
		labels = ["Date", ...mapping];

		// Déterminer si au moins une série visible utilise y ou y2
		mapping.forEach((label, idx) => {
			const axis = (config[label] && config[label].axis) || 'y';
			const visible = Array.isArray(vis) ? !!vis[idx] : true; // vis correspond à mapping
			if (visible) {
				if (axis === 'y2') anyY2 = true; else anyY = true;
			}
		});

		// Définition des unités pour les titres des axes Y
		(anyY) ? y1Title = instance.y1Title : y1Title = "";	
		(anyY2) ? y2Title = instance.y2Title : y2Title = ""	;
		
	} else {
		// NAVIGATOR
		mapping = ["Navigation"];
		displayed = mapping;
		config = { Navigation: { color: '#00FBFF', axis: 'y' } };
		vis = [true];
		seriesConfig = { Navigation: { color: '#00FBFF', axis: 'y' } };
		labels = ["Date", "Navigation"];
		y1Title = instance.y1Title || "";
		y2Title = instance.y2Title || "";
	}
	const commonOptions = {
		labels: labels,
		visibility: vis,
		gridLineColor: '#222',
		axisLineColor: '#FFFFFF',
		axisLabelColor: '#FFFFFF',
		highlightSeriesOpts: {
			strokeWidth: 3,
			highlightCircleSize: 5
		},
		highlightSeriesBackgroundAlpha: 1.0,
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
			showLabelsOnHighlight: false,
			labelsSeparateLines: false,
			legend: 'none',
			axes: {
				x: { drawAxis: true, axisLabelFontSize: 10, axisLabelColor: '#eee' },
				y: { drawAxis: false, drawGrid: false }
			},
			margin: { left: 45, right: 15, top: 0, bottom: 5 }
			,
			// Dessine les labels des poignées du range selector directement sur le canvas
			drawCallback: function(g) {
						try {
					const maindiv = g.maindiv_;
					if (!maindiv) return;
					// Récupérer la fenêtre X courante
					let dateWindow = null;
					if (typeof g.xAxisRange === 'function') {
						try { dateWindow = g.xAxisRange(); } catch(e) { dateWindow = null; }
					}
					if (!dateWindow) dateWindow = g.getOption && g.getOption('dateWindow') ? g.getOption('dateWindow') : null;
					if (!dateWindow) return;
					const leftX = dateWindow[0];
					const rightX = dateWindow[1];
					// Convertir valeurs X en coordonnées DOM (relatives au maindiv)
					let leftPx = null, rightPx = null;
					try {
						leftPx = g.toDomXCoord(leftX);
						rightPx = g.toDomXCoord(rightX);
					} catch (e) { return; }
					if (leftPx == null || rightPx == null) return;
					// Obtenir le canvas du range selector si présent (fgcanvas), sinon fallback au canvas principal
					const rangeCanvas = maindiv.querySelector('.dygraph-rangesel-fgcanvas');
					const canvas = rangeCanvas || g.canvas_ || maindiv.querySelector('canvas');
					if (!canvas) return;
					const ctx = canvas.getContext('2d');
					if (!ctx) return;
					const dpr = window.devicePixelRatio || 1;
					ctx.save();
					try {
						// Formatter les dates : utiliser xValueFormatter si présent sinon format FR
						const fmt = (g.getOption && g.getOption('xValueFormatter')) ? g.getOption('xValueFormatter') : (v => {
							try {
								const dt = new Date(v);
								return dt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
							} catch (e) { return String(v); }
						});
						const leftText = fmt(leftX);
						const rightText = fmt(rightX);

						// Récupérer styles depuis le CSS pour cohérence visuelle
						const sampleEl = document.querySelector('.local-status-val') || document.querySelector('.static-legend-frame') || document.body;
						const cs = window.getComputedStyle(sampleEl);
						const fontSizePx = parseFloat(cs.fontSize) || 12;
						const fontFamily = cs.fontFamily || 'Arial, sans-serif';
						const fontWeight = cs.fontWeight || '600';
						const textColor = cs.color || '#ffffff';

						// Paramètres de dessin (en pixels réels)
						ctx.font = `${fontWeight} ${Math.round(fontSizePx * dpr)}px ${fontFamily}`;
						ctx.textBaseline = 'bottom';
						ctx.fillStyle = textColor;
						ctx.lineWidth = Math.max(2, Math.round(2 * dpr));
						ctx.strokeStyle = 'rgba(0,0,0,0.7)';

						// Positions relatives au canvas (g.toDomXCoord renvoie relatif à maindiv clientLeft)
						const rect = maindiv.getBoundingClientRect();
						const canvasRect = canvas.getBoundingClientRect();
						const offsetLeft = canvasRect.left - rect.left;

						// Mesures textes (retour en CSS px donc diviser par dpr)
						const leftTextWidth = Math.ceil(ctx.measureText(leftText).width / dpr);
						const rightTextWidth = Math.ceil(ctx.measureText(rightText).width / dpr);

						const padding = 6; // css px
						const paddingPx = Math.round(padding * dpr);

						// Calcul Y (placer au-dessus des handles). Si on dessine sur le rangeCanvas,
						// placer près du haut de ce canvas, sinon utiliser une position par défaut.
						let ty;
						if (rangeCanvas) {
							const rcHeight = Math.round(rangeCanvas.clientHeight || rangeCanvas.height / dpr || 40);
							// placer le texte 6px au-dessus du bas du range canvas (en CSS px)
							const tyCss = Math.max(8, rcHeight - 6);
							ty = Math.round(tyCss * dpr);
						} else {
							const tyCss = 14; // css px from top of canvas area
							ty = Math.round(tyCss * dpr);
						}

						// Coordonnées en pixels réels
						const txLeftCss = Math.round(leftPx - offsetLeft + padding);
						const txLeft = txLeftCss * dpr;
						const txRightCss = Math.round(rightPx - offsetLeft - rightTextWidth - padding);
						const txRight = txRightCss * dpr;
                        

						// Dessiner fond arrondi derrière chaque label pour lisibilité
						function drawLabelBackground(xPx, yPx, textWidthCss) {
							const w = Math.round((textWidthCss + padding * 2) * dpr);
							const h = Math.round((fontSizePx + 4) * dpr);
							const bx = Math.round(xPx - paddingPx);
							const by = Math.round(yPx - h - Math.round(2 * dpr));
							const radius = Math.round(6 * dpr);
							ctx.beginPath();
							ctx.fillStyle = 'rgba(0,0,0,0.55)';
							// rounded rect
							ctx.moveTo(bx + radius, by);
							ctx.lineTo(bx + w - radius, by);
							ctx.quadraticCurveTo(bx + w, by, bx + w, by + radius);
							ctx.lineTo(bx + w, by + h - radius);
							ctx.quadraticCurveTo(bx + w, by + h, bx + w - radius, by + h);
							ctx.lineTo(bx + radius, by + h);
							ctx.quadraticCurveTo(bx, by + h, bx, by + h - radius);
							ctx.lineTo(bx, by + radius);
							ctx.quadraticCurveTo(bx, by, bx + radius, by);
							ctx.closePath();
							ctx.fill();
						}

						// If we are drawing on the range selector canvas, prefer DOM labels
						if (rangeCanvas) {
							// create or update left/right labels as DOM nodes for robustness
							function ensureLabel(className) {
								let el = maindiv.querySelector('.' + className);
								// ensure maindiv is a positioning context
								try { if (maindiv && (!maindiv.style.position || maindiv.style.position === 'static')) maindiv.style.position = 'relative'; } catch(e) {}
								if (!el) {
									el = document.createElement('div');
									el.className = 'nav-range-label ' + className;
									el.style.position = 'absolute';
									el.style.pointerEvents = 'none';
									el.style.zIndex = 9999;
									// minimal inline to ensure font matches computed style
									el.style.font = `${fontWeight} ${Math.round(fontSizePx)}px ${fontFamily}`;
									maindiv.appendChild(el);
								}
								return el;
							}
							const leftEl = ensureLabel('nav-range-label-left');
							const rightEl = ensureLabel('nav-range-label-right');
							// Use actual handle DOM positions if available (more reliable and follows movement)
							let leftHandleX = null, rightHandleX = null, leftHandleY = null, rightHandleY = null, handleWidthCss = 16;
							try {
								const handles = maindiv.querySelectorAll('.dygraph-rangesel-zoomhandle');
								if (handles && handles.length >= 2) {
									const h0 = handles[0].getBoundingClientRect();
									const h1 = handles[1].getBoundingClientRect();
									handleWidthCss = Math.round(h0.width || handleWidthCss);
									// positions relative to maindiv
									leftHandleX = Math.round(h0.left - rect.left + (h0.width || 0) / 2);
									rightHandleX = Math.round(h1.left - rect.left + (h1.width || 0) / 2);
									// vertical centers relative to maindiv
									leftHandleY = Math.round(h0.top - rect.top + (h0.height || 0) / 2);
									rightHandleY = Math.round(h1.top - rect.top + (h1.height || 0) / 2);
								}
							} catch (e) { leftHandleX = null; rightHandleX = null; leftHandleY = null; rightHandleY = null; }

							// Fallback: if handles not available, use g.toDomXCoord values
							const leftPosCss = (leftHandleX !== null) ? leftHandleX : Math.round(leftPx);
							const rightPosCss = (rightHandleX !== null) ? rightHandleX : Math.round(rightPx);

							// Position: place left label to the right of the left handle, right label to the left of the right handle
							const leftCss = leftPosCss + Math.round(handleWidthCss / 2) + 8;
							const rightCss = rightPosCss - rightTextWidth - Math.round(handleWidthCss / 2) - 8;
							// Prefer handle vertical center when available so labels align with handles
							let topCss;
							if (leftHandleY !== null && rightHandleY !== null) {
								// place labels vertically centered on the handles
								topCss = Math.round(((leftHandleY + rightHandleY) / 2) - (fontSizePx / 2));
							} else if (leftHandleY !== null) {
								topCss = Math.round(leftHandleY - (fontSizePx / 2));
							} else {
								topCss = Math.round((canvasRect.top - rect.top) + (canvasRect.height / 2) - (fontSizePx / 2));
							}
							// Small upward adjustment so labels sit approximately at handle height
							const verticalOffsetCss = 12; // pixels (increased to raise labels a bit more)
							topCss = topCss - verticalOffsetCss;

							// Set text first (so offsetWidth is available), then measure and position precisely
							leftEl.textContent = leftText;
							rightEl.textContent = rightText;
							// Force reflow to ensure offsetWidth is ready
							const lw = leftEl.offsetWidth || leftTextWidth;
							const rw = rightEl.offsetWidth || rightTextWidth;

							// recompute positions using measured widths for proper right alignment
							const leftPos = leftPosCss + Math.round(handleWidthCss / 2) + 8;
							const rightPos = rightPosCss - rw - Math.round(handleWidthCss / 2) - 8;
							leftEl.style.left = Math.round(leftPos) + 'px';
							rightEl.style.left = Math.round(rightPos) + 'px';
							// Position labels: if a label is emphasized, lower its top so the fixed label remains readable
							try {
								const emphasizeOffset = 18; // px to lower emphasized label
								const leftTop = topCss + (leftEl.classList.contains('moving') ? emphasizeOffset : 0);
								const rightTop = topCss + (rightEl.classList.contains('moving') ? emphasizeOffset : 0);
								try { leftEl.style.setProperty('top', leftTop + 'px', 'important'); } catch(e) { leftEl.style.top = leftTop + 'px'; }
								try { rightEl.style.setProperty('top', rightTop + 'px', 'important'); } catch(e) { rightEl.style.top = rightTop + 'px'; }
								// Apply visual translate as fallback to ensure labels sit above handles (use small upward translate)
								const vo = (typeof verticalOffsetCss === 'number') ? verticalOffsetCss : 12;
								const leftOffset = Math.max(0, vo - (leftEl.classList.contains('moving') ? emphasizeOffset : 0));
								const rightOffset = Math.max(0, vo - (rightEl.classList.contains('moving') ? emphasizeOffset : 0));
								try { leftEl.style.setProperty('transform', `translateY(-${leftOffset}px)`, 'important'); } catch(e) { leftEl.style.transform = `translateY(-${leftOffset}px)`; }
								try { rightEl.style.setProperty('transform', `translateY(-${rightOffset}px)`, 'important'); } catch(e) { rightEl.style.transform = `translateY(-${rightOffset}px)`; }
							} catch (e) {
								leftEl.style.top = topCss + 'px';
								rightEl.style.top = topCss + 'px';
							}

							// Apply moving class while user interacts.
							// Respect the active handle index if available so dragging a single handle
							// only emphasizes its corresponding label. For pan interactions, both are emphasized.
							try {
								const activeIdx = (typeof window._navActiveHandleIndex !== 'undefined') ? window._navActiveHandleIndex : null;
								if (activeIdx === null) {
									// not interacting — remove classes
									leftEl.classList.remove('moving');
									rightEl.classList.remove('moving');
								} else if (activeIdx === 'pan') {
									// pan: emphasize both
									leftEl.classList.add('moving');
									rightEl.classList.add('moving');
								} else if (activeIdx === 0) {
									leftEl.classList.add('moving');
									rightEl.classList.remove('moving');
								} else if (activeIdx === 1) {
									rightEl.classList.add('moving');
									leftEl.classList.remove('moving');
								} else {
									// fallback: mirror window.isInteracting for safety
									if (window.isInteracting) {
										leftEl.classList.add('moving');
										rightEl.classList.add('moving');
									} else {
										leftEl.classList.remove('moving');
										rightEl.classList.remove('moving');
									}
								}
							} catch (e) {}
							// Recompute transforms after moving class was applied so the emphasized label
							// is slightly lower than the fixed one and remains readable when overlapped.
							try {
								const vo2 = (typeof verticalOffsetCss === 'number') ? verticalOffsetCss : 12;
								const extraDown2 = 25;
								const lMoving = leftEl.classList.contains('moving');
								const rMoving = rightEl.classList.contains('moving');
								const lOffset = Math.max(0, vo2 - (lMoving ? extraDown2 : 0));
								const rOffset = Math.max(0, vo2 - (rMoving ? extraDown2 : 0));
								try { leftEl.style.setProperty('transform', `translateY(-${lOffset}px)`, 'important'); } catch(e) { leftEl.style.transform = `translateY(-${lOffset}px)`; }
								try { rightEl.style.setProperty('transform', `translateY(-${rOffset}px)`, 'important'); } catch(e) { rightEl.style.transform = `translateY(-${rOffset}px)`; }
							} catch (e) {}
						} else {
							// Left label: draw background + stroke+fill text
							drawLabelBackground(txLeft, ty, leftTextWidth);
							ctx.strokeText(leftText, txLeft, ty);
							ctx.fillText(leftText, txLeft, ty);

							// Right label: draw background + stroke+fill text
							drawLabelBackground(txRight, ty, rightTextWidth);
							ctx.strokeText(rightText, txRight, ty);
							ctx.fillText(rightText, txRight, ty);
						}

					} finally { ctx.restore(); }
				} catch (e) { /* ignore drawing errors */ }
			}
		};
	}

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
		margin: { left: 50, right: 15, top: 15, bottom: 15 },
		showRangeSelector: false,
		title: null,
		ylabel: y1Title,
		y2label: y2Title,
		labelsDivStyles: { 'textAlign': 'right' },
		yAxisLabelWidth: 60,
		y2AxisLabelWidth: 60,
		axes: {
			x: { drawAxis: true },
		},
		labelsDiv: `status-val-${zoneIndex}`,
		labelsSeparateLines: false,
		legend: 'always',
		legendFormatter: function(data) {
			refreshStaticLegend(this, data);
			try {
				const g = this;
				try {
					// Rechercher l'entrée affichée correspondant à ce dygraph
					const disp = Object.values(window.displayedGraphs || {}).find(d => d && d.dygraph === g);
					if (disp && disp.template && typeof disp.template.updateAxesVisibility === 'function') {
						// Appeler la méthode en contexte de l'objet affiché (disp)
						try { disp.template.updateAxesVisibility.call(disp); } catch(e) { console.error('[Diag] legendFormatter updateAxesVisibility error', e); }
					}
				} catch (e) {}
			} catch (e) {
				// ignore
			}
			return "";
		},
		highlightCallback: function(event, x, points, row, seriesName) {},
		underlayCallback: function(canvas, area, g) {
			drawLimitLines(canvas, area, g);
		},
        
	};
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
			const seriesOpts = g.getOption && g.getOption('series') && g.getOption('series')[labelName] ? g.getOption('series')[labelName] : {};
			const color = seriesOpts.color || "#FFFFFF";
			const unit = seriesOpts.unit || "";
						
			// RÉCUPÉRATION DE LA VALEUR
            let valueStr = "";
            if (isHovering) {
				const series = data.series.find(s => s.label === labelName);
				if (series && series.y !== undefined && series.y !== null) {
					valueStr = `<span class="legend-value" style="color:${color} !important;">: ${series.yHTML}${unit}</span>`;
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
function updateGraphs(targetZone) {
	// Log d'appel pour debug double invocation
	console.log('[updateGraphs] Appel updateGraphs', new Error().stack.split('\n')[1].trim());
	// Verrou de sécurité
	if (isInteracting) return;

	const layout = determineLayout();

	// 1. Affiche/masque les zones graphiques selon le layout (zones 1..3)
	for (let i = 1; i <= 3; i++) {
		const $zone = $(`#graph-zone-${i}`);
		if (i === 1 || i <= layout.count) {
			$zone.show().css('display', 'flex');
		} else {
			$zone.hide();
		}
	}

	// 2. Mettre à jour chaque dygraph existant à partir de l'état par-zone (window.displayedGraphs)
	// Detach synchronizer to avoid concurrent callbacks while we update options
	if (syncHandler) {
		try { syncHandler.detach(); } catch (e) {}
		syncHandler = null;
	}
	const pendingUpdates = [];
	Object.keys(window.displayedGraphs || {}).forEach(zoneKey => {
		try {
			const zone = parseInt(zoneKey, 10);
			if (typeof targetZone !== 'undefined' && zone !== targetZone) return;
			const disp = window.displayedGraphs[zone];
			if (!disp || !disp.dygraph) return;
			// Skip dygraphs that were just created and not yet finalized to avoid races
			if (disp.initialized === false) {
				console.log(`[Dygraph][updateGraphs] Skipping zone ${zone} because dygraph not initialized yet`);
				return;
			}
			const containerId = zone === 4 ? 'graph-canvas-nav' : `graph-canvas-${zone}`;
			const container = document.getElementById(containerId);
			// Ajuster explicitement le container selon la zone parent
			if (container) {
				let zoneEl = document.getElementById(`graph-zone-${zone}`);
				if (zone === 4) zoneEl = document.getElementById('navZone') || zoneEl;
				if (zoneEl) {
					const zRect = zoneEl.getBoundingClientRect();
					const w = Math.round(zRect.width);
					const h = Math.round(zRect.height - (zoneEl.querySelector('.graph-header-mini') ? zoneEl.querySelector('.graph-header-mini').offsetHeight : 0));
					if (w > 0) {
						if (Math.abs(container.clientWidth - w) > 1) {
							container.style.width = w + 'px';
							console.log(`[Dygraph][updateGraphs] Applied explicit width to ${containerId}: ${w}px (from zone ${zoneEl.id})`);
						}
						if (h > 0 && Math.abs(container.clientHeight - h) > 1) {
							container.style.height = h + 'px';
							console.log(`[Dygraph][updateGraphs] Applied explicit height to ${containerId}: ${h}px (from zone ${zoneEl.id})`);
						}
					} else {
						console.log(`[Dygraph][updateGraphs] zone ${zoneEl.id} not yet sized: ${zRect.width}x${zRect.height}`);
					}
				} else {
					console.log(`[Dygraph][updateGraphs] zone element for ${containerId} introuvable`);
				}
			} else {
				console.log(`[Dygraph][updateGraphs] ${containerId} introuvable`);
			}

			// Prepare update for this zone (deferred to next RAF)
			const template = disp.template;
			let options = getGraphOptions(template, template.type === 'navigator', zone);
			if (options && options.dateWindow) delete options.dateWindow;
			pendingUpdates.push({ zone, disp, container, containerId, options });

		} catch (e) { console.error('[Dygraph][updateGraphs] unexpected error per zone:', e); }
	});

	// Execute all updates in the next animation frame to avoid re-entrancy with dygraph/synchronizer callbacks
	requestAnimationFrame(() => {
		try {
			// detach synchronizer to prevent its callbacks from firing during updateOptions
			let hadSync = false;
			if (syncHandler) {
				try { syncHandler.detach(); } catch (e) {}
				syncHandler = null;
				hadSync = true;
			}
			const dpr = window.devicePixelRatio || 1;
			pendingUpdates.forEach(item => {
				try {
					const { zone, disp, container, containerId, options } = item;
					if (!disp || !disp.dygraph) return;
					const maindiv = disp.dygraph && disp.dygraph.maindiv_ ? disp.dygraph.maindiv_ : null;
					const safeContainer = container && container.clientHeight && container.clientWidth;
					if (!maindiv || !safeContainer) {
						console.warn(`[Dygraph][updateGraphs] Skipping deferred updateOptions for zone=${zone} - maindiv or container not ready`, { maindiv: !!maindiv, containerSize: safeContainer ? `${container.clientWidth}x${container.clientHeight}` : '0x0' });
						return;
					}
					try {
						disp.dygraph.updateOptions({ file: disp.template.data, ...options });
						try { updateAxesSelectorsVisual(zone); } catch(e){}
					} catch (err) {
						console.warn(`[Dygraph][updateGraphs] updateOptions immediate failed for zone=${zone}, scheduling one retry`, err);
						try {
							// single retry flag to avoid loops
							disp._updateRetry = disp._updateRetry ? disp._updateRetry + 1 : 1;
							if (disp._updateRetry <= 1) {
								requestAnimationFrame(() => {
									try {
										console.log(`[Dygraph][updateGraphs] executing retry updateOptions for zone=${zone}`);
										disp.dygraph.updateOptions({ file: disp.template.data, ...options });
										try { updateAxesSelectorsVisual(zone); } catch(e){}
										// also adjust canvases after retry
										try {
											const maindiv2 = disp.dygraph && disp.dygraph.maindiv_ ? disp.dygraph.maindiv_ : null;
											if (maindiv2) {
												const canvases2 = maindiv2.querySelectorAll('canvas');
												const dpr2 = window.devicePixelRatio || 1;
												canvases2.forEach(c2 => {
													try {
														const cssW2 = Math.round(container.clientWidth || c2.clientWidth || 0);
														const cssH2 = Math.round(container.clientHeight || c2.clientHeight || 0);
														if (cssW2 > 0 && cssH2 > 0) {
															c2.style.width = cssW2 + 'px';
															c2.style.height = cssH2 + 'px';
															const pixW2 = Math.round(cssW2 * dpr2);
															const pixH2 = Math.round(cssH2 * dpr2);
															if (c2.width !== pixW2 || c2.height !== pixH2) {
																c2.width = pixW2;
																c2.height = pixH2;
															}
														}
													} catch (e) { /* ignore */ }
												});
											}
										} catch (e) { /* ignore */ }
										// retry succeeded — clear retry flag and log
										try { disp._updateRetry = 0; } catch(e){}
										try { console.log(`[Dygraph][updateGraphs] retry updateOptions succeeded for zone=${zone}`); } catch(e){}
									} catch (err2) {
										console.error('[Dygraph][updateGraphs] retry updateOptions failed', err2);
									}
								});
							}
						} catch (e2) { console.error('[Dygraph][updateGraphs] scheduling retry failed', e2); }
					}
					// Ajuster les canvases internes pour la largeur/hauteur physique (devicePixelRatio)
					try {
						if (maindiv) {
							const canvases = maindiv.querySelectorAll('canvas');
							canvases.forEach(c => {
								try {
									const cssW = Math.round(container.clientWidth || c.clientWidth || 0);
									const cssH = Math.round(container.clientHeight || c.clientHeight || 0);
									if (cssW > 0 && cssH > 0) {
										c.style.width = cssW + 'px';
										c.style.height = cssH + 'px';
										const pixW = Math.round(cssW * dpr);
										const pixH = Math.round(cssH * dpr);
										if (c.width !== pixW || c.height !== pixH) {
											c.width = pixW;
											c.height = pixH;
											console.log(`[Dygraph][updateGraphs] Set canvas pixels for ${containerId}: ${pixW}x${pixH} (dpr=${dpr})`);
										}
									}
								} catch (e) { /* ignore individual canvas errors */ }
							});
						}
					} catch (e) { console.error('[Dygraph][updateGraphs] canvas adjust erreur:', e); }
				} catch (e) { console.error('[Dygraph][updateGraphs] deferred update error:', e); }
			});
			// reattach synchronizer if it existed before
			if (hadSync) {
				try {
					requestAnimationFrame(() => {
						try { synchronizeGraphs(); } catch (e) { console.error('[Dygraph][updateGraphs] synchronizeGraphs reattach error', e); }
					});
				} catch (e) { console.error('[Dygraph][updateGraphs] reattach scheduling error', e); }
			}
		} catch (e) { console.error('[Dygraph][updateGraphs] deferred updates frame error:', e); }
	});

	// 3. Lancer le redimensionnement intelligent pour les containers visibles (debounced)
	requestAnimationFrame(() => {
		scheduleGraphResize();
	});
}

/**
 * Resize uniquement les graphiques visibles et retenter si le layout n'est pas encore calculé
 * retries: nombre de tentatives déjà effectuées
 */
function resizeVisibleGraphs(retries = 0) {
	const MAX_RETRIES = 4;
	const visibleContainers = [];
	Object.keys(window.displayedGraphs || {}).forEach(zone => {
		const containerId = zone == 4 ? 'graph-canvas-nav' : `graph-canvas-${zone}`;
		const container = document.getElementById(containerId);
		if (!container) return;
		const rect = container.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			visibleContainers.push({ zone, container, rect });
		}
	});

	if (visibleContainers.length === 0 && retries < MAX_RETRIES) {
		// Peut-être que le layout n'est pas encore appliqué — retenter sur la prochaine frame
		requestAnimationFrame(() => resizeVisibleGraphs(retries + 1));
		return;
	}

	// Appliquer resize seulement sur les containers avec une taille valide
	visibleContainers.forEach(({zone, container, rect}) => {
		try {
			console.log(`[Dygraph][resizeVisibleGraphs] Resizing ${container.id}: ${rect.width}x${rect.height}`);
			const displayed = window.displayedGraphs && window.displayedGraphs[zone];
			if (displayed && displayed.dygraph && typeof displayed.dygraph.resize === 'function') {
				displayed.dygraph.resize();
				// Log après resize (une frame plus tard pour laisser le DOM se stabiliser)
				requestAnimationFrame(() => {
					try {
						const afterRect = container.getBoundingClientRect();
						console.log(`[Dygraph][afterResize] ${container.id}: ${afterRect.width}x${afterRect.height}`);
					} catch (e) {
						console.error('[Dygraph][afterResize] erreur lecture rect:', e);
					}
				});
			}
		} catch (e) {
			console.error('[Dygraph][resizeVisibleGraphs] erreur resize:', e);
		}
	});

	// Après resize, resynchroniser
	requestAnimationFrame(() => synchronizeGraphs());
}

// Scheduler pour regrouper/annuler les multiples demandes de resize (debounce)
window._graphResizeTimer = null;
function scheduleGraphResize(delay = 80) {
	if (window._graphResizeTimer) clearTimeout(window._graphResizeTimer);
	window._graphResizeTimer = setTimeout(() => {
		window._graphResizeTimer = null;
		try { resizeVisibleGraphs(0); } catch (e) { console.error('[scheduleGraphResize] erreur:', e); }
	}, delay);
}

/** Create (or recreate) a Dygraph for a given zone based on the selected type */
function createDygraphForZone(zone) {
	return new Promise((resolve) => {
		try {
			const sel = $(`#graphSelector${zone}`).val();
			console.log(`[Diag] createDygraphForZone zone=${zone} graphSelector val=`, sel);
			function mapDisplayToType(v) {
				if (!v) return v;
				const s = v.toString().toLowerCase();
				if (s.indexOf('chimie') !== -1) return 'chimie';
				if (s.indexOf('temp') !== -1) return 'temperature';
				if (s.indexOf('équip') !== -1 || s.indexOf('equip') !== -1) return 'equipment';
				if (s.indexOf('nav') !== -1) return 'navigator';
				return s.replace(/[^a-z0-9]/g, '');
			}
			const type = mapDisplayToType(sel);
			const template = window.graphInstances.find(inst => inst.type === type);
			const container = document.getElementById(`graph-canvas-${zone}`);
			if (!template) console.warn(`[Diag] createDygraphForZone: template not found for type='${sel}' zone=${zone}`);
			if (!container) console.warn(`[Diag] createDygraphForZone: container not found for zone=${zone}`);
			if (!template || !container) { resolve(null); return; }
			const options = getGraphOptions(template, template.type === 'navigator', zone);
			// Destroy previous dygraph if exists
			if (window.displayedGraphs && window.displayedGraphs[zone] && window.displayedGraphs[zone].dygraph) {
				try { window.displayedGraphs[zone].dygraph.destroy(); } catch (e) {}
			}
			template.createDygraph(container, options, zone).then((dy) => {
				console.log(`[Diag] Dygraph created for zone=${zone} dy=`, !!dy);
				if (!window.displayedGraphs) window.displayedGraphs = {};
				window.displayedGraphs[zone] = { type: type, template: template, dygraph: dy, axesSelected: [...(template.displayed || [])], initialized: false };
				if (dy) refreshStaticLegend(dy);
				// Refresh axes selector visual state to match template.displayed
				try { updateAxesSelectorsVisual(zone); } catch(e){}

				// Prefer Dygraph.ready() if available to ensure internals are initialized
				const finalize = () => {
					try { if (dy && typeof dy.resize === 'function') { dy.resize(); } } catch(e) {}
					// second RAF resize to be safe
					requestAnimationFrame(() => {
						try { if (dy && typeof dy.resize === 'function') { dy.resize(); } } catch(e) {}
						// schedule global resize as well to sync canvases
						scheduleGraphResize(60);
						try { if (window.displayedGraphs && window.displayedGraphs[zone]) window.displayedGraphs[zone].initialized = true; } catch(e){}
						resolve(dy);
					});
				};

				try {
					if (dy && typeof dy.ready === 'function') {
						try {
							dy.ready(() => {
								finalize();
							});
						} catch (e) {
							// fallback to RAF strategy
							finalize();
						}
					} else {
						// No ready hook — use double RAF as before
						requestAnimationFrame(() => requestAnimationFrame(() => finalize()));
					}
				} catch (e) { finalize(); }
			}).catch(() => resolve(null));
		} catch (e) { resolve(null); }
	});
}

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
	const disp = window.displayedGraphs && window.displayedGraphs[zone];
	if (!disp) return;
	const instance = disp.template;
	if (!instance) return;
	const mapping = instance.mapping;
	const displayed = disp.axesSelected || instance.displayed || mapping;
	const $select = $(`#axesSelector${zone}`);
	let labelsToSelect = [];
	$select.find('option').each(function() {
		const label = $(this).val();
		if (!label) return;
		$(this).prop('disabled', false).show();	// Toujours activé, jamais disabled
		if (displayed.includes(label)) {
			labelsToSelect.push(label);	// Sélectionné si dans displayed
		}
	});
	$select.val(labelsToSelect).selectmenu("refresh", true);
}

function createAxesSelectorForZone(zone) {
	// Determine displayed type for this zone
	const sel = $(`#graphSelector${zone}`).val();
	function mapDisplayToType(v) {
		if (!v) return v;
		const s = v.toString().toLowerCase();
		if (s.indexOf('chimie') !== -1) return 'chimie';
		if (s.indexOf('temp') !== -1) return 'temperature';
		if (s.indexOf('équip') !== -1 || s.indexOf('equip') !== -1) return 'equipment';
		if (s.indexOf('nav') !== -1) return 'navigator';
		return s.replace(/[^a-z0-9]/g, '');
	}
	const type = mapDisplayToType(sel);
	const template = window.graphInstances.find(inst => inst.type === type);
	const $zone = $(`#graph-zone-${zone}`);
	const $container = $zone.find('.axes-container');
	if (!$container || $container.length === 0) return;
	// Remove only existing select elements to preserve static HTML (eg. close button)
	$container.find('select.axes-multi-selector').remove();
	if (!template) return;
	const $select = $(`<select id="axesSelector${zone}" class="axes-multi-selector" data-zone="${zone}" multiple="multiple" data-native-menu="false" data-theme="b" data-icon="gear" data-iconpos="left"></select>`);
	$select.append(`<option >Courbes...</option>`);
	(template.mapping || []).forEach(labelKey => {
		const cfg = SENSOR_CONFIG[labelKey] || {};
		const text = cfg.label || labelKey;
		$select.append(`<option value="${labelKey}">${text}</option>`);
	});
	$container.append($select);
	try { if ($select.selectmenu) $select.selectmenu(); } catch(e) {}
	// initialize displayedGraphs entry
	if (!window.displayedGraphs) window.displayedGraphs = {};
	if (!window.displayedGraphs[zone]) window.displayedGraphs[zone] = { type: template.type, template: template, axesSelected: [...(template.displayed || [])] };
	updateAxesSelectorsVisual(zone);
}

/** Crée et injecte le select multi axes pour une instance de graphe */
function createAxesSelectorForInstance(instance) {
	if (!instance) return;
	const zone = instance.zoneIndex;
	const $zone = $(`#graph-zone-${zone}`);
	const $container = $zone.find('.axes-container');
	if (!$container || $container.length === 0) return;

	// Construire le select (id unique par zone)
	const selectId = `axesSelector${zone}`;
	// Remove existing if any
	// Remove only existing select elements to preserve static HTML (eg. close button)
	$container.find('select.axes-multi-selector').remove();
	const $select = $(`<select id="${selectId}" class="axes-multi-selector" data-zone="${zone}" multiple="multiple" data-native-menu="false" data-theme="b" data-icon="gear" data-iconpos="left"></select>`);

	// Placeholder option
	$select.append(`<option data-placeholder="true">Courbes...</option>`);

	// Populate options from instance.mapping
	const mapping = instance.mapping || [];
	mapping.forEach(labelKey => {
		const cfg = SENSOR_CONFIG[labelKey] || {};
		const text = cfg.label || labelKey;
		// value must be internal labelKey so updateAxesSelectorsVisual works
		$select.append(`<option value="${labelKey}">${text}</option>`);
	});

	$container.append($select);

	// Initialize jQuery Mobile selectmenu if available
	try {
		if ($select.selectmenu) {
			$select.selectmenu();
			// Apply current selection state
			updateAxesSelectorsVisual(zone);
		}
	} catch (e) { /* ignore */ }
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
		'align-items': 'stretch',
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
			// Ne pas écraser l'attribut style complet — appliquer seulement le display
			$zone.show().css('display', 'flex');
		} else {
			$zone.hide();
		}
	}

	// 4. Si le layout est en ligne (row), répartir les largeurs équitablement
	if (layout.orientation === 'row') {
		const colPercent = Math.floor(100 / layout.count);
		for (let i = 1; i <= 3; i++) {
			const $zone = $(`#graph-zone-${i}`);
			if (i === 1 || i <= layout.count) {
				$zone.css({ 'width': colPercent + '%', 'min-width': 0 });
			} else {
				$zone.css({ 'width': '0%', 'min-width': 0 });
			}
		}
	} else {
		// En colonne, chaque zone prend toute la largeur
		for (let i = 1; i <= 3; i++) {
			$(`#graph-zone-${i}`).css({ 'width': '100%', 'min-width': 0 });
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
	const disp = (window.displayedGraphs && window.displayedGraphs[zoneIndex]) || null;
	const g = disp && disp.dygraph ? disp.dygraph : null;
	if (!g) {
		console.error("Graphique non trouvé pour la zone :", zoneIndex);
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
	$(document).on('pointerdown', '.dygraph-rangesel-fgcanvas, .dygraph-rangesel-zoomhandle', function(e) {
	    isInteracting = true;
	    try { window.isInteracting = true; } catch(e) {}
	    console.log('[Diag] pointerdown - isInteracting=true');
	    try {
	        // Find the closest graph container (navigator) to scope labels
	        let $container = $(this).closest('[id^="graph-canvas-"], #graph-canvas-nav');
	        if (!$container || $container.length === 0) $container = $(document.body);
	        const $leftLabel = $container.find('.nav-range-label-left');
	        const $rightLabel = $container.find('.nav-range-label-right');
			// If user pressed on a handle, emphasize only that label; if on fgcanvas (pan), emphasize both
			const isHandle = $(this).hasClass('dygraph-rangesel-zoomhandle');
			if (isHandle) {
				// determine which handle index within this container
				const $handles = $container.find('.dygraph-rangesel-zoomhandle');
				let idx = -1;
				if ($handles && $handles.length) {
					idx = $handles.index(this);
				}
				// store active index globally for drawCallback to respect during move
				try { window._navActiveHandleIndex = (idx >= 0 ? idx : null); } catch(e) {}
				if (idx === 0) {
					try { $leftLabel.addClass('moving'); $rightLabel.removeClass('moving'); } catch(e) {}
				} else if (idx === 1) {
					try { $rightLabel.addClass('moving'); $leftLabel.removeClass('moving'); } catch(e) {}
				} else {
					// Unknown handle index — fallback to both and mark as pan-like
					try { $leftLabel.addClass('moving'); $rightLabel.addClass('moving'); } catch(e) {}
				}
				// immediate transform + top update so label visual moves down on pointerdown
					try {
						const vo = 12;
						const extraDown = 12; // match drawCallback behaviour
						const lMovingNow = $leftLabel.hasClass('moving');
						const rMovingNow = $rightLabel.hasClass('moving');
						const lOffset = Math.max(0, vo - (lMovingNow ? extraDown : 0));
						const rOffset = Math.max(0, vo - (rMovingNow ? extraDown : 0));
						try { if ($leftLabel && $leftLabel.length && $leftLabel.get(0) && $leftLabel.get(0).style) $leftLabel.get(0).style.setProperty('transform', `translateY(-${lOffset}px)`, 'important'); else $leftLabel.css('transform', `translateY(-${lOffset}px)`); } catch(e) { try { $leftLabel.css('transform', `translateY(-${lOffset}px)`); } catch(_) {} }
						try { if ($rightLabel && $rightLabel.length && $rightLabel.get(0) && $rightLabel.get(0).style) $rightLabel.get(0).style.setProperty('transform', `translateY(-${rOffset}px)`, 'important'); else $rightLabel.css('transform', `translateY(-${rOffset}px)`); } catch(e) { try { $rightLabel.css('transform', `translateY(-${rOffset}px)`); } catch(_) {} }
						// also nudge the top so the visual vertical offset matches the draw-time adjustment
						try {
							const curLTop = parseFloat($leftLabel.css('top')) || 0;
							const curRTop = parseFloat($rightLabel.css('top')) || 0;
							const newLTop = curLTop + (lMovingNow ? extraDown : 0);
							const newRTop = curRTop + (rMovingNow ? extraDown : 0);
							// Save original top to restore precisely on pointerup
							try { if ($leftLabel && $leftLabel.length && $leftLabel.data && $leftLabel.data('origTop') == null) $leftLabel.data('origTop', curLTop); } catch(e) {}
							try { if ($rightLabel && $rightLabel.length && $rightLabel.data && $rightLabel.data('origTop') == null) $rightLabel.data('origTop', curRTop); } catch(e) {}
							if ($leftLabel && $leftLabel.length && $leftLabel.get(0) && $leftLabel.get(0).style) $leftLabel.get(0).style.setProperty('top', newLTop + 'px', 'important'); else $leftLabel.css('top', newLTop + 'px');
							if ($rightLabel && $rightLabel.length && $rightLabel.get(0) && $rightLabel.get(0).style) $rightLabel.get(0).style.setProperty('top', newRTop + 'px', 'important'); else $rightLabel.css('top', newRTop + 'px');
						} catch(e) {}
					} catch (e) {}
			} else {
				// fgcanvas pan: emphasize both and mark pan mode
				try {
					window._navActiveHandleIndex = 'pan';
					$leftLabel.addClass('moving');
					$rightLabel.addClass('moving');
					const vo = 12; const extraDown = 12; const off = Math.max(0, vo - extraDown);
					try { if ($leftLabel && $leftLabel.length && $leftLabel.get(0) && $leftLabel.get(0).style) $leftLabel.get(0).style.setProperty('transform', `translateY(-${off}px)`, 'important'); else $leftLabel.css('transform', `translateY(-${off}px)`); } catch(e) { try { $leftLabel.css('transform', `translateY(-${off}px)`); } catch(_) {} }
					try { if ($rightLabel && $rightLabel.length && $rightLabel.get(0) && $rightLabel.get(0).style) $rightLabel.get(0).style.setProperty('transform', `translateY(-${off}px)`, 'important'); else $rightLabel.css('transform', `translateY(-${off}px)`); } catch(e) { try { $rightLabel.css('transform', `translateY(-${off}px)`); } catch(_) {} }
					try {
						const curLTop = parseFloat($leftLabel.css('top')) || 0;
						const curRTop = parseFloat($rightLabel.css('top')) || 0;
						const newLTop = curLTop + extraDown;
						const newRTop = curRTop + extraDown;
						// Save original top if not already saved
						try { if ($leftLabel && $leftLabel.length && $leftLabel.data && $leftLabel.data('origTop') == null) $leftLabel.data('origTop', curLTop); } catch(e) {}
						try { if ($rightLabel && $rightLabel.length && $rightLabel.data && $rightLabel.data('origTop') == null) $rightLabel.data('origTop', curRTop); } catch(e) {}
						if ($leftLabel && $leftLabel.length && $leftLabel.get(0) && $leftLabel.get(0).style) $leftLabel.get(0).style.setProperty('top', newLTop + 'px', 'important'); else $leftLabel.css('top', newLTop + 'px');
						if ($rightLabel && $rightLabel.length && $rightLabel.get(0) && $rightLabel.get(0).style) $rightLabel.get(0).style.setProperty('top', newRTop + 'px', 'important'); else $rightLabel.css('top', newRTop + 'px');
					} catch(e) {}
				} catch(e) {}
			}
	    } catch (e) { console.warn('pointerdown label emphasis failed', e); }
	    if (interactionTimeout) clearTimeout(interactionTimeout);
	});

	$(document).on('pointerup pointercancel', function() {
	    if (interactionTimeout) clearTimeout(interactionTimeout);
		// Remove visual moving state immediately so UI feels responsive and clear active handle
				try {
					$('.nav-range-label').removeClass('moving');
					try { window._navActiveHandleIndex = null; } catch(e) {}
					// Reset transforms and top so labels return to default position immediately
					try {
						const vo = 12; const extraDown = 12;
						try {
							$('.nav-range-label').each(function(){
								try {
									this.style.setProperty('transform', `translateY(-${vo}px)`, 'important');
									const $el = $(this);
									const orig = $el.data('origTop');
									if (orig !== undefined && orig !== null) {
										// restore exact original top
										this.style.setProperty('top', orig + 'px', 'important');
										try { $el.removeData('origTop'); } catch(e) {}
									} else {
										const curTop = parseFloat(window.getComputedStyle(this).top) || 0;
										const restored = Math.max(0, curTop - extraDown);
										this.style.setProperty('top', restored + 'px', 'important');
									}
								} catch (e) {}
							});
						} catch(e) { try { $('.nav-range-label').css('transform', `translateY(-${vo}px)`); } catch(_) {} }
					} catch (e) {}
				} catch(e) {}
		interactionTimeout = setTimeout(() => { isInteracting = false; try { window.isInteracting = false; } catch(e) {} console.log('[Diag] pointerup -> isInteracting=false'); }, 150);
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
		// Ensure layout heights are applied first (same flow as orientation change)
		try { applyChartHeights(); } catch(e) { console.error('[GRAPH CHANGE] applyChartHeights error', e); }
		// Double RAF to ensure browser applied styles/layout, then recreate selector + dygraph
		requestAnimationFrame(() => requestAnimationFrame(() => {
			console.log('[GRAPH CHANGE] zone', zone, '- RAF double, recreating axes selector and dygraph');
			try { createAxesSelectorForZone(zone); } catch(e) { console.error('[GRAPH CHANGE] createAxesSelectorForZone error', e); }
			createDygraphForZone(zone).then(() => {
				// After creation, update only this zone to avoid touching other graphs
				try { updateGraphs(zone); } catch(e) { console.error('[GRAPH CHANGE] updateGraphs error', e); }
			});
		}));
	});
	
	// quand on selectionne de axes 
	$(document).on('change', '.axes-multi-selector', function() {
		const zone = $(this).data('zone');
		const labels = $(this).val();
		console.log('[Diag] axes-multi-selector change zone=', zone, 'labels=', labels);
		if (!window.displayedGraphs || !window.displayedGraphs[zone]) return;
		const disp = window.displayedGraphs[zone];
		disp.axesSelected = Array.isArray(labels) ? labels : [labels];
		disp.template.displayed = Array.isArray(labels) ? labels : [labels];
		// Update the displayed dygraph for this zone
		if (disp.dygraph) {
				// Compute visibility array and log diagnostic info
				const visibilityArray = disp.template.mapping.map(l => disp.template.displayed.includes(l));
				console.log('[Diag] axes change visibilityArray for zone=', zone, 'mapping=', disp.template.mapping, 'displayed=', disp.template.displayed, 'visibility=', visibilityArray);
					try {
					disp.dygraph.updateOptions({ visibility: visibilityArray });
					refreshStaticLegend(disp.dygraph);
					// Also update axes visibility
					try { disp.template.updateAxesVisibility.call(disp); } catch(e) { console.error('[Diag] updateAxesVisibility error', e); }
									// Ensure resize/redraw scheduled
													scheduleGraphResize();
													// Close the selectmenu after a short period of inactivity so user
													// can make multiple selections without it closing immediately.
													try {
														var $self = $(this);
														if (!window._axesCloseTimers) window._axesCloseTimers = {};
														// Clear any existing timer for this zone
														if (window._axesCloseTimers[zone]) {
															clearTimeout(window._axesCloseTimers[zone]);
															window._axesCloseTimers[zone] = null;
														}
														// Start a new debounce timer (2s) to close the menu after user stops interacting
														window._axesCloseTimers[zone] = setTimeout(() => {
															try {
																if ($self && $self.selectmenu) {
																	try { $self.selectmenu('close'); } catch (e2) { /* ignore */ }
																}
															} catch (e3) { /* ignore */ }
															window._axesCloseTimers[zone] = null;
														}, 2000);
													} catch (e2) { /* ignore */ }
				} catch (e) {
					console.error('[Diag] dygraph.updateOptions failed for zone=' + zone, e);
				}
						// After updating visibility, ensure the select reflects current displayed series
						try { updateAxesSelectorsVisual(zone); } catch(e){}
		}
	});
	
	// choix du type d'export
	// Emphase du bouton fermer JQM et pulsation quand le menu est ouvert
	$(document).on('selectmenuopen', '.axes-multi-selector', function() {
		const zone = $(this).data('zone');
		if (!zone) return;
		try {
			const $axContainer = $(`#graph-zone-${zone}`).find('.axes-container');
			if ($axContainer && $axContainer.length) $axContainer.addClass('axes-pulse-active');
			const popup = $(`#${this.id}-listbox-popup`);
			if (popup && popup.length) {
				try { popup.find('.ui-header .ui-btn').addClass('axes-pulse-close-emph'); } catch(e){}
			}
			// clear pending close timer while user opens menu
			if (window._axesCloseTimers && window._axesCloseTimers[zone]) { clearTimeout(window._axesCloseTimers[zone]); window._axesCloseTimers[zone]=null; }
		} catch(e){}
	});

	$(document).on('selectmenuclose', '.axes-multi-selector', function() {
		const zone = $(this).data('zone');
		if (!zone) return;
		try {
			const $axContainer = $(`#graph-zone-${zone}`).find('.axes-container');
			if ($axContainer && $axContainer.length) $axContainer.removeClass('axes-pulse-active');
			const popup = $(`#${this.id}-listbox-popup`);
			if (popup && popup.length) {
				try { popup.find('.ui-header .ui-btn').removeClass('axes-pulse-close-emph'); } catch(e){}
				try { popup.find('.ui-header .jqm-close-icon').remove(); } catch(e){}
			}
			if (window._axesCloseTimers && window._axesCloseTimers[zone]) { clearTimeout(window._axesCloseTimers[zone]); window._axesCloseTimers[zone]=null; }
		} catch(e){}
	});

	$(document).on("change", ".export-selector", function() {
	    // Force la conversion en nombre pour éviter les erreurs de type "1" vs 1
	    const zoneIndex = parseInt($(this).data("zone"), 10); 
	    const mode = $(this).val();
	
	    if (!mode) return;
	
	    // Log de debug pour vérifier qui appelle quoi
		const disp = (window.displayedGraphs && window.displayedGraphs[zoneIndex]) || null;
		console.log("Zone détectée :", zoneIndex, "Mode :", mode, "Displayed:", !!disp, disp && disp.type);
	
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
		if ($('#pagePiscineGraphs').hasClass('ui-page-active')) {
			applyChartHeights();
			// Double RAF pour s'assurer que le navigateur a appliqué les styles/layout
			requestAnimationFrame(() => requestAnimationFrame(() => {
				console.log('[RESPONSIVE] resize/orientation - RAF double, calling updateGraphs');
				updateGraphs();
			}));
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


	// --- page PiscineGraphs Phase 1 : beforecreate ---
	$(document).delegate("#pagePiscineGraphs","pagebeforecreate", function() {
		console.log("pagebeforecreate: updating chart data");
		$.mobile.loading('show', {
			text: "Fetch des Données pour les graphiques...",
			textVisible: true,
			theme: "b" // Thème sombre
		});
		setTimeout(async function() {
			try {
				await initData();
			} finally {
				$.mobile.loading('hide');
			}
		}, 200);
	});


// --- page PiscineGraphs Phase 2 : pageshow ---
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
// navigate to the graphs page
try {
	if ($ && $.mobile && $.mobile.changePage) {
		$.mobile.changePage("#pagePiscineGraphs", {transition: "fade"});
	} else {
		console.warn('[INIT] jQuery Mobile not available to change page');
	}
} catch (e) {
	console.error('[INIT] Error during auto-navigation:', e);
}

