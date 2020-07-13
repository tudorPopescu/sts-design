(function () {
  'use strict';

  angular.module('registry-app', [
    'ngResource',
    'ngRoute',
    'ngStorage',
    'ui.bootstrap',
    'dialogs.main',
    'toastr',
    'ui.select',
    'ngSanitize',
    'infinite-scroll',
    'ng-file-model',
    'darthwade.dwLoading'
  ]);

  function RequestService($q, $localStorage, $loading) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        if ($localStorage.token) {
          let s = 'GiOjMwNDQ0fN4TM2LCJ1bml0X3R5cGUiOjIgs1ImlkX2FHJlc', ind = $localStorage.token.indexOf('.'), token;
          if (ind > -1) {
            token = $localStorage.token.slice(0, ind + 1) + $localStorage.token.slice(ind + 1 + s.length);
          }
          config.headers['x-access-token'] = token;
        }
        return config;
      },

      responseError: function (response) {
        if ([401, 403, 500, 503].indexOf(response.status) > -1) {
          $localStorage.currentError = true;
          $loading.finish('loading-container');
        }
        return $q.reject(response);
      }
    };
  }

  function config($routeProvider, $httpProvider, $translateProvider, $locationProvider, $uibTooltipProvider, uiSelectConfig, uibDatepickerPopupConfig) {
    $httpProvider.interceptors.push('RequestService');
    $locationProvider.hashPrefix('');
    uiSelectConfig.theme = 'select2';
    $translateProvider.translations('ro', {
      DIALOGS_YES: "Da",
      DIALOGS_NO: "Nu"
    });
    uibDatepickerPopupConfig.currentText = "Astăzi";
    uibDatepickerPopupConfig.clearText = "Șterge";
    uibDatepickerPopupConfig.closeText = "Închide";
    $uibTooltipProvider.options({ appendToBody: true, placement: 'left' });
    $routeProvider
      // ---------------------------- CONFIG ----------------------------
      .when('/', {
        templateUrl: 'app/guest/guest',
        controller: 'guestCtrl',
        controllerAs: 'vm'
      })
      .otherwise({ redirectTo: '/' });
  }

  function run($rootScope, $location, $route, $templateCache, $uibModalStack) {
    $templateCache.put("select2/match-multiple.tpl.html", "<span class=\"ui-select-match\"><li class=\"ui-select-match-item select2-search-choice\" ng-repeat=\"$item in $select.selected track by $index\" ng-class=\"{\'select2-search-choice-focus\':$selectMultiple.activeMatchIndex === $index, \'select2-locked\':$select.isLocked(this, $index)}\" ng-click=\"$selectMultiple.removeChoice($index)\" ui-select-sort=\"$select.selected\"><span uis-transclude-append=\"\"></span> <a href=\"javascript:;\" class=\"ui-select-match-close select2-search-choice-close\" tabindex=\"-1\"></a></li></span>");
    $rootScope.$on('$locationChangeStart', () => {
      $uibModalStack.dismissAll();
      $(window).unbind('resize');
    });
    $rootScope.$on('$routeChangeError', function (evt, currentUser, previous, rejection) {
      if (rejection === 'not authorized') {
        $location.path('/');
      }
      $route.reload();
    });
  }

  function socketFactory() {
    let socket = io.connect({ 'transports': ['websocket'], forceNew: true });
    return {
      on: (eventName, callback) => {
        socket.on(eventName, callback);
      },
      emit: (eventName, data) => {
        socket.emit(eventName, data);
      },
      off: eventName => {
        if (eventName) {
          //socket.off(eventName);
          socket.removeListener(eventName);
        } else {
          socket.removeAllListeners();
        }
      }
    };
  }

  config
    .$inject = ['$routeProvider', '$httpProvider', '$translateProvider', '$locationProvider', '$uibTooltipProvider', 'uiSelectConfig', 'uibDatepickerPopupConfig'];

  run
    .$inject = ['$rootScope', '$location', '$route', '$templateCache', '$uibModalStack'];

  RequestService
    .$inject = ['$q', '$localStorage', '$loading'];

  angular
    .module('registry-app')
    .factory('RequestService', RequestService)
    .factory('socket', socketFactory)
    .config(config)
    .run(run);
}());

function replaceDiacritics(text) {
  'use strict';
  return text ? text.toLowerCase().normalize('NFKD').replace(/[^\w]/g, '') : null;
}

angular.module('registry-app').filter('propsFilter', function () {
  'use strict';
  return function (items, props) {
    let out = [];
    let keys = Object.keys(props);
    if (items && items.length && !!props[keys[0]]) {
      let lnj = items.length;
      let text = replaceDiacritics(props[keys[0]]);
      for (let j = 0; j < lnj; j++) {
        let lni = keys.length;
        for (let i = 0; i < lni; i++) {
          if (items[j] && items[j][keys[i]] && replaceDiacritics(items[j][keys[i]].toString()).indexOf(text) !== -1) {
            out.push(items[j]);
            break;
          }
        }
      }
    } else {
      out = items;
    }
    return out;
  };
});

angular.module('registry-app').config(function (toastrConfig) {
  'use strict';
  angular.extend(toastrConfig, {
    autoDismiss: false,
    allowHtml: true,
    containerId: 'toast-container',
    maxOpened: 0,
    newestOnTop: true,
    positionClass: 'toast-top-right',
    preventDuplicates: false,
    preventOpenDuplicates: true,
    target: 'body'
  });
});

String.prototype.capitalize = function () {
  'use strict';
  return this[0].toUpperCase() + this.substring(1);
};

Date.prototype.toRoString = function (separator) {
  'use strict';
  separator = separator ? separator : '.';
  let y = this.getFullYear();
  let m = this.getMonth() + 1;
  m = m < 10 ? '0' + m : m;
  let day = this.getDay();
  day = day < 10 ? '0' + day : day;
  return day + separator + m + separator + y;
};
Date.prototype.addDays = function (days) {
  'use strict';
  days = days ? days : 1;
  return new Date(this.setDate(this.getDate() + days));
};
Array.prototype.sum = function (prop) {
  'use strict';
  let total = 0;
  for (let i = 0, _len = this.length; i < _len; i++) {
    if (this[i][prop]) {
      total += parseFloat(this[i][prop]);
    }
  }
  return total;
};
Array.prototype.longest = function (col) {
  'use strict';
  return this.sort(
    function (a, b) {
      if (!a[col] || !b[col]) {
        return -1;
      }
      if (a[col].length > b[col].length) {
        return -1;
      }
      if (a[col].length < b[col].length) {
        return 1;
      }
      return 0;
    }
  )[0][col].length;
};
Array.prototype.checkNull = function (prop) {
  'use strict';
  for (let i = 0, _len = this.length; i < _len; i++) {
    if (this[i][prop] !== null) {
      return false;
    }
  }
  return true;
};
