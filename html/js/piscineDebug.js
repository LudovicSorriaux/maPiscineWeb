// page PiscineDebug — logs temps réel via SSE
var debugLogEl = null;
var debugLineCount = 0;
var piscineDebugEvent = null;
var MAX_DEBUG_LINES = 300;

function appendDebugLine(text) {
    if (!debugLogEl || !text) return;
    var lines = text.split('\n');
    lines.forEach(function (line) {
        if (!line) return;
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

$(document).delegate("#pagePiscineDebug", "pagebeforecreate", function () {
    var showDebug = 1;
    var $page = $(this);

    $page.find("#ClearText").click(function () {
        if (debugLogEl) {
            debugLogEl.innerHTML = '';
            debugLineCount = 0;
        }
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
        onMessage: function () {},
        options: { forceAjax: false },
        events: {
            piscineLCDDebug: function (evt) {
                var today = new Date();
                if (expirationDate < today.getTime()) {
                    showSessionExpiredDialog("Invalid Session");
                    return;
                }
                try {
                    var data = $.trim(evt.data);
                    var returnedData = JSON.parse(data);
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
    if (piscineDebugEvent) piscineDebugEvent.start();
    fetch('/setPiscine?action=setActivePage&page=debug', { method: 'POST' });
    fetch('/setPiscine?action=Debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'trigger=start&sess=' + sessID
    });
    showToast("Mise à jour temps réel des logs activée", 'info');
});

$(document).on("pageshow", "#pagePiscineDebug", function () {
    debugLogEl = $(this).find("#debugLogContainer")[0];
});

$(document).on("pagebeforehide", "#pagePiscineDebug", function () {
    console.log("-- STOPPING Piscine Debug SSE --");
    debugLogEl = null;
    if (piscineDebugEvent) piscineDebugEvent.stop();
    fetch('/setPiscine?action=Debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'trigger=stop&sess=' + sessID
    });
});
