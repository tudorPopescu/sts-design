module.exports = db => {
	'use strict';
	const rhs = require('../utils/requestHandler').success;
	const saveError = require('../utils/utils')(db).saveError;

	return {
		findAll: (req, res) => {
			db.query('SELECT concat(u.surname, \' \', u.forename) AS user, u.email, un.name, un.cui, a.action, a.date, a.details ' +
				'FROM "UserAction" a ' +
				'LEFT JOIN "User" u ON u.id = a.id_user ' +
				'LEFT JOIN "Unit" un ON un.id = u.id_unit ' +
				'WHERE to_char(a.date, \'YYYY-MM-DD\') = \'' + req.params.date + '\' AND a.action <> \'LogIn\' ' +
				'ORDER BY a.date DESC').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll UserAction, date: ' + req.params.date, e, res));
		},

		historyByIdUser: (req, res) => {
			db.query('SELECT action, date, details, case when report is true then true else false end AS report ' +
				'FROM "UserAction" ' +
				'WHERE id_user = ' + req.params.id_user + ' AND action <> \'LogIn\' ' +
				'ORDER BY id DESC ' + req.params.clauseType + ' ' + req.params.limit).then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'historyByIdUser UserAction, id_user: ' + req.params.id_user, e, res));
		},

		historyLogInByIdUser: (req, res) => {
			db.query('SELECT details FROM "UserAction" WHERE action = \'LogIn\' AND id_user = ' + req.params.id_user).then(resp => {
				if (resp[0].length) {
					let arr = resp[0][0].details.split(';'), tmp = [];
					for (let i = arr.length - 1; i >= 0; i--) {
						tmp.push({date: new Date(arr[i])});
					}
					res.json(tmp);
				} else {
					res.json([]);
				}
			}).catch(e => saveError(req.user, 'historyLogInByIdUser UserAction, id_user: ' + req.params.id_user, e, res));
		},

		removeReportActions: (req, res) => {
			db.query('DELETE FROM "UserAction" WHERE report is true AND id_user = ' + req.params.id_user).then(() => {
				rhs(res);
			}).catch(e => saveError(req.user, 'removeReportActions UserAction, id_user: ' + req.params.id_user, e, res));
		},

		removeLogInActions: (req, res) => {
			db.query('DELETE FROM "UserAction" WHERE action = \'LogIn\' AND id_user = ' + req.params.id_user).then(() => {
				rhs(res);
			}).catch(e => saveError(req.user, 'removeLogInActions UserAction, id_user: ' + req.params.id_user, e, res));
		}
	};
};
