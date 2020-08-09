(function () {
  'use strict';

  let errors = require('./errors');

  module.exports = app => {
    /* ----------------------------------------------- CONFIG ----------------------------------------------- */
    app.use('/api/refreshToken', require('./utils/refreshToken')(app));
    app.use('/api/contact', require('./routes/contact')(app));

    app.get('/app/*', (req, res) => {
      res.render('../../public/app/' + req.params['0']);
    });

    app.route('/').get((req, res) => {
      res.render('client');
    });

    app.route('*').get(errors[404]);
  };
}());
