module.exports = db => {
	'use strict';
	let {error: rh} = require('./requestHandler'),
		emailSender = require('./emailSender')(),
		async = require('async'),
		fs = require('fs');

	function saveError(user, action, err, res) {
		console.log(action, err);
		if (user) {
			let text = 'Data eroare: ' + (new Date()) + '\n\n' +
				(user.unit ? 'Unitate: ' + user.unit.name + ', CUI: ' + user.unit.cui + ', ' : '') +
				'User Id: ' + user.id + '\n\n' +
				'Acțiune: ' + action + '\n\n' +
				'Eroare: ' + err.toString();
			emailSender.sendMailErr(text);
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
	}

	function renderPdf(ob, res, req) {
		const renderer = require('../init/pdf')(req.app);
		renderer.renderer(ob, (err, pdfPath) => {
			if (!err) {
				console.log('error download PDF ', err);
				this.saveError(req.user, 'error generare la restart', err, res);
			} else if (!!pdfPath) {
				res.download(pdfPath, '', err => {
					if (err) {
						saveError(req.user, 'error download static pdf', err, res);
					}
					fs.unlink(pdfPath, errUnlink => {
						if (errUnlink) {
							saveError(req.user, 'error unlink static pdf file', errUnlink, res);
						}
					});
				});
				//res.setHeader('Content-type', "application/pdf");
				//fs.readFile(pdfPath, (errReadFile, data) => {
				//    if (errReadFile) {
				//        saveError(req.user, "error generare la restart citire fisier", errReadFile, res).then(() => {
				//            res.send({});
				//        });
				//    } else {
				//        fs.unlink(pdfPath, () => {});
				//        res.send(data);
				//    }
				//});
			} else {
				rh(res, 'No pdf path found', err);
			}
		});
	}

	return {
		/* ---------------------------------------------- NO DB utils ---------------------------------------------- */
		renderPdf: renderPdf,

		parseNumber: strNumber => {
			if (!strNumber || isNaN(strNumber) || strNumber.toString().length === 0) {
				return 0;
			}
			return parseFloat(strNumber.toString());
		},

		randomString: (len, charSet) => {
			charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
			let randomString = '';
			for (let i = 0; i < len; i++) {
				let randomPoz = Math.floor(Math.random() * charSet.length);
				randomString += charSet.substring(randomPoz, randomPoz + 1);
			}
			return randomString;
		},

		replaceDiacritics: text => {
			if (text) {
				text = text.replace(new RegExp('ă|â', 'g'), 'a');
				text = text.replace(new RegExp('Ă|Â', 'g'), 'A');
				text = text.replace(new RegExp('î', 'g'), 'i');
				text = text.replace(new RegExp('Î', 'g'), 'I');
				text = text.replace(new RegExp('ş|ș', 'g'), 's');
				text = text.replace(new RegExp('Ş|Ș', 'g'), 'S');
				text = text.replace(new RegExp('ț|ţ', 'g'), 't');
				text = text.replace(new RegExp('Ţ|Ț', 'g'), 'T');
				return text;
			} else {
				return null;
			}
		},

		/* ---------------------------------------------- DB utils ---------------------------------------------- */

		updateLastLogin: idUser => {
			if (idUser) {
				let tasks = [];
				tasks.push(cb => {
					db.models.User.update({last_login: new Date()}, {where: {id: idUser}}).then(() => cb()).catch(err => cb(err));
				});
				tasks.push(cb => {
					db.query('UPDATE "UserAction" SET date=now(), details=details || \';\' || now()::text WHERE action=\'LogIn\' AND id_user = ' + idUser).then(resp => {
						if (resp[1].rowCount > 0) {
							cb();
						} else {
							db.query('INSERT INTO "UserAction"(action, date, details, "createdAt", "updatedAt", id_user) ' +
								'VALUES (\'LogIn\', now(), now(), now(), now(), ' + idUser + ')').then(() => cb()).catch(err => cb(err));
						}
					}).catch(err => cb(err));
				});
				async.parallel(tasks, () => null);
			}
		},

		saveError: saveError,

		logAction: (idUser, action, details, report) => {
			if (idUser) {
				db.models.UserAction.create({
					id_user: idUser,
					action: action,
					details: details,
					date: new Date(),
					report: (report !== null || report !== undefined ? report : null)
				}).catch(err => console.log('update user action', err));
			}
		}
	};

};