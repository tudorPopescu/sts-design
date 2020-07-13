module.exports = db => {
	'use strict';
	const saveError = require('../../utils/utils')(db).saveError;
	const async = require('async');

	return {
		findByLocality: (req, res) => {
			if (req.params.id_draft_locality && !isNaN(req.params.id_draft_locality)) {
				db.query('SELECT id, name, postal_code, siruta_code FROM "Village" WHERE id_draft_locality = ' + req.params.id_draft_locality).then(resp => {
					res.json(resp[0]);
				}).catch(e => saveError(req.user, 'findByLocality Village, id_draft_locality: ' + req.params.id_draft_locality, e, res));
			} else {
				saveError(req.user, 'findByLocality Village, id_draft_locality: ' + req.params.id_draft_locality, 'bad params', res);
			}
		},

		findLocalitiesVillages: (req, res) => {
			if (req.params.id_draft_county && !isNaN(req.params.id_draft_county) && req.params.type && !isNaN(req.params.type) && req.params.id_draft_locality && !isNaN(req.params.id_draft_locality)) {
				let response = {}, tasks = [];
				tasks.push(cb => {
					db.query('SELECT id, name FROM "Locality" WHERE id_draft_county = ' + req.params.id_draft_county + ' AND type = ' + req.params.type + ' ORDER BY name').then(resp => {
						response.localities = resp[0];
						cb();
					}).catch(e => cb(e));
				});
				tasks.push(cb => {
					db.query('SELECT id, name FROM "Village" WHERE id_draft_locality = ' + req.params.id_draft_locality + ' ORDER BY name').then(resp => {
						response.villages = resp[0];
						cb();
					}).catch(e => cb(e));
				});
				async.parallel(tasks, e => {
					if (e) {
						saveError(req.user, `findLocalitiesVillages Village, id_draft_county: ${req.params.id_draft_county}, type: ${req.params.type}, id_draft_locality: ${req.params.id_draft_locality}`, e, res);
					} else {
						res.json(response);
					}
				});
			} else {
				saveError(req.user, `findLocalitiesVillages Village, id_draft_county: ${req.params.id_draft_county}, type: ${req.params.type}, id_draft_locality: ${req.params.id_draft_locality}`, 'bad params', res);
			}
		},

		findFull: (req, res) => {
			if (req.params.id_draft_county && !isNaN(req.params.id_draft_county) && req.params.id_draft_locality && !isNaN(req.params.id_draft_locality)) {
				let response = {}, tasks = [];
				tasks.push(cb => {
					db.query('SELECT id, name FROM "DraftCounty" ORDER BY name').then(resp => {
						response.counties = resp[0];
						cb();
					}).catch(e => cb(e));
				});
				tasks.push(cb => {
					db.query('SELECT id, name FROM "DraftLocality" WHERE id_draft_county = ' + req.params.id_draft_county + ' ORDER BY name').then(resp => {
						response.localities = resp[0];
						cb();
					}).catch(e => cb(e));
				});
				tasks.push(cb => {
					db.query('SELECT id, name FROM "DraftVillage" WHERE id_draft_locality = ' + req.params.id_draft_locality + ' ORDER BY name').then(resp => {
						response.villages = resp[0];
						cb();
					}).catch(e => cb(e));
				});
				async.parallel(tasks, e => {
					if (e) {
						saveError(req.user, `findFull Village, id_draft_county: ${req.params.id_draft_county}, id_draft_locality: ${req.params.id_draft_locality}`, e, res);
					} else {
						res.json(response);
					}
				});
			} else {
				saveError(req.user, `findFull Village, id_draft_county: ${req.params.id_draft_county}, id_draft_locality: ${req.params.id_draft_locality}`, 'bad params', res);
			}
		}
	};
};
