module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../../controllers/drafts/draftStatusCtrl')(app.locals.db),
    auth = require('../../utils/authentication'),
    router = express.Router();

  router.get('/', auth.requireLogin, ctrl.findAll);
  router.post('/', auth.requiresRole('sa'), ctrl.create);
  router.put('/', auth.requiresRole('sa'), ctrl.update);
  router.get('/checkUsage/:id', auth.requiresRole('sa'), ctrl.checkUsage);
  router.delete('/:id', auth.requiresRole('sa'), ctrl.destroy);

  return router;
};