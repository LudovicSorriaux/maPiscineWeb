# Implémentation Multi-Graphes Responsive

## Vue d'ensemble
Transformation de la page Graphes pour supporter 2 modes :
- **Mobile portrait** : 1 graphe multiaxes (mode actuel amélioré)
- **Desktop/Tablette paysage** : 3 graphes spécialisés côte à côte

## Fichiers modifiés

### ✅ 1. HTML (`html/main.html`)
- Ajout PapaParse CDN (ligne 59)
- Structure responsive avec 2 containers :
  - `#graph-mobile` : graph unique + selectItems (14 courbes)
  - `#graphs-desktop` : 3 sections (chimie, température, équipements)

### ✅ 2. CSS (`html/css/mystyles.css`)
- Media query mobile (<768px) : affiche `#graph-mobile`, masque `#graphs-desktop`
- Media query desktop (>1024px) : masque `#graph-mobile`, affiche grid 3 colonnes
- Styles graph-section, graph-title, graph-canvas, graph-legend

### ⏳ 3. JavaScript (`html/js/piscineScripts.js`)
**À implémenter** : Gestion dynamique des graphiques selon viewport

## Code JavaScript à ajouter

### Variables globales
```javascript
var charts = {
	mobile: null,          // Graph mobile unique
	chemistry: null,       // Graph chimie desktop
	temperature: null,     // Graph température desktop
	equipment: null        // Graph équipements desktop
};
var currentMode = null;  // 'mobile' ou 'desktop'
```

### Détection mode responsive
```javascript
function getGraphMode() {
	return window.innerWidth >= 1024 && window.matchMedia('(orientation: landscape)').matches ? 'desktop' : 'mobile';
}
```

### Création graphes (pagebeforecreate)
```javascript
function createGraphs(data) {
	const mode = getGraphMode();
	currentMode = mode;
	
	if (mode === 'mobile') {
		// Graph mobile unique (config actuelle)
		if (!charts.mobile) {
			const config = Object.assign({}, DYGRAPH_CONFIG, {
				labelsDiv: document.getElementById("legend-mobile"),
				legendFormatter: /* ... */,
				dateWindow: [dayjs().subtract(2,"days").startOf("day"), dayjs()],
				interactionModel: Dygraph.defaultInteractionModel,
				zoomCallback: /* sync daterangepicker + getNewData */,
				drawCallback: /* pan handling */
			});
			charts.mobile = new Dygraph($("#graph1")[0], data || [[Date.now(),0,0,0,0,0,0,0,0,0,0,0,0,0]], config);
		}
	} else {
		// 3 graphes desktop
		if (!charts.chemistry) {
			const chemData = extractChemistryData(data);
			const config = Object.assign({}, DYGRAPH_CHEMISTRY_CONFIG, {
				labelsDiv: document.getElementById("legend-chemistry"),
				legendFormatter: /* ... */,
				dateWindow: [dayjs().subtract(2,"days").startOf("day"), dayjs()],
				interactionModel: Dygraph.defaultInteractionModel,
				zoomCallback: /* ... */,
				drawCallback: /* ... */
			});
			charts.chemistry = new Dygraph($("#graph-chemistry")[0], chemData, config);
		}
		
		if (!charts.temperature) {
			const tempData = extractTemperatureData(data);
			const config = Object.assign({}, DYGRAPH_TEMPERATURE_CONFIG, {
				labelsDiv: document.getElementById("legend-temperature"),
				/* ... */
			});
			charts.temperature = new Dygraph($("#graph-temperature")[0], tempData, config);
		}
		
		if (!charts.equipment) {
			const equipData = applyEquipmentOffset(data);
			const config = Object.assign({}, DYGRAPH_EQUIPMENT_CONFIG, {
				labelsDiv: document.getElementById("legend-equipment"),
				/* ... */
			});
			charts.equipment = new Dygraph($("#graph-equipment")[0], equipData, config);
		}
		
		// Synchroniser les 3 graphes
		Dygraph.synchronize([charts.chemistry, charts.temperature, charts.equipment], {
			selection: true,
			zoom: true,
			range: false
		});
	}
}
```

