(function () {
	'use strict';
	module.exports = function initJWTRoutes(app) {
		const updateLastLogin = require('./utils')(app.locals.db).updateLastLogin;
		const authenticate = require('./authentication').authenticate;
		const jwt = require('jsonwebtoken');
		const router = require('express').Router();
		const _ = require('lodash');

		function render(res, user) {
			delete user.salt;
			delete user.password;
			let token = jwt.sign(user, global.config.sKey, {expiresIn: 86400});
			if (user.role === 'sa' || user.role === 'admin') {
				res.render('admin', {token: token});
			} else if (_.includes([config.roles.clientAdmin, config.roles.client], user.role)) {
				res.render('client', {token: token});
				updateLastLogin(user.id);
			} else {
				res.render('login', {success: false, message: 'Autentificare eșuată.'});
			}
		}

		router.post('/', function authRoute(req, res) {
			if (!!req.body.email) {
				app.locals.db.query('SELECT us.id, us.surname, us.forename, us.email, us.phone, us.role, us.id_unit, us.salt, us.password, us.active, us.condition, us.condition_date, us.current_year, ' + 
					'to_json(u) AS unit, array_agg(c.id) as id_compartment ' +
					'FROM "User" us ' +
					'LEFT JOIN "Compartment" c on c.id_user = us.id ' +
					'LEFT JOIN (SELECT u.id, u.name, u.email, u.phone, u.cui, u.unit_type, u.id_address, to_jsonb(a) AS address ' +
					'    FROM "Unit" u ' +
					'    LEFT JOIN (SELECT a.id, a.number, a.street, v.siruta_code, a.id_draft_county, a.id_draft_locality, a.id_draft_village, c.name AS county, l.name AS locality, v.name AS village, l.type AS "localityType" ' +
					'        FROM "Address" a ' +
					'        LEFT JOIN "DraftCounty" c ON c.id = a.id_draft_county ' +
					'        LEFT JOIN "DraftLocality" l ON l.id = a.id_draft_locality ' +
					'        LEFT JOIN "DraftVillage" v ON v.id = a.id_draft_village ' +
					'        ) a ON a.id = u.id_address ' +
					'   ) u ON u.id = us.id_unit ' +
					'WHERE us.email = \'' + req.body.email + '\' ' +
					'GROUP BY us.id, u.*').then(resp => {
					try {
						if (resp[0].length) {
							if (authenticate(req.body.password, resp[0][0].salt, resp[0][0].password) && resp[0][0].active) {
								if (_.includes([config.roles.clientAdmin, config.roles.client], resp[0][0].role)) {
									app.locals.db.query('SELECT name, json_build_object(\'add\', add, \'edit\', edit, \'remove\', remove) AS right ' +
										'FROM "UserRight" ' +
										'WHERE id_user = ' + resp[0][0].id).then(rights => {
											let r = {};
											for (let ob of rights[0]) {
												r[ob.name] = ob.right;
											}
											resp[0][0].rights = r;
											render(res, resp[0][0]);
										}).catch(e => {
											console.log('find user_right jwt init', e);
											res.render('login', { success: false, message: 'Autentificare eșuată.' });
										})
								} else {
									render(res, resp[0][0]);
								}
							} else if (authenticate(req.body.password, resp[0][0].salt, resp[0][0].password) && !resp[0][0].active) {
								res.render('login', {success: false, message: 'Autentificare eșuată. Contul este dezactivat'});
							} else {
								res.render('login', {success: false, message: 'Autentificare eșuată. Parolă greșită'});
							}
						} else {
							res.render('login', {success: false, message: 'Autentificare eșuată. Utilizator inexistent'});
						}
					} catch (e) {
						console.log(e);
					}
				}).catch(err => {
					console.log('find user jwt init', err);
					res.render('login', {success: false, message: 'Autentificare eșuată.'});
				});
			} else {
				// res.render('login', {success: false, message: 'Introduceți un utilizator'});
				let token = jwt.sign({name: 'xxx`'}, global.config.sKey, { expiresIn: 86400 });
				res.render('guest', { token: token });
			}
		});

		router.get('/secret', function test(req, res) {
			res.json(req.user);
		});

		return router;
	};
}());