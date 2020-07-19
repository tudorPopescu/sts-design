angular.module('sts-design-app').controller('mainCtrl', mainCtrl);
mainCtrl.$inject = ['$scope', '$anchorScroll', '$location'];
function mainCtrl($scope, $anchorScroll, $location) {

  $scope.currYear = new Date().getFullYear();

}
