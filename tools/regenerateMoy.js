#!/usr/bin/env node
/**
 * regenerateMoy.js
 * Recrée les fichiers -Moy.log à partir des fichiers bruts .log
 * Usage: node tools/regenerateMoy.js <chemin_fichier_brut.log>
 *   ex: node tools/regenerateMoy.js "/Volumes/SD/log/2026/logs/March/Wed-25.log"
 * Sortie: <même_dossier>/Wed-25-Moy.log (remplace l'existant)
 */

const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Usage: node regenerateMoy.js <fichier_brut.log>');
    process.exit(1);
}

const HEADER = 'date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;PompePH;PompeCL;PompeALG;PP;PAC;Auto';
const NUM_COLS = 13; // colonnes de valeurs (hors date)

// Parse une date "D-M-YYYY H:m:s" → Date
function parseESPDate(str) {
    const m = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (!m) return null;
    return new Date(+m[3], +m[2]-1, +m[1], +m[4], +m[5], +m[6]);
}

// Formate une Date → "D-M-YYYY H:m:s"
function formatESPDate(d) {
    return `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

const raw = fs.readFileSync(inputFile, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

// Regroupe les lignes par heure
const hourGroups = new Map(); // clé: "YYYY-MM-DD HH" → { date, values: [[...], ...] }

for (const line of lines) {
    const cols = line.split(';');
    if (cols.length !== 14) continue; // skip header et lignes invalides
    const d = parseESPDate(cols[0]);
    if (!d) continue;

    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    if (!hourGroups.has(key)) {
        hourGroups.set(key, { date: d, values: [] });
    }
    const nums = cols.slice(1).map(v => parseFloat(v));
    if (nums.some(isNaN)) continue; // skip lignes avec valeurs manquantes
    hourGroups.get(key).values.push(nums);
}

if (hourGroups.size === 0) {
    console.error('Aucune ligne valide trouvée dans', inputFile);
    process.exit(1);
}

// Calcule les moyennes et écrit le fichier Moy
const outputFile = inputFile.replace(/\.log$/, '-Moy.log');
const out = [HEADER];

for (const [, group] of [...hourGroups.entries()].sort((a, b) => a[1].date - b[1].date)) {
    const n = group.values.length;
    if (n === 0) continue;
    const means = Array(NUM_COLS).fill(0);
    for (const row of group.values) {
        for (let i = 0; i < NUM_COLS; i++) means[i] += row[i];
    }
    // Températures et pH : 2 décimales ; Redox, équipements : entiers
    const formatted = means.map((v, i) => {
        const avg = v / n;
        // colonnes 0-3 = températures, 4 = pH, 5 = redox, 6 = chlore, 7-12 = 0/1
        if (i <= 4 || i === 6) return avg.toFixed(2);
        return Math.round(avg).toString();
    });
    out.push(formatESPDate(group.date) + ';' + formatted.join(';'));
}

fs.writeFileSync(outputFile, out.join('\r\n') + '\r\n', 'utf8');
console.log(`✅ Écrit ${out.length - 1} lignes → ${outputFile}`);
