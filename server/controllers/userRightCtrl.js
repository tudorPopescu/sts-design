module.exports = db => {
	'use strict';
	const { success: rhs } = require('../utils/requestHandler');
	const saveError = require('../utils/utils')(db).saveError;
	const _ = require('lodash');
	const async = require('async');

	return {
		createUpdate: (req, res) => {
			let toCreate = _.filter(req.body, f => !f.id);
			let toUpdate = _.filter(req.body, f => f.id);
			let tasks = [];
			if (toCreate.length) {
				tasks.push(cb => {
					db.models.UserRight.bulkCreate(toCreate).then(() => cb()).catch(e => cb(e));
				});
			}
			if (toUpdate.length) {
				_.forEach(toUpdate, e => {
					tasks.push(cb => {
						db.models.UserRight.update(e, {where: {id: e.id}}).then(resp => {
							if (resp[0] > 0) {
								cb();
							} else {
								cb('update UserRight not found, id: ' + e.id);
							}
						}).catch(e => cb(e));
					});
				});
			}
			async.parallel(tasks, e => {
				if (e) {
					saveError(req.user, 'createUpdate UserRight', e, res);
				} else {
					rhs(res);
				}
			});
		},

		findAllByUser: (req, res) => {
			db.query('SELECT * FROM "UserRight" ' +
				'WHERE id_user = ' + req.params.id_user + ' ORDER BY id').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAllByUser UserRight, id_user: ' + req.params.id_user, e, res));
		}
	};
};
