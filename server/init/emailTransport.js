exports.createTransport = function () {
  'use strict';
  let nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: 'office.yourconsulting@gmail.com',

      clientId: '184683573738-tchs9l91lj00lau0cuevkiubvph5okb3.apps.googleusercontent.com',
      clientSecret: '8qPfSu90lL-hfLXVq0j_2fGx',

      accessToken: 'ya29.GlseBj3iHsyR-JKwi33gN8gfAy8dyfiX73AObDX9ZXMz5XjBhIbqQIG--OyQftP3SbtYLJd8IVotR1R_PSD3vHUeZJSf2Og8JKnfYzKGp0v-fQHBa8j2hFYXq0x2',
      refreshToken: '1/D1HDaehtSjegNa3QiWrjDoe0lRclMAygfhd5OFboAwk',
      expires: 1484314697598
    }
  });
};
