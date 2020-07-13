module.exports = app => {
  'use strict';
  let express = require('express'),
    ctrl = require('../../controllers/drafts/draftLocalityCtrl')(app.locals.db),
    requireLogin = require('../../utils/authentication').requireLogin,
    router = express.Router();

  router.get('/byCounty/:id_draft_county', requireLogin, ctrl.findByCounty);
  router.get('/byCountyType/:id_draft_county/:type', requireLogin, ctrl.findByCountyType);
  router.post('/byDetails', requireLogin, ctrl.findByDetails);

  return router;
};