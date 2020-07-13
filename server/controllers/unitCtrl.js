module.exports = db => {
	'use strict';
	const rhs = require('../utils/requestHandler').success;
	const saveError = require('../utils/utils')(db).saveError;
	const async = require('async');

	return {
		find: (req, res) => {
			db.query('SELECT u.id, u.name, u.cui, u.email, u.phone, json_build_object(\'id\', a.id, \'street\', a.street, \'number\', a.number, ' +
				'\'county\', c.name, \'locality\', l.name, \'village\', v.name, \'locationType\', l.type) as address ' +
				'FROM "Unit" u ' +
				'LEFT JOIN "Address" a ON a.id = u.id_address ' +
				'LEFT JOIN "DraftCounty" c ON c.id = a.id_draft_county ' +
				'LEFT JOIN "DraftLocality" l ON l.id = a.id_draft_locality ' +
				'LEFT JOIN "DraftVillage" v ON v.id = a.id_draft_village ' +
				'WHERE u.id = ' + req.user.id_unit).then(resp => {
				if (resp[0].length) {
					res.json(resp[0][0]);
				} else {
					saveError(req.user, 'find Unit, id: ' + req.user.id_unit, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'find Unit, id: ' + req.user.id_unit, e, res));
		},

		findAll: (req, res) => {
			db.query(`SELECT id, name
				FROM "Unit"
				ORDER BY name`).then(resp => {
					res.send(resp[0]);
				}).catch(e => saveError(req.user, 'find all Units', e, res));
		},

		update: (req, res) => {
			let tasks = [];
			tasks.push(cb => {
				db.models.Unit.update(req.body, {where: {id: req.body.id}}).then(() => cb()).catch(e => cb(e));
			});
			tasks.push(cb => {
				db.models.Address.update(req.body.address, {where: {id: req.body.address.id}}).then(() => cb()).catch(e => cb(e));
			});
			async.parallel(tasks, e => {
				if (e) {
					saveError(req.user, 'update Unit, id: ' + req.body.id, e, res);
				} else {
					rhs(res);
				}
			});
		},

		verifyCui: (req, res) => {
			db.query('SELECT id FROM "Unit" WHERE cui = ' + req.body.cui + (req.body.id ? ' AND id <> ' + req.body.id : '')).then(resp => {
				res.json({exists: resp[0].length !== 0});
			}).catch(e => saveError(req.user, 'verifyCui Unit', e, res));
		},

		dbInfo: (req, res) => {
			let tasks = [], response = {};
			tasks.push(cb => {
				db.query('SELECT count(*) FROM "Compartment" WHERE id_unit = ' + req.params.id).then(resp => {
					response.compartment = resp[0].length ? resp[0][0].count : 0;
					cb();
				}).catch(e => cb(e));
			});
			tasks.push(cb => {
				db.query('SELECT count(*) FROM "Document" WHERE id_unit = ' + req.params.id).then(resp => {
					response.document = resp[0].length ? resp[0][0].count : 0;
					cb();
				}).catch(e => cb(e));
			});
			async.parallel(tasks, e => {
				if (!e) {
					res.json(response);
				} else {
					saveError(req.user, 'dbInfo Unit, id_unit: ' + req.params.id, e, res);
				}
			});
		},

		destroy: (req, res) => {
			db.models.Unit.destroy({where: {id: req.params.id}}).then(resp => {
				if (resp > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'destroy Unit, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'destroy Unit, id: ' + req.params.id, e, res));
		}
	};
};
