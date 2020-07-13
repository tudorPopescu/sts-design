module.exports = app => {
	'use strict';

	let express = require('express'),
		ctrl = require('../controllers/userErrorCtrl')(app.locals.db),
		auth = require('../utils/authentication'),
		router = express.Router();

	router.get('/', auth.requiresRole('sa'), ctrl.findAll);
	router.get('/count/all', auth.requiresRole('sa'), ctrl.countAll);
	router.delete('/:id', auth.requiresRole('sa'), ctrl.destroy);
	router.delete('/', auth.requiresRole('sa'), ctrl.destroyAll);

	return router;
};