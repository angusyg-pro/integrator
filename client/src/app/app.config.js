(function() {
  'use strict';

  angular
    .module('frontend')
    .constant('SERVER_API', {
      URL: 'http://localhost:3005',
    })
    .config(RoutingConfig)

  RoutingConfig.$inject = [
    '$stateProvider',
    '$urlRouterProvider',
  ];

  function RoutingConfig($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    const rootState = {
      name: 'root',
      url: '/',
      templateUrl: 'partials/home/home.html',
      controller: 'HomeController',
      controllerAs: 'home',
      resolve: {
        versions: ['apiService', (apiService) => apiService.getVersions()],
        gedVersions: ['apiService', (apiService) => apiService.getGEDVersions()],
      }
    };

    $stateProvider.state(rootState);
  }
})();
