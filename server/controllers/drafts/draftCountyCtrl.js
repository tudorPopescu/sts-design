module.exports = db => {
  'use strict';
  const saveError = require('../../utils/utils')(db).saveError;

  return {
    findAll: (req, res) => {
      db.query('SELECT id, name FROM "DraftCounty" ORDER BY name').then(resp => res.json(resp[0])).catch(e => saveError(req.user, 'findAll DraftCounty', e, res));
    }
  };
};