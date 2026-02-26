/* ==========================================================================
   piscineGraphs.js : Moteur de rendu et logique visuelle
   ========================================================================== */

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
let g1 = null, g2 = null, g3 = null, gNav = null;
let syncHandler = null;  


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
//    "Chimie":       [PHVal*,RedoxVal*,PompePH,PompeCL,PompeALG,TempEau,TempAir], 
//    "Températures": [TempEau*,TempAir*,TempPAC*,TempInt*,PAC,PP,PHVal], 
//    "Équipements":  [PP*,PAC*,PompePH*,PompeCL*,Auto,PompeALG,TempPAC,TempEau,PHVal]  
};

    "Chimie":       ["ON",  "OFF",    "ON",  "OFF", "ON",  "HIDDEN", "HIDDEN"], 
    "Températures": ["OFF", "OFF",    "OFF", "ON",  "ON",  "HIDDEN", "HIDDEN"], 
    "Équipements":  ["OFF", "HIDDEN", "ON",  "OFF", "OFF", "ON",     "HIDDEN"]  
	


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
	const isLandscape = width > height;
    if (width < 768) return isLandscape ? 'mobile-landscape' : 'mobile-portrait';
    if (width < 1100) return isLandscape ? 'tablet-landscape' : 'tablet-portrait';
    return isLandscape ? 'desktop-landscape' : 'desktop-portrait';
}

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
				//axisLabelFormatter: formatYAxisLabelLimit4,
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
		    if (data.x == null) return '';
		    
		    // Heure en blanc brillant
			const date = new Date(data.x);
		    
		    // Format Date : 16/02 (Jour/Mois)
		    const dateStr = date.getDate().toString().padStart(2, '0') + "/" + 
		                    (date.getMonth() + 1).toString().padStart(2, '0');
		    
		    // Format Heure : 14:35:02
		    const timeStr = date.getHours().toString().padStart(2, '0') + ":" + 
		                    date.getMinutes().toString().padStart(2, '0') + ":" + 
		                    date.getSeconds().toString().padStart(2, '0');
					
			// On affiche la date et l'heure dans un style légèrement différent (gris/blanc)
		    let html = `<span class="legend-value-item" style="color: #aaa; margin-right: 15px; font-size: 10px;">
		                    ${dateStr} <span style="color: #00FBFF; font-size: 11px;">${timeStr}</span>
						</span>`;
												
		    data.series.forEach((s, i) => {
		        if (s.isVisible) {
					const config = SENSOR_CONFIG[s.label] || { color: "#FFF", label: s.label, unit: "" };
			        const val = (s.label === "Redox") ? s.y.toFixed(0) : s.y.toFixed(2);
			        
			        // On met la couleur de la config ici. 
			        // Le CSS se chargera de faire hériter cette couleur à tout le contenu.
			        html += `<span class="legend-value-item" style="color: ${config.color} !important;">
			                    <span style="opacity: 0.85; font-size: 0.9em;">${config.label}:</span> 
			                    ${val}${config.unit}
							</span>`;
                }
            });
            return html;
		},		
		highlightCallback: function(event, x, points, row, seriesName) {
		    if (isNavigator) return; // Pas de légende pour le nav
		
		    const statusEl = document.getElementById(`status-val-${zoneIndex}`);
			if (!statusEl) return;
			
			// 1. Formater l'heure (Axe X)
			const date = new Date(x);
		    
		    // Format Date : 16/02 (Jour/Mois)
		    const dateStr = date.getDate().toString().padStart(2, '0') + "/" + 
		                    (date.getMonth() + 1).toString().padStart(2, '0');
		    
		    // Format Heure : 14:35:02
		    const timeStr = date.getHours().toString().padStart(2, '0') + ":" + 
		                    date.getMinutes().toString().padStart(2, '0') + ":" + 
		                    date.getSeconds().toString().padStart(2, '0');
					
			// On affiche la date et l'heure dans un style légèrement différent (gris/blanc)
		    let html = `<span class="legend-value-item" style="color: #aaa; margin-right: 15px; font-size: 10px;">
		                    ${dateStr} <span style="color: #00FBFF; font-size: 11px; margin-left: 5px;">${timeStr}</span>
						</span>`;
					
		    // 3. Ajouter les autres points (PH, CL, etc.)
			points.forEach(p => {
			    const config = SENSOR_CONFIG[p.name] || { color: "#FFF", label: p.name, unit: "" };
			    
			    // On met la couleur sur le span parent, et grâce au CSS "inherit", 
			    // tout ce qui est dedans (label + valeur) sera coloré.
			    html += `<span class="legend-value-item" style="color: ${config.color} !important;">
			                <span class="smallLabel">${config.label}:</span> 
			                ${p.yval.toFixed(2)}${config.unit}
			             </span>`;
			});
			statusEl.innerHTML = html;
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
function refreshStaticLegend(g) {
    if (!g || !g.maindiv_) return;

    const container = g.maindiv_;
    let frame = container.querySelector('.static-legend-frame');
    
    if (!frame) {
        frame = document.createElement('div');
        frame.className = 'static-legend-frame';
        container.style.position = "relative"; 
        container.appendChild(frame);
    }

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
            
            html += `<div class="legend-row">
                        <span class="legend-label">${labelName}</span>
                        <div class="legend-dot" style="background-color:${color} !important;"></div>
                     </div>`;
        }
    }
    frame.innerHTML = html;
}

