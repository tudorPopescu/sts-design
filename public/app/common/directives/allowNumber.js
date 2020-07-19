(function () {
  'use strict';
  angular.module('sts-design-app').directive('allowNumber', () => {
    return {
      require: 'ngModel',
      link: (scope, element, attrs, modelCtrl) => {
        modelCtrl.$parsers.push(inputValue => {
          if (inputValue.toString().length > 0) {
            let transformedInput = inputValue.toString().match(/(\d+)/g);

            if (transformedInput === null) {
              transformedInput = [''];
            }
            if (transformedInput && transformedInput[0] !== inputValue) {
              modelCtrl.$setViewValue(transformedInput[0]);
              modelCtrl.$render();
            }
            if (transformedInput) {
              return transformedInput[0] === '' ? null : transformedInput[0];
            }
            return null;
          } else {
            return null;
          }
        });
      }
    };
  });
})();