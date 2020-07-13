module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/personCtrl')(app.locals.db),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.get('/', requireLogin, ctrl.findAll);
  router.post('/', requireLogin, ctrl.create);

  return router;
};