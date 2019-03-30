'use strict';

const Koa = require('koa');
const cors = require('koa2-cors');
const bodyParser = require('koa-bodyparser');
const config = require('./config');
const logger = require('./common/logger');
const router_hoo = require('./routers/router_hoo');
const router_dragonex = require('./routers/router_dragonex');
const requestLog = require('./utils/request_log');

const app = new Koa();

const urlinfo = require('url').parse(config.app_host);
config.hostname = urlinfo.hostname || config.app_host;

app.use(cors());
app.use(bodyParser());

// 404
app.use(async (ctx, next) => {
    await next();
    if (ctx.status === 404) {
        ctx.body = JSON.stringify({
            ok: false,
            code: -1,
            msg: 'no router (′⌒`)',
            data: {},
        });
    }
});
// request logger
app.use(requestLog);

// router
app.use(router_hoo.routes())
   .use(router_hoo.allowedMethods());
// app.use(router_dragonex.routes())
//    .use(router_dragonex.allowedMethods());

if (!module.parent) {
    app.listen(config.app_port, () => {
        logger.info('dragon-midsrv listening on port:', config.app_port);
        logger.info('god bless love...');
        logger.info(`you can debug your app with http://${config.hostname}:${config.app_port}`);
    });
}

module.exports = app;
