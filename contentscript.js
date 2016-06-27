var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
        eventListenerSupported = window.addEventListener;

    return function(obj, callback){
        if( MutationObserver ){
            // define a new observer
            var obs = new MutationObserver(function(mutations, observer){
                if( mutations[0].addedNodes.length || mutations[0].removedNodes.length )
                    callback();
            });
            // have the observer observe foo for changes in children
            obs.observe( obj, { childList:true, subtree:true });
        }
        else if( eventListenerSupported ){
            obj.addEventListener('DOMNodeInserted', callback, false);
            obj.addEventListener('DOMNodeRemoved', callback, false);
        }
    }
})();

var customLoader = function() {
    this.load = function(url,responseType,onSuccess,onError,onTimeOut,timeout,maxRetry,retryDelay) {

        chrome.runtime.sendMessage({
            url: url,
            responseType: responseType,
            timeout: timeout,
            maxRetry: maxRetry,
            retryDelay: retryDelay,
            stats: { retry: 0 }
        }, function (response) {

            if(!this.aborted){
                if(response.error){
                    onError();
                }else if(response.timeout){
                    onTimeOut(null, response.stats);
                }else{
                    var xhr = new XMLHttpRequest();

                    xhr.onload = function(event) {
                        if (this.status >= 200 && this.status < 300) {

                            if(responseType === 'arraybuffer'){

                                response.data.response = event.currentTarget.response;

                                onSuccess(response.data, response.stats);

                                URL.revokeObjectURL(response.link);

                            }else{

                                response.data.responseText = event.currentTarget.responseText;

                                onSuccess(response.data, response.stats);
                            }
                        }else{
                            onError();
                        }
                    };
                    xhr.open('GET', response.link, true);

                    xhr.responseType = responseType;
                    
                    xhr.send();
                }
            }
        });
    };

    /* abort any loading in progress */
    this.abort = function() {
        this.aborted = true;
    };
    /* destroy loading context */
    this.destroy = function() {

    };
};

$(window).ready(function() {

    var channel = $('meta[property="og:url"]').attr("content").split("https://www.twitch.tv/")[1];

    //VOD or live channel, only live currently implemented here
    if(channel.indexOf("/") > -1){
        return;
    }

    getPlaylistLink(channel, function (err, playlistLink) {
        if (err) {
            console.log(err);
            return;
        }

        if(Hls.isSupported()) {

            var hls = new Hls({
                loader: customLoader,
                startFragPrefech: true
            });

            hls.loadSource(playlistLink);

            var element_id = 'html5videor34h7984';
            var added = false;
            var clearPlayerFunction = function () {
                var cached_element = $("#player");
                if (cached_element.length) {
                    cached_element.find('*').not(document.getElementById(element_id)).remove();

                    if (!added) {
                        cached_element.append("<video id='" + element_id + "' controls></video>");
                        var video = document.getElementById(element_id);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            video.play();
                        });
                        added = true;
                    }
                }
            };
            observeDOM(document, clearPlayerFunction);


        }
    });
});