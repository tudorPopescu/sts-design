module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/startNumberCtrl')(app.locals.db),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.post('/', requireLogin, ctrl.create);
  router.get('/', requireLogin, ctrl.findAll);
  router.get('/nextNumber', requireLogin, ctrl.getNextNumber);

  return router;
};