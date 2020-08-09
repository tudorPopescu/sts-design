exports.createTransport = function () {
  'use strict';
  let nodemailer = require('nodemailer');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: 'tudorp2@gmail.com',

      clientId: '299470438797-ftomp5rl6t7ju8vak4p7fpbmgkmntkes.apps.googleusercontent.com',
      clientSecret: 'juIFr097LKBiqsQUVvDDmzwT',

      accessToken: 'ya29.a0AfH6SMCNj5YPhpo0MdKKCLzoTGQSXFiMEUfbyLFwdv31Hfh1jAXJCa2Sh1Lqj0N7prwTlYsro1w-_mmFfxk_iSpX1NiYM0B6oSE0_sneVoUTiyKylBqbi2L2aYcUQDqGqDXkSobQsZLiLd7qbEW9L11fQkMmIX_jQZM',
      refreshToken: '1//0411odlyN4njuCgYIARAAGAQSNwF-L9IrvQ266dlz-yLd5x2JBIkBS1jrOnxPAgms5IFbUhsjRQoPj2SkIjZBN5l_iFLm2pS7uK8',
      expires: 1484314697598
    }
  });
};
