module.exports = app => {
  'use strict';
  let express = require('express'),
    ctrl = require('../../controllers/drafts/draftCountyCtrl')(app.locals.db),
    requireLogin = require('../../utils/authentication').requireLogin,
    router = express.Router();

  router.get('/', requireLogin, ctrl.findAll);

  return router;
};