module.exports = db => {
  'use strict';
  const {success: rhs} = require('../utils/requestHandler');

  return {
    sendMailContact: ( mail, res) => {
      let mailOptions = {
        from: 'Contact STS-Design',
        to: ['tudorp2@gmail.com'],
        subject: `Contact STS-Design`,
        html: `
          <p style="margin-bottom: 5px;">Mail Contact trimis de către:<p/>
          <p style="margin-bottom: 5px;">${mail.lastName} ${mail.firstName}</p>
          <p style="margin-bottom: 5px;">Telefon: ${mail.phone}</p>
          <p style="margin-bottom: 5px;">Email: ${mail.email}</p>
          <p style="margin-bottom: 5px;">Mesaj: ${mail.message}</p>
        `
      };

      global.smtpTransportYour.sendMail(mailOptions, err => {
        if (!err) {
          rhs(res);
        }
      });
    }
  };
};
