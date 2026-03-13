
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
				theHtml += '    <li><a href="#pagePiscinePrincipale" ><h4 class="myh4">Piscine</h4></a></li>';	// data-transition="slide"
				theHtml += '    <li><a href="#pagePiscineParametres" ><h4 class="myh4">Piscine Parametres</h4></a></li>';
				theHtml += '    <li><a href="#pagePiscineMaintenance" ><h4 class="myh4">Piscine Maintenance</h4></a></li>';
				theHtml += '    <li><a href="#pagePiscineGraphs" ><h4 class="myh4">Piscine Graphs</h4></a></li>';
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

function proceedWhenPagesReady(eventNames, opts) {
	// Nouvelle stratégie : on attend que les flags window[ev] soient truthy.
	// Utilise un poll léger et un timeout pour éviter de rester bloqué si un module
	// n'émet jamais son flag (scripts chargés avant ce bootstrap).
	try {
		const timeout = (opts && opts.timeout) || 5000; // ms
		const interval = (opts && opts.interval) || 120; // ms

		return new Promise((resolve) => {
			if (!Array.isArray(eventNames) || eventNames.length === 0) {
				resolve(true);
				return;
			}

			const start = Date.now();
			function check() {
				let allReady = true;
				for (let ev of eventNames) {
					try {
						if (!window[ev]) { allReady = false; break; }
					} catch(e) { allReady = false; break; }
				}
				if (allReady) { resolve(true); return; }
				if ((Date.now() - start) >= timeout) {
					console.warn('[proceedWhenPagesReady] timeout waiting for', eventNames);
					resolve(false);
					return;
				}
				setTimeout(check, interval);
			}
			check();
		});
	} catch (e) {
		return Promise.resolve(false);
	}
}

// ---------------------------------------- Ok ready ! ----------------------------------

/*  ---------------------------  
    --- 13) Ready / Launch ---
    ---------------------------
*/

currentLayout = getGraphMode();
$('body').attr('data-layout', currentLayout);
setUserUI();
proceedWhenPagesReady([ 
//	'piscinePrincipaleLoaded',
//	'piscineParametresLoaded',
//	'piscineMaintenanceLoaded',
	'piscineGraphsLoaded'
    ]).then(function(ok) {  // Attendre explicitement les events des pages principales
        if (ok) {
            try {
                console.info( "ready to go !" );
                // navigate to the graphs page
                if ($ && $.mobile && $.mobile.changePage) {
                    $.mobile.changePage("#pagePiscineGraphs", {transition: "fade"});
                } else {
                    console.warn('[INIT] jQuery Mobile not available to change page');
                }
            } catch (e) {
                console.error('[INIT] Error during auto-navigation:', e);
            }
        } else {
            try {
                console.info( "ready to go !" );
                // navigate to the graphs page
                if ($ && $.mobile && $.mobile.changePage) {
                    $.mobile.changePage("#pagePiscineGraphs", {transition: "fade"});
                } else {
                    console.warn('[INIT] jQuery Mobile not available to change page');
                }
            } catch (e) {
                console.error('[INIT] Error during auto-navigation:', e);
            }
        }
    }
);
console.log ("All set, waiting for pages to be ready...");
