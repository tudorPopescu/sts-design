module.exports = (app) => {
  'use strict';
  const router = require('express').Router(),
    jwt = require('jsonwebtoken'),
    jwtRefresh = require('jsonwebtoken-refresh');

  router.get('/', (req, res) => {
    let token = req.headers['x-access-token'] || req.body.token || req.params.token;
    if (token) {
      jwt.verify(token, global.config.sKey, function checkToken(err) {
        if (!err) {
          let obj = jwt.decode(token, {complete: true});
          res.send({token: jwtRefresh.refresh(obj, 60 * 60, global.config.sKey, null)});
        } else {
          res.send({token: null});
        }
      });
    } else {
      res.send({token: null});
    }
  });

  router.put('/', (req, res) => {
    let token = req.headers['x-access-token'] || req.body.token || req.params.token, response = null;
    if (token) {
      jwt.verify(token, global.config.sKey, function checkToken(err) {
        if (!err) {
          app.locals.db.models.User.update({monitoring_title: req.body.monitoring_title}, {where: {id: req.body.id}}).then(() => {
            res.send({token: jwt.sign(req.body, global.config.sKey, {expiresIn: 86400})});
          }).catch(() => {
            res.send({token: response});
          });
        } else {
          res.send({token: response});
        }
      });
    } else {
      res.send({token: response});
    }
  });

  return router;
};