chrome.runtime.onMessage.addListener(function(request, sender, callback) {

    if(!request.stats)
        return;

    var timeout = setTimeout(function() {
            callback({
                timeout: true,
                stats: request.stats
            })
        }, request.timeout);

    request.stats.tfirst = null;
    request.stats.loaded = 0;

    function makeRequest() {

        var xhttp = new XMLHttpRequest();

        xhttp.onprogress = function (event) {
            if (request.stats.tfirst === null) {
                request.stats.tfirst = performance.now();
            }
            request.stats.loaded = event.loaded;
        };

        xhttp.onload = function(event) {
            var xhr = event.currentTarget;

            if (xhr.status >= 200 && xhr.status < 300) {
                clearTimeout(timeout);

                var blob = new Blob([xhr.response]);
                var link = URL.createObjectURL(blob);

                var responseURL = xhr.responseURL;
                var mtime = new Date(xhr.getResponseHeader('Last-Modified'));
                
                callback({
                    success: true,
                    link: link,
                    data: {responseURL: responseURL, mtime: mtime},
                    stats: request.stats
                });

                setTimeout( function() {
                    URL.revokeObjectURL(link);
                }, 2000);
            } else {
                // error ...
                if (request.stats.retry < request.maxRetry) {
                    setTimeout(makeRequest(), request.retryDelay);

                    // exponential backoff
                    request.retryDelay = Math.min(2 * request.retryDelay, 64000);
                    request.stats.retry++;
                } else {
                    clearTimeout(timeout);
                    callback({error: true});
                }
            }
        };

        xhttp.open('GET', request.url, true);

        xhttp.responseType = request.responseType;

        xhttp.send();
    }

    makeRequest();

    return true;

});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {

    if(!request.playlistLink)
        return;

    var xhttp = new XMLHttpRequest();

    xhttp.onload = function() {
        callback({playlist: xhttp.responseText});
    };

    xhttp.onerror = function() {
        callback(null);
    };

    xhttp.open('GET', request.playlistLink, true);

    xhttp.send();

    return true;


});