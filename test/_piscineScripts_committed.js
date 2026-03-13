/*
================================================================================
TABLE OF CONTENTS & ORGANISATION

This file is organized into logical sections to improve readability and
maintenance. Sections (in order):
	1) Declarations (const, vars, classes)
	2) Determine layout
	3) Progress bar utilities
	4) Data initialization
	5) Data fetching / range modification
	6) Dygraph-related functions
	7) Interface / layout helpers
	8) Exports (PNG/CSV)
	9) User events
 10) Page lifecycle events
 11) Global events (resize, orientation)
 12) Misc / Helpers
 13) Ready / Launch

Use these comment anchors to quickly navigate the file.
================================================================================
*/


/*  ----------------------------------------------
    --- 1) Declarations (const, vars, classes) ---
    ----------------------------------------------
*/

// Global functions and variables
console.info("📌 piscineScripts.js VERSION 2026-02-26-22:20 loaded");
var debug = true;
// Application settings (can be toggled by UI later)
window.appSettings = window.appSettings || { fillMissing: 'nan' }; // 'none'|'nan'|'interpolate'

var statusErrorMap = {
	'400' : "Server understood the request, but request content was invalid.",
	'401' : "Unauthorized access.",
	'403' : "Forbidden resource can't be accessed.",
	// PiscineDebug removed: debug SSE and related handlers disabled in this build
	};

// Logger wrapper centralisé et dynamique : consulte `window.debug` à chaque appel.
// Permet de basculer `debug` dynamiquement depuis la console (ex: `debug = false`).
(function(){
	try {
		// Préserver les méthodes originales pour pouvoir les appeler conditionnellement
		if (!console._orig_log) {
			console._orig_log = console.log ? console.log.bind(console) : function(){};
			console._orig_info = console.info ? console.info.bind(console) : console._orig_log;
			console._orig_debug = console.debug ? console.debug.bind(console) : console._orig_log;
		}

		// Remplacer par des wrappers qui consultent `window.debug` au moment de l'appel.
		console.log = function(...args) { if (window.debug) console._orig_log(...args); };
		console.info = function(...args) { if (window.debug) console._orig_info(...args); };
		console.debug = function(...args) { if (window.debug) console._orig_debug(...args); };
	} catch(e) { /* Ne doit jamais empêcher le chargement */ }
})();

/* -- Global constants --- 
   --- Colors, labels, mappings, and static configs for graphs and sensors --- 
*/
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
	"TempEau":  { label: "T° Eau",   unit: "°C",   color: PALETTE.BLUE_AZURE, min: 25,  max: 29,  axis: 'y2'},
	"TempAir":  { label: "T° Air",   unit: "°C",   color: PALETTE.BLUE_SKY,                     axis: 'y2'}, 
	"TempPAC":  { label: "T° PAC",   unit: "°C",   color: PALETTE.ORANGE_NEON,                 axis: 'y2'}, 
	"TempInt":  { label: "T° Int",   unit: "°C",   color: PALETTE.PURPLE_ROYAL,                axis: 'y2'}, 
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

/* --- Variables globales ---*/
let syncHandler = null;
let isInteracting = false;      
let interactionTimeout = null; 
var updateDebounceTimer = null;	// Timer de debounce pour les appels getNewData
var graphProgressShown = false;

// Global data structures
var chartdata=[];
var dataOrigin=[];
var availableDays = new Set();	// availableDays: simple index (Set) contenant les jours (YYYY-MM-DD) déjà disponibles côté client
var chartdataIndex = new Map(); // Index timestamp -> index dans chartdata pour accès rapide

window.displayedGraphs = {};	// Mapping zoneIndex -> { type, dygraph, template, axesSelected }

/* --- Classes ---*/
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
											// Update only the drawAxis flags via Dygraph API
												try {
												if (debug) console.debug(`[AxVis] updateOptions for zone=${this.zoneIndex} type=${this.type} needY=${needY} needY2=${needY2}`);
												g.updateOptions({ axes: { y: { drawAxis: needY }, y2: { drawAxis: needY2 } } });
											} catch (err) {
												console.warn('[Diag] updateAxesVisibility suppressed dygraph error', err);
											}

										// Additionally, toggle visibility of axis title and tick labels in this graph's DOM
										try {
											const maindiv = g.maindiv_;
											if (maindiv) {
												const instZone = this.zoneIndex; const instType = this.type;
												// Helper to (re)apply DOM visibility for this graph
												const enforce = () => {
													try {
														const yTitle = maindiv.querySelector('.dygraph-label.dygraph-ylabel');
														const y2Title = maindiv.querySelector('.dygraph-label.dygraph-y2label');
														if (debug) console.debug(`[AxVis] enforce zone=${instZone} type=${instType} needY=${needY} needY2=${needY2} yTitle=${!!yTitle} y2Title=${!!y2Title}`);
														if (yTitle) yTitle.style.display = needY ? '' : 'none';
														if (y2Title) y2Title.style.display = needY2 ? '' : 'none';

														const yTicks = maindiv.querySelectorAll('.dygraph-axis-label-y');
														const y2Ticks = maindiv.querySelectorAll('.dygraph-axis-label-y2');
														yTicks.forEach(el => { el.style.display = needY ? '' : 'none'; });
														y2Ticks.forEach(el => { el.style.display = needY2 ? '' : 'none'; });
													} catch (e) { /* ignore */ }
												};

												// Apply immediately
												enforce();

												// Store flags on the maindiv so CSS can persistently hide labels for this graph
												try {
													maindiv.setAttribute('data-axes-hidden', JSON.stringify({ y: !needY, y2: !needY2 }));
													maindiv.setAttribute('data-axis-y-hidden', (!needY) ? 'true' : 'false');
													maindiv.setAttribute('data-axis-y2-hidden', (!needY2) ? 'true' : 'false');
												} catch(e) {}

												// Ensure a per-graph <style> rule exists to forcibly hide any newly-created axis nodes
												try {
													const safeId = maindiv.id || (`zone-${instZone}`);
													const styleId = 'axis-hide-' + safeId;
													let styleEl = document.getElementById(styleId);
													// Use attribute selector to avoid needing to escape the id in CSS
													const sel = `[id="${maindiv.id}"]`;
													let rules = '';
													if (!needY) {
														rules += `${sel} .dygraph-label.dygraph-ylabel, ${sel} .dygraph-axis-label-y { display: none !important; }\n`;
													}
													if (!needY2) {
														rules += `${sel} .dygraph-label.dygraph-y2label, ${sel} .dygraph-axis-label-y2 { display: none !important; }\n`;
													}
													if (!styleEl) {
														styleEl = document.createElement('style');
														styleEl.id = styleId;
														styleEl.setAttribute('data-generated-for', safeId);
														document.head.appendChild(styleEl);
													}
													styleEl.textContent = rules;
													// If both axes are needed, remove the style to avoid stale rules
													if (needY && needY2 && styleEl && styleEl.textContent.trim() === '') {
														try { styleEl.parentNode && styleEl.parentNode.removeChild(styleEl); } catch(e) {}
													}
												} catch(e) { /* ignore */ }

												// Attach a parent MutationObserver to detect newly inserted axis nodes
												try {
												// `showGraphProgressNow` retired: use `updateGraphProgress` directly from fetchDataRange
													if (!maindiv.__axisParentObserver) {
														maindiv.__axisParentObserver = new MutationObserver((mutations) => {
															let found = false;
															for (const m of mutations) {
																if (m.addedNodes && m.addedNodes.length) {
																	for (const n of m.addedNodes) {
																		try {
																			if (!(n instanceof Element)) continue;
																			if (n.matches && (n.matches('.dygraph-label.dygraph-ylabel') || n.matches('.dygraph-label.dygraph-y2label') || n.matches('.dygraph-axis-label-y') || n.matches('.dygraph-axis-label-y2'))) {
																				found = true; break;
																			}
																			if (n.querySelector && (n.querySelector('.dygraph-label.dygraph-ylabel') || n.querySelector('.dygraph-label.dygraph-y2label') || n.querySelector('.dygraph-axis-label-y') || n.querySelector('.dygraph-axis-label-y2'))) {
																				found = true; break;
																			}
																		} catch(e) {}
																	}
																}
																if (found) break;
															}
															if (found) {
																if (debug) console.debug(`[AxVis] mutation detected for zone=${instZone} type=${instType} — reapplying enforce`);
																enforce();
															}
														});
													maindiv.__axisParentObserver.observe(maindiv, { childList: true, subtree: true });
													}

													// Auto-disconnect after short time to avoid long-lived observers
													if (maindiv.__axisObserverTimeout) clearTimeout(maindiv.__axisObserverTimeout);
													maindiv.__axisObserverTimeout = setTimeout(() => {
														try { if (maindiv.__axisParentObserver) { maindiv.__axisParentObserver.disconnect(); delete maindiv.__axisParentObserver; } } catch(e) {}
													}, 3000);
												} catch (e) {
													/* ignore observer failures */
												}
											}
										} catch (err2) {
											console.debug && console.debug('[Diag] updateAxesVisibility DOM toggle failed', err2);
										}
									} catch (err) {
										console.warn('[Diag] updateAxesVisibility outer error', err);
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


/*  ---------------------------
    --- 2) Determine layout ---
    ---------------------------
*/
// Déterminer le nombre de graphes à afficher simultanément et leur orientation (row vs column) en fonction du mode d'affichage (mobile/desktop, portrait/landscape)
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

/** Calcule et applique les hauteurs CSS pour le plein écran */
function applyChartHeights() {
    const headerH = $('#graphHeader').outerHeight() || 40;
    const periodH = $('#periodControlBox').outerHeight() || 0;
    const navH = $('#navZone').outerHeight() || 65; // Hauteur fixe pour le Navigator (wrapper + marges)
	const margin = 0; // Marges et paddings cumulés
	
	
    const availableDataH = window.innerHeight - headerH - navH - periodH - margin;	// On calcule la hauteur disponible pour les graphiques Y1, Y2, Y3
	console.debug("Window:",window.innerHeight, "headerH:",headerH,", periodH:", periodH, ", Nav:", navH, ", availableDataH:",availableDataH)
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



/*  ---------------------------------
    --- 3) Progress bar utilities ---
    ---------------------------------
*/
// Mise à jour progress bar graphique (création si nécessaire) — appelée depuis fetchDataRange pour les longues opérations de chargement
function updateGraphProgress(current, total, message) {
	let percent = 0;
	try { percent = Math.round((current / total) * 100); } catch(e) { percent = 0; }
	percent = Math.max(0, Math.min(100, percent));
	
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
		
		// Append progress HTML (styles are in piscineGraphs.css)
		$('body').append(progressHTML);
	}
	
	$('#graphProgressBar').css('width', percent + '%').text(percent + '%');
	// Also set inline style directly to avoid jQuery/stylesheet race and use transform fallback
	try {
		const barEl = document.getElementById('graphProgressBar');
		if (barEl) {
			// Base width 100% then scaleX for reliable rendering
			barEl.style.width = '100%';
			barEl.style.minWidth = '0';
			barEl.style.transform = `scaleX(${percent/100})`;
			barEl.style.transformOrigin = 'left';
			barEl.style.willChange = 'transform';
			// diagnostic removed
		}
	} catch(e) { /* ignore */ }
	$('#graphProgressMessage').text(message);
	$('#graphProgressDetail').text(`${current} / ${total}`);

	const el2 = $('#graphProgressContainer');
	try {
		// Ensure attached to body
		if (el2.length && (!el2[0].parentNode || el2.closest('body').length === 0)) {
			try { $('body').append(el2); } catch(e) {}
		}
		// Force inline styles to make it visible layer and ready for reveal
		el2.css({ display: 'block', zIndex: 99999, opacity: 1, visibility: 'visible', pointerEvents: 'auto' });

		// Force immediate reveal to ensure visibility even during synchronous/blocking work
		try {
			el2.css('opacity', 1);
			// also set via direct style to avoid jQuery timing issues
			try { el2[0].style.opacity = '1'; } catch(e) {}
			graphProgressShown = true;
		} catch(e) { console.warn('[GraphProgress] reveal failed', e); }
	} catch (e) { console.warn('[GraphProgress] show failed inner', e); }

	// Diagnostic: log real widths to detect mismatch between percent and rendered width
	try {
		const bar = $('#graphProgressBar');
		const track = bar.parent();
		if (bar.length && track.length) {
			const barCss = bar.css('width');
			const barRect = bar[0].getBoundingClientRect();
			const trackRect = track[0].getBoundingClientRect();
			let renderedPct = trackRect.width ? Math.round((barRect.width / trackRect.width) * 100) : null;
			// diagnostic removed
		}
	} catch(e) { /* silent */ }
}

// Masquer progress bar
function hideGraphProgress() {
	try {
		const el = $('#graphProgressContainer');
		// Cancel pending reveal
		if (el.length) {
			// Animate collapse: scaleX -> 0 then fade out container
			try {
				const bar = document.getElementById('graphProgressBar');
				if (bar) {
					bar.style.transition = 'transform 220ms ease';
					bar.style.transformOrigin = 'left';
					bar.style.transform = 'scaleX(0)';
				}
				// also fade out container for smooth disappearance
				el.css({ opacity: 0, transition: 'opacity 260ms ease' });
				setTimeout(() => { try { el.remove(); } catch(e) {} }, 320);
			} catch(e) { try { el.remove(); } catch(_) {} }
		}
	} catch (e) {}
	graphProgressShown = false;
}


/*  ------------------------------  
    --- 4) Data initialization ---
    ------------------------------
*/
// Génération des données pour le navigateur
function generateNavigatorData(start, end, options = {}) {
  const debug = options.debug || false;
  const intervalMinutes = options.intervalMinutes || 15;
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
// Initialisation des données: charger les 3 derniers jours et préparer les graphiques
async function initData() {
	currEnd = now = dayjs().set("minute",0).set("second",0);
	// Initialisation: charger 3 derniers jours en respectant la règle serveur (jours := 01:00..00:00)
	const rawStart = dayjs().subtract(3, "day");
	const normalized = normalizeRangeForServer(rawStart, now);
	CurrStart = start = normalized.ds;
	currEnd = now = normalized.de.isBefore(now) ? normalized.de : now;
	console.debug && console.debug("Fetching Origin Data: start:"+start.format()+" end:"+now.format());

		// 1. Générer les données simulées (ou les charger depuis le serveur)
		// Marquer la phase d'initialisation pour que getOriginData puisse forcer la borne 'start' au début du jour
		try {
			window._initializing = true;
			await getOriginData(start, now);    // ← Cette fonction remplit dataOrigin et normalise dans chartdata
		} finally {
			window._initializing = false;
		}
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
				const data = generateNavigatorData(start, now, { intervalMinutes: 15, debug });
				window.graphInstances.push(new GraphInstance(4, 'navigator', data, mapping, config, displayed, "", ""));
			}
		});
}

