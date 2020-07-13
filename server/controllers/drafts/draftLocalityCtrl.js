module.exports = db => {
	'use strict';
	const saveError = require('../../utils/utils')(db).saveError;
	const replaceDiacritics = require('../../utils/utils')(db).replaceDiacritics;
	const async = require('async');

	return {
		findByCounty: (req, res) => {
			if (req.params.id_draft_county && !isNaN(req.params.id_draft_county)) {
				db.query('SELECT l.id, l.name, to_json(array_remove(array_agg(v), null)) as villages ' +
					'FROM "DraftLocality" l ' +
					'LEFT JOIN (SELECT id, name, id_draft_locality FROM "DraftVillage") v ON v.id_draft_locality = l.id ' +
					'WHERE l.id_draft_county = ' + req.params.id_draft_county + ' GROUP BY l.id').then(resp => {
					res.json(resp[0]);
				}).catch(e => saveError(req.user, 'findByCounty DraftLocality, id_draft_county: ' + req.params.id_draft_county, e, res));
			} else {
				saveError(req.user, 'findByCounty DraftLocality, id_draft_county: ' + req.params.id_draft_county, 'bad params', res);
			}
		},

		findByCountyType: (req, res) => {
			if (req.params.id_draft_county && !isNaN(req.params.id_draft_county) && req.params.type && !isNaN(req.params.type)) {
				db.query('SELECT id, type, name FROM "DraftLocality" WHERE id_draft_county = ' + req.params.id_draft_county + ' AND type = ' + req.params.type + ' ORDER BY name').then(resp => {
					res.json(resp[0]);
				}).catch(e => saveError(req.user, 'findByCountyType DraftLocality, id_draft_county: ' + req.params.id_draft_county, +', type: ' + req.body.type, e, res));
			} else {
				saveError(req.user, 'findByCountyType DraftLocality, id_draft_county: ' + req.params.id_draft_county, +', type: ' + req.body.type, 'bad params', res);
			}
		},

		findByDetails: (req, res) => {
			let response = {}, tasks = [], village, villageSpace, villageLineCap, villageCap, villagesStr = [];
			if (req.body.village) {
				village = replaceDiacritics(req.body.village);
				villageSpace = village.replace(new RegExp('-', 'g'), ' ');
				villageLineCap = village.replace(/-[a-z]/g, letter => letter.toUpperCase());
				villageCap = villageSpace.replace(/\b[a-z]/g, letter => letter.toUpperCase());

				villagesStr.push('\'' + req.body.village + '\'');
				villagesStr.push('\'' + village + '\'');
				villagesStr.push('\'' + villageSpace + '\'');
				villagesStr.push('\'' + villageLineCap + '\'');
				villagesStr.push('\'' + villageCap + '\'');
			}

			if (req.body.postal_code && req.body.id_draft_county && !isNaN(req.body.id_draft_county)) {
				tasks.push(cb => {
					db.query('SELECT l.id as id_draft_locality, l.type, v.id as id_draft_village ' +
						'FROM "DraftLocality" l ' +
						'LEFT JOIN "DraftVillage" v ON l.id = v.id_draft_locality ' +
						'WHERE l.id_draft_county = ' + req.body.id_draft_county + ' AND v.postal_code = \'' + req.body.postal_code + '\'').then(loc => {
						if (loc[0].length) {
							response = loc[0][0];
							cb();
						} else {
							if (req.body.village && req.body.id_draft_county && !isNaN(req.body.id_draft_county)) {
								db.query('SELECT l.id as id_draft_locality, l.type, v.id as id_draft_village FROM "DraftLocality" l, "DraftVillage" v WHERE l.id_draft_county = ' + req.body.id_draft_county +
									' AND l.id = v.id_draft_locality AND (v.name IN (' + villagesStr + '))').then(loc => {
									if (loc[0].length) {
										response = loc[0][0];
										cb();
									} else {
										cb('no response');
									}
								}).catch(e => cb(e));
							} else {
								cb('bad params');
							}
						}
					}).catch(e => cb(e));
				});
			} else if (req.body.village && req.body.id_draft_county && !isNaN(req.body.id_draft_county)) {
				tasks.push(cb => {
					db.query('SELECT l.id as id_draft_locality, l.type, v.id as id_draft_village FROM "DraftLocality" l, "DraftVillage" v WHERE l.id_draft_county = ' + req.body.id_draft_county +
						' AND l.id = v.id_draft_locality AND (v.name IN (' + villagesStr + '))').then(loc => {
						if (loc[0].length) {
							response = loc[0][0];
							cb();
						} else {
							cb('no response');
						}
					}).catch(e => cb(e));
				});
			}
			async.parallel(tasks, e => {
				if (e) {
					saveError(req.user, 'findByDetails DraftLocality - parallel', e, res);
				} else {
					tasks = [];
					if (req.body.id_draft_county && !isNaN(req.body.id_draft_county) && response.type) {
						tasks.push(cb => {
							db.query('SELECT id, type, name, county_code FROM "DraftLocality" WHERE id_draft_county = ' + req.body.id_draft_county + ' AND type = ' + response.type + ' ORDER BY name').then(resp => {
								response.localities = resp[0];
								cb();
							}).catch(e => cb(e));
						});
					} else {
						response.localities = [];
					}
					if (response.id_draft_locality && !isNaN(response.id_draft_locality)) {
						tasks.push(cb => {
							db.query('SELECT id, name, postal_code FROM "DraftVillage" WHERE id_draft_locality = ' + response.id_draft_locality + ' ORDER BY name;').then(resp => {
								response.villages = resp[0];
								cb();
							}).catch(e => cb(e));
						});
					} else {
						response.villages = [];
					}
					async.parallel(tasks, e => {
						if (e) {
							saveError(req.user, 'findByDetails DraftLocality - parallel get data', e, res);
						} else {
							res.json(response);
						}
					});
				}
			});
		}
	};
};
