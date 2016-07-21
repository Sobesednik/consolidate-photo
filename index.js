const app = require('koa')();
const router = require('koa-router')();
const request = require('request');
const config = require('./config');

const SITE_URL = 'https://oskrl3ko.apps.lair.io';

const VK_APP_ID = config.vk.appId;
const VK_APP_SECRET = config.vk.appSecret;
const VK_OAUTH_URL = 'https://oauth.vk.com/authorize';
const VK_REDIRECT_PATH = '/auth/vk/redirect';
const VK_SCOPE = 'photos';
const VK_REDIRECT_URL = `${SITE_URL}${VK_REDIRECT_PATH}`;

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
	console.log(this.request);
});

router.get('/auth/vk', function *() {
	const url = `${VK_OAUTH_URL}?client_id=${VK_APP_ID}` +
				`&redirect_uri=${VK_REDIRECT_URL}` +
				`&scope=${VK_SCOPE}`;
	this.redirect(url);
});


function getVkAccessToken(code) {
	return req({
        url: 'https://oauth.vk.com/access_token',
        qs: {
            code,
            client_id: VK_APP_ID,
            client_secret: VK_APP_SECRET,
            redirect_uri: VK_REDIRECT_URL,
        },
    }).then((res) => {
        const result = JSON.parse(res);
        if ('error' in result) {
            throw new Error(result.error_description);
        }
        if ('access_token' in result) {
            return result;
        }
    });
}

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

router.get(VK_REDIRECT_PATH, function *() {
	if (!('code' in this.request.query)) {
		throw new Error('Code is not available');
	}
    if ('error' in this.request.query) {
        throw new Error('Some error occured');
    }
	yield getVkAccessToken(this.request.query.code)
        .then((res) => {
            console.log(res);
        });
});

app.use(router.routes());

app.listen(3000);
