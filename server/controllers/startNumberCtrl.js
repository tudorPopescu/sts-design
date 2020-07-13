module.exports = db => {
	'use strict';
	const rhs = require('../utils/requestHandler').success;
	const saveError = require('../utils/utils')(db).saveError;
	const logAction = require('../utils/utils')(db).logAction;
	const async = require('async');
	const _ = require('lodash');

	return {
		create: (req, res) => {
			let tasks = [];
			if (req.body.toCreate.length) {
				tasks.push(cb => {
					db.models.StartNumber.bulkCreate(req.body.toCreate).then(() => cb()).catch(e => cb(e));
				});
			}
			if (req.body.toUpdate.length) {
				_.forEach(req.body.toUpdate, e => {
					tasks.push(cb => {
						db.models.StartNumber.update(e, {where: {id: e.id}}).then(resp => {
							if (resp[0] > 0) {
								cb();
							} else {
								cb('StartNumber update not found, id: ' + e.id);
							}
						}).catch(e => cb(e));
					});
				});
			}
			async.parallel(tasks, e => {
				if (!e) {
					logAction(req.user.id, 'Adăugare/Modificare startNumber', 'Adăugate: ' + req.body.toCreate.length + '; Modificate: ' + req.body.toUpdate.length);
					rhs(res);
				} else {
					saveError(req.user, 'create StartNumber', e, res);
				}
			});
		},

		findAll: (req, res) => {
			db.query(`SELECT id, number, year, id_unit
        FROM "StartNumber"
        WHERE id_unit = ${req.user.id_unit}
        ORDER BY year DESC`).then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll StartNumber', e, res));
		},

		getNextNumber: (req, res) => {
			db.query(`SELECT number
      FROM "StartNumber"
      WHERE id_unit = ${req.user.id_unit} AND year = ${req.user.current_year}`).then(r => {
				if (r[0].length) {
					res.json(r[0][0]);
				} else {
					res.json({number: 1});
				}
			}).catch(e => saveError(req.user, 'getNextNumber StartNumber', e, res));
		}
	};
};