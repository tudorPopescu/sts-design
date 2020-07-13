module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/documentCtrl')(app.locals.db),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.post('/', requireLogin, ctrl.create);
  router.put('/', requireLogin, ctrl.update);
  router.get('/', requireLogin, ctrl.findAll);
  router.get('/:id', requireLogin, ctrl.find);
  router.get('/history/:id', requireLogin, ctrl.findAllHistory);
  router.get('/years/available', requireLogin, ctrl.getYears);
  router.get('/viewed/all', requireLogin, ctrl.findViewed);
  router.get('/types/all', requireLogin, ctrl.findTypes);
  router.get('/expired/all', requireLogin, ctrl.findExpired);
  router.get('/toExpire/all', requireLogin, ctrl.findToExpire);
  router.put('/viewed/all', requireLogin, ctrl.updateViewed);
  router.get('/byIdUnit/:id_unit', ctrl.findAllbyIdUnit);
  router.delete('/:id', ctrl.destroy);

  return router;
};
