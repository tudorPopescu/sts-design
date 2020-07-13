angular.module('registry-app').controller('mainCtrl', mainCtrl);
mainCtrl.$inject = ['$scope', '$uibModal', '$localStorage', '$location', '$loading', '$q', 'socket', 'toastr', 'userModel', 'documentModel', 'draftStatusModel'];
function mainCtrl($scope, $uibModal, $localStorage, $location, $loading, $q, socket, toastr, userModel, documentModel, draftStatusModel) {

  let s = 'GiOjMwNDQ0fN4TM2LCJ1bml0X3R5cGUiOjIgs1ImlkX2FHJlc', token = window.token, ind = token.indexOf('.');
  if (ind > -1) {
    token = token.slice(0, ind + 1) + s + token.slice(ind + 1);
  }
  $localStorage.token = token;

  let getCurrentDate = () => {
    return $q(resolve => {
      let url = 'https://worldtimeapi.org/api/timezone/Europe/Bucharest';
      $.ajax({
        url: url, success: resp => {
          resolve({currentDate: new Date(resp.datetime)});
        }
      });
    });
  };

  userModel.bootstrappedUser.get().$promise.then(resp => {
    $scope.user = resp;
    // join to room with name bootstrappedUser.id
    socket.emit('join', resp);
    socket.on('reconnect', () => socket.emit('join', resp));
    if (resp.condition !== true) {
      $uibModal.open({
        templateUrl: 'app/client/main/condition/condition-modal',
        controller: 'conditionCtrl',
        size: 'lg',
        backdrop: 'static',
        scope: $scope,
        keyboard: false
      });
    } else {
      if (!$scope.currentDate) {
        try {
          getCurrentDate().then(resp => {
            $scope.currentDate = resp.currentDate;
            if (!(!!$location.path()) || $location.path() === '/') {
              $location.path('/document/');
            }
          });
        } catch (e) {
          $scope.currentDate = new Date();
          if (!(!!$location.path())) {
            $location.path('/document/');
          }
        }
      } else {
        if (!(!!$location.path())) {
          $location.path('/document/');
        }
      }
    }
  }).catch(() => toastr.error('Eroare la preluarea utilizatorului'));

  if (!$localStorage.status) {
    draftStatusModel.simple.query().$promise.then(resp => {
      $localStorage.status = resp;
    }).catch(() => toastr.error('Eroare la preluare status documente'));
  }

  const refreshNewDocuments = () => {
    documentModel.viewed.get().$promise.then(resp => {
      $scope.newDocuments = resp.count;
    }).catch(() => toastr.error('Eroare la preluarea datelor'));
  };
  refreshNewDocuments();

  $scope.startLoader = () => $loading.start('loading-container');
  $scope.stopLoader = () => $loading.finish('loading-container');

  $scope.viewDocuments = () => {
    $scope.newDocuments = 0;
    $location.path('/document/');
  };

  socket.on('newDocumentInfo', user => {
    if (user.id !== $scope.user.id && user.id_unit === $scope.user.id_unit) {
      if ($location.path() !== '/document') {
        refreshNewDocuments();
        toastr.info('O nouă înregistrare a fost trimisă către soluționare');
      } else {
        $scope.newDocuments = 0;
      }
    }
  });

  socket.on('accountDisabled', user => {
    if (user.id === $scope.user.id) {
      toastr.warning('Contul dumneavoastră a fost dezactivat');
      setTimeout(() => $scope.logOut(), 2000);
    }
  });

  socket.on('reloadPage', ()=> {
    let time = 10000;
    let t = time / 1000;
    setToast(t);
    setInterval(()=> {
      t -= 1;
      toastr.clear();
      setToast(t);
    }, 1000);
    setTimeout(()=> window.location.reload(), time);
  });

  function setToast(t) {
    if (t) {
      let msg = 'Aplicaţia se va actualiza in ' + t + ' secunde';
      toastr.info(msg, {extendedTimeOut: 0, timeOut: 0});
    }
  }

  $scope.changeYear = () => {
    $uibModal.open({
      templateUrl: 'app/client/main/changeYear/changeYear-modal',
      controller: 'changeYearCtrl',
      backdrop: 'static',
      size: 'sm',
      resolve: {user: () => $scope.user}
    }).result.then(() => location.reload()).catch(() => null);
  };

  $scope.getApps = () => {
    $uibModal.open({
      templateUrl: 'app/client/yourApp/yourApp-modal',
      controller: 'yourAppCtrl',
      size: 'sm',
      resolve: {user: () => $scope.user}
    }).result.catch(() => null);
  };

  $scope.editProfile = () => {
    $uibModal.open({
      templateUrl: 'app/client/main/profile/profile-modal',
      controller: 'profileCtrl',
      scope: $scope
    });
  };

  $scope.resetPassword = () => {
    $uibModal.open({
      templateUrl: 'app/client/main/resetPassword/resetPassword-modal',
      controller: 'resetPasswordCtrl',
      resolve: {user: () => $scope.user}
    }).result.catch(() => null);
  };

  $scope.getHandbook = () => {
    $scope.url = 'app/client/handbook/handbook.pdf';
    $scope.pdfTitle = 'Manual de utilizare';
    $uibModal.open({
      templateUrl: 'app/client/showPdf/showPdf-modal',
      controller: 'showPdfCtrl',
      windowClass: 'full-screen',
      scope: $scope
    }).result.catch(() => null);
  };

  $scope.contact = () => {
    $uibModal.open({
      templateUrl: 'app/client/main/contact/contact-modal',
      controller: 'contactCtrl',
      size: 'md',
      scope: $scope
    }).result.catch(() => null);
  };

  $scope.logOut = () => {
    $localStorage.$reset();
    let a = document.createElement('a');
    document.body.appendChild(a);
    a.href = '/auth/logout';
    a.click();
  };
}