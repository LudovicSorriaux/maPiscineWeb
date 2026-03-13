#!/usr/bin/env python3
"""
Serveur mock pour tester html/main.html localement.
Sert les fichiers statiques de html/ et simule les endpoints ESP32.

Usage:
    python3 mock_server.py
Puis ouvrir: http://localhost:8080
"""

import http.server
import json
import math
import os
import random
import re
import urllib.parse
from datetime import datetime, timedelta

HTML_DIR = os.path.join(os.path.dirname(__file__), "html")
PORT = 8080

# ─── Génération de données CSV de test ────────────────────────────────────────
# Format: date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;
#         PompePH;PompeCL;PompeALG;PP;PAC;Auto;Navigation
# Date:   "D-M-YYYY H:m:s"  (pas de zéros initiaux — format ESP32)

def make_csv_for_day(day: datetime) -> str:
    """Génère une journée de données CSV (une ligne toutes les 15 min)."""
    lines = ["date;TempEau;TempAir;TempPAC;TempInt;PHVal;RedoxVal;CLVal;"
             "PompePH;PompeCL;PompeALG;PP;PAC;Auto"]
    t = day.replace(hour=0, minute=0, second=0)
    for _ in range(96):  # 96 x 15 min = 24 h
        h = t.hour + t.minute / 60
        # Températures avec variation sinusoïdale
        temp_eau  = round(26.0 + 1.5 * math.sin(h * math.pi / 12) + random.uniform(-0.1, 0.1), 2)
        temp_air  = round(22.0 + 6.0 * math.sin((h - 4) * math.pi / 12) + random.uniform(-0.2, 0.2), 2)
        temp_pac  = round(temp_eau + 2.5 + random.uniform(-0.3, 0.3), 2)
        temp_int  = round(24.0 + 2.0 * math.sin((h - 2) * math.pi / 12) + random.uniform(-0.1, 0.1), 2)
        ph_val    = round(7.2 + 0.3 * math.sin(h * math.pi / 8) + random.uniform(-0.05, 0.05), 2)
        redox_val = round(700 + 30 * math.sin(h * math.pi / 12) + random.uniform(-5, 5), 1)
        cl_val    = round(1.2 + 0.2 * math.sin(h * math.pi / 10) + random.uniform(-0.05, 0.05), 2)
        pp        = 1 if 8 <= h < 20 else 0
        pac       = 1 if 10 <= h < 18 else 0
        pompe_ph  = 1 if ph_val > 7.4 else 0
        pompe_cl  = 1 if cl_val < 1.1 else 0
        pompe_alg = 0
        auto      = 1
        date_str  = f"{t.day}-{t.month}-{t.year} {t.hour}:{t.minute}:{t.second}"
        lines.append(f"{date_str};{temp_eau};{temp_air};{temp_pac};{temp_int};"
                     f"{ph_val};{redox_val};{cl_val};"
                     f"{pompe_ph};{pompe_cl};{pompe_alg};{pp};{pac};{auto}")
        t += timedelta(minutes=15)
    return "\n".join(lines)


# Pré-génération de 7 jours de données (mises en cache mémoire)
TODAY = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
DAYS = [TODAY - timedelta(days=i) for i in range(6, -1, -1)]  # il y a 6j → aujourd'hui
CSV_CACHE = {d.strftime("%d-%m-%Y"): make_csv_for_day(d) for d in DAYS}
AVAILABLE_DATES = [d.strftime("%d-%m-%Y") for d in DAYS]

CHUNK_SIZE = 1024  # octets (même valeur que le client envoie)


# ─── Handler HTTP ──────────────────────────────────────────────────────────────

class MockHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HTML_DIR, **kwargs)

    # ── Routage ────────────────────────────────────────────────────────────────

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        if path == "/checkLocalAuth":
            self._handle_check_local_auth()
        elif path == "/api/graph/file-info":
            self._handle_file_info(params)
        elif path == "/api/graph/chunk":
            self._handle_chunk(params)
        elif path == "/piscineEvents":
            self._handle_sse()
        else:
            # Réécriture des chemins pour servir html/ correctement
            self.path = self._rewrite_path(path)
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path   = parsed.path
        body   = self._read_body()

        if path == "/api/graph/plan":
            self._handle_graph_plan(body)
        elif path == "/api/auth":
            self._send_json({"status": "Log in Successful", "username": "admin",
                             "password": "", "sessionID": "mock-session-42",
                             "ttl": 31536000, "roles": [1,1,1,1,1], "message": "OK"})
        elif path.startswith("/setPiscine") or path.startswith("/logon"):
            self._send_json({"status": "ok"})
        else:
            self._send_json({"status": "ok"})

    # ── Endpoints mock ─────────────────────────────────────────────────────────

    def _handle_check_local_auth(self):
        """Auto-login local : bypass écran de connexion."""
        self._send_json({
            "autoLogin": True,
            "username":  "admin",
            "sessionID": "mock-session-42",
            "ttl":       31536000,   # 1 an
            "message":   "Connexion locale automatique (mock)"
        })

    def _handle_graph_plan(self, body: str):
        """Retourne le plan : liste des jours disponibles."""
        params = urllib.parse.parse_qs(body)
        start_str = params.get("start", [""])[0]
        end_str   = params.get("end",   [""])[0]
        try:
            start = datetime.strptime(start_str, "%d-%m-%Y")
            end   = datetime.strptime(end_str,   "%d-%m-%Y")
        except ValueError:
            start = TODAY - timedelta(days=6)
            end   = TODAY

        dates_in_range = []
        for d_str in AVAILABLE_DATES:
            d = datetime.strptime(d_str, "%d-%m-%Y")
            if start <= d <= end:
                dates_in_range.append(d_str)

        self._send_json({
            "total_days":     (end - start).days + 1,
            "available_days": len(dates_in_range),
            "dates":          dates_in_range
        })

    def _handle_file_info(self, params: dict):
        """Retourne la taille et le nombre de chunks d'un fichier."""
        date = params.get("date", [""])[0]
        csv  = CSV_CACHE.get(date, "")
        if not csv:
            self._send_json({"exists": False, "date": date})
            return
        size   = len(csv.encode("utf-8"))
        chunks = math.ceil(size / CHUNK_SIZE)
        self._send_json({"exists": True, "date": date, "size": size, "chunks": chunks})

    def _handle_chunk(self, params: dict):
        """Retourne un chunk CSV (texte brut)."""
        date  = params.get("date",  [""])[0]
        index = int(params.get("index", ["0"])[0])
        csv   = CSV_CACHE.get(date, "")
        if not csv:
            self._send_text("404: not found")
            return
        data   = csv.encode("utf-8")
        offset = index * CHUNK_SIZE
        chunk  = data[offset:offset + CHUNK_SIZE].decode("utf-8", errors="replace")
        self._send_text(chunk)

    def _handle_sse(self):
        """Répond à /piscineEvents avec un flux SSE minimal."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        try:
            self.wfile.write(b"data: hello!\n\n")
            self.wfile.flush()
        except Exception:
            pass

    # ── Utilitaires ───────────────────────────────────────────────────────────

    def _rewrite_path(self, path: str) -> str:
        """Adapte les chemins /css/, /js/, /images/ → répertoires relatifs."""
        if path == "/" or path == "":
            return "/main.html"
        return path

    def _read_body(self) -> str:
        length = int(self.headers.get("Content-Length", 0))
        return self.rfile.read(length).decode("utf-8") if length else ""

    def _send_json(self, obj: dict):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, text: str):
        body = text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Filtrer les logs statiques trop verbeux
        path = args[0] if args else ""
        if any(ext in str(path) for ext in [".js", ".css", ".png", ".ico", ".gif"]):
            return
        print(f"  {self.address_string()} → {fmt % args}")


# ─── Lancement ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    server = http.server.HTTPServer(("localhost", PORT), MockHandler)
    print(f"")
    print(f"  Mock server démarré : http://localhost:{PORT}")
    print(f"  Répertoire servi    : {HTML_DIR}")
    print(f"  Données simulées    : {len(AVAILABLE_DATES)} jours "
          f"({AVAILABLE_DATES[0]} → {AVAILABLE_DATES[-1]})")
    print(f"")
    print(f"  Ctrl+C pour arrêter")
    print(f"")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Arrêt du serveur.")
