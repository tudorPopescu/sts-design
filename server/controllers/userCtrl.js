module.exports = db => {
	'use strict';
	const {success: rhs} = require('../utils/requestHandler');
	const auth = require('../utils/authentication');
	const randomString = require('../utils/utils')(db).randomString;
	const saveError = require('../utils/utils')(db).saveError;
	const logAction = require('../utils/utils')(db).logAction;
	const emailSender = require('../utils/emailSender')(db);
	const async = require('async');
	const jwt = require('jsonwebtoken');
	const _ = require('lodash');

	return {
		createWithUnit: (req, res) => {
			let oldPassword, salt = auth.createSalt();
			oldPassword = _.clone(req.body.password);
			req.body.salt = salt;
			req.body.password = auth.hashPwd(salt, !!req.body.password ? req.body.password : randomString(6));
			db.models.Address.create(req.body.unit.address).then(address => {
				req.body.unit.id_address = address.id;
				db.models.Unit.create(req.body.unit).then(unit => {
					req.body.id_unit = unit.id;
					db.models.User.create(req.body).then(user => {
						let rights = [
							{id_user: user.id, add: true, edit: true, remove: true, name: 'document', name_view: 'Document'},
							{id_user: user.id, add: true, edit: true, remove: true, name: 'compartment', name_view: 'Compartiment'},
							{id_user: user.id, add: true, edit: true, remove: true, name: 'user', name_view: 'Utilizator'},
							{id_user: user.id, add: true, edit: true, remove: true, name: 'start_number', name_view: 'Număr început'}
						];
						db.models.UserRight.bulkCreate(rights).then(() => {
							emailSender.sendMailAccount(req.body.unit.name, req.body.unit.cui, req.body.email, oldPassword);
							rhs(res);
						}).catch(e => saveError(req.user, 'createWithUnit User - Create UserRight', e, res));
					}).catch(e => saveError(req.user, 'createWithUnit User - Create User', e, res));
				}).catch(e => saveError(req.user, 'createWithUnit User - Create Unit', e, res));
			}).catch(e => saveError(req.user, 'createWithUnit User - Create Address', e, res));
		},

		updateWithUnit: (req, res) => {
			let tasks = [];
			tasks.push(cb => {
				db.models.User.update(req.body, {where: {id: req.body.id}}).then(resp => {
					if (resp[0] > 0) {
						cb();
					} else {
						cb('User not found');
					}
				}).catch(e => cb(e));
			});
			tasks.push(cb => {
				db.models.Unit.update(req.body.unit, {where: {id: req.body.unit.id}}).then(resp => {
					if (resp[0] > 0) {
						cb();
					} else {
						cb('Unit not found');
					}
				}).catch(e => cb(e));
			});
			tasks.push(cb => {
				db.models.Address.update(req.body.unit.address, {where: {id: req.body.unit.address.id}}).then(resp => {
					if (resp[0] > 0) {
						cb();
					} else {
						cb('Address not found');
					}
				}).catch(e => cb(e));
			});
			async.parallel(tasks, e => {
				if (e) {
					saveError(req.user, 'updateWithUnit User, id_user: ' + req.body.id, e, res);
				} else {
					rhs(res);
				}
			});
		},

		findAllWithUnit: (req, res) => {
			db.query('SELECT us.id, us.surname, us.forename, us.email, us."createdAt", us.active, us.id_unit, us.role, us.phone, us.last_login, ' +
				'u.name, u.cui, c.name AS county, l.name AS locality, v.name AS village, us.condition, us.condition_date ' +
				'FROM "User" us ' +
				'LEFT JOIN "Unit" u ON us.id_unit = u.id ' +
				'LEFT JOIN "Address" a ON a.id = u.id_address ' +
				'LEFT JOIN "DraftCounty" c ON c.id = a.id_draft_county ' +
				'LEFT JOIN "DraftLocality" l ON l.id = a.id_draft_locality ' +
				'LEFT JOIN "DraftVillage" v ON v.id = a.id_draft_village ' +
				'WHERE us.role = \'clientAdmin\' OR us.role = \'client\' ' +
				'ORDER BY us."createdAt"').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAllWithUnit User', e, res));
		},

		findWithUnit: (req, res) => {
			db.query('SELECT us.id, us.surname, us.forename, us.email, us."createdAt", us.active, us.id_unit, us.role, us.phone, to_json(u) AS unit ' +
				'FROM "User" us ' +
				'LEFT JOIN (SELECT u.id, u.cui, u.name, to_json(a) AS address FROM "Unit" u ' +
				'           LEFT JOIN "Address" a ON a.id = u.id_address' +
				'           ) u ON us.id_unit = u.id ' +
				'WHERE us.id = ' + req.params.id).then(resp => {
				if (resp[0].length) {
					res.json(resp[0][0]);
				} else {
					saveError(req.user, 'findWithUnit User, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'findWithUnit User, id: ' + req.params.id, e, res));
		},

		verifyEmail: (req, res) => {
			db.query('SELECT id FROM "User" WHERE email = \'' + req.body.email + (req.body.id ? '\' AND id <> ' + req.body.id : '\'')).then(resp => {
				res.json({exists: resp[0].length !== 0});
			}).catch(e => saveError(req.user, 'verifyEmail User', e, res));
		},

		verifyPassword: (req, res) => {
			db.query('SELECT salt FROM "User" WHERE id = ' + req.user.id).then(resp => {
				if (resp[0].length) {
					let hashed_pwd = auth.hashPwd(resp[0][0].salt, req.body.oldPass);
					db.query('SELECT salt FROM "User" WHERE password = \'' + hashed_pwd + '\' AND id = ' + req.user.id).then(resp => {
						res.json({isPass: resp[0].length > 0});
					}).catch(e => saveError(req.user, 'verifyPassword User - select user by password, id: ' + req.user.id, e, res));
				} else {
					saveError(req.user, 'verifyPassword User - select user, id: ' + req.user.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'verifyPassword User - select user, id: ' + req.user.id, e, res));
		},

		resetPassword: (req, res) => {
			db.query(`SELECT password, salt, email FROM "User" WHERE id = ${req.body.id}`).then(resp => {
				if (resp[0].length && resp[0][0]) {
					let pass = req.body.pass ? req.body.pass : randomString(6), email = _.clone(resp[0][0].email);
					db.query(`UPDATE "User" SET password = '${auth.hashPwd(resp[0][0].salt, pass)}' WHERE id = ${req.body.id}`).then(() => {
						emailSender.sendMailResetPassword(req.body.unitName, req.body.unitCui, email, pass);
						rhs(res);
					}).catch(e => saveError(req.user, 'resetPassword User - update password, id: ' + req.body.id, e, res));
				} else {
					saveError(req.user, 'resetPassword User, id: ' + req.body.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'resetPassword User, id: ' + req.body.id, e, res));
		},

		create: (req, res) => {
			let oldPassword, salt = auth.createSalt();
			oldPassword = _.clone(req.body.password);
			req.body.salt = salt;
			req.body.password = auth.hashPwd(salt, !!req.body.password ? req.body.password : randomString(6));
			db.models.User.create(req.body).then(resp => {
				db.models.UserRight.bulkCreate(req.body.rights).then(() => {
					emailSender.sendMailAccount(req.user.unit ? req.user.unit.name : 'admin', req.user.unit ? req.user.unit.cui : '', req.body.email, oldPassword);
					logAction(req.user.id, 'Adăugare utilizator', 'id: ' + resp.id + '; nume: ' + req.body.surname + '; prenume: ' + req.body.forename + '; email: ' + req.body.email);
				}).catch(e => saveError(req.user, 'createWithUnit User - Create UserRight', e, res));
				res.send(resp);
			}).catch(e => saveError(req.user, 'create User', e, res));
		},

		update: (req, res) => {
			logAction(req.user.id, 'Modificare utilizator', 'id: ' + req.body.id + '; nume: ' + req.body.surname + '; prenume: ' + req.body.forename + '; email: ' + req.body.email);
			db.models.User.update(req.body, {where: {id: req.body.id}}).then(resp => {
				if (resp[0] > 0) {
					if (req.body.rights) {
						let t = [];
						_.forEach(req.body.rights, e => {
							t.push(cb => {
								db.models.UserRight.update(e, {where: {id: e.id}}).then(resp => {
									if (resp[0] > 0) {
										cb();
									} else {
										cb('update UserRight not found, id: ' + e.id);
									}
								}).catch(e => cb(e));
							});
						});
						async.parallel(t, e => {
							if (e) {
								saveError(req.user, 'update User - update UserRight, id: ' + req.body.id, e, res);
							} else {
								rhs(res);
							}
						});
					} else {
						rhs(res);
					}
				} else {
					saveError(req.user, 'update User, id: ' + req.body.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'update User, id: ' + req.body.id, e, res));
		},

		findAll: (req, res) => {
			db.query('SELECT id, surname, forename, email, last_login, phone, role, password, active FROM "User" ' +
				'WHERE id_unit = ' + req.user.id_unit + ' AND role = \'' + config.roles.client + '\' ORDER BY "createdAt"').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll User, id_unit: ' + req.user.id_unit, e, res));
		},

		findAllUnit: (req, res) => {
			db.query('SELECT id, surname, forename, email FROM "User" WHERE id_unit = ' + req.user.id_unit + ' ORDER BY "createdAt"').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAllUnit User, id_unit: ' + req.user.id_unit, e, res));
		},

		find: (req, res) => {
			db.query(`SELECT u.id, u.surname, u.forename, u.email, u.phone, to_json(array_agg(r)) AS rights
			FROM "User" u
			LEFT JOIN "UserRight" r ON r.id_user = u.id
			WHERE u.id = ${req.params.id}
			GROUP BY u.id`).then(resp => {
				if (resp[0].length) {
					res.json(resp[0][0]);
				} else {
					saveError(req.user, 'find User, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'findAll User, id_unit: ' + req.user.id_unit, e, res));
		},

		destroy: (req, res) => {
			db.models.User.destroy({where: {id: req.params.id}}).then(resp => {
				if (resp > 0) {
					logAction(req.user.id, 'Ștergere utilizator', 'id: ' + req.params.id);
					rhs(res);
				} else {
					saveError(req.user, 'destroy User: id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'destroy User: id: ' + req.params.id, e, res));
		},

		checkUsage: (req, res) => {
			db.query('SELECT id FROM "Compartment" WHERE id_user = ' + req.params.id).then(resp => {
				res.json({exists: !!resp[0].length});
			}).catch(e => saveError(req.user, 'checkUsage User', e, res));
		},

		setActiveInactiveFromAdmin: (req, res) => {
			db.models.User.update(req.body, {where: {id_unit: req.body.id_unit}}).then(resp => {
				if (resp[0] > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'setActiveInactiveFromAdmin User, id_unit: ' + req.body.id_unit, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'setActiveInactiveFromAdmin User, id_unit: ' + req.body.id_unit, e, res));
		},

		setActiveInactiveFromClient: (req, res) => {
			db.models.User.update(req.body, {where: {id: req.body.id}}).then(resp => {
				if (resp[0] > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'setActiveInactiveFromClient User, id: ' + req.body.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'setActiveInactiveFromClient User, id: ' + req.body.id, e, res));
		},

		sendMailContact: (req, res) => emailSender.sendMailContact(req.user, req.body, res),

		logInAs: (req, res) => {
			db.query('SELECT us.id, us.surname, us.forename, us.email, us.phone, us.role, us.id_unit, us.salt, us.password, us.active, us.condition, us.condition_date, us.current_year, to_json(u) AS unit, array_agg(c.id) AS id_compartment ' +
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
				'WHERE us.email = \'' + req.params.email + '\' ' +
				'GROUP BY us.id, u.*').then(resp => {
				res.json({token: jwt.sign(resp[0][0], global.config.sKey, {expiresIn: 86400})});
			}).catch(e => saveError(req.user, 'logInAs User', e, res));
		}
	};
};
