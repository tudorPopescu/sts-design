module.exports = db => {
	'use strict';
	const saveError = require('../utils/utils')(db).saveError;
	const rhs = require('../utils/requestHandler').success;
  const fs = require('fs');

	return {
    create: (req, res) => {
      if (req.files && req.files.length) {
        fs.readFile(req.files[0].path, (er, data) => {
          if (er) {
            saveError(req.user, 'Create File', er)
          }else {
            let extension = req.files[0].originalname.split(".").pop().toLowerCase();
            fs.unlink(req.files[0].path, e=> {
              if (e) saveError(req.user, req.files[0].path + ' - unlink file, create', e);
            });
            req.body.extension = extension;
            req.body.file_blob = data;
            db.models.File.create(req.body).then(() => rhs(res)).catch(e => saveError(req.user, 'create File', e, res));
          }
        });
      } else {
        saveError(req.user, 'Create File, id_document: ' + req.body.id_document, 'not found', res);
      }
    },

		update: (req, res) => {
      if (req.files && req.files.length) {
        fs.readFile(req.files[0].path, (er, data) => {
          if (er) {
            saveError(req.user, 'Update File', er)
          }else {
            let extension = req.files[0].originalname.split(".").pop().toLowerCase();
            fs.unlink(req.files[0].path, e=> {
              if (e) saveError(req.user, req.files[0].path + ' - unlink file, update', e);
            });
            req.body.extension = extension;
            req.body.file_blob = data;
            db.models.File.update(req.body, {where: {id: req.body.id}}).then(resp => {
              if (resp[0] > 0) {
                rhs(res);
              } else {
                saveError(req.user, 'update File, id: ' + req.body.id, 'not found', res);
              }
            }).catch(e => saveError(req.user, 'update File, id: ' + req.body.id, e, res));
          }
        });
      } else {
        rhs(res);
      }
		},

		find: (req, res) => {
			db.query(`SELECT id, name FROM "File" WHERE id = ${req.params.id}`).then(resp => {
				if (resp[0].length) {
					res.json(resp[0][0]);
				} else {
					saveError(req.user, 'find File, id: ' + req.params.id, 'not found', res);
				}
			}).catch(e => saveError(req.user, 'find File, id: ' + req.params.id, e, res));
		},

		findAll: (req, res) => {
			db.query(`SELECT u.name AS unit, f.id, f.name, f.extension, octet_length(f.file_blob) AS size_number,
			CASE WHEN octet_length(f.file_blob) < 1048576 THEN CONCAT(CEILING(octet_length(f.file_blob) / 1024), ' KB') ELSE CONCAT(round(octet_length(f.file_blob)::numeric / 1048576, 2), ' MB') END AS size
			FROM "File" f
			LEFT JOIN "Document" d ON d.id = f.id_document
			LEFT JOIN "Unit" u ON u.id = d.id_unit
			WHERE f.extension = 'pdf' AND compressed is not true
			ORDER BY f.id DESC`).then(resp => {
				res.json(resp[0]);
			}).catch(e => saveError(req.user, 'findAll File', e, res));
		},

		findForPrint: (req, res) => {
			let content = {
				pdf: 'application/pdf',
				doc: 'application/msword',
				docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				xls: 'application/vnd.ms-excel',
				xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			};
			db.query('SELECT name, extension, file_blob FROM "File" WHERE id = ' + req.params.id).then(resp => {
				if (resp[0].length) {
					if (content[resp[0][0].extension]) {
						res.contentType(content[resp[0][0].extension]);
					} else {
						res.contentType('application/' + content[resp[0][0].extension]);
					}
					res.send(resp[0][0].file_blob);
				} else {
					res.sendStatus(404);
				}
			}).catch(e => saveError(req.user, 'File findForPrint at id: ' + req.params.id, e, res));
		}
	};
};
