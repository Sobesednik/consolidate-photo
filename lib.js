const request = require('request');
const OAuth = require('oauth');

function req(options) {
    return new Promise((resolve, reject) => {
        function callback(error, response, body) {
            if (error) {
                return reject(error);
            }
            return resolve(body);
        }
        request(options, callback);
    });
}

/**
 * Koa middleware to check response from an oauth provider.
 * @throws {Error} An error if error is in query string, or code is not present.
 */
function *checkOAuthResponse (next) {
    if ('error' in this.request.query) {
        throw new Error(this.request.query.error_description);
    }
    if (!('code' in this.request.query)) {
        throw new Error('Code is not available');
    }
    yield next;
}

function getOAuthAccessToken(url, code, clientId, secret, redirectUri) {
    const qs = {
        code,
        client_id: clientId,
        client_secret: secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    };
    return req({
        url,
        qs,
        method: 'POST',
    });
}

function getVkAccessToken(code, appId, secret, redirectUri) {
    return getOAuthAccessToken('https://oauth.vk.com/access_token', code, appId,
                              secret, redirectUri)
        .then((res) => {
            const result = JSON.parse(res);
            if ('error' in result) {
                throw new Error(result.error_description);
            }
            if ('access_token' in result) {
                return result;
            }
        });
}
function getFbAccessToken(code, appId, secret, redirectUri) {
    return getOAuthAccessToken('https://graph.facebook.com/v2.3/oauth/access_token', code, appId,
                              secret, redirectUri)
        .then((res) => {
            const result = JSON.parse(res);
            if ('error' in result) {
                throw new Error(result.error.message);
            }
            if ('access_token' in result) {
                return result;
            }
        });
}

function getGoogleAccessToken(code, appId, secret, redirectUri) {
    return getOAuthAccessToken('https://www.googleapis.com/oauth2/v4/token', code, appId,
                              secret, redirectUri)
        .then((res) => {
            const result = JSON.parse(res);
            if ('error' in result) {
                throw new Error(result.error_description);
            }
            if ('access_token' in result) {
                return result;
            }
        });
}

function createFlickrOAuth(appId, appSecret, redirectUrl) {
    return new OAuth.OAuth(
        'https://www.flickr.com/services/oauth/request_token',
        'https://www.flickr.com/services/oauth/access_token',
        appId,
        appSecret,
        '1.0A',
        redirectUrl,
        'HMAC-SHA1'
    );
}

function create500pxOAuth(appId, appSecret, redirectUrl) {
    return new OAuth.OAuth(
        'https://api.500px.com/v1/oauth/request_token',
        'https://api.500px.com/v1/oauth/access_token',
        appId,
        appSecret,
        '1.0',
        redirectUrl,
        'HMAC-SHA1'
    );
}

function getFlickrAccessToken(appId, appSecret, redirectUrl, token, secret, verifier) {
    const oauth = createFlickrOAuth(appId, appSecret, redirectUrl);
    return new Promise((resolve, reject) => {
        oauth.getOAuthAccessToken(
            token,
            secret,
            verifier,
            (error, oAuthAccessToken, oAuthAccessTokenSecret, results) => {
                if (error) {
                    return reject(new Error(error.data));
                }
                return resolve({
                    oAuthAccessToken,
                    oAuthAccessTokenSecret,
                    results,
                });
            }
        );
    });
}


function get500pxAccessToken(appId, appSecret, redirectUrl, token, secret, verifier) {
    const oauth = create500pxOAuth(appId, appSecret, redirectUrl);
    return new Promise((resolve, reject) => {
        oauth.getOAuthAccessToken(
            token,
            secret,
            verifier,
            (error, oAuthAccessToken, oAuthAccessTokenSecret, results) => {
                if (error) {
                    return reject(new Error(error.data));
                }
                return resolve({
                    oAuthAccessToken,
                    oAuthAccessTokenSecret,
                    results,
                });
            }
        );
    });
}

module.exports = {
    req,
    checkOAuthResponse,
    getVkAccessToken,
    getFbAccessToken,
    createFlickrOAuth,
    create500pxOAuth,
    getFlickrAccessToken,
    getGoogleAccessToken,
    get500pxAccessToken,
};
