module.exports = db => {
  'use strict';
  const emailSender = require('../utils/emailSender')(db);

  return {
    sendMailContact: (req, res) => {
      emailSender.sendMailContact(req.body, res)
    }
  };
};
