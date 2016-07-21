const request = require('request');

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
    return req({
        url,
        qs: {
            code,
            client_id: clientId,
            client_secret: secret,
            redirect_uri: redirectUri,
        },
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

module.exports = {
    req,
    checkOAuthResponse,
    getVkAccessToken,
    getFbAccessToken,
};