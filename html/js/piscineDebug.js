// page PiscineDebug — logs temps réel via SSE
var debugLogEl = null;
var debugLineCount = 0;
var piscineDebugEvent = null;
var debugQueue = [];          // buffer pour les messages arrivant avant pageshow
var MAX_DEBUG_LINES = 300;
var HB_THROTTLE_MS = 60000;  // afficher 1 heartbeat max toutes les 60 s dans le log
var lastHbLogTime = 0;

function _renderDebugLine(text) {
    if (!debugLogEl || !text) return;
    var lines = text.split('\n');
    lines.forEach(function (line) {
        if (!line) return;
        // Heartbeat = "[DEBUG] heap:XXXX controleur:..."
        if (/^\[DEBUG\] heap:/.test(line)) {
            var hbEl = document.getElementById('hbStatus');
            if (hbEl) {
                var ts = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
                hbEl.textContent = '● heartbeat: ' + ts + '  ' + line.replace('[DEBUG] ','');
            }
            var now = Date.now();
            if (now - lastHbLogTime < HB_THROTTLE_MS) return;
            lastHbLogTime = now;
            // affiche dans le log avec style atténué
            var div = document.createElement('div');
            div.className = 'debug-line debug-line-hb';
            div.textContent = line;
            debugLogEl.appendChild(div);
            debugLineCount++;
            while (debugLineCount > MAX_DEBUG_LINES) {
                debugLogEl.removeChild(debugLogEl.firstChild);
                debugLineCount--;
            }
            debugLogEl.scrollTop = debugLogEl.scrollHeight;
            return;
        }
        var div = document.createElement('div');
        var cls = 'debug-line';
        if (/\[ERR|ERROR\b/i.test(line)) cls += ' debug-line-err';
        else if (/\[WARN|WARNING\b/i.test(line)) cls += ' debug-line-warn';
        div.className = cls;
        div.textContent = line;
        debugLogEl.appendChild(div);
        debugLineCount++;
        while (debugLineCount > MAX_DEBUG_LINES) {
            debugLogEl.removeChild(debugLogEl.firstChild);
            debugLineCount--;
        }
    });
    debugLogEl.scrollTop = debugLogEl.scrollHeight;
}

function appendDebugLine(text) {
    if (!text) return;
    if (!debugLogEl) {
        debugQueue.push(text);   // page pas encore visible, bufferiser
        return;
    }
    _renderDebugLine(text);
}

function flushDebugQueue() {
    while (debugQueue.length > 0) {
        _renderDebugLine(debugQueue.shift());
    }
}

function debugActivate() {
    fetch('/setPiscine?action=setActivePage&page=debug', { method: 'POST' })
        .then(function(r) { console.log("[Debug] setActivePage status:", r.status); })
        .catch(function(e) { console.log("[Debug] setActivePage erreur:", e); });
    fetch('/setPiscine?action=Debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'trigger=start&sess=' + sessID
    })
        .then(function(r) { console.log("[Debug] trigger=start status:", r.status); })
        .catch(function(e) { console.log("[Debug] trigger=start erreur:", e); });
}

$(document).delegate("#pagePiscineDebug", "pagebeforecreate", function () {
    var showDebug = 1;
    var $page = $(this);

    $page.find("#ClearText").click(function () {
        if (debugLogEl) {
            debugLogEl.innerHTML = '';
            debugLineCount = 0;
        }
        debugQueue = [];
        lastHbLogTime = 0;
    });

    $page.find("#FeedSW").click(function () {
        (showDebug === 0) ? showDebug = 1 : showDebug = 0;
        $.ajax({
            type: 'POST',
            url: '/setPiscine?action=Debug',
            data: 'sess=' + sessID + '&showDebug=' + showDebug,
            dataType: "text",
            success: function () {
                console.log("[Debug] FeedSW toggle, showDebug=" + showDebug);
            },
            error: function (xhr) {
                if ((xhr.status === 400) && (xhr.responseText.indexOf("Invalid Session") !== -1)) {
                    showSessionExpiredDialog("Invalid Session");
                }
            }
        });
    });

    piscineDebugEvent = $.SSE("/piscineEvents", {
        onOpen: function () { console.log("[Debug] SSE ouvert"); },
        onEnd: function () { console.log("[Debug] SSE fermé"); },
        onError: function () { console.log("[Debug] SSE erreur"); },
        onMessage: function (e) {
            if ($.trim(e.data).includes('hello!')) {
                console.log("[Debug] hello! reçu → activation debug");
                debugActivate();
            }
        },
        options: { forceAjax: false },
        events: {
            piscineLCDDebug: function (evt) {
                var today = new Date();
                if (expirationDate < today.getTime()) {
                    showSessionExpiredDialog("Invalid Session");
                    return;
                }
                try {
                    var returnedData = JSON.parse($.trim(evt.data));
                    if (returnedData.hasOwnProperty("lignes")) {
                        appendDebugLine(returnedData.lignes);
                    }
                } catch (e) {
                    appendDebugLine(evt.data);
                }
            }
        }
    });
});

$(document).on("pagebeforeshow", "#pagePiscineDebug", function () {
    console.log("-- STARTING Piscine Debug SSE --");
    debugLogEl = null;    // sera défini dans pageshow quand le DOM est attaché
    debugQueue = [];
    if (piscineDebugEvent) piscineDebugEvent.start();
    showToast("Mise à jour temps réel des logs activée", 'info');
});

$(document).on("pageshow", "#pagePiscineDebug", function () {
    // JQM déplace le contenu hors de $(this) — on ancre sur .screenPieceDebug
    var $piece = $(this).find('.screenPieceDebug');
    debugLogEl = $piece.find('#debugLogContainer').get(0);
    if (!debugLogEl) {
        debugLogEl = $('<div id="debugLogContainer" class="screenTextZoneDebug"></div>')[0];
        $piece.append(debugLogEl);
    }
    flushDebugQueue();
});

$(document).on("pagebeforehide", "#pagePiscineDebug", function () {
    console.log("-- STOPPING Piscine Debug SSE --");
    debugLogEl = null;
    debugQueue = [];
    lastHbLogTime = 0;
    if (piscineDebugEvent) piscineDebugEvent.stop();
    fetch('/setPiscine?action=Debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'trigger=stop&sess=' + sessID
    });
});
