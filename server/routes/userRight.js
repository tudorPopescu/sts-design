module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/userRightCtrl')(app.locals.db),
    auth = require('../utils/authentication'),
    router = express.Router();

  router.post('/', auth.requiresRoles(['sa', 'admin']), ctrl.createUpdate);
  router.get('/:id_user', auth.requiresRoles(['sa', 'admin']), ctrl.findAllByUser);

  return router;
};
