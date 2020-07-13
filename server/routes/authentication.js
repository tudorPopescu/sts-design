(function(){
  'use strict';

  let express = require('express'),
    router = express.Router();

  router.get('/logout', (req, res) => {
    res.redirect('/');
  });

  module.exports = router;
})();