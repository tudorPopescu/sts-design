module.exports = db => {
  'use strict';
  const rhs = require('../utils/requestHandler').success;
  const saveError = require('../utils/utils')(db).saveError;
  const logAction = require('../utils/utils')(db).logAction;
  const async = require('async');
  const _ = require('lodash');

  return {
    create: (req, res) => {
      db.query(`SELECT number FROM "StartNumber" WHERE year = ${new Date().getFullYear()} AND id_unit = ${req.user.id_unit}`).then(resp => {
        for (let key in req.body) {
          if (req.body.hasOwnProperty(key) && (typeof req.body[key] === 'string' || req.body[key] instanceof String)) {
            req.body[key] = req.body[key].replace(/\'/g, "\''");
          }
        }
        db.query(`INSERT INTO "Document" ("number", date, number_document, date_document, end_date, type, input, content, observation, expedition_date, viewed, canceled,
        "createdAt", "updatedAt", id_unit, id_user, id_draft_status, id_compartment, provenance, expedition)

        SELECT case when max(number) is null then ${(resp[0][0] ? resp[0][0].number : 1)} else max(number) + 1 end AS number,
        ${req.body.date ? `'${req.body.date}'` : null}, ${req.body.number_document || null}, ${req.body.date_document ? `'${req.body.date_document}'` : null}, ${req.body.end_date ? `'${req.body.end_date}'` : null},
        '${req.body.type}', ${req.body.input}, ${req.body.content ? `'${req.body.content}'` : null}, ${req.body.observation ? `'${req.body.observation}'` : null},
        ${req.body.expedition_date ? `'${req.body.expedition_date}'` : null}, false, ${(req.body.canceled || null)}, now(), now(), ${req.user.id_unit}, ${req.user.id}, ${req.body.id_draft_status || null},
        ${req.body.id_compartment || null}, ${req.body.provenance ? `'${req.body.provenance}'` : null}, ${req.body.expedition ? `'${req.body.expedition}'` : null}
        FROM "Document" WHERE id_unit = ${req.user.id_unit} AND to_char(date, 'yyyy')::int = ${new Date().getFullYear()} returning id`).then(resp => {
          if (resp[0].length && resp[0][0].id) {
            logAction(req.user.id, 'Creare document', 'id: ' + resp[0][0].id);
            res.json({id: resp[0][0].id});
          } else {
            saveError(req.user, 'create Document', 'no such document', res);
          }
        }).catch(e => saveError(req.user, 'create Document', e, res));
      }).catch(e => saveError(req.user, 'create Document - select next number', e, res));
    },

    update: (req, res) => {
      let tasks = [];
      tasks.push(cb => {
        db.models.Document.update(req.body, {where: {id: req.body.id}}).then(resp => {
          if (resp[0] > 0) {
            cb();
          } else {
            cb('Document update - not found');
          }
        }).catch(e => cb(e));
      });
      if (!req.body.canceled && req.body.documentHistory) {
        tasks.push(cb => {
          db.models.DocumentHistory.create({id_document: req.body.id, changes_text: req.body.documentHistory.slice(0, -1)}).then(() => cb()).catch(e => cb(e));
        });
      }
      if (req.body.idDeleteFile) {
        tasks.push(cb => {
          db.query('DELETE FROM "File" WHERE id = ' + req.body.idDeleteFile).then(dh => {
            if (dh[1].rowCount > 0) {
              cb();
            } else {
              cb('File delete - not found');
            }
          }).catch(e => cb(e));
        });
      }
      async.parallel(tasks, e => {
        if (e) {
          saveError(req.user, 'update Document', e, res);
        } else {
          logAction(req.user.id, (req.body.canceled ? 'Anulare' : 'Modificare') + ' document', 'id: ' + req.body.id);
          rhs(res);
        }
      });
    },

    findAll: (req, res) => {
      let tasks = [], documents, docHistory;
      tasks.push(cb => {
        db.query(`SELECT d.id, d.id_user, d.number, d.date, d.end_date, d.canceled, d.input, d.type, d.viewed, d.id_compartment, d.id_unit, d.provenance, d.expedition
        ,case when d.input = true then 'Intrare' else 'Ieșire' end AS input_view
        ,case when d.canceled = true then 'Anulat' else ds.name end AS status, ds.id as status_id
        ,d.number_document, d.date_document, d.content, d.expedition_date, d.observation, c.name AS compartment,
        json_build_object('id', f.id, 'name', f.name, 'extension', f.extension) AS file
        FROM "Document" d
        LEFT JOIN "DraftStatus" ds ON ds.id = d.id_draft_status
        LEFT JOIN "Compartment" c ON c.id = d.id_compartment
        LEFT JOIN "File" f on f.id_document = d.id
        WHERE d.id_unit = ${req.user.id_unit}
        AND to_char(d.date, 'yyyy')::int = ${req.user.current_year}
        ORDER BY d.id DESC`).then(resp => {
          documents = resp[0];
          cb();
        }).catch(e => cb(e));
      });
      tasks.push(cb => {
        db.query('SELECT count(dh.*), dh.id_document ' +
          'FROM "Document" d ' +
          'LEFT JOIN "DocumentHistory" dh ON dh.id_document = d.id ' +
          'GROUP BY dh.id_document HAVING count(dh.*) > 0').then(resp => {
          docHistory = resp[0];
          cb();
        }).catch(e => cb(e));
      });
      async.parallel(tasks, e => {
        if (!e) {
          for (let i = documents.length - 1; i >= 0; i--) {
            documents[i].showHistory = !!_.find(docHistory, {id_document: documents[i].id});
            documents[i].date = documents[i].date ? (new Date(documents[i].date)).setHours(0, 0, 0, 0) : null;
            documents[i].date_document = documents[i].date_document ? (new Date(documents[i].date_document)).setHours(0, 0, 0, 0) : null;
          }
          res.json(documents);
        } else {
          saveError(req.user, 'findAll Document', e, res);
        }
      });
    },

    find: (req, res) => {
      db.query(`SELECT d.*, to_json(f) AS file
      FROM "Document" d
      LEFT JOIN (SELECT id, name, id_document FROM "File") f ON f.id_document = d.id
      WHERE d.id = ${req.params.id}`).then(resp => {
        if (resp[0].length) {
          res.json(resp[0][0]);
        } else {
          saveError(req.user, 'find Document, id: ' + req.params.id, 'not found', res);
        }
      }).catch(e => saveError(req.user, 'find Document, id: ' + req.params.id, e, res));
    },

    findAllHistory: (req, res) => {
      db.query(`SELECT changes_text AS changes, "createdAt" FROM "DocumentHistory"
      WHERE id_document = ${req.params.id}
      ORDER BY id DESC`).then(resp => {
        res.json(resp[0]);
      }).catch(e => saveError(req.user, 'findAllHistory Document, id: ' + req.params.id, e, res));
    },

    findViewed: (req, res) => {
      if (req.user.id_compartment && req.user.id_compartment[0]) {
        db.query(`SELECT COUNT(id)
        FROM "Document"
        WHERE viewed IS NOT TRUE AND id_unit = ${req.user.id_unit} AND id_compartment IN (${req.user.id_compartment.join(',')})`).then(resp => {
          res.json(resp[0][0]);
        }).catch(e => saveError(req.user, 'findViewed Document', e, res));
      } else {
        res.json({});
      }
    },

    updateViewed: (req, res) => {
      let ids = _.filter(_.map(req.body, 'id'), f => !!f);
      if (ids.length) {
        db.query(`UPDATE "Document" SET "viewed" = true WHERE id IN (${ids})`).then(() => {
          rhs(res);
        }).catch(e => saveError(req.user, 'updateViewed Document', e, res));
      } else {
        rhs(res);
      }
    },

    getYears: (req, res) => {
      db.query(`SELECT DISTINCT date_part('year', date) AS year
      FROM "Document"
      WHERE id_unit = ${req.user.id_unit}
      ORDER BY year DESC`).then(resp => {
        res.json(resp[0]);
      }).catch(e => saveError(req.user, 'getYears Document', e, res));
    },

    findTypes: (req, res) => {
      db.query(`SELECT DISTINCT type
      FROM "Document"
      WHERE id_unit = ${req.user.id_unit} AND type IS NOT NULL`).then(resp => {
        res.json(_.map(resp[0], 'type'));
      }).catch(e => saveError(req.user, 'findTypes Document', e, res));
    },

    findExpired: (req, res) => {
      db.query(`SELECT d.id, d.number, d.date, d.end_date, d.canceled, d.input, d.type, d.viewed, d.id_compartment, d.id_unit, d.provenance, d.expedition
        ,case when d.input = true then 'Intrare' else 'Ieșire' end AS input_view
        ,case when d.canceled = true then 'Anulat' else ds.name end AS status, ds.id as status_id
        ,d.number_document, d.date_document, d.content, d.expedition_date, d.observation, c.name AS compartment,
        json_build_object('id', f.id, 'name', f.name, 'extension', f.extension) AS file
        FROM "Document" d
        RIGHT JOIN "DraftStatus" ds ON ds.id = d.id_draft_status AND ds.id = 1
        LEFT JOIN "Compartment" c ON c.id = d.id_compartment
        LEFT JOIN "File" f on f.id_document = d.id
        WHERE d.id_unit = ${req.user.id_unit} AND (d.end_date::date - NOW()::date) < 0 AND to_char(d.date, 'yyyy')::int = ${req.user.current_year}
        ORDER BY d.id DESC`).then(resp => {
        res.send(resp[0]);
      }).catch(e => saveError(req.user, 'findExpired Document', e, res));
    },

    findToExpire: (req, res) => {
      db.query(`SELECT d.id, d.end_date::date - NOW()::date AS to_expire, d.number, d.date, d.end_date, d.canceled, d.input, d.type, d.viewed, d.id_compartment, d.id_unit, d.provenance, d.expedition
        ,case when d.input = true then 'Intrare' else 'Ieșire' end AS input_view
        ,case when d.canceled = true then 'Anulat' else ds.name end AS status, ds.id as status_id
        ,d.number_document, d.date_document, d.content, d.expedition_date, d.observation, c.name AS compartment,
        json_build_object('id', f.id, 'name', f.name, 'extension', f.extension) AS file
        FROM "Document" d
        RIGHT JOIN "DraftStatus" ds ON ds.id = d.id_draft_status AND ds.id = 1
        LEFT JOIN "Compartment" c ON c.id = d.id_compartment
        LEFT JOIN "File" f on f.id_document = d.id
        WHERE d.id_unit = ${req.user.id_unit} AND (d.end_date::date - NOW()::date) > 0 AND (d.end_date::date - NOW()::date) < 6 AND to_char(d.date, 'yyyy')::int = ${req.user.current_year}
        ORDER BY d.id DESC`).then(resp => {
        res.send(resp[0]);
      }).catch(e => saveError(req.user, 'findToExpire Document', e, res));
    },

    findAllbyIdUnit: (req, res) => {
      db.query(`SELECT d.id, d.number, d.date, d.end_date, d.canceled, d.input, d.type, d.viewed, d.id_compartment, d.id_unit, d.provenance, d.expedition
        ,case when d.input = true then 'Intrare' else 'Ieșire' end AS input_view
        ,case when d.canceled = true then 'Anulat' else ds.name end AS status, ds.id as status_id
        ,d.number_document, d.date_document, d.content, d.expedition_date, d.observation, c.name AS compartment,
        json_build_object('id', f.id, 'name', f.name, 'extension', f.extension) AS file
        FROM "Document" d
        LEFT JOIN "DraftStatus" ds ON ds.id = d.id_draft_status
        LEFT JOIN "Compartment" c ON c.id = d.id_compartment
        LEFT JOIN "File" f on f.id_document = d.id
        WHERE d.id_unit = ${req.params.id_unit}
        ORDER BY d.id DESC`).then(resp => {
        res.json(resp[0]);
        }).catch(e => saveError(req.user, 'findAllbyIdUnit Document, id_unit: ' + req.params.id_unit, e, res));
    },

    destroy: (req, res) => {
      db.query(`SELECT id, type FROM "Document" WHERE id = ${req.params.id}`).then(resp => {
        if (resp[0].length) {
          db.query(`DELETE FROM "Document" WHERE id = ${req.params.id}`).then(() => {
            rhs(res);
          }).catch(e => saveError(req.user, 'destroy Document, id: ' + req.params.id, e, res));
        } else {
          saveError(req.user, 'destroy Document, id: ' + req.params.id, 'Not found!', res);
        }
      }).catch(e => saveError(req.user, 'destroy Document Find before delete, id: ' + req.params.id, e, res));
    }
  };
};
