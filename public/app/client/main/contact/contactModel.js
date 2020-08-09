angular.module('sts-design-app').factory('contactModel', $resource => {
  return {
    sendContactMail: $resource('/api/contact/send')
  };
});
