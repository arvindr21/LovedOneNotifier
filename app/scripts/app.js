'use strict';
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
angular.module('LovedOneNotifier', ['ionic', 'config', 'LocalStorageModule', 'LovedOneNotifier.controllers'])

.run(function($ionicPlatform, $rootScope, localStorageService, $location, $timeout) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        var myService = cordova.require('com.red_folder.phonegap.plugin.backgroundservice.BackgroundService');

        myService.startService(function() { //r
                // service started
            },
            function(e) {
                //alert('Error: ' + e.ErrorMessage);
            });

        var skipIntro;

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState) {
                skipIntro = localStorageService.get('skip') === 'true' ? true : false;

                if (fromState.name === 'home' && toState.name === 'intro') {
                    if (skipIntro) {
                        navigator.app.exitApp();
                    }
                }
                if (fromState.name === 'intro' && toState.name === 'loading') {
                    navigator.app.exitApp();
                }
                if (fromState.name === 'home' && toState.name === 'loading') {
                    navigator.app.exitApp();
                }
                if (toState.name === 'intro') {
                    if (skipIntro) {
                        location.href = '#/home';
                    }
                }
            });

        skipIntro = localStorageService.get('skip') === 'true' ? true : false;

        if ($location.$$url === '/loading') {
            $timeout(function() {
                if (skipIntro) {
                    location.href = '#/home';
                } else {
                    location.href = '#/intro';
                }
            }, 2000);
        }


    });
})

.config(function($stateProvider, $urlRouterProvider, localStorageServiceProvider) {

    $stateProvider
        .state('loading', {
            url: '/loading',
            templateUrl: 'templates/loading.html'
        })

    .state('intro', {
        url: '/intro',
        templateUrl: 'templates/intro.html',
        controller: 'IntroCtrl'
    })

    .state('home', {
        url: '/home',
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl'
    })

    .state('contacts', {
        url: '/contacts',
        templateUrl: 'templates/contacts.html',
        controller: 'ContactsCtrl'
    });

    $urlRouterProvider.otherwise('/loading');

    localStorageServiceProvider
        .setPrefix('lon');


});
