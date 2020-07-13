module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/compartmentCtrl')(app.locals.db),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.post('/', requireLogin, ctrl.createUpdate);
  router.get('/', requireLogin, ctrl.findAll);
  router.get('/slim', requireLogin, ctrl.findAllSlim);
  router.get('/import', requireLogin, ctrl.importFromScim);
  router.get('/checkForImport', requireLogin, ctrl.checkForImport);

  return router;
};