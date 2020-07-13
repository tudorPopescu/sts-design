module.exports = app => {
  'use strict';
  let express = require('express'),
    ctrl = require('../controllers/fileCtrl')(app.locals.db),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.post('/', requireLogin, ctrl.create);
  router.put('/', requireLogin, ctrl.update);
  router.get('/byId/:id', requireLogin, ctrl.find);
  router.get('/', requireLogin, ctrl.findAll);
  router.get('/print/:id', ctrl.findForPrint);

  return router;
};
