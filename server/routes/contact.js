module.exports = app => {
  'use strict';

  let express = require('express'),
    ctrl = require('../controllers/contactCtrl')(app),
    router = express.Router();

  router.post('/send', ctrl.sendMailContact);

  return router;
}; 