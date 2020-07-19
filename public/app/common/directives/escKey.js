angular.module('sts-design-app').directive('escKey', () => {
  'use strict';
  return function (scope, element, attrs) {
    element.bind('keydown keypress', event => {
      if (event.which === 27) {
        scope.$apply(() => {
          scope.$eval(attrs.escKey);
        });
        event.preventDefault();
      }
    });
  };
});