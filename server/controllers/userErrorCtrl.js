module.exports = db => {
	'use strict';
	const rhs = require('../utils/requestHandler').success;
	const saveError = require('../utils/utils')(db).saveError;

	return {
		findAll: (req, res) => {
			db.query('SELECT l.*, concat(u.surname, \' \', u.forename) AS "userName" FROM "UserError" l ' +
				'LEFT JOIN "User" u ON u.id = l.id_user ' +
				'ORDER BY l."createdAt" DESC').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll UserError', e, res));
		},

		countAll: (req, res) => {
			db.query('SELECT count(id) :: integer FROM "UserError"').then(resp => {
				res.json({count: resp[0].length ? resp[0][0].count : 0});
			}).catch(e => saveError(req.user, 'countAll UserError', e, res));
		},

		destroy: (req, res) => {
			db.query('DELETE FROM "UserError" WHERE id = ' + req.params.id).then(resp => {
				if (resp[1].rowCount > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'destroy UserError, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'destroy UserError, id: ' + req.params.id, e, res));
		},

		destroyAll: (req, res) => {
			db.query('DELETE FROM "UserError"').then(resp => {
				if (resp[1].rowCount > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'destroyAll UserError', 'not found', res);
				}
			}).catch(e => saveError(req.user, 'destroyAll UserError', e, res));
		}
	};
};