### Gestion selectItems (3 selects desktop)
```javascript
// Mobile : selectItems (14 courbes)
$("#selectItems").on("change", function() {
	if (currentMode !== 'mobile' || !charts.mobile) return;
	var selected = $(this).val();
	for(let i=0; i<14; i++) {
		charts.mobile.setVisibility(i, selected && selected.includes(String(i)));
	}
});

// Desktop : selectChemistry (6 courbes : pH, Redox, 3 pompes, CLVal supprimé)
$("#selectChemistry").on("change", function() {
	if (currentMode !== 'desktop' || !charts.chemistry) return;
	var selected = $(this).val();
	for(let i=0; i<5; i++) {  // 5 courbes (pH, Redox, PompePH, PompeCL, PompeALG)
		charts.chemistry.setVisibility(i, selected && selected.includes(String(i)));
	}
});

// Desktop : selectTemperature (4 courbes)
$("#selectTemperature").on("change", function() {
	if (currentMode !== 'desktop' || !charts.temperature) return;
	var selected = $(this).val();
	for(let i=0; i<4; i++) {
		charts.temperature.setVisibility(i, selected && selected.includes(String(i)));
	}
});

// Desktop : selectEquipment (3 courbes)
$("#selectEquipment").on("change", function() {
	if (currentMode !== 'desktop' || !charts.equipment) return;
	var selected = $(this).val();
	for(let i=0; i<3; i++) {
		charts.equipment.setVisibility(i, selected && selected.includes(String(i)));
	}
});
```

### Mise à jour données (pageshow + resize)
```javascript
function updateGraphsData(data) {
	const mode = getGraphMode();
	
	if (mode === 'mobile' && charts.mobile) {
		charts.mobile.updateOptions({file: data});
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

// Gérer rotation/resize
$(window).on('resize orientationchange', function() {
	const newMode = getGraphMode();
	if (newMode !== currentMode) {
		console.log(`Mode changed: ${currentMode} → ${newMode}`);
		// Recharger les données et recréer les graphes
		const startDate = dayjs().subtract(2, "days").startOf("day");
		const endDate = dayjs();
		fetchDataRange(startDate, endDate).then(data => {
			createGraphs(data);
			currentMode = newMode;
		});
	}
});
```

## Tests à effectuer

### Mode Mobile
- [ ] Graph unique s'affiche correctement
- [ ] SelectItems (14 courbes) fonctionne
- [ ] Zoom/pan avec sync daterangepicker
- [ ] Rotation portrait ↔ paysage

### Mode Desktop
- [ ] 3 graphes côte à côte
- [ ] Graph Chimie : pH + Redox + 3 pompes (stepPlot transparent)
- [ ] Graph Température : 4 courbes avec échelle commune
- [ ] Graph Équipements : 3 "pistes" séparées (offset vertical)
- [ ] Synchronisation zoom/pan entre les 3 graphes
- [ ] SelectChemistry, SelectTemperature, SelectEquipment fonctionnent
- [ ] Rotation paysage ↔ portrait recrée les graphes

### Transitions
- [ ] Mobile → Desktop : recrée 3 graphes, conserve période affichée
- [ ] Desktop → Mobile : recrée graph unique, conserve période affichée
- [ ] Données en cache préservées entre transitions

## Impact performance
- **Mobile** : 1 instance Dygraph (inchangé)
- **Desktop** : 3 instances Dygraph synchronisées
- **RAM navigateur** : +2 instances × ~500KB ≈ +1MB
- **CPU** : Synchronisation pan/zoom native Dygraph (optimisée)
- **Réseau** : Aucun impact (cache partagé Map)

## Prochaine étape
Implémenter le code JavaScript complet dans piscineScripts.js (section pagebeforecreate).