// First step of data initialization: fetch or generate the origin data, then normalize it for charting
async function getOriginData(start, now){
	i=0;
	// Si nous sommes en phase d'initialisation, forcer la borne start au début du jour
	let genStart = start;
	let genEnd = now;
	try {
		if (window._initializing) genStart = dayjs(start).startOf('day').toDate();
	} catch(e) {}
	try { genEnd = dayjs(now).toDate(); } catch(e) { genEnd = now; }
	dataOrigin = await window.generatePoolData(genStart, genEnd, { intervalMinutes: 15, debug });
//	dataOrigin=await fetchDataChunked(start,now);  // ← NOUVELLE API: Chunking multi-requêtes
	chartdata=getNormalizedData();  // Normalisation (ex: décalage PAC/PP pour éviter chevauchement)
	// Rebuild fast index after initial normalization
	rebuildChartdataIndex();
	// Initialiser le cache avec les données d'origine
	populateCache(dataOrigin);
}

// Normalisation des données pour les graphiques: appliquer des offsets sur les séries d'équipements pour les différencier visuellement
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

// Rebuild the chartdataIndex for fast timestamp lookups after any update to chartdata
function rebuildChartdataIndex() {
	chartdataIndex = new Map();
	try {
		for (let i = 0; i < (chartdata || []).length; i++) {
			const r = chartdata[i];
			if (r && r[0]) chartdataIndex.set(+r[0], i);
		}
	} catch (e) { /* ignore */ }
}

// Mettre à jour le cache de jours disponibles et les données d'origine avec de nouvelles données brutes (ex: après chargement chunké)
function populateCache(data) {
	// Nouvelle stratégie : availableDays est un Set de jours disponibles (format "YYYY-MM-DD") — on ajoute les jours présents dans data
	// dataOrigin contient les lignes brutes (utiles pour export) — on met à jour dataOrigin
	let addedDays = 0;
	data.forEach(row => {
		if (row && row[0]) {
			const d = (row[0] instanceof Date) ? row[0] : new Date(row[0]);
			if (isNaN(d)) return;
			const dayKey = dayjs(d).format("YYYY-MM-DD");
			if (!availableDays.has(dayKey)) { availableDays.add(dayKey); addedDays++; }
			// Conserver dataOrigin comme source d'export: append si absent (dédup par timestamp)
			try {
				const ts = +d;
				const exists = dataOrigin.some(r => +r[0] === ts);
				if (!exists) dataOrigin.push([d, ...row.slice(1)]);
			} catch (e) {}
		}
	});
	// keep dataOrigin sorted by timestamp
	try { dataOrigin.sort((a,b)=> +a[0] - +b[0]); } catch(e) {}
	if (addedDays) console.info(`[populateCache] ajout ${addedDays} jours à availableDays (total=${availableDays.size})`);
}

// Extrait la configuration des capteurs pour un type donné selon le mapping demandé
function extractConfig(type, mapping) {
	const result = {};
	mapping.forEach(label => {
		if (SENSOR_CONFIG[label]) {
			result[label] = { ...SENSOR_CONFIG[label] };
		}
	});
	return result;
}

// Extrait les colonnes de chartdata correspondant au mapping demandé, avec filtrage optionnel par plage de dates (startDate, endDate) --- 
function extractColumns(mapping, startDate = null, endDate = null) {
	// mapping = liste des colonnes à extraire (ex: ["PHVal", "RedoxVal", ...])
	// chartdata = tableau de lignes (chaque ligne = [Date, PHVal, ...])
	// On suppose que la première colonne est Date
	const indices = [0]; // Date toujours
	mapping.forEach(label => {
		const idx = ALL_LABELS.indexOf(label);
		if (idx > 0) indices.push(idx);
	});

	let startMs = null, endMs = null;
	try { if (startDate) startMs = +dayjs(startDate); } catch(e) { startMs = null; }
	try { if (endDate) endMs = +dayjs(endDate); } catch(e) { endMs = null; }

	// Filter chartdata by optional range, then map to selected indices
	if ((startMs !== null) || (endMs !== null)) {
		return (chartdata || []).filter(row => {
			try {
				const t = +row[0];
				if (startMs !== null && t < startMs) return false;
				if (endMs !== null && t > endMs) return false;
				return true;
			} catch(e) { return false; }
		}).map(row => indices.map(idx => row[idx]));
	}

	return (chartdata || []).map(row => indices.map(idx => row[idx]));
}

// Normalise une ligne de données brutes en appliquant les offsets nécessaires pour les séries d'é
function normalizeRow(rawRow) {
	if (!rawRow || !rawRow[0]) return null;
	const row = [...rawRow];
	// Ensure Date object
	row[0] = (row[0] instanceof Date) ? row[0] : new Date(row[0]);
	// Indices selon ALL_LABELS
	row[11] = (row[11] !== null && row[11] !== undefined) ? row[11] : null;
	row[12] = (row[12] !== null && row[12] !== undefined) ? row[12] + 1 : null;
	row[13] = (row[13] !== null && row[13] !== undefined) ? row[13] + 2 : null;
	row[8]  = (row[8]  !== null && row[8]  !== undefined) ? row[8]  + 3 : null;
	row[9]  = (row[9]  !== null && row[9]  !== undefined) ? row[9]  + 4 : null;
	row[10] = (row[10] !== null && row[10] !== undefined) ? row[10] + 5 : null;
	return row;
}

