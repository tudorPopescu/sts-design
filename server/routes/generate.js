module.exports = app => {
  'use strict';

  let express = require('express'),
    requireLogin = require('../utils/authentication').requireLogin,
    router = express.Router();

  router.post('/static', requireLogin, function staticGenerate(req, res) {
    const Reports = require('../reports');
    const renderPdf = require('../utils/utils')(app.locals.db).renderPdf;
    const logAction = require('../utils/utils')(app.locals.db).logAction;
    logAction(req.user.id, 'Generare raport', req.body.actionTitle, true);
    req.body.data.user = req.user;
    renderPdf({tpl: Reports[req.body.template], data: req.body.data, formatP: req.body.format, disableFooter: true}, res, req);
  });

  return router;
};