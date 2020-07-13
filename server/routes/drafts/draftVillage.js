module.exports = app => {
  'use strict';
  let express = require('express'),
    ctrl = require('../../controllers/drafts/draftVillageCtrl')(app.locals.db),
    requireLogin = require('../../utils/authentication').requireLogin,
    router = express.Router();

  router.get('/byLocality/:id_draft_locality', requireLogin, ctrl.findByLocality);
  router.get('/findFull/:id_draft_county/:id_draft_locality', requireLogin, ctrl.findFull);
  router.get('/findLocalitiesVillages/:id_draft_county/:id_draft_locality/:type', requireLogin, ctrl.findLocalitiesVillages);

  return router;
};