// Insère une liste de lignes normalisées dans chartdata en maintenant l'ordre chronologique et en évitant les doublons (basé sur timestamp)
function insertNormalizedRows(rawRows) {
	if (!Array.isArray(rawRows) || rawRows.length === 0) return 0;
	if (!chartdata) chartdata = [];
	// Normalize and sort incoming rows by timestamp
	const normalized = [];
	for (const r of rawRows) {
		try {
			const nr = normalizeRow(r);
			if (nr) normalized.push(nr);
		} catch (e) {}
	}
	if (normalized.length === 0) return 0;
	normalized.sort((a,b)=> +a[0] - +b[0]);

	// Diagnostic: log min/max dates and check for duplicates
	try {
		const dates = normalized.map(r => +r[0]);
		const minDate = dates.length ? new Date(Math.min(...dates)).toISOString() : 'n/a';
		const maxDate = dates.length ? new Date(Math.max(...dates)).toISOString() : 'n/a';
		const uniqueDates = new Set(dates);
		if (dates.length !== uniqueDates.size) {
			console.warn(`[insertNormalizedRows] Attention: doublons détectés dans les données insérées (${dates.length - uniqueDates.size} doublons)`);
		}
		console.info(`[insertNormalizedRows] min=${minDate} max=${maxDate} count=${dates.length}`);
	} catch(e) {}

	// helper binary search
	function findInsertIndex(arr, time) {
		let lo = 0, hi = arr.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (+arr[mid][0] < time) lo = mid + 1; else hi = mid;
		}
		return lo;
	}

	// Diagnostic : log les timestamps à insérer et ceux déjà présents
	try {
		const toInsert = normalized.map(nr => +nr[0]);
		const alreadyPresent = toInsert.filter(t => chartdataIndex.has(t));
		const notPresent = toInsert.filter(t => !chartdataIndex.has(t));
		console.info(`[insertNormalizedRows] à insérer: ${toInsert.length}, déjà présents: ${alreadyPresent.length}, nouveaux: ${notPresent.length}`);
	} catch(e) {}

	let inserted = 0;
	// Gap-filling: optionally insert placeholders (NaN) or interpolated values for missing timestamps
	try {
		const fillMode = (window.appSettings && window.appSettings.fillMissing) ? window.appSettings.fillMissing : 'none';
		if (fillMode && fillMode !== 'none') {
			// Determine expected interval from normalized timestamps (median diff) or default 15min
			const timestamps = normalized.map(r => +r[0]);
			let expected = 15 * 60000;
			if (timestamps.length >= 2) {
				const diffs = [];
				for (let i = 1; i < timestamps.length; i++) diffs.push(timestamps[i] - timestamps[i-1]);
				diffs.sort((a,b)=>a-b);
				expected = diffs[Math.floor(diffs.length/2)] || expected;
			}

			// Build a set of times already provided in this batch
			const normalizedSet = new Set(timestamps);
			// Determine min/max range for filling
			const minT = Math.min(...timestamps);
			const maxT = Math.max(...timestamps);
			// Generate expected timeline between minT and maxT inclusive
			const placeholders = [];
			for (let t = minT; t <= maxT; t += expected) {
				if (!normalizedSet.has(t) && !chartdataIndex.has(t)) {
					placeholders.push(t);
				}
			}

			// Helper to retrieve nearest known value for interpolation
			function findNeighborValue(ts, colIndex, direction) {
				// direction: -1 => previous, +1 => next
				// Search in normalized (new) first, then in existing chartdata
				if (direction === -1) {
					// previous
					for (let i = timestamps.length - 1; i >= 0; i--) if (timestamps[i] < ts) {
						const row = normalized[i]; if (row && row[colIndex] != null) return { t: timestamps[i], v: row[colIndex] };
					}
					// fallback to chartdata
					for (let [tt, idx] of chartdataIndex) {
						if (tt < ts) {
							const r = chartdata[idx]; if (r && r[colIndex] != null) return { t: tt, v: r[colIndex] };
						}
					}
				} else {
					// next
					for (let i = 0; i < timestamps.length; i++) if (timestamps[i] > ts) {
						const row = normalized[i]; if (row && row[colIndex] != null) return { t: timestamps[i], v: row[colIndex] };
					}
					for (let [tt, idx] of chartdataIndex) {
						if (tt > ts) {
							const r = chartdata[idx]; if (r && r[colIndex] != null) return { t: tt, v: r[colIndex] };
						}
					}
				}
				return null;
			}

			// Create placeholder rows
			const createdPlaceholders = [];
			for (const t of placeholders) {
				const rowTemplate = new Array(normalized[0].length).fill(null);
				rowTemplate[0] = new Date(t);
				if (fillMode === 'interpolate') {
					// Try to interpolate each numeric column
					for (let c = 1; c < rowTemplate.length; c++) {
						const prev = findNeighborValue(t, c, -1);
						const next = findNeighborValue(t, c, +1);
						if (prev && next && prev.t !== next.t) {
							const ratio = (t - prev.t) / (next.t - prev.t);
							const val = prev.v + (next.v - prev.v) * ratio;
							rowTemplate[c] = Number.isFinite(val) ? +val : null;
						} else {
							rowTemplate[c] = null;
						}
					}
				}
				// for 'nan' mode, keep nulls
				createdPlaceholders.push(rowTemplate);
			}

			if (createdPlaceholders.length) {
				// Merge placeholders into normalized array and re-sort
				for (const ph of createdPlaceholders) normalized.push(ph);
				normalized.sort((a,b)=> +a[0] - +b[0]);
				// Update diagnostics
				try { console.info(`[insertNormalizedRows] fillMode=${fillMode} placeholdersAdded=${createdPlaceholders.length}`); } catch(e) {}
			}
		}
	} catch(e) { console.warn('[insertNormalizedRows] gap-filling failed', e); }
	for (const nr of normalized) {
		try {
			const t = +nr[0];
			if (chartdataIndex.has(t)) {
				const idx = chartdataIndex.get(t);
				chartdata[idx] = nr; // replace existing
			} else {
				const idx = findInsertIndex(chartdata, t);
				chartdata.splice(idx, 0, nr);
				inserted++;
			}
		} catch (e) { /* ignore */ }
	}

	// Déduplication : ne garder qu'une ligne par timestamp (la dernière)
	try {
		const seen = new Map();
		for (let i = chartdata.length - 1; i >= 0; i--) {
			const t = +chartdata[i][0];
			if (seen.has(t)) {
				chartdata.splice(i, 1); // retire le doublon
			} else {
				seen.set(t, true);
			}
		}
	} catch(e) { console.warn('[insertNormalizedRows] déduplication failed', e); }

	// Rebuild the index after batch insertion
	try { rebuildChartdataIndex(); } catch(e) {}

	try { console.info(`[insertNormalizedRows] normalized=${normalized.length} inserted=${inserted} chartdata=${chartdata.length} index=${chartdataIndex.size}`); } catch(e) {}

	// Notify user and add badge if placeholders were added by gap-filling
	try {
		if (window.appSettings && window.appSettings.fillMissing && window.appSettings.fillMissing !== 'none') {
			// Count placeholders by checking entries with mostly-null values
			const placeholderCount = normalized.filter(r => {
				let nn = 0; for (let i = 1; i < r.length; i++) if (r[i] == null) nn++;
				return nn >= (r.length - 2); // heuristique: nearly all null => placeholder
			}).length - (rawRows ? rawRows.length : 0);
			if (placeholderCount > 0) {
				const msg = `Données incomplètes: ${placeholderCount} points ajoutés (mode ${window.appSettings.fillMissing})`;
				try { if (typeof showToast === 'function') showToast(msg, 'warning'); else console.warn(msg); } catch(e) { console.warn(msg); }
				try {
					$('#dataIncompleteBadge').remove();
					$('#dateRangeText').append(`<span id="dataIncompleteBadge" style="color:orange;margin-left:8px;cursor:pointer">⚠️ ${placeholderCount}</span>`);
					$('#dataIncompleteBadge').off('click').on('click', function(){
						const sample = normalized.filter(r=>{ let nn=0; for(let i=1;i<r.length;i++) if(r[i]==null) nn++; return nn>=(r.length-2); }).slice(0,20).map(r=> new Date(r[0]).toISOString());
						alert(`Données incomplètes — exemples de timestamps manquants (max 20):\n` + sample.join('\n'));
					});
				} catch(e) { console.warn('[insertNormalizedRows] badge DOM update failed', e); }
			}
		}
	} catch(e) { /* non-blocking */ }

	return inserted;
}

// Diagnostic helper: analyse la continuité des données dans chartdata et dataOrigin
function analyzeDataContinuity() {
	try {
		if (!chartdata || chartdata.length === 0) {
			console.info('[DataDiag] chartdata vide');
			return;
		}
		// Determine expected interval (infer from mode: default 15min)
		const diffs = [];
		for (let i = 1; i < Math.min(chartdata.length, 500); i++) {
			diffs.push(+chartdata[i][0] - +chartdata[i-1][0]);
		}
		const median = diffs.length ? diffs.sort((a,b)=>a-b)[Math.floor(diffs.length/2)] : 15*60000;
		const expected = median || 15*60000;

		// Scan for large gaps
		const gaps = [];
		for (let i = 1; i < chartdata.length; i++) {
			const prev = +chartdata[i-1][0];
			const cur = +chartdata[i][0];
			const delta = cur - prev;
			if (delta > expected * 1.5) {
				gaps.push({ index: i-1, from: new Date(prev).toISOString(), to: new Date(cur).toISOString(), delta, missingPoints: Math.round(delta / expected) - 1 });
			}
		}

		// Per-day counts from dataOrigin and from chartdata
		const perDayOrigin = new Map();
		(dataOrigin || []).forEach(r => { try { const k = dayjs(r[0]).format('YYYY-MM-DD'); perDayOrigin.set(k, (perDayOrigin.get(k)||0)+1); } catch(e){} });
		const perDayChart = new Map();
		(chartdata || []).forEach(r => { try { const k = dayjs(r[0]).format('YYYY-MM-DD'); perDayChart.set(k, (perDayChart.get(k)||0)+1); } catch(e){} });

		console.info(`[DataDiag] chartdata=${chartdata.length} index=${chartdataIndex.size} expected_interval_ms=${expected} gaps=${gaps.length}`);
		if (gaps.length) console.info('[DataDiag] sample gaps:', gaps.slice(0,6));
		// Log per-day summary (few days)
		const days = Array.from(new Set([...perDayOrigin.keys(), ...perDayChart.keys()])).sort();
	} catch (e) {
		console.warn('[DataDiag] erreur', e);
	}
}

