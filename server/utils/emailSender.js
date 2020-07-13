module.exports = db => {
	'use strict';
	const {success: rhs} = require('../utils/requestHandler');

	function logError(user, action, err, res) {
		db.models.UserError.create({id_user: user.id, action: action, details: err.toString()}).then(() => {
			if (res) {
				res.status(500);
				res.end();
			}
		}).catch(() => {
			if (res) {
				res.status(500);
				res.end();
			}
		});
	}

	return {
		sendMailAccount: (unitate, cui, email, pass) => {
			if (config.env === 'production' && email) {
				let mailOptions = {
					from: 'YourConsulting ✔ <office.yourconsulting@gmail.com>',
					to: [email, 'ostasuc.danut@gmail.com', 'ungurean.cristian@gmail.com', 'nicolae.todosi@gmail.com', 'alina.buha82@gmail.com'],
					subject: 'YourConsulting - Registratură account',
					text: '\t Adresă aplicație online: http://your-registratura.herokuapp.com' + '\n\n' +
					'\t\tUnitate: ' + unitate + '\n\n' +
					'\t\tCod Fiscal: ' + cui + '\n\n' +
					'\t\tEmail: ' + email + '\n\n' +
					'\t\tParolă: ' + pass + '\n\n' +
					'\t\tAutentificarea se face cu adresa de email și parola\n\n' +
					'\t\tAplicația se accesează doar cu browserul Google Chrome\n'
				};
				global.smtpTransportYour.sendMail(mailOptions, err => {
					if (!err) {
						console.log('sendMailAccount YC-Registratură!!');
					} else {
						console.log('Email send err: ', err);
					}
				});
			} else {
				return null;
			}
		},

		sendMailFailedLogin: (email, msg, pw) => {
			if (global.NODE_ENV === 'production') {
				let text = 'Email: ' + email;
				text += '\n\n Parola: ';
				text += !!pw ? pw : '';
				let mailOptions = {
					from: 'YourConsulting ✔ <office.yourconsulting@gmail.com>',
					to: [email, 'ostasuc.danut@gmail.com', 'ungurean.cristian@gmail.com', 'nicolae.todosi@gmail.com', 'alina.buha82@gmail.com'],
					subject: 'Registratură - failed login ' + msg,
					text: text
				};
				global.smtpTransportYour.sendMail(mailOptions, err => {
					if (err) {
						console.log('Email send err: ', err);
					}
					return null;
				});
			}
		},

		sendMailResetPassword: (unitate, cui, email, pass) => {
			unitate = !!unitate ? unitate : 'admin';
			if (config.env === 'production' && email) {
				let mailOptions = {
					from: 'YourConsulting ✔ <office.yourconsulting@gmail.com>',
					to: [email, 'ostasuc.danut@gmail.com', 'ungurean.cristian@gmail.com', 'nicolae.todosi@gmail.com', 'alina.buha82@gmail.com'],
					subject: 'YourConsulting - Registratură resetare parolă',
					text: '\t Adresă aplicație online: http://your-registratura.herokuapp.com' + '\n\n' +
					'\t\tUnitate: ' + unitate + '\n\n' +
					'\t\tCod Fiscal: ' + cui + '\n\n' +
					'\t\tEmail: ' + email + '\n\n' +
					'\t\tParolă: ' + pass + '\n\n' +
					'\t\tAutentificarea se face cu adresa de email și parola\n\n' +
					'\t\tAplicația se accesează doar cu browserul Google Chrome\n'
				};
				global.smtpTransportYour.sendMail(mailOptions, err => {
					if (!err) {
						console.log('sendMailResetPassword YC-Registratură!!');
					} else {
						console.log('Email send err: ', err);
					}
				});
			} else {
				return null;
			}
		},

		sendMailErr: text => {
			if (config.env === 'production') {
				let mailOptions = {
					from: 'YourConsulting ✔ <office.yourconsulting@gmail.com>',
					to: ['ostasuc.danut@gmail.com', 'ungurean.cristian@gmail.com', 'nicolae.todosi@gmail.com', 'alina.buha82@gmail.com'],
					subject: 'YourConsulting - Registratură error',
					text: text
				};
				global.smtpTransportYour.sendMail(mailOptions, err => {
					if (!err) {
						console.log('sendMailErr YC-Registratură!!');
					} else {
						console.log('Email send err: ', err);
					}
				});
			} else {
				return null;
			}
		},

		sendMailContact: (user, mail, res) => {
			if (global.NODE_ENV === 'production') {
				let mailOptions = {
					from: 'Contact - Registratură ✔ <office.yourconsulting@gmail.com>',
					to: ['ostasuc.danut@gmail.com', 'ungurean.cristian@gmail.com', 'nicolae.todosi@gmail.com', 'alina.buha82@gmail.com'],
					subject: mail.subject,
					text: 'Unitate: ' + user.unit.name + '\n\n' +
					'CUI: ' + user.unit.cui + '\n\n' +
					(user.phone ? 'Telefon: ' + user.phone + '\n\n' : '') +
					(user.email ? 'Email: ' + user.email + '\n\n' : '') +
					'Localitate: ' + user.unit.address.village + '\n\n' +
					'Județ: ' + user.unit.address.county + '\n\n' +
					'Mesaj: \n' + mail.message
				};
				global.smtpTransportYour.sendMail(mailOptions, err => {
					if (!err) {
						rhs(res);
					} else {
						logError(user, 'sendMailContact', err, res);
					}
				});
			} else {
				rhs(res);
			}
		}
	};
};