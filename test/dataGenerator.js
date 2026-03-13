// dataGenerator.js — Générateur de données simulées pour toutes les courbes
// Interface compatible avec un fetch serveur : generatePoolData(start, end, options)
// Retourne un tableau de lignes : [Date, TempEau, TempAir, TempPAC, TempInt, PHVal, RedoxVal, CLVal, PompePH, PompeCL, PompeALG, PP, PAC, Auto, Navigation]



async function generatePoolData(start, end, options = {}) {
  const debug = options.debug || false;
  const intervalMinutes = options.intervalMinutes || 60;
  const rows = [];
  // Coerce start/end to milliseconds (défensive) pour éviter les concaténations de chaînes
  const startMs = (start instanceof Date) ? start.getTime() : Number(start);
  const endMs = (end instanceof Date) ? end.getTime() : Number(end);
  const totalDaysToFetch = Math.ceil((endMs - startMs) / (24*3600*1000));
  let progressActive = false;
  
  if (totalDaysToFetch > 7) {
    try { updateGraphProgress(0, totalDaysToFetch, `Téléchargement 0/${totalDaysToFetch} jours…`); } catch(e) {}
    progressActive = true;
  }

  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    if (debug) console.log(`[dataGen] Génération de 0 points de ${new Date(startMs).toLocaleString()} à ${new Date(endMs).toLocaleString()} (invalid range)`);
    return rows;
  }
  // Inclure le point initial pour couvrir toute la journée (ex: 24h -> 96 points à 15min)
  const n = Math.floor((endMs - startMs) / (intervalMinutes * 60000)) + 1;
  if (debug) console.log(`[dataGen] Génération de ${n} points de ${new Date(startMs).toLocaleString()} à ${new Date(endMs).toLocaleString()}`);

  // Valeurs initiales réalistes
  let tempEau = 26.5, tempAir = 22.0, tempPAC = 25.0, tempInt = 24.0;
  let ph = 7.2, redox = 700, cl = 1.2;
  let pompePH = 0, pompeCL = 0, pompeALG = 0;
  let pp = 1, pac = 0, auto = 1;
  let navigation = 0;

  for (let i = 0; i < n; i++) {
    const t = new Date(startMs + i * intervalMinutes * 60000);
    // Simulations réalistes — variation adaptée à l'intervalle
    const variationScale = Math.sqrt(Math.max(1, intervalMinutes));
    tempEau += (Math.random() - 0.5) * 0.05 * variationScale;
    tempAir += (Math.random() - 0.5) * 0.2 * variationScale;
    tempPAC += (Math.random() - 0.5) * 0.1 * variationScale;
    tempInt += (Math.random() - 0.5) * 0.1 * variationScale;
    ph += (Math.random() - 0.5) * 0.03 * variationScale;
    redox += (Math.random() - 0.5) * 2 * variationScale;
    cl += (Math.random() - 0.5) * 0.05 * variationScale;
      // Pompes : cycles ON/OFF réalistes
      // minutesSinceStart allows intervalMinutes != 1
      const minutesSinceStart = Math.floor((t - new Date(start)) / 60000);

      // Auto: actif principalement de 09:00 à 22:00
      const hour = t.getHours();
      auto = (hour >= 9 && hour < 22) ? 1 : 0;

      // Préparer fenêtres de coupure pour PP (max 2 coupures par jour) — générées par jour
      if (!generatePoolData.__ppWindows) generatePoolData.__ppWindows = {};
      const dayKey = t.toISOString().slice(0,10);
      if (!generatePoolData.__ppWindows[dayKey]) {
        // créer 0..2 fenêtres de coupure aléatoires à l'intérieur de la plage Auto (9:00-22:00)
        const cuts = Math.floor(Math.random()*3); // 0,1,2
        const windows = [];
        for (let c=0;c<cuts;c++){
          const windowStartMin = 9*60 + Math.floor(Math.random()*(13*60)); // start between 9:00 and 21:59
          const maxDur = Math.min(360, 22*60 - windowStartMin); // max 6h or until 22:00
          const dur = 60 + Math.floor(Math.random()*(maxDur-59));
          windows.push([windowStartMin, windowStartMin + dur]);
        }
        // merge overlapping windows
        windows.sort((a,b)=>a[0]-b[0]);
        const merged = [];
        windows.forEach(w=>{
          if (!merged.length) merged.push(w); else {
            const last = merged[merged.length-1];
            if (w[0] <= last[1]) last[1] = Math.max(last[1], w[1]); else merged.push(w);
          }
        });
        generatePoolData.__ppWindows[dayKey] = merged;
      }
      // Calculer PP: suit Auto mais peut avoir jusqu'à 2 coupures (fenêtres) pendant la journée
      if (auto) {
        const minsOfDay = t.getHours()*60 + t.getMinutes();
        const wnd = generatePoolData.__ppWindows[dayKey] || [];
        let inCut = false;
        for (const w of wnd) { if (minsOfDay >= w[0] && minsOfDay < w[1]) { inCut = true; break; } }
        pp = inCut ? 0 : 1;
      } else {
        pp = 0;
      }

      // PAC and other pumps: generate independent cycles while respecting Auto (only active when Auto==1)
      if (!generatePoolData.__pumpCycles) generatePoolData.__pumpCycles = {};
      const pumps = ['pac','pompePH','pompeCL','pompeALG'];
      pumps.forEach((pname)=>{
        if (!generatePoolData.__pumpCycles[pname]) {
          // period between 60 and 360 minutes (ON duration), OFF duration equals ON duration
          const period = 60 + Math.floor(Math.random()*301); // 60..360
          const phase = Math.floor(Math.random()*(period*2));
          generatePoolData.__pumpCycles[pname] = { period, phase };
        }
      });
      // Evaluate each pump
      const pacCycle = generatePoolData.__pumpCycles['pac'];
      pac = ( ((minutesSinceStart + pacCycle.phase) % (pacCycle.period*2)) < pacCycle.period ) ? 1 : 0;
      const phCycle = generatePoolData.__pumpCycles['pompePH'];
      pompePH = ( ((minutesSinceStart + phCycle.phase) % (phCycle.period*2)) < phCycle.period ) ? 1 : 0;
      const clCycle = generatePoolData.__pumpCycles['pompeCL'];
      pompeCL = ( ((minutesSinceStart + clCycle.phase) % (clCycle.period*2)) < clCycle.period ) ? 1 : 0;
      const algCycle = generatePoolData.__pumpCycles['pompeALG'];
      pompeALG = ( ((minutesSinceStart + algCycle.phase) % (algCycle.period*2)) < algCycle.period ) ? 1 : 0;

      // Respect Auto: if Auto is off, mask pac and other pumps off
      if (!auto) { pac = 0; pompePH = 0; pompeCL = 0; pompeALG = 0; }
    navigation = Math.sin(i / 50) * 50;
    // Clamp values to realistic ranges
    tempEau = Math.min(Math.max(tempEau, 10), 40);
    tempAir = Math.min(Math.max(tempAir, -10), 45);
    tempPAC = Math.min(Math.max(tempPAC, 5), 45);
    tempInt = Math.min(Math.max(tempInt, 5), 40);
    ph = Math.min(Math.max(ph, 6.5), 8.5);
    redox = Math.min(Math.max(redox, 300), 1100);
    cl = Math.min(Math.max(cl, 0), 5);
    rows.push([
      t,
      parseFloat(tempEau.toFixed(2)),
      parseFloat(tempAir.toFixed(2)),
      parseFloat(tempPAC.toFixed(2)),
      parseFloat(tempInt.toFixed(2)),
      parseFloat(ph.toFixed(2)),
      parseFloat(redox.toFixed(1)),
      parseFloat(cl.toFixed(2)),
      pompePH, pompeCL, pompeALG, pp, pac, auto, parseFloat(navigation.toFixed(2))
    ]);
    if(i%96 === 0 && progressActive) { // update progress every 24h (96 points at 15min)
      const daysFetched = Math.floor(i / 96);
      try { updateGraphProgress(daysFetched, totalDaysToFetch, `Téléchargement ${daysFetched}/${totalDaysToFetch} jours…`); } catch(e) {}
      // Yield to the browser so DOM updates (progress bar) can be painted during heavy work
      try { await new Promise(resolve => setTimeout(resolve, 0)); } catch(e) {}
    }
  }
  if (debug) console.log(`[dataGen] Fini, ${rows.length} lignes générées.`);
  	// Masquer progress si utilisé
	if (progressActive) { try { hideGraphProgress(); } catch(e) {} }
  return rows;
}

// Export pour usage ES6 ou global
if (typeof module !== 'undefined') module.exports = { generatePoolData, ALL_LABELS };
if (typeof window !== 'undefined') window.generatePoolData = generatePoolData;
