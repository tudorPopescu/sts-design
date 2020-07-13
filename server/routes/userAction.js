module.exports = app => {
	'use strict';

	let express = require('express'),
		ctrl = require('../controllers/userActionCtrl')(app.locals.db),
		auth = require('../utils/authentication'),
		router = express.Router();

	router.get('/byDate/:date', auth.requiresRoles(['sa', 'admin']), ctrl.findAll);
	router.get('/history/byIdUser/:id_user/:clauseType/:limit', auth.requiresRoles(['sa', 'admin']), ctrl.historyByIdUser);
	router.get('/historyLogIn/byIdUser/:id_user', auth.requiresRoles(['sa', 'admin']), ctrl.historyLogInByIdUser);
	router.delete('/removeReportActions/:id_user', auth.requiresRoles(['sa', 'admin']), ctrl.removeReportActions);
	router.delete('/removeLogInActions/:id_user', auth.requiresRoles(['sa', 'admin']), ctrl.removeLogInActions);

	return router;
};