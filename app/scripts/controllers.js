'use strict';
angular.module('LovedOneNotifier.controllers', [])

.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate, localStorageService) {

  $scope.startApp = function() {
    localStorageService.set('skip', true);
    $state.go('home');
  };
  $scope.next = function() {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function() {
    $ionicSlideBoxDelegate.previous();
  };

  $scope.slideChanged = function(index) {
    $scope.slideIndex = index;
  };
})

.controller('HomeCtrl', function($ionicPlatform, $scope, $state, localStorageService) {
  $scope.lonConfig = {};
  $scope.lonConfig.isEnabled = localStorageService.get('lonConfig.isEnabled') === 'true' ? true : false;
  $scope.lonConfig.savedContacts = localStorageService.get('lonConfig.savedContacts') || [];
  $scope.lonConfig.threshold = parseInt(localStorageService.get('lonConfig.threshold')) || 15;
  $scope.lonConfig.message = localStorageService.get('lonConfig.message');

  if ($scope.lonConfig.message === null || $scope.lonConfig.message === 'null') {
    $scope.lonConfig.message = 'My Battery is Dying.. TTYL.';
  }

  localStorageService.bind($scope, 'lonConfig.isEnabled', $scope.lonConfig.isEnabled);
  localStorageService.bind($scope, 'lonConfig.threshold', $scope.lonConfig.threshold);
  localStorageService.bind($scope, 'lonConfig.message', $scope.lonConfig.message);
  localStorageService.bind($scope, 'lonConfig.savedContacts', $scope.lonConfig.savedContacts);

  $scope.toContacts = function() {
    $state.go('contacts');
  };

  $ionicPlatform.ready(function() {
    $scope.onBatteryStatus = function(info) {

      $scope.lonConfig.level = info.level;
      $scope.lonConfig.isPlugged = info.isPlugged;

      if (info.isPlugged) {
        localStorageService.set('lonConfig.lastSentBattery', null);
      }

      if ($scope.lonConfig.isEnabled && !info.isPlugged && info.level <= parseInt(localStorageService.get('lonConfig.threshold'))) {
        $scope.sendSMS(info);

      }

      $scope.$apply();

    };

    window.addEventListener('batterystatus', $scope.onBatteryStatus, false);


    $scope.sendSMS = function(info) {

      var lastSentBattery = localStorageService.get('lonConfig.lastSentBattery');

      lastSentBattery = lastSentBattery === 'null' ? null : lastSentBattery;

      function _sms(number) {
        var msg = localStorageService.get('lonConfig.message');

        var message = msg !== 'null' ? msg : 'My Battery is Dying.. TTYL.';
        var intent = ''; //leave empty for sending sms using default intent
        var success = function() {
          //alert('Message sent successfully');
        };
        var error = function() {
          //alert('Message Failed:' + e);
        };
        sms.send(number, message, intent, success, error);
      }

      if ((lastSentBattery === null) || parseInt(lastSentBattery) < info.level) {
        var savedContacts = localStorageService.get('lonConfig.savedContacts');
        savedContacts = savedContacts ? savedContacts : [];
        var _u = [];

        for (var i = 0; i < savedContacts.length; i++) {
          _u.push(savedContacts[i].name);
          _sms(savedContacts[i].number);
        }

        if (_u.length > 0) {
          window.plugin.notification.local.add({
            autoCancel: true,
            message: 'Battery Notification Message sent to : ' + _u.join(', ')
          });
        }
        localStorageService.set('lonConfig.lastSentBattery', info.level);
      }
    };
  });

}).controller('ContactsCtrl', function($scope, $ionicLoading, localStorageService) {

  $ionicLoading.show({
    template: 'Loading Contacts...'
  });

  var options = new ContactFindOptions();
  options.multiple = true;
  options.desiredFields = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name, navigator.contacts.fieldType.phoneNumbers];

  var fields = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];

  function onSuccess(contacts) {

    var _contacts = contacts.filter(function(c) {
      return (c.displayName && c.phoneNumbers);
    });

    var savedContacts = localStorageService.get('lonConfig.savedContacts');
    savedContacts = savedContacts ? savedContacts : [];

    for (var i = 0; i < _contacts.length; i++) {
      innerLoop: for (var j = 0; j < savedContacts.length; j++) {
        if (savedContacts[j].id === _contacts[i].id) {
          _contacts[i].isChecked = true;
          break innerLoop;
        } else {
          _contacts[i].isChecked = false;
        }
      }
    }

    $scope.contacts = _contacts;

    $ionicLoading.hide();
  }

  function onError(contactError) {
    $scope.error = contactError;
    //alert('onError!');
    $ionicLoading.hide();
  }

  // get the contacts
  navigator.contacts.find(fields, onSuccess, onError, options);

  $scope.handleContact = function(c) {
    var savedContacts = localStorageService.get('lonConfig.savedContacts');
    savedContacts = savedContacts ? savedContacts : [];

    if (c.isChecked) {
      // add to localStorage

      savedContacts.push({
        id: c.id,
        name: c.displayName,
        number: c.phoneNumbers[0].value
      });

      localStorageService.set('lonConfig.savedContacts', savedContacts);

    } else {
      // remove from localStorage
      savedContacts.forEach(function(k, v) {
        if (k.id === c.id) {
          savedContacts.splice(v, 1);
        }
      });

      localStorageService.set('lonConfig.savedContacts', savedContacts);
    }

    $scope.savedContacts = savedContacts;
  };


});