/** Redessine tous les graphiques (utile après un resize) */
function updateGraphs() {

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
	console.log(`[UI] Zone ${zone}, labels à cocher :`, savedLabels); // <--- LOG ICI

    let labelsToSelect = [];

    // 3. Filtrer pour ne garder que ce qui appartient au groupe actuel
    $select.find('option').each(function() {
        const label = $(this).val();
        if (!label) return;

        const indexInLabels = ALL_LABELS.indexOf(label);
        if (indexInLabels > 0) {
            const state = mapping[indexInLabels - 1];
            // On ne sélectionne que si c'est autorisé par le groupe (ON ou OFF)
            // ET si c'est présent dans nos préférences sauvegardées
            if ((state === "ON" || state === "OFF") && savedLabels.includes(label)) {
                labelsToSelect.push(label);
                $(this).show();
            } else if (state === "HIDDEN") {
                $(this).hide();
            } else {
                $(this).show(); // Cas "OFF" mais pas dans les préférences
            }
        }
    });

    // 4. Appliquer à l'UI
    $select.val(labelsToSelect).selectmenu("refresh");
    
    // 5. Appliquer au graphique avec un flag "isInit" pour ne pas auto-écraser
    updateGraphVisibility(zone, labelsToSelect, true);
}

function applyChartHeights() {
    const headerH = $('#graphHeader').outerHeight() || 40;
    const navH = 65; // Hauteur fixe pour le Navigator (wrapper + marges)
	const margin = 10; // Marges et paddings cumulés
	
	
    const availableDataH = window.innerHeight - headerH - navH - margin;	// On calcule la hauteur disponible pour les graphiques Y1, Y2, Y3
    
    // 1. On force la hauteur pour les graphiques de données uniquement
    $('.dashboard-card').css({
        'height': (window.innerHeight - headerH - 5) + 'px',	//'height': Math.max(availableH, 200) + 'px',
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
        'height': '55px',
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

/** limite la taille des indices sur les axes */
function formatYAxisLabelLimit4(v) {
    if (v === null || v === undefined || isNaN(v)) return '';
    const absV = Math.abs(v);
    if (absV < 1000) return Number(v).toFixed(1);
    return (v / 1000).toFixed(1) + 'k';
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


/*  ---------------  
    --- EXPORTS ---
    ---------------
*/
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

                                    