angular.module('sts-design-app').controller('contactCtrl', contactCtrl);
contactCtrl.$inject = ['contactModel'];
function contactCtrl (contactModel) {
  'use strict';
  let vm = this;
  vm.form = {};
  vm.sendErr = undefined;

  let checkValidation = form => {
    vm.firstNameErr = false;
    vm.lastNameErr = false;
    vm.emailErr = false;
    vm.phoneErr = false;
    vm.messageErr = false;

    if (!form.firstName) {
      vm.firstNameErr = true;
    } else if (form.firstName) {
      vm.firstNameErr = false;
    }

    if (!form.lastName) {
      vm.lastNameErr = true;
    } else if (form.lastName) {
      vm.lastNameErr = false;
    }

    if (!form.email) {
      vm.emailErr = true;
    } else if (form.email) {
      vm.emailErr = false;
    }

    if (!form.phone) {
      vm.phoneErr = true;
    } else if (form.phone) {
      vm.phoneErr = false;
    }

    if (!form.message) {
      vm.messageErr = true;
      return false;
    } else if (form.message) {
      vm.messageErr = false;
    }

    return true;
  }

  vm.send = form => {
    if (checkValidation(form)) {
      contactModel.sendContactMail.save(form).$promise.then(() => {
        vm.sendErr = false;
      }).catch(() => {
        vm.sendErr = true;
      });
    }
  };
}