/*  ---------------------------------------------  
    --- 5) Data fetching / range modification ---
    ---------------------------------------------
*/
// get and load new data to graphs
function getNewData(debut, fin) {
	// Annuler le timer précédent
	if (updateDebounceTimer != null) clearTimeout(updateDebounceTimer);

	updateDebounceTimer = setTimeout(async () => {
		if (getNewData.__inProgress) {
			console.warn('[getNewData] opération déjà en cours — skip');
			return;
		}
		getNewData.__inProgress = true;
		try {
			console.debug && console.debug(`getNewData: fetching from ${debut.format("DD-MM-YYYY")} to ${fin.format("DD-MM-YYYY")}`);
			// Timestamp pour diagnostic / fallback si la barre n'a pas pu s'afficher
			const _gpStart = (window.performance && performance.now) ? performance.now() : Date.now();
			// progress bar handling moved into fetchDataRange (fetch-level progress)

			// 2) récupérer uniquement les jours nécessaires via fetchDataRange
			const newRows = await fetchDataRange(debut, fin);

			console.info(`[getNewData] fetchedRows=${newRows ? newRows.length : 0}`);

			if (newRows && newRows.length) {
				// 2) marquer les jours comme disponibles et mettre à jour dataOrigin
				try { populateCache(newRows); } catch(e) { console.warn('[getNewData] populateCache failed', e); }

				// 3) insérer incrémentalement les nouvelles lignes normalisées dans chartdata
				try {
					const inserted = insertNormalizedRows(newRows);
					console.debug && console.debug(`[getNewData] inserted ${inserted} new normalized rows`);
				} catch(e) { console.warn('[getNewData] insertNormalizedRows failed', e); }

				// 4) mettre à jour chaque instance de graphe (fournir le dataset complet ou fenêtre adaptée)
				try {
					if (window.graphInstances && Array.isArray(window.graphInstances)) {
						window.graphInstances.forEach(inst => {
							try {
								// Extraire uniquement les données correspondant à la plage demandée (début/fin)
								const instData = extractColumns(inst.mapping || [], debut, fin);
								inst.data = instData;
								if (inst.dygraph && typeof inst.dygraph.updateOptions === 'function') {
									inst.dygraph.updateOptions({ file: instData, dateWindow: [debut.toDate(), fin.toDate()] });
									// Ensure any displayed dygraph linked to this instance/template is also updated
									try {
										Object.values(window.displayedGraphs || {}).forEach(d => {
											if (!d) return;
											// match by template object or by type
											if (d.template === inst || d.type === inst.type) {
												try {
													if (d.dygraph && typeof d.dygraph.updateOptions === 'function') {
														d.dygraph.updateOptions({ file: instData, dateWindow: [debut.toDate(), fin.toDate()] });
													}
												} catch(_) {}
											}
										});
									} catch(_) {}
								}
							} catch(e) {}
						});
					}
				} catch(e) { console.warn('[getNewData] update instances error', e); }
			}

			// Même s'il n'y a pas de nouvelles lignes (ex: réduction de plage), appliquer la découpe
			try {
				if (window.graphInstances && Array.isArray(window.graphInstances)) {
					window.graphInstances.forEach(inst => {
						try {
							const instData = extractColumns(inst.mapping || [], debut, fin);
							inst.data = instData;
							if (inst.dygraph && typeof inst.dygraph.updateOptions === 'function') {
								inst.dygraph.updateOptions({ file: instData, dateWindow: [debut.toDate(), fin.toDate()] });
							}
							// aussi appliquer aux displayedGraphs correspondants
							try { Object.values(window.displayedGraphs || {}).forEach(d => {
								if (!d) return;
								if (d.template === inst || d.type === inst.type) {
									try { if (d.dygraph && typeof d.dygraph.updateOptions === 'function') d.dygraph.updateOptions({ file: instData, dateWindow: [debut.toDate(), fin.toDate()] }); } catch(_) {}
								}
							}); } catch(_) {}
					} catch(e) {}
				});
			}
			} catch(e) { console.warn('[getNewData] post-update slice failed', e); }

			// 5) Mettre à jour la plage courante et forcer la dateWindow (la vue visible)
			try { CurrStart = debut; CurrEnd = fin; } catch(e){}
			try {
				Object.values(window.displayedGraphs || {}).forEach(d => {
					try {
						if (d && d.dygraph && CurrStart && CurrEnd) d.dygraph.updateOptions({ dateWindow: [CurrStart.toDate(), CurrEnd.toDate()] });
					} catch(e) {}
				});
			} catch(e) {}

			// 6) Notifier resize/sync si besoin
			try { scheduleGraphResize(60); } catch(e) {}

			// Progress overlay is managed by fetchDataRange; nothing to clean here

			// Diagnostic: analyse de continuité si mode debug actif (Option 1)
			try { if (debug) analyzeDataContinuity(); } catch(e) { console.warn('[getNewData] analyzeDataContinuity failed', e); }

		} catch (e) {
			console.error('[getNewData] erreur générale', e);
		} finally {
			getNewData.__inProgress = false;
		}
	}, 300);
}

// utilise availableDays pour identifier les jours manquants, tente de récupérer uniquement les jours nécessaires, et gère les cas de jours partiellement complets (bordures)
async function fetchDataRange(debut, fin) {
	const start = dayjs(debut).startOf('day');
	const end = dayjs(fin).endOf('day');
	const missingRanges = [];
	const result = [];

	// Parcourir chaque jour de la période demandée et utiliser availableDays
	let current = start.clone();
	while (current.isBefore(end) || current.isSame(end, 'day')) {
		const dayKey = current.format("YYYY-MM-DD");
		if (availableDays.has(dayKey)) {
			// Extraire les lignes correspondantes depuis dataOrigin, mais NE PAS renvoyer celles déjà dans chartdataIndex
			try {
				// Define server-aligned day window: day starts at 01:00 and ends at next-day 00:00
				const dayStartServer = current.clone().hour(1).minute(0).second(0).millisecond(0);
				const dayEndServer = current.clone().add(1, 'day').hour(0).minute(0).second(0).millisecond(0);
				const dayRows = dataOrigin.filter(r => {
					try {
						const t = dayjs(r[0]);
						// include rows with timestamps in [dayStartServer, dayEndServer)
						return (!t.isBefore(dayStartServer)) && t.isBefore(dayEndServer);
					} catch(e) { return false; }
				});
				// Filtrer les lignes déjà présentes dans chartdataIndex
				const newRows = dayRows.filter(r => !chartdataIndex.has(+r[0]));
				if (newRows && newRows.length) {
					console.info(`[fetchDataRange] day=${dayKey} available=${dayRows.length} new=${newRows.length}`);
					result.push(...newRows);
				} else {
					console.debug && console.debug(`[fetchDataRange] day=${dayKey} available=${dayRows.length} new=0`);
				}

				// Re-fetch bordures: si le jour est présent mais contient moins de points que prévu,
				// tenter un fetch élargi +/- 1 heure afin de récupérer des points tronqués aux bords.
				try {
					const intervalMinutes = 15; // cohérent avec usage courant
					// Server day is 01:00..00:00 (23 hours)
					const expectedPerDay = Math.round((23 * 60) / intervalMinutes);
					if ((dayRows.length || 0) > 0 && (dayRows.length < expectedPerDay)) {
						console.info(`[fetchDataRange] day=${dayKey} incomplete (${dayRows.length}/${expectedPerDay}), attempting border re-fetch +/-1h`);
						const genStart = dayStartServer.subtract(1, 'hour').toDate();
						const genEnd = dayEndServer.add(1, 'hour').toDate();
						const fetched = await window.generatePoolData(genStart, genEnd, { intervalMinutes, debug });
						if (fetched && fetched.length) {
							// Extraire uniquement les lignes appartenant au jourKey et non présentes
							const dayFetched = fetched.filter(r => {
								try { return dayjs(r[0]).format('YYYY-MM-DD') === dayKey; } catch(e) { return false; }
							});
							const additional = dayFetched.filter(r => !chartdataIndex.has(+r[0]) && !dayRows.some(rr => +rr[0] === +r[0]));
							if (additional.length) {
								console.info(`[fetchDataRange] day=${dayKey} border-refetch added=${additional.length}`);
								try { populateCache(additional); } catch(e) { console.warn('[fetchDataRange] populateCache failed for border-refetch', e); }
								result.push(...additional);
							}
						}
					}
				} catch(e) { console.warn('[fetchDataRange] border re-fetch failed', e); }
			} catch(e) { /* ignore */ }
		} else {
			// Jour manquant -> construire une plage manquante contiguë
			const rangeStart = current.clone();
			while (!availableDays.has(current.format("YYYY-MM-DD")) && (current.isBefore(end) || current.isSame(end, 'day'))) {
				current = current.add(1, 'day');
			}
			missingRanges.push({ start: rangeStart, end: current.subtract(1, 'day') });
			current = current.subtract(1, 'day');
		}
		current = current.add(1, 'day');
	}
	// Diagnostics: log missing ranges and availableDays summary
	try {
		const missingDays = missingRanges.flatMap(r => {
			const arr = [];
			let d = r.start.clone();
			while (d.isBefore(r.end) || d.isSame(r.end, 'day')) { arr.push(d.format('YYYY-MM-DD')); d = d.add(1,'day'); }
			return arr;
		});
		console.debug(`[fetchDataRange] availableDays=${Array.from(availableDays).slice(0,6).join(',')}... total=${availableDays.size} missingDays=${missingDays.slice(0,10).join(',')}`);
	} catch(e) {}

	// Calculer nombre total de jours manquants (inclusifs)
	let totalDaysToFetch = 0;
	missingRanges.forEach(r => {
		let d = r.start.clone();
		while (d.isBefore(r.end) || d.isSame(r.end, 'day')) { totalDaysToFetch++; d = d.add(1, 'day'); }
	});
	console.info(`[fetchDataRange] totalDaysToFetch=${totalDaysToFetch} missingRanges=${missingRanges.length}`);
	let progressActive = false;
	let fetchedDays = 0;

	// Télécharger les plages manquantes avec API chunked
	for (const range of missingRanges) {
		console.debug && console.debug(`Fetching missing data from ${range.start.format("DD-MM-YYYY")} to ${range.end.format("DD-MM-YYYY")} (full-day)`);
		// Passer des Date alignées sur la logique serveur: each day => 01:00 .. next-day 00:00
		const genStart = range.start.hour(1).minute(0).second(0).millisecond(0).toDate();
		const genEnd = range.end.add(1, 'day').hour(0).minute(0).second(0).millisecond(0).toDate();
		const newData = await window.generatePoolData(genStart, genEnd, { intervalMinutes: 15, debug });
//		const newData = await fetchDataChunked(range.start, range.end);  // ← Utilise API chunked
		// fetchDataChunked retourne déjà des lignes parsées via csvToArray
		if (newData && newData.length) {
			try { populateCache(newData); } catch(e) { console.warn('[fetchDataRange] populateCache failed', e); }
			result.push(...newData);
			if (progressActive) {	// Mettre à jour la barre de progression par jour de plage traitée
				fetchedDays += 1;
				console.info(`[fetchDataRange] fetchedDays=${fetchedDays}/${totalDaysToFetch}`);
			}
		}
	}
	
	// Trier les résultats par date
	result.sort((a, b) => a[0] - b[0]);	
	return result;
}

