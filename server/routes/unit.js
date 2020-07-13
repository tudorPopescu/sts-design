module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/unitCtrl')(app.locals.db),
    auth = require('../utils/authentication'),
    router = express.Router();

  router.get('/', auth.requireLogin, ctrl.find);
  router.get('/simple', ctrl.findAll);
  router.post('/', auth.requiresRoles(['sa', 'admin']), ctrl.update);
  router.delete('/byId/:id', auth.requiresRole('sa'), ctrl.destroy);
  router.get('/dbInfo/:id', auth.requiresRoles(['sa', 'admin']), ctrl.dbInfo);
  router.post('/verify/cui', auth.requiresRoles(['sa', 'admin']), ctrl.verifyCui);

  return router;
};
