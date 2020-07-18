(function () {
  'use strict';

  angular.module('sts-design-app', [
    'ngResource',
    'ngRoute',
    'ui.bootstrap',
    'dialogs.main',
    'toastr',
    'ngSanitize',
  ]);

  function RequestService() {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        return config;
      },
    };
  }

  function config($routeProvider, $httpProvider, $locationProvider) {
    $httpProvider.interceptors.push('RequestService');
    $routeProvider
      // ---------------------------- CONFIG ----------------------------
      .when('/', {
        templateUrl: 'app/client/main/home/home',
        controller: 'homeCtrl',
        controllerAs: 'vm'
      })

      .otherwise({ redirectTo: '/' });
  }

  function run($rootScope, $location, $route) {
    $rootScope.$on('$locationChangeStart', () => {
      $(window).unbind('resize');
    });
    $rootScope.$on('$routeChangeError', function (evt, currentUser, previous, rejection) {
      if (rejection === 'not authorized') {
        $location.path('/');
      }
      $route.reload();
    });
  }

  config
    .$inject = ['$routeProvider', '$httpProvider', '$translateProvider', '$locationProvider'];

  run
    .$inject = ['$rootScope', '$location', '$route', '$templateCache', '$uibModalStack'];

  RequestService
    .$inject = ['$q'];

  angular
    .module('sts-design-app')
    .factory('RequestService', RequestService)
    .config(config)
    .run(run);
}());
