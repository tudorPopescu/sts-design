(function () {
  'use strict';

  module.exports = function (app, config) {
    let express = require('express');
    let timeout = require('express-timeout-handler');
    let morgan = require('morgan');
    let multer = require('multer');
    let compression = require('compression');
    let bodyParser = require('body-parser');
    let cookieParser = require('cookie-parser');
    let path = require('path');
    let env = config.env;
    let helmet = require('helmet');

    let options = {
      timeout: 27000,
      onTimeout: function (req, res) {
        saveError(req.user, 'Request timeout', 'url: ' + req.originalUrl);
        res.status(503).end();
      }
      //disable: ['write', 'setHeaders', 'send', 'json', 'end']
    };

    app.use(timeout.handler(options));
    app.use(compression());
    app.use(helmet());
    app.disable('x-powered-by');
    app.use(express.static(path.join(config.path, '/public')));
    app.set('views', config.path + '/server/views');
    app.set('view engine', 'pug');
    app.use(multer({dest:'./tempReports/'}).any());
    //app.use(multer({dest: './tempReports/', inMemory: true}));
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(bodyParser.urlencoded({limit: '5mb', extended: false}));
    app.use(cookieParser());

    if ('production' === env || 'staging' === env) {
      app.set('appPath', config.path + '/public');
      app.use(morgan('dev'));
    }

    if ('dev' === env || 'test' === env) {
      app.use(require('connect-livereload')());
      app.disable('view cache');
      app.set('appPath', config.path + '/public');
      app.use(morgan('dev'));
    }
  };
}());