// 1) obtenir la liste des jours disponibles, 
// 2) pour chaque jour, vérifier l'existence du fichier et son découpage en chunks, 
// 3) charger les chunks un par un et concaténer les données CSV, 
// 4) parser le CSV complet en tableau de lignes
// Note: Cette fonction suppose que le serveur expose les endpoints suivants :
// POST /api/graph/plan { sess, start, end } -> { total_days, available_days, dates[] }
// GET /api/graph/file-info?sess=&date=2024-01-01&chunk_size=1024 -> { exists, size, chunks }
// GET /api/graph/chunk?sess=&date=2024-01-01&index=0&size=1024 -> chunk de données CSV	
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
	
	let progressActive = false;
	let fetchedDays = 0;
	
	console.debug && console.debug("📊 [CHUNKED API] Fetching data: " + start.format("DD-MM-YYYY") + " → " + end.format("DD-MM-YYYY"));
	
	try {
		// Étape 1 : Récupérer le plan (start, end, total_days seulement - évite WDT serveur)
		
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
		if (availableDays > 7) {
			progressActive = true;
		}
		
		if (dates.length === 0) {
			hideGraphProgress();
			showToast("Aucune donnée disponible pour cette période", 'warning');
			return datas;
		}
		
		let totalChunks = 0;
		let loadedChunks = 0;
		const fileInfos = [];
		
		// Étape 2 : Récupérer info de chaque fichier
		
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
		if(progressActive) try { updateGraphProgress(0, totalChunks, `Téléchargement 0/${totalChunks} chunks…`); } catch(e) {}

		// Étape 3 : Charger chunks fichier par fichier
		let allData = "";
		
		console.debug && console.debug(`🔄 Début chargement chunks : ${fileInfos.length} fichiers, ${totalChunks} chunks total`);
		
		for (let fileIdx = 0; fileIdx < fileInfos.length; fileIdx++) {
			const fileInfo = fileInfos[fileIdx];
			
			for (let chunkIndex = 0; chunkIndex < fileInfo.chunks; chunkIndex++) {
				// Progression gérée par fetchDataRange ; ici on ne touche pas à la barre
				
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
					if(progressActive) try { updateGraphProgress(loadedChunks, totalChunks, `Téléchargement ${loadedChunks}/${totalChunks} chunks…`); } catch(e) {}
				} catch (error) {
					loadedChunks++;
					// Continue avec chunk suivant
				}
			}
		}
		// Étape 4 : Parser données
		const parsedData = csvToArray(allData.trim());
		datas.push(...parsedData);
		
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
	
/*  ------------------------------------
    --- 6) Dygraph-related functions ---
    ------------------------------------
*/
// Initialisation des graphiques : appliquer les hauteurs, créer les selecteurs d'axes, instancier les Dygraphs, gérer la synchro et le ResizeObserver
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
			console.info(`[initCharts] skipping creation for zone ${z} due to layout.count=${layout.count}`);
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
					console.debug('[ResizeObserver] déclenché, entries:', entries.map(e => e.target && (e.target.id || e.target.className)));
				} catch (e) {}
					// Utiliser le scheduler pour coalescer les resizes
					scheduleGraphResize();
			});
		});
		window.chartObserver.observe(dashboard);
	}
}

