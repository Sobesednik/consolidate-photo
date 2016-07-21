const app = require('koa')();
const router = require('koa-router')();
const config = require('./config');
const lib = require('./lib');

const SITE_URL = 'https://oskrl3ko.apps.lair.io';

const VK_APP_ID = config.vk.appId;
const VK_APP_SECRET = config.vk.appSecret;
const FB_APP_ID = config.fb.appId;
const FB_APP_SECRET = config.fb.appSecret;
const VK_OAUTH_URL = 'https://oauth.vk.com/authorize';
const FB_OAUTH_URL = 'https://www.facebook.com/dialog/oauth';
const VK_REDIRECT_PATH = '/auth/vk/redirect';
const FB_REDIRECT_PATH = '/auth/fb/redirect';
const VK_SCOPE = 'photos';
const FB_SCOPE = 'user_photos';
const VK_REDIRECT_URL = `${SITE_URL}${VK_REDIRECT_PATH}`;
const FB_REDIRECT_URL = `${SITE_URL}${FB_REDIRECT_PATH}`;

const template = `<!DOCTYPE html>
<html>
<head>
	<title>Consolidate photos | Sobesednik.media</title>
</head>
<body>
	<a href="/auth/vk">Login VK</a>
	<a href="/auth/fb">Login Facebook</a>
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

router.get(VK_REDIRECT_PATH, lib.checkOAuthResponse, function *() {
	yield lib.getVkAccessToken(this.request.query.code, VK_APP_ID, VK_APP_SECRET, VK_REDIRECT_URL)
        .then((res) => {
            console.log(res);
        });
});

router.get(FB_REDIRECT_PATH, lib.checkOAuthResponse, function *() {
    yield lib.getFbAccessToken(this.request.query.code, FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URL)
        .then((res) => {
            console.log(res);
        });
});

app.use(router.routes());

app.listen(3000);
