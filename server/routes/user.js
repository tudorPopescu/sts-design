module.exports = app => {
	'use strict';

	let express = require('express'),
		ctrl = require('../controllers/userCtrl')(app.locals.db),
		auth = require('../utils/authentication'),
		router = express.Router();

	router.get('/bootstrapped/user', auth.requireLogin, (req, res) => res.json(req.user));

	router.post('/withUnit', auth.requiresRoles(['sa', 'admin']), ctrl.createWithUnit);
	router.put('/withUnit', auth.requiresRoles(['sa', 'admin']), ctrl.updateWithUnit);
	router.get('/withUnit', auth.requiresRoles(['sa', 'admin']), ctrl.findAllWithUnit);
	router.get('/withUnit/:id', auth.requiresRoles(['sa', 'admin']), ctrl.findWithUnit);

	router.post('/verify/email', auth.requireLogin, ctrl.verifyEmail);

	router.post('/verifyPassword', auth.requireLogin, ctrl.verifyPassword);
	router.post('/resetPassword', auth.requireLogin, ctrl.resetPassword);

	router.post('/', auth.requireLogin, ctrl.create);
	router.put('/', auth.requireLogin, ctrl.update);
	router.get('/', auth.requireLogin, ctrl.findAll);
	router.get('/:id', auth.requireLogin, ctrl.find);
	router.delete('/:id', auth.requireLogin, ctrl.destroy);
	router.get('/simple/unit', auth.requireLogin, ctrl.findAllUnit);
	router.get('/checkUsage/:id', auth.requireLogin, ctrl.checkUsage);

	router.post('/admin/set/activeInactive', auth.requiresRoles(['sa', 'admin']), ctrl.setActiveInactiveFromAdmin);
	router.post('/client/set/activeInactive', auth.requireLogin, ctrl.setActiveInactiveFromClient);
	router.get('/admin/logInAs/:email', auth.requiresRoles(['sa', 'admin']), ctrl.logInAs);

	router.post('/mailContact/send', auth.requireLogin, ctrl.sendMailContact);

	return router;
};