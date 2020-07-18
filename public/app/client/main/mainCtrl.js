angular.module('sts-design-app').controller('mainCtrl', mainCtrl);
mainCtrl.$inject = ['$scope'];
function mainCtrl($scope) {

  $scope.currYear = new Date().getFullYear();
  console.log('mata');
};
