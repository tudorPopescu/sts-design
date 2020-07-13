module.exports = db => {
	'use strict';
	const rhs = require('../utils/requestHandler').success;
	const saveError = require('../utils/utils')(db).saveError;
	const logAction = require('../utils/utils')(db).logAction;
	const async = require('async');
	const _ = require('lodash');

	return {
		createUpdate: (req, res) => {
			logAction(req.user.id, 'Adăugare/Modificare/Ștergere compartiment', 'Adăugate: ' + req.body.toCreate.length + '; Modificate: ' + req.body.toUpdate.length + '; Șterse: ' + req.body.toDelete.length);
			let tasks = [];
			if (req.body.toCreate.length) {
				tasks.push(cb => {
					db.models.Compartment.bulkCreate(req.body.toCreate).then(() => cb()).catch(e => cb(e));
				});
			}
			if (req.body.toUpdate.length) {
				_.forEach(req.body.toUpdate, e => {
					tasks.push(cb => {
						db.models.Compartment.update(e, {where: {id: e.id}}).then(resp => {
							if (resp[0] > 0) {
								cb();
							} else {
								cb('update Compartment not found, id: ' + e.id);
							}
						}).catch(e => cb(e));
					});
				});
			}
			if (req.body.toDelete.length) {
				tasks.push(cb => {
					db.query('DELETE FROM "Compartment" WHERE id IN (' + req.body.toDelete + ')').then(resp => {
						if (resp[1].rowCount > 0) {
							cb();
						} else {
							cb('delete Compartment - not found, ids: ' + req.body.toDelete);
						}
					}).catch(e => cb(e));
				});
			}
			async.parallel(tasks, e => {
				if (!e) {
					tasks = [];
					if (req.body.imported) {
						tasks.push(cb => {
							db.query(`UPDATE "Compartment" c SET id_compartment = (SELECT id FROM "Compartment" WHERE id_scim = c.id_scim_superior AND id_unit = ${req.user.id_unit})
							WHERE c.id_unit = ${req.user.id_unit}`).then(() => cb()).catch(e => cb(e));
						});
					}
					if (req.body.toDelete.length) {
						tasks.push(cb => {
							db.query(`UPDATE "Compartment" SET id_compartment = null WHERE id_unit = ${req.user.id_unit} AND id_compartment IN (${req.body.toDelete})`).then(() => cb()).catch(e => cb(e));
						});
					}
					async.parallel(tasks, e => {
						if (e) {
							saveError(req.user, 'createUpdate Compartment - parallel', e, res);
						} else {
							rhs(res);
						}
					});
				} else {
					saveError(req.user, 'createUpdate Compartment', e, res);
				}
			});
		},

		findAll: (req, res) => {
			db.query('SELECT c.id, c.name, c.id_unit, c.id_compartment, c.id_user, c.id_scim, case when count(d.*) > 0 then false else true end AS visible ' +
				'FROM "Compartment" c ' +
				'LEFT JOIN "Document" d ON d.id_compartment = c.id ' +
				'WHERE c.id_unit = ' + req.user.id_unit + ' ' +
				'GROUP BY c.id ORDER BY c.id').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll Compartment', e, res));
		},

		findAllSlim: (req, res) => {
			db.query('SELECT id, name FROM "Compartment" WHERE id_unit = ' + req.user.id_unit).then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAllSlim Compartment', e, res));
		},

		checkForImport: (req, res) => {
			//if (config.env === 'production') {
			const Sequelize = require('sequelize');
			const sequelize = new Sequelize(config.scimDbUrl, {
				dialect: 'postgres',
				protocol: 'postgres',
				dialectOptions: {
					ssl: config.scimDbSsl ? {
						require: true,
						rejectUnauthorized: false
					} : false
				},
				logging: config.dbLogging,
				define: {
					timestamps: false,
					freezeTableName: true
				},
				timezone: '+03:00'
			});

			sequelize.authenticate().then(() => {
				sequelize.query(`SELECT s.denumire
          FROM "Structuras" s
          LEFT JOIN "Entitates" e ON e.id = s."idEntitate"
          WHERE e."codFiscal" = ${req.user.unit.cui} AND s."tipStructura" = 'Departament' AND s.familia IS NOT NULL`).then(resp => {
					if (!resp[0].length) {
						res.json({exist: false});
					} else {
						res.json({exist: true});
					}
				}).catch(e => saveError(req.user, 'checkForImport Compartment - select data', e, res));
			}).catch(e => saveError(req.user, 'checkForImport Compartment - authenticate db', e, res));
			//} else {
			//  res.json({ exist: false });
			//}
		},

		importFromScim: (req, res) => {
			//if (config.env === 'production') {
			const Sequelize = require('sequelize');
			const sequelize = new Sequelize(config.scimDbUrl, {
				dialect: 'postgres',
				protocol: 'postgres',
				dialectOptions: {
					ssl: config.scimDbSsl ? {
						require: true,
						rejectUnauthorized: false
					} : false
				},
				logging: config.dbLogging,
				define: {
					timestamps: false,
					freezeTableName: true
				},
				timezone: '+03:00'
			});

			sequelize.authenticate().then(() => {
				sequelize.query(`SELECT s.id, s.denumire, s."idStructura",
          (SELECT denumire FROM "Structuras" WHERE id = s."idStructura") AS superior
          FROM "Structuras" s
          LEFT JOIN "Entitates" e ON e.id = s."idEntitate"
          WHERE e."codFiscal" = ${req.user.unit.cui} AND s."tipStructura" = 'Departament' AND s.familia IS NOT NULL
          ORDER BY s."denumire"`).then(resp => {
					res.json(resp[0].map(d => ({id_scim: d.id, id_unit: req.user.id_unit, name: d.denumire, id_scim_superior: d.idStructura, superior: d.superior})));
				}).catch(e => saveError(req.user, 'importFromScim Compartment - select data', e, res));
			}).catch(e => saveError(req.user, 'importFromScim Compartment - authenticate db', e, res));
			//}
		}
	};
};
