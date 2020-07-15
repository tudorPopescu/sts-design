'use strict';
let cluster = require('cluster');
const worker = process.env.WEB_CONCURRENCY || 1;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  // Fork workers.
  for (var i = 0; i < worker; i++) {
    cluster.fork();
  }

  Object.keys(cluster.workers).forEach(function (id) {
    console.log("I am running with ID : " + cluster.workers[id].process.pid);
  });

} else {
  global.NODE_ENV = process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
  const express = require('express');
  const config = require('./init/config').init();
  global.config = config;

  let app = express();
  let server = require('http').createServer(app);

  let phantomInit = require('./init/phantomInit');
  let emailTransport = require('./init/emailTransport');

  Promise.all([phantomInit.createPhantomSession(app)]).then(values => {
    const [phSession] = values;
    app.locals.config = config;
    app.locals.email = global.smtpTransportYour = emailTransport.createTransport();
    app.locals.ph = phSession;

    require('./init/express')(app, config);
    require('./routes')(app);

    server.listen(config.port, config.ip, () => {
      console.log('Listening on port: %d, env: %s', config.port, config.env);
      process.on('exit', () => {
        console.log('exiting phantom session');
        app.locals.ph.exit();
      });
    });
  }).catch(reason => {
    console.log('Init sequence error:', reason);
  });

  module.exports = app;
}
