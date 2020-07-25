angular.module('sts-design-app').controller('mainCtrl', mainCtrl);
mainCtrl.$inject = ['$scope', '$rootScope', '$location'];
function mainCtrl($scope, $rootScope, $location) {

  $scope.currYear = new Date().getFullYear();
  $rootScope.$on('$routeChangeSuccess', function() {
    $scope.location = $location.path();
  });
}
