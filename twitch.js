function getLinks(channel, callback) {
    if(typeof callback !== 'function') {
        return callback = function(){};
    }

    if(typeof channel === 'undefined' || !channel) {
        return callback('You must supply a channel to get links from.');
    }

    var links = [];
    getStreams(channel, function(err, streams) {
        if(err) {
            return callback(err, null);
        }

        return callback(null, streams);
        
    });
}

function getPlaylistLink(channel, callback) {
    var tokenApi = getTokenAPI(channel);
    getTwitchToken(tokenApi, function(err, token) {
        if(err || !token) {
            return callback('Unable to request API Token from Twitch');
        }

        var usherApi = getUsherAPI(channel, token);
        
        return callback(null, usherApi.url);

    });
}


function getStreams(channel, callback) {
    var tokenApi = getTokenAPI(channel);
    getTwitchToken(tokenApi, function(err, token) {
        if(err || !token) {
            return callback('Unable to request API Token from Twitch');
        }

        var usherApi = getUsherAPI(channel, token);
        getUsherLinks(usherApi, function(err, usher) {
            if(err || !usher) {
                return callback('Unable to parse Twitch Usher links');
            }

            return callback(null, usher);
            
        });

    });
}

function getTwitchToken(tokenApi, callback) {
    $.get(tokenApi, function(token) {
        return callback(null, token);
    }).fail(function () {
        return callback(true, null);
    });
}

function getUsherLinks(usherApi, callback) {
    $.get(usherApi, function(usher) {
        return callback(null, usher);
    }).fail(function () {
        return callback(true, null);
    });
}


function getTokenAPI(channel) {

    var host = 'https://api.twitch.tv';

    var path = '/api/channels/' + channel + '/access_token';

    var token_api_options = {
        url: host+path,
        dataType: "json"
    };

    return token_api_options;
}



function getUsherAPI(channel, token) {

    var random_int = Math.round(Math.random() * 1e7);
    
    //Method 2
    var path = "http://usher.twitch.tv/api/channel/hls/" + channel + ".m3u8?";

    var query = {
        player: "twitchweb",
        token: token.token,
        sig: token.sig,
        allow_audio_only: true,
        allow_source: true,
        type: "any",
        p: random_int
    };

    path = path + $.param(query);

    usher_api_options = {
        url: path
    };

    return usher_api_options;
}