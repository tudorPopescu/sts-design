'use strict';
module.exports = {
  init: function initConfig() {
    const _ = require('lodash');
    const path = require('path');
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
      require('with-env')();
    }
    let conf = require('konfig')();
    let G = {};
    let rawConf = _.pick(conf, ['common',  conf.common.env || process.env ]);
    G.config = _.extend({}, rawConf.common, rawConf[conf.common.env] || process.env );
    G.config.path = path.normalize(__dirname + '/../../');
    G.config.roles = {
      sa: 'sa',
      admin: 'admin',
      clientAdmin: 'clientAdmin',
      client: 'client'
    };
    return G.config;
  }
};
