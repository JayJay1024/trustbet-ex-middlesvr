'use strict';

const path = require('path');

const rpc = 'http://127.0.0.1:8888';
const chainId = 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f';
const priKeys = ['5KBgomXoXKdP56LSTj2fvi6oJChi15d1afR5qgNjUqNnmsvWEiK'];  // 执行合约action的账号的私钥

const config = {
    debug: true,
    app_port: 3030,
    app_host: 'localhost',

    log_dir: path.join(__dirname, 'logs'),

    dragonex: {
        host: 'devoauth.dragonex.im',  // test env
        company_id: '简体Name',
        app_id: 'trustbetapp1',
        access_key: '02fc25bd242e56a0b513622ee5f6e388',
        secret_key: '49d87730e28c5842b4b9d97987a0bc10',
        resp_check_key: 'testKey',
    },

    redis: {
        port: 6379,
        host: '127.0.0.1',
    },

    eos_config: {
        chainId: chainId,
        keyProvider: priKeys,  
        httpEndpoint: rpc,
        expireInSeconds: 60,
        broadcast: true,
        debug: false,
        sign: true,
    },
    getTablesUri: `${rpc}/v1/chain/get_table_rows`,
    getActionsUri: `${rpc}/v1/history/get_actions`,

    // 合约账号
    contract: {
        bull: 'trustbetbull',
    },
    // 执行合约action的账号
    action_pusher: {
        bull: 'trustbetdrag',  // 需要把该账号的私钥放到 priKeys 数组中
    }
};

module.exports = config;
