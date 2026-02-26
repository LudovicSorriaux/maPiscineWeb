// dataGenerator.js — Générateur de données simulées pour toutes les courbes
// Interface compatible avec un fetch serveur : generatePoolData(start, end, options)
// Retourne un tableau de lignes : [Date, TempEau, TempAir, TempPAC, TempInt, PHVal, RedoxVal, CLVal, PompePH, PompeCL, PompeALG, PP, PAC, Auto, Navigation]



function generatePoolData(start, end, options = {}) {
  const debug = options.debug || false;
  const intervalMinutes = options.intervalMinutes || 1;
  const rows = [];
  const n = Math.floor((end - start) / (intervalMinutes * 60000));
  if (debug) console.log(`[dataGen] Génération de ${n} points de ${new Date(start).toLocaleString()} à ${new Date(end).toLocaleString()}`);

  // Valeurs initiales réalistes
  let tempEau = 26.5, tempAir = 22.0, tempPAC = 25.0, tempInt = 24.0;
  let ph = 7.2, redox = 700, cl = 1.2;
  let pompePH = 0, pompeCL = 0, pompeALG = 0;
  let pp = 1, pac = 0, auto = 1;
  let navigation = 0;

  for (let i = 0; i < n; i++) {
    const t = new Date(start + i * intervalMinutes * 60000);
    // Simulations réalistes
    tempEau += (Math.random() - 0.5) * 0.05;
    tempAir += (Math.random() - 0.5) * 0.2;
    tempPAC += (Math.random() - 0.5) * 0.1;
    tempInt += (Math.random() - 0.5) * 0.1;
    ph += (Math.random() - 0.5) * 0.03;
    redox += (Math.random() - 0.5) * 2;
    cl += (Math.random() - 0.5) * 0.05;
    // Pompes : cycles ON/OFF
    pompePH = (i % 120 < 10) ? 1 : 0;
    pompeCL = (i % 180 < 15) ? 1 : 0;
    pompeALG = (i % 360 < 20) ? 1 : 0;
    pp = (i % 60 < 30) ? 1 : 0;
    pac = (i % 240 < 120) ? 1 : 0;
    auto = (i % 480 < 240) ? 1 : 0;
    navigation = Math.sin(i / 50) * 50;
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
  }
  if (debug) console.log(`[dataGen] Fini, ${rows.length} lignes générées.`);
  return rows;
}

// Export pour usage ES6 ou global
if (typeof module !== 'undefined') module.exports = { generatePoolData, ALL_LABELS };
if (typeof window !== 'undefined') window.generatePoolData = generatePoolData;
