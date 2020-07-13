module.exports = db => {
	'use strict';
	const saveError = require('../../utils/utils')(db).saveError;
	const {success: rhs} = require('../../utils/requestHandler');

	return {
		findAll: (req, res) => {
			db.query('SELECT id, name FROM "DraftStatus" ORDER BY id').then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll DraftStatus', e, res));
		},

		create: (req, res) => {
			db.models.DraftStatus.create(req.body).then(() => rhs(res)).catch(e => saveError(req.user, 'create DraftStatus', e, res));
		},

		update: (req, res) => {
			db.models.DraftStatus.update(req.body, {where: {id: req.body.id}}).then(resp => {
				if (resp[0] > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'update DraftStatus, id: ' + req.body.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'update DraftStatus, id: ' + req.body.id, e, res));
		},

		checkUsage: (req, res) => {
			db.query('SELECT id FROM "Document" WHERE id_draft_status = ' + req.params.id).then(resp => {
				res.json({exists: !!resp[0].length});
			}).catch(e => saveError(req.user, 'checkUsage DraftStatus, id: ' + req.params.id, e, res));
		},

		destroy: (req, res) => {
			db.query('DELETE FROM "DraftStatus" WHERE id = ' + req.params.id).then(resp => {
				if (resp[1].rowCount > 0) {
					rhs(res);
				} else {
					saveError(req.user, 'destroy DraftStatus, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'destroy DraftStatus, id: ' + req.params.id, e, res));
		}
	};
};
