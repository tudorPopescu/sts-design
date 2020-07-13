module.exports = app => {
	const updateLastLogin = require('./utils')(app.locals.db).updateLastLogin;
	const sendMailFailedLogin = require('./emailSender')(app.locals.db).sendMailFailedLogin;
	const jwt = require('jsonwebtoken');
	const _ = require('lodash');

	function render(res, user) {
		let token = jwt.sign(user, global.config.sKey, {expiresIn: 86400});
		if (user.role === 'sa' || user.role === 'admin') {
			res.render('admin', {token: token});
		} else if (_.includes([config.roles.clientAdmin, config.roles.client], user.role)) {
			res.render('client', {token: token});
			updateLastLogin(user.id);
		} else {
			res.render('login', {success: false, message: 'Autentificare eșuată.'});
		}
	}

	return {
		logIn: (req, res) => {
			if (req.body.token) {
				jwt.verify(req.body.token, global.config.sKey, function checkToken(err, decoded) {
					if (err) {
						res.render('login', {success: false, message: 'Introduceți un utilizator'});
					} else {
						if (decoded.email) {
							app.locals.db.query('SELECT us.id, us.surname, us.forename, us.email, us.phone, us.role, us.id_unit, us.active, us.condition, us.condition_date, us.current_year, to_json(u) AS unit, array_agg(c.id) as id_compartment ' +
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
								'WHERE us.email = \'' + decoded.email + '\' ' +
								'GROUP BY us.id, u.*').then(resp => {
								if (resp[0].length) {
									if (resp[0][0].active) {
										render(res, resp[0][0]);
									} else {
										sendMailFailedLogin(decoded.email, 'cont dezactivat');
										res.render('login', {success: false, message: 'Autentificare eșuată. Contul este dezactivat'});
										return null;
									}
								} else {
									res.render('login', {success: false, message: 'Autentificare eșuată. Utilizator inexistent'});
								}
							}).catch(err => {
								console.log('find user jwt init from yourApps', err);
								res.render('login', {success: false, message: 'Autentificare eșuată.'});
							});
						}
					}
				});
			} else {
				res.render('login', {success: false, message: 'Introduceți un utilizator'});
			}
		}
	};
};