/** Calcule l'objet options complet pour l'instanciation ou l'update */
// instance = objet GraphInstance déjà préparé, isNavigator = bool, zoneIndex = 1..3 (pour logs)
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
		connectSeparatedPoints: false,
		animatedZooms: true,
		drawPoints: false,
		fillGraph: false,
		fillAlpha: 0.15,
		backgroundColor: '#000',
		strokeWidth: 1,
		margin: { left: 50, right: 15, top: 15, bottom: 15 },
		showRangeSelector: false,
		title: null,
		ylabel: y1Title,
		y2label: y2Title,
		labelsDivStyles: { 'textAlign': 'right' },
		yAxisLabelWidth: 60,
		y2AxisLabelWidth: 60,
		axes: {
			x: { drawAxis: false },
			y: { drawAxis: !!anyY },
			y2: { drawAxis: !!anyY2 },
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

// Met à jour les graphiques existants en fonction de l'état actuel (window.displayedGraphs) et du layout
// Si targetZone est défini, ne mettre à jour que cette zone (optimisation pour les changements d'axes)
function updateGraphs(targetZone) {
	// Log d'appel pour debug double invocation
	console.debug('[updateGraphs] Appel updateGraphs', new Error().stack.split('\n')[1].trim());
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
				console.warn(`[Dygraph][updateGraphs] Skipping zone ${zone} because dygraph not initialized yet`);
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
							console.info(`[Dygraph][updateGraphs] Applied explicit width to ${containerId}: ${w}px (from zone ${zoneEl.id})`);
						}
						if (h > 0 && Math.abs(container.clientHeight - h) > 1) {
							container.style.height = h + 'px';
							console.info(`[Dygraph][updateGraphs] Applied explicit height to ${containerId}: ${h}px (from zone ${zoneEl.id})`);
						}
					} else {
						console.warn(`[Dygraph][updateGraphs] zone ${zoneEl.id} not yet sized: ${zRect.width}x${zRect.height}`);
					}
				} else {
					console.warn(`[Dygraph][updateGraphs] zone element for ${containerId} introuvable`);
				}
			} else {
				console.warn(`[Dygraph][updateGraphs] ${containerId} introuvable`);
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
										console.info(`[Dygraph][updateGraphs] executing retry updateOptions for zone=${zone}`);
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
										try { console.info(`[Dygraph][updateGraphs] retry updateOptions succeeded for zone=${zone}`); } catch(e){}
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
											console.debug(`[Dygraph][updateGraphs] Set canvas pixels for ${containerId}: ${pixW}x${pixH} (dpr=${dpr})`);
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

	// --- X label near hovered point ---
	try {
		let xLabel = container.querySelector('.hover-x-label');
		if (!xLabel) {
			xLabel = document.createElement('div');
			xLabel.className = 'hover-x-label';
			xLabel.style.position = 'absolute';
			xLabel.style.pointerEvents = 'none';
			xLabel.style.zIndex = 9999;
			xLabel.style.padding = '4px 8px';
			xLabel.style.background = 'rgba(0,0,0,0.7)';
			xLabel.style.color = '#fff';
			xLabel.style.borderRadius = '6px';
			xLabel.style.fontSize = '12px';
			xLabel.style.whiteSpace = 'nowrap';
			container.appendChild(xLabel);
		}
		if (isHovering) {
			// Format date as DD/MM/YY HH:mm using dayjs if available, fallback to toLocaleString
			let xVal = data.x;
			let txt = '';
			try {
				if (typeof dayjs === 'function') txt = dayjs(xVal).format('DD/MM/YY HH:mm');
				else {
					const dt = new Date(xVal);
					const pad = n => n.toString().padStart(2, '0');
					txt = `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear().toString().slice(-2)} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
				}
			} catch(e) { txt = String(xVal); }
			xLabel.textContent = txt;
			// compute position: prefer pointer position if available, otherwise place above canvas near domX
			try {
				// install lightweight global pointer tracker once
				try {
					if (!window._hoverPointerInstalled) {
						window._hoverPointerInstalled = true;
						document.addEventListener('pointermove', function(ev){
							try { window._lastPointer = { pageX: ev.pageX, pageY: ev.pageY }; } catch(e) {}
						}, { passive: true });
					}
				} catch(_) {}

				const rect = container.getBoundingClientRect();
				const canvas = container.querySelector('canvas');
				const canvasRect = canvas ? canvas.getBoundingClientRect() : rect;
				const last = window._lastPointer || null;
				let leftCss, topCss;
				if (last && typeof last.pageX === 'number' && typeof last.pageY === 'number') {
					// position next to the pointer with small offset
					const relX = Math.round(last.pageX - rect.left);
					const relY = Math.round(last.pageY - rect.top);
					leftCss = relX + 12; // 12px to the right of pointer
					topCss = Math.max(4, relY - (xLabel.offsetHeight || 24) - 8);
				} else {
					const domX = Math.round(g.toDomXCoord(data.x));
					leftCss = Math.round(domX - (xLabel.offsetWidth || 60) / 2);
					topCss = Math.max(4, Math.round((canvasRect.top - rect.top) + 6));
				}
				xLabel.style.left = leftCss + 'px';
				xLabel.style.top = topCss + 'px';
				xLabel.style.display = '';
			} catch(e) { xLabel.style.display = 'none'; }
		} else {
			try { xLabel.style.display = 'none'; } catch(e) {}
		}
	} catch(e) {}
}

// Fonction pour dessiner les lignes de limites (min/max) sur le graphique en fonction de la configuration SENSOR_CONFIG et de la visibilité des séries. Appelée dans underlayCallback de Dygraph.
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

// Synchroniser les graphiques (si plusieurs) — à faire après création de tous les dygraphs pour éviter les erreurs de synchronisation
function synchronizeGraphs() {
	console.info('[synchronizeGraphs] État des zones affichées :');
	const activeGraphs = [];
	Object.keys(window.displayedGraphs || {}).forEach(zone => {
		const d = window.displayedGraphs[zone];
		const containerId = zone == 4 ? 'graph-canvas-nav' : `graph-canvas-${zone}`;
		const container = document.getElementById(containerId);
		console.debug(`  zone=${zone} type=${d && d.type} dygraph=`, !!(d && d.dygraph), 'container=', !!container);
		if (d && d.dygraph) activeGraphs.push(d.dygraph);
	});
	console.info('[synchronizeGraphs] Dygraph valides trouvés :', activeGraphs.length, activeGraphs);
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

// Cette fonction est appelée après updateGraphs pour s'assurer que les graphiques visibles sont redimensionnés correctement, même si le layout n'était pas encore appliqué lors de l'appel initial.
// Elle vérifie les containers des graphiques visibles et applique resize() uniquement à ceux qui ont une taille valide, avec un mécanisme de retry limité si aucun container n'est prêt.
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
			console.debug(`[Dygraph][resizeVisibleGraphs] Resizing ${container.id}: ${rect.width}x${rect.height}`);
			const displayed = window.displayedGraphs && window.displayedGraphs[zone];
			if (displayed && displayed.dygraph && typeof displayed.dygraph.resize === 'function') {
				displayed.dygraph.resize();
				// Log après resize (une frame plus tard pour laisser le DOM se stabiliser)
				requestAnimationFrame(() => {
					try {
						const afterRect = container.getBoundingClientRect();
						console.debug(`[Dygraph][afterResize] ${container.id}: ${afterRect.width}x${afterRect.height}`);
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

// Fonction appelée après changement de période (daterange picker)
function updateGraphsDateRange(startDate, endDate) {
	console.info("Updating graphs date range: " + startDate.format('DD/MMM/YY') + " to " + endDate.format('DD/MMM/YY'));
	
	Object.keys(charts).forEach(function(key) {
		if (charts[key] && typeof charts[key].updateOptions === 'function') {
			charts[key].updateOptions({
				dateWindow: [startDate.toDate(), endDate.toDate()]
			});
		}
	});
}

// Fonction pour créer un dygraph dans une zone donnée en fonction du sélecteur de graphique choisi
function createDygraphForZone(zone) {
	return new Promise((resolve) => {
		try {
			const sel = $(`#graphSelector${zone}`).val();
			console.debug(`[Diag] createDygraphForZone zone=${zone} graphSelector val=`, sel);
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
				console.debug(`[Diag] Dygraph created for zone=${zone} dy=`, !!dy);
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


// Scheduler pour regrouper/annuler les multiples demandes de resize (debounce)
// Cette fonction peut être appelée fréquemment (ex: lors de redimensionnements rapides) et s'assure que resizeVisibleGraphs n'est appelé qu'une fois après que les changements se sont stabilisés, avec un délai configurable.
window._graphResizeTimer = null;
function scheduleGraphResize(delay = 80) {
	if (window._graphResizeTimer) clearTimeout(window._graphResizeTimer);
	window._graphResizeTimer = setTimeout(() => {
		window._graphResizeTimer = null;
		try { resizeVisibleGraphs(0); } catch (e) { console.error('[scheduleGraphResize] erreur:', e); }
	}, delay);
}


/*  -------------------------------------
    --- 7) Interface / layout helpers ---
    -------------------------------------
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

/* Afficher la periode dans le bon formet */
function updatePeriodDisplay() {
    const period = $("#periodSelector1").val();
    const range = getPeriodDates(period); // Votre fonction de calcul de timestamps
    
	// Afficher la période en jours complets (startOf day -> endOf day), cap end sur maintenant
	try {
		let ds = dayjs.unix(range.start).startOf('day');
		let de = dayjs.unix(range.end).endOf('day');
		const now = dayjs();
		if (de.isAfter(now)) de = now;
		const formatD = (djs) => {
			const d = djs.toDate();
			const pad = (n) => n.toString().padStart(2, '0');
			return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear().toString().slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		};
		const text = formatD(ds) + " ➜ " + formatD(de);
		$("#dateRangeText").text(text);
		if (debug) console.debug("[PERIOD] Update UI (full-days):", text);
	} catch (e) {
		// fallback simple
		const format = (ts) => {
			const d = new Date(ts * 1000);
			const pad = (n) => n.toString().padStart(2, '0');
			return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear().toString().slice(-2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		};
		const text = format(range.start) + " ➜ " + format(range.end);
		$("#dateRangeText").text(text);
		if (debug) console.debug("[PERIOD] Update UI (fallback):", text);
	}

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


/*  ----------------------------  
    --- 8) Exports (PNG/CSV) ---
    ----------------------------
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

// --------------------------------  EVENEMENTS ---------------------------------------------------


/*  ----------------------  
    --- 9) User events ---
    ----------------------
*/
// --- DateRangePicker helpers (integration du daterangepicker.js) ---


// Formatage sécurisé d'un objet Moment pour affichage, avec fallback en cas d'erreur ou de format inattendu
function fmtMoment(m){ 
	try { return m && m.format ? m.format('DD/MM/YYYY') : '—'; } catch(e){ return '—'; } 
}

// Callback externalisée pour la sélection de plage (séparée pour réutilisation et tests)
function handleDateRangeSelected(start, end, label){
	try {
		// Log raw parameters passed to this handler
		console.log('[handleDateRangeSelected] parameters:', { start: start, end: end, label: label });
		console.info('daterangepicker selected:', start.format(), '->', end.format(), label);

		// Ensure start is not after end. If user somehow picked start> end, swap them.
		if (start.isAfter && end.isValid && start.isAfter(end)) {
			console.warn('[handleDateRangeSelected] start is after end — swapping values');
			const _s = start.clone ? start.clone() : moment(start);
			start = end.clone ? end.clone() : moment(end);
			end = _s;
			console.info('[handleDateRangeSelected] after swap:', start.format(), '->', end.format());
		}
		$('#dateRangeText').text(fmtMoment(start) + ' → ' + fmtMoment(end));
		$('#dateDisplayRange').attr('data-start', start.format()).attr('data-end', end.format());

		// Appel direct vers la récupération de données : conversion Moment -> dayjs
		try {
			if (typeof getNewData === 'function') {
				// Apply server-aligned day rules:
				// - Server produces hourly lines where the "0:00" row covers 23:00-0:00,
				//   therefore a logical "day" runs from 01:00 (inclusive) to 00:00 (exclusive
				//   of the next day). We map a selected calendar date to the interval
				//   start = date 01:00 and end = (date+1) 00:00. Exception: if the end date
				//   is today, use (currentHour - 1):00 as the end hour to avoid future hours.
				const today = dayjs();
				// Start at 01:00 of the selected start day
				let ds = dayjs(start.format('YYYY-MM-DD')).hour(1).minute(0).second(0).millisecond(0);

				// End: if end is today -> use currentHour-1, otherwise use next-day 00:00
				let de;
				if (dayjs(end.format('YYYY-MM-DD')).isSame(today, 'day')) {
					const h = Math.max(0, today.hour() - 1);
					de = dayjs(end.format('YYYY-MM-DD')).hour(h).minute(0).second(0).millisecond(0);
				} else {
					// map end date to the midnight that ends that logical day (next day 00:00)
					de = dayjs(end.format('YYYY-MM-DD')).add(1, 'day').hour(0).minute(0).second(0).millisecond(0);
				}

				// Defensive: if computed ds is after de (can happen when selecting today very early),
				// clamp ds to the earliest valid hour (00:00) and ensure ds <= de.
				if (ds.isAfter(de)) {
					console.warn('[handleDateRangeSelected] computed start is after computed end — adjusting start to 00:00 of start day');
					ds = dayjs(start.format('YYYY-MM-DD')).startOf('day');
					if (ds.isAfter(de)) {
						// As a last resort, swap them
						const tmp = ds; ds = de; de = tmp;
					}
				}

				// Marquer le select sur 'custom' pour refléter l'état
				try { $('#periodSelector1').val('custom').selectmenu('refresh'); } catch(_) {}
				// Logs: afficher les dates calculées (début/fin) avant appel éventuel
				console.info('[handleDateRangeSelected] computed start (ds):', ds.format('YYYY-MM-DD HH:mm'));
				console.info('[handleDateRangeSelected] computed end   (de):', de.format('YYYY-MM-DD HH:mm'));
				getNewData(ds, de);
			}
		} catch(err) { console.warn('appel getNewData échoué', err); }
	} catch(e){ console.warn('daterangepicker callback error', e); }
}

// Normalize a selected start/end (Moment or dayjs) to server-aligned intervals
// Rules:
// - A logical day runs from 01:00 (inclusive) to next-day 00:00 (exclusive)
// - For an end date equal to today, end = today at (currentHour - 1):00
// Returns { ds: dayjs, de: dayjs }
function normalizeRangeForServer(start, end) {
	try {
		const s = dayjs(start.format ? start.format('YYYY-MM-DD') : dayjs(start).format('YYYY-MM-DD'));
		const e = dayjs(end.format ? end.format('YYYY-MM-DD') : dayjs(end).format('YYYY-MM-DD'));
		const today = dayjs();
		let ds = s.hour(1).minute(0).second(0).millisecond(0);
		let de;
		if (e.isSame(today, 'day')) {
			const h = Math.max(0, today.hour() - 1);
			de = e.hour(h).minute(0).second(0).millisecond(0);
		} else {
			de = e.add(1, 'day').hour(0).minute(0).second(0).millisecond(0);
		}
		if (ds.isAfter(de)) {
			ds = s.startOf('day');
			if (ds.isAfter(de)) {
				const tmp = ds; ds = de; de = tmp;
			}
		}
		return { ds, de };
	} catch (e) {
		console.warn('[normalizeRangeForServer] failed', e);
		return { ds: dayjs(start).startOf('day'), de: dayjs(end).endOf('day') };
	}
}

// Ouvre le date range picker avec des dates initiales optionnelles, et gère la sélection pour mettre à jour l'affichage et émettre un événement personnalisé
function openRangePicker(initialStart, initialEnd){
	let $inp = $('#_rangePickerInput');
	if (!$inp.length) {
		$inp = $('<input id="_rangePickerInput" type="text" style="position:absolute;left:-9999px;top:auto;opacity:0;pointer-events:none;" />').appendTo('body');
	} else {
		const inst = $inp.data('daterangepicker');
		if (inst && typeof inst.remove === 'function') inst.remove();
	}

	// If no initial dates provided, try to read them from the visible display
	if (!initialStart || !initialEnd) {
		try {
			const displayed = ($('#dateRangeText').text() || '').trim();
			if (displayed && (displayed.includes('→') || displayed.includes('➜'))) {
				const sep = displayed.includes('→') ? '→' : '➜';
				const parts = displayed.split(sep).map(p => p.trim());
				if (!initialStart) {
					const m = moment(parts[0], 'DD/MM/YY HH:mm');
					if (m.isValid()) initialStart = m;
				}
				if (!initialEnd && parts[1]) {
					const m2 = moment(parts[1], 'DD/MM/YY HH:mm');
					if (m2.isValid()) initialEnd = m2;
				}
			}
		} catch (e) { /* ignore parse errors */ }
	}

	console.debug && console.debug('[openRangePicker] initialStart/raw:', initialStart, 'initialEnd/raw:', initialEnd);

	$inp.daterangepicker({
		startDate: initialStart || moment().startOf('day'),
		endDate: initialEnd || moment().endOf('day'),
		locale: { format: 'DD/MM/YYYY', applyLabel: 'Appliquer', cancelLabel: 'Annuler', separator: ' - ' },
		opens: 'right',
		autoUpdateInput: false,
		alwaysShowCalendars: true,
        // Auto-apply selection immediately and remove Apply/Cancel buttons
        autoApply: true,
		// Enable month/year dropdowns so user can quickly jump months/years.
		showDropdowns: true,
		// Allow start and end calendars to be navigated independently so ranges > 1 year are selectable
		linkedCalendars: false,
		// Prevent selecting future dates
		maxDate: moment().endOf('day'),
		// Allow selecting far past dates (expands year dropdown range)
		minDate: moment().subtract(10, 'year').startOf('year'),
		// No time picker: we only operate on whole days in the app. Times are derived in callback.
		timePicker: false
	}, handleDateRangeSelected);

	// show the picker
	try { $inp.data('daterangepicker').show(); } catch(e) {}

	// Diagnostic logs: inspect the picker's runtime state (help debug stuck right calendar)
	try {
		const picker = $inp.data('daterangepicker');
		if (picker) {
			console.debug && console.debug('[openRangePicker] picker.startDate', picker.startDate && picker.startDate.format ? picker.startDate.format('YYYY-MM-DD') : picker.startDate,
										   'picker.endDate', picker.endDate && picker.endDate.format ? picker.endDate.format('YYYY-MM-DD') : picker.endDate);
			try {
				console.debug && console.debug('[openRangePicker] leftCalendar.month', picker.leftCalendar && picker.leftCalendar.month && picker.leftCalendar.month.format && picker.leftCalendar.month.format('YYYY-MM'),
											   'rightCalendar.month', picker.rightCalendar && picker.rightCalendar.month && picker.rightCalendar.month.format && picker.rightCalendar.month.format('YYYY-MM'));
			} catch(_) {}
			console.debug && console.debug('[openRangePicker] linkedCalendars, showDropdowns, minDate, maxDate', picker.linkedCalendars, picker.showDropdowns,
										   picker.minDate && picker.minDate.format ? picker.minDate.format('YYYY-MM-DD') : picker.minDate,
										   picker.maxDate && picker.maxDate.format ? picker.maxDate.format('YYYY-MM-DD') : picker.maxDate);
		}
	} catch(err) { console.warn('openRangePicker diagnostics failed', err); }
}

	// Click handlers to open the picker from the visible display area or its button
	$(document).on('click', '#dateDisplayRange', function(e){
		e.preventDefault();
		// parse existing displayed value if present (try multiple formats)
		const txt = ($('#dateRangeText').text() || '').trim();
		let s = null, eD = null;
		if (txt && (txt.includes('→') || txt.includes('➜'))){
			const sep = txt.includes('→') ? '→' : '➜';
			const parts = txt.split(sep).map(t => t.trim());
			const formats = ['DD/MM/YYYY HH:mm','DD/MM/YY HH:mm','DD/MM/YYYY','DD/MM/YY'];
			const parseFlexible = (str) => {
				for (const f of formats){
					const m = moment(str, f, true);
					if (m.isValid()) return m;
				}
				return null;
			};
			try { s = parseFlexible(parts[0]); } catch(_) { s = null; }
			try { if (parts[1]) eD = parseFlexible(parts[1]); } catch(_) { eD = null; }
		}
		openRangePicker(s, eD);
	});


	// A. Gestion pointeur pour les labels de sélection de plage du navigateur (navigator range selector labels)
	// --- NAVIGATOR LABELS INTERACTION (pointerdown to set moving state, pointermove to update label position live, pointerup to clear state) ---
	$(document).on('pointerdown', '.dygraph-rangesel-fgcanvas, .dygraph-rangesel-zoomhandle', function(e) {
	    isInteracting = true;
	    try { window.isInteracting = true; } catch(e) {}
		console.debug('[Diag] pointerdown - isInteracting=true');
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
				// Use a global search and compare element references for robustness
				const allHandles = Array.from(document.querySelectorAll('.dygraph-rangesel-zoomhandle'));
				let idx = -1;
				try {
					if (allHandles && allHandles.length) {
						idx = allHandles.indexOf(this);
					}
				} catch(e) { idx = -1; }
				// store active index globally for drawCallback to respect during move
				try { window._navActiveHandleIndex = (idx >= 0 ? idx : null); } catch(e) {}
				// also store the dygraph instance (if any) so pointermove can update labels live
				try {
					if (window.displayedGraphs) {
						Object.values(window.displayedGraphs).some(d => {
							try {
								const dy = d && d.dygraph;
								if (dy && dy.maindiv_ && dy.maindiv_.contains && dy.maindiv_.contains(this)) {
									try { window._navActiveGraph = dy; } catch(e) { window._navActiveGraph = null; }
									return true;
								}
							} catch(_) {}
							return false;
						});
					}
					// Fallback: if not found, try to map handle to a dygraph by proximity
					if (!window._navActiveGraph && allHandles && allHandles.length && idx >= 0) {
						// find nearest dygraph whose maindiv horizontal span contains handle's clientX
						const rect = this.getBoundingClientRect(); const cx = rect.left + rect.width/2;
						Object.values(window.displayedGraphs || {}).some(d => {
							try {
								const dy = d && d.dygraph;
								if (dy && dy.maindiv_) {
									const r = dy.maindiv_.getBoundingClientRect();
									if (cx >= r.left && cx <= r.right) { window._navActiveGraph = dy; return true; }
								}
							} catch(_) {}
							return false;
						});
					}
				} catch(e) {}
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
					// also try to associate the active graph so pointermove updates labels during pan
					try {
						if (window.displayedGraphs) {
							Object.values(window.displayedGraphs).some(d => {
								try {
									const dy = d && d.dygraph;
									if (dy && dy.maindiv_ && $container && $container.length && dy.maindiv_.contains && $container.get(0).contains(dy.maindiv_)) {
										try { window._navActiveGraph = dy; } catch(e) { window._navActiveGraph = null; }
										return true;
									}
								} catch(_) {}
								return false;
							});
						}
					} catch(_) {}
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

	// During pointermove, if we have an active handle and graph stored from pointerdown, update the label positions live based on handle positions or dateWindow (for pan)
	$(document).on('pointermove', function(e) {
		try {
			const dy = window._navActiveGraph || null;
			const activeIdx = (typeof window._navActiveHandleIndex !== 'undefined') ? window._navActiveHandleIndex : null;
			if (!dy || activeIdx === null || typeof activeIdx === 'undefined') return; // nothing to update
			const maindiv = dy.maindiv_;
			if (!maindiv) return;
			const leftEl = maindiv.querySelector('.nav-range-label-left');
			const rightEl = maindiv.querySelector('.nav-range-label-right');
			if (!leftEl || !rightEl) return;
			// compute current dateWindow from dygraph
			let dateWindow = null;
			try { dateWindow = (typeof dy.xAxisRange === 'function') ? dy.xAxisRange() : (dy.getOption && dy.getOption('dateWindow') ? dy.getOption('dateWindow') : null); } catch(e) { dateWindow = null; }
			if (!dateWindow) return;
			const leftX = dateWindow[0];
			const rightX = dateWindow[1];
			const fmt = (dy.getOption && dy.getOption('xValueFormatter')) ? dy.getOption('xValueFormatter') : (v => {
				try { const dt = new Date(v); return dt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch(e) { return String(v); }
			});
			// update text: prefer computing from handle positions (live), fallback to dateWindow
			try {
				const handles = maindiv.querySelectorAll('.dygraph-rangesel-zoomhandle');
				if (handles && handles.length >= 2) {
					const h0 = handles[0].getBoundingClientRect();
					const h1 = handles[1].getBoundingClientRect();
					const pageXLeft = h0.left + (h0.width || 0) / 2 + (window.pageXOffset || window.scrollX || 0);
					const pageXRight = h1.left + (h1.width || 0) / 2 + (window.pageXOffset || window.scrollX || 0);
					try {
						const dataLeft = dy.toDataXCoord ? dy.toDataXCoord(pageXLeft) : leftX;
						const dataRight = dy.toDataXCoord ? dy.toDataXCoord(pageXRight) : rightX;
						leftEl.textContent = fmt(dataLeft);
						rightEl.textContent = fmt(dataRight);
					} catch(e) {
						leftEl.textContent = fmt(leftX);
						rightEl.textContent = fmt(rightX);
					}
				} else {
					leftEl.textContent = fmt(leftX);
					rightEl.textContent = fmt(rightX);
				}
			} catch(e) { try { leftEl.textContent = fmt(leftX); rightEl.textContent = fmt(rightX); } catch(_) {} }
			// update position using handles if available
			try {
				const rect = maindiv.getBoundingClientRect();
				const handles = maindiv.querySelectorAll('.dygraph-rangesel-zoomhandle');
				let leftHandleX = null, rightHandleX = null, handleWidthCss = 16;
				if (handles && handles.length >= 2) {
					const h0 = handles[0].getBoundingClientRect();
					const h1 = handles[1].getBoundingClientRect();
					handleWidthCss = Math.round(h0.width || handleWidthCss);
					leftHandleX = Math.round(h0.left - rect.left + (h0.width || 0) / 2);
					rightHandleX = Math.round(h1.left - rect.left + (h1.width || 0) / 2);
				}
				const leftPosCss = (leftHandleX !== null) ? leftHandleX : Math.round(dy.toDomXCoord(leftX));
				const rightPosCss = (rightHandleX !== null) ? rightHandleX : Math.round(dy.toDomXCoord(rightX));
				const lw = leftEl.offsetWidth || 80; const rw = rightEl.offsetWidth || 80;
				const leftPos = leftPosCss + Math.round(handleWidthCss / 2) + 8;
				const rightPos = rightPosCss - rw - Math.round(handleWidthCss / 2) - 8;
				leftEl.style.left = Math.round(leftPos) + 'px';
				rightEl.style.left = Math.round(rightPos) + 'px';
			} catch(e) {}
		} catch(e) {}
	});

	// On pointerup or pointercancel, clear moving state and reset label positions, with a short delay to allow any final pointermove updates to apply before we consider interaction fully ended.
	$(document).on('pointerup pointercancel', function() {
	    if (interactionTimeout) clearTimeout(interactionTimeout);
		// Remove visual moving state immediately so UI feels responsive and clear active handle
				try {
					$('.nav-range-label').removeClass('moving');
					try { window._navActiveHandleIndex = null; } catch(e) {}
					try { window._navActiveGraph = null; } catch(e) {}
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
		 interactionTimeout = setTimeout(() => { isInteracting = false; try { window.isInteracting = false; } catch(e) {} console.debug('[Diag] pointerup -> isInteracting=false'); }, 150);
	});

	// B. Changements utilisateur
	// Ouvrir le select JQM quand on clique sur le titre du graphe (pour mobile, plus facile que de viser le petit bouton de roue crantée)
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

	// Quand on change de graphe (ex: de Chimie à Températures)
	$(document).on('change', '.zone-graph-selector', function() {
		const zone = $(this).data('zone');
		// Ensure layout heights are applied first (same flow as orientation change)
		try { applyChartHeights(); } catch(e) { console.error('[GRAPH CHANGE] applyChartHeights error', e); }
		// Double RAF to ensure browser applied styles/layout, then recreate selector + dygraph
		requestAnimationFrame(() => requestAnimationFrame(() => {
			console.info('[GRAPH CHANGE] zone', zone, '- RAF double, recreating axes selector and dygraph');
			try { createAxesSelectorForZone(zone); } catch(e) { console.error('[GRAPH CHANGE] createAxesSelectorForZone error', e); }
			createDygraphForZone(zone).then(() => {
				// After creation, update only this zone to avoid touching other graphs
				try { updateGraphs(zone); } catch(e) { console.error('[GRAPH CHANGE] updateGraphs error', e); }
			});
		}));
	});
	
	// quand on selectionne des axes 
	$(document).on('change', '.axes-multi-selector', function() {
		const zone = $(this).data('zone');
		const labels = $(this).val();
		console.debug('[Diag] axes-multi-selector change zone=', zone, 'labels=', labels);
		if (!window.displayedGraphs || !window.displayedGraphs[zone]) return;
		const disp = window.displayedGraphs[zone];
		disp.axesSelected = Array.isArray(labels) ? labels : [labels];
		disp.template.displayed = Array.isArray(labels) ? labels : [labels];
		// Update the displayed dygraph for this zone
		if (disp.dygraph) {
				// Compute visibility array and log diagnostic info
				const visibilityArray = disp.template.mapping.map(l => disp.template.displayed.includes(l));
				console.debug('[Diag] axes change visibilityArray for zone=', zone, 'mapping=', disp.template.mapping, 'displayed=', disp.template.displayed, 'visibility=', visibilityArray);
					try {
					disp.dygraph.updateOptions({ visibility: visibilityArray });
					refreshStaticLegend(disp.dygraph);
					// Also update axes visibility
					try { disp.template.updateAxesVisibility.call(disp); } catch(e) { console.error('[Diag] updateAxesVisibility error', e); }
											// Re-apply to all graphs to guard against Dygraph redraws that may re-create axis nodes
											try {
												Object.values(window.displayedGraphs || {}).forEach(d => {
												try { if (d && d.template && typeof d.template.updateAxesVisibility === 'function') d.template.updateAxesVisibility.call(d); } catch(_) {}
											});
											} catch(_) {}
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

	// Nettoyage de l'emphase et pulsation quand le menu se ferme
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

	// Quand on clique sur Exporter et qu'on choisit PNG ou CSV
	$(document).on("change", ".export-selector", function() {
	    // Force la conversion en nombre pour éviter les erreurs de type "1" vs 1
	    const zoneIndex = parseInt($(this).data("zone"), 10); 
	    const mode = $(this).val();
	
	    if (!mode) return;
	
	    // Log de debug pour vérifier qui appelle quoi
		const disp = (window.displayedGraphs && window.displayedGraphs[zoneIndex]) || null;
		console.debug("Zone détectée :", zoneIndex, "Mode :", mode, "Displayed:", !!disp, disp && disp.type);
	
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

		// Si l'utilisateur choisit l'option personnalisée, ouvrir le date range picker
		if (period === 'custom'){
			try { openRangePicker(); } catch(e){ console.warn('openRangePicker failed', e); }
			return; // ne pas exécuter le traitement par défaut
		}

		if (debug) console.debug("[PERIOD] Nouvelle période sélectionnée :", period);

        // 1. On calcule les dates start/end
        var range = getPeriodDates(period);

        // 2. On met à jour tes variables globales de requête (si tu en as)
        // ou on passe directement les dates à la fonction fetch
		// Appeler getNewData avec des objets dayjs (range.* est en secondes)
		try {
			// Normalize to server-aligned hours (01:00..00:00 next day)
			const { ds, de } = normalizeRangeForServer(dayjs.unix(range.start), dayjs.unix(range.end));
			if (debug) console.debug(`[PERIOD] calling getNewData normalized: ${ds.format()} -> ${de.format()}`);
			getNewData(ds, de);
		} catch(e) { console.warn('[PERIOD] getNewData call failed', e); }
    });


/*  ---------------------------------  
    --- 10) Page lifecycle events ---
    ---------------------------------
*/
 	// --- page PiscineGraphs Phase 1 : beforecreate ---
	$(document).delegate("#pagePiscineGraphs","pagebeforecreate", function() {
		console.info("pagebeforecreate: updating chart data");
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
		// 1. Forcer le sélecteur sur "3 jours" à l'init 
		$("#periodSelector1").val("last3d").selectmenu("refresh");

		// 2. Calculer les dates et mettre à jour la textbox
		updatePeriodDisplay();
		// Pré-calculer la période choisie pour l'utiliser après l'initialisation des charts
        
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



/*  -----------------------------------------------  
    --- 11) Global events (resize, orientation) ---
    -----------------------------------------------
*/
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
				console.info('[RESPONSIVE] resize/orientation - RAF double, calling updateGraphs');
				updateGraphs();
			}));
		}
	});

	// Event handler for left panel opening
	$(document).on("panelbeforeopen", "#leftpanel", function(event, ui) {
		console.debug("[DEBUG] panelbeforeopen - leftpanel triggered, userMenu=", userMenu);
		if(!userMenu){
			console.debug("[DEBUG] calling setUserUI from panelbeforeopen");
			setUserUI();
			userMenu = true;
		}
	});

	// Event handler for Options button - open panel of active page
	$(document).on("vclick", "a[href='#optionsPiscineManager']", function(event) {
		event.preventDefault();
		event.stopPropagation();
		
		console.debug("[DEBUG] Options button vclick!");
		
		// Find panel in the button's parent page
		var currentPage = $(this).closest("[data-role='page']");
		var pageId = currentPage.attr("id");
		console.debug("[DEBUG] Current page ID:", pageId);
		
		// Select panel within this specific page (use .find() instead of .children())
		var activePanel = currentPage.find("#optionsPiscineManager");
		console.debug("[DEBUG] Panel found:", activePanel.length);
		
		if (activePanel.length) {
			console.debug("[DEBUG] Opening panel on page:", pageId);
			activePanel.panel('open');
		} else {
			console.warn("[WARN] No panel found on page:", pageId);
		}
		
		return false;
	});

/*  //Appeler adaptJQueryMobileGrids / adaptPanels lors des transitions de page pertinentes
	$(document).on('pagebeforeshow', '#pagePiscineParametres, #pagePiscineMaintenance, #pagePiscinePrincipale, #pagePiscineGraphs', function() {
		// Lire le variant précis pour diagnostics (getGraphMode met à jour currentLayout)
		var detectedVariant = getGraphMode();
		if (debug) console.debug('[RESPONSIVE] pagebeforeshow for', this.id, 'variant=', detectedVariant, 'currentLayout=', currentLayout);
		try { adaptJQueryMobileGrids(); } catch(e) { if (debug) console.warn('[RESPONSIVE] adaptJQueryMobileGrids failed on pagebeforeshow', e); }
		try { adaptPanels(); } catch(e) { if (debug) console.warn('[RESPONSIVE] adaptPanels failed on pagebeforeshow', e); }

		// Si on va afficher la page des graphs, ajuster hauteurs et normaliser canvases
		if (this.id === 'pagePiscineGraphs') {
			try { setGraphContainerHeight(); } catch(e) { if (debug) console.warn('[GRAPH-DIAG] setGraphContainerHeight failed on pagebeforeshow', e); }
			try { normalizeAllCanvases(); } catch(e) { if (debug) console.warn('[GRAPH-DIAG] normalizeAllCanvases failed on pagebeforeshow', e); }
		}
	});
*/
	

/*  -------------------------------------------  
    --- 12) Global Misc / Helpers fonctions ---
    -------------------------------------------
*/

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

// Détection du mode graphique (desktop/tablet/mobile + orientation) pour ajustements responsives
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
	console.warn("FailBack dans la detection des media")
    if (width < 768) return isLandscape ? 'mobile-landscape' : 'mobile-portrait';
    if (width < 1100) return isLandscape ? 'tablet-landscape' : 'tablet-portrait';
    return isLandscape ? 'desktop-landscape' : 'desktop-portrait';
}

// Adaptation dynamique des grids jQuery Mobile
function adaptJQueryMobileGrids() {
	try {
		if (debug) console.debug('[RESPONSIVE] adaptJQueryMobileGrids currentLayout=', currentLayout);

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
					if (debug) console.debug('[RESPONSIVE] adaptJQueryMobileGrids: converted', selB);
				}
			} else {
				// Restaurer grids originales (si présents)
				var $elRev = $(selA_rev);
				if ($elRev && $elRev.length) {
					$elRev.removeClass('ui-grid-a').addClass('ui-grid-b');
					if (debug) console.debug('[RESPONSIVE] adaptJQueryMobileGrids: reverted', selA_rev);
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
	console.info('[RESPONSIVE] Panels mode reveal (desktop)');
    }
  } else {
    // Mobile/Tablette : panels en mode overlay
    $panels.panel({
      display: 'overlay',
      dismissible: true,
      swipeClose: true
    });
    
    if (debug) {
	console.info('[RESPONSIVE] Panels mode overlay (mobile/tablette)');
    }
  }
  
  // Redimensionner Dygraph si page Graphs active
  //resizeDygraphIfNeeded();
}


// ---------------------------------------- Ok ready ! ----------------------------------

/*  ---------------------------  
    --- 13) Ready / Launch ---
    ---------------------------
*/

currentLayout = getGraphMode();
$('body').attr('data-layout', currentLayout);
setUserUI();
console.info( "ready to go !" );
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

