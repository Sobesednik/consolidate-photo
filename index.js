const app = require('koa')();
const router = require('koa-router')();
const session = require('koa-session');
const config = require('./config');
const lib = require('./lib');

const SITE_URL = config.site;

const VK_APP_ID = config.vk.appId;
const VK_APP_SECRET = config.vk.appSecret;
const FB_APP_ID = config.fb.appId;
const FB_APP_SECRET = config.fb.appSecret;
const FLICKR_APP_ID = config.flickr.appId;
const FLICKR_APP_SECRET = config.flickr.appSecret;

const VK_OAUTH_URL = 'https://oauth.vk.com/authorize';
const FB_OAUTH_URL = 'https://www.facebook.com/dialog/oauth';
const FLICKR_OAUTH_URL = 'https://www.flickr.com/services/oauth/request_token';

const VK_REDIRECT_PATH = '/auth/vk/redirect';
const FB_REDIRECT_PATH = '/auth/fb/redirect';
const FLICKR_REDIRECT_PATH = '/auth/flickr/redirect';

const VK_SCOPE = 'photos';
const FB_SCOPE = 'user_photos';

const VK_REDIRECT_URL = `${SITE_URL}${VK_REDIRECT_PATH}`;
const FB_REDIRECT_URL = `${SITE_URL}${FB_REDIRECT_PATH}`;
const FLICKR_REDIRECT_URL = `${SITE_URL}${FLICKR_REDIRECT_PATH}`;

const template = `<!DOCTYPE html>
<html>
<head>
	<title>Consolidate photos | Sobesednik.media</title>
</head>
<body>
	<a href="/auth/vk">Login VK</a>
	<a href="/auth/fb">Login Facebook</a>
	<a href="/auth/flickr">Login Flickr</a>
</body>
</html>`;

router.get('/', function *() {
	this.type = 'text/html';
	this.body = template;
});

router.get('/auth/vk', function *() {
	const url = `${VK_OAUTH_URL}?client_id=${VK_APP_ID}` +
				`&redirect_uri=${VK_REDIRECT_URL}` +
				`&scope=${VK_SCOPE}`;
	this.redirect(url);
});
router.get('/auth/fb', function *() {
    const url = `${FB_OAUTH_URL}?client_id=${FB_APP_ID}` +
                `&redirect_uri=${FB_REDIRECT_URL}` +
                `&scope=${FB_SCOPE}`;
    this.redirect(url);
});

router.get('/auth/flickr', function *() {
    const oauth = lib.createFlickrOAuth(FLICKR_APP_ID, FLICKR_APP_SECRET, FLICKR_REDIRECT_URL);
    const res = yield new Promise((resolve, reject) => {
        oauth.getOAuthRequestToken(function (error, oAuthToken, oAuthTokenSecret, results) {
            if (error) {
                return reject(error);
            }
            return resolve({
                oAuthToken,
                oAuthTokenSecret,
                results,
            });
        });
    });
    const url = `https://www.flickr.com/services/oauth/authorize?oauth_token=${res.oAuthToken}`;
    this.session.flickrOAuthTokenSecret = res.oAuthTokenSecret;
    this.redirect(url);
});

router.get(VK_REDIRECT_PATH, lib.checkOAuthResponse, function *() {
	const res = yield lib.getVkAccessToken(
        this.request.query.code,
        VK_APP_ID,
        VK_APP_SECRET,
        VK_REDIRECT_URL
    );
    console.log(res);
});

router.get(FB_REDIRECT_PATH, lib.checkOAuthResponse, function *() {
    const res = yield lib.getFbAccessToken(
        this.request.query.code,
        FB_APP_ID,
        FB_APP_SECRET,
        FB_REDIRECT_URL
    );
    console.log(res);
});

router.get(FLICKR_REDIRECT_PATH, function *() {
    if (!('oauth_token' in this.request.query && 'oauth_verifier' in this.request.query)) {
        throw new Error('No oauth token and/or verifier');
    }
    if (!('flickrOAuthTokenSecret' in this.session)) {
        throw new Error('No OAuth token secret in session');
    }
    const res = yield lib.getFlickrAccessToken(
        FLICKR_APP_ID,
        FLICKR_APP_SECRET,
        FLICKR_REDIRECT_URL,
        this.request.query.oauth_token,
        this.session.flickrOAuthTokenSecret,
        this.request.query.oauth_verifier
    );
    console.log(res);
});

app.keys = [config.appSecret || 'app_secret'];
app.use(session(app));

app.use(router.routes());

app.listen(3000);
