(function() {
  'use strict';

  angular
    .module('frontend.shared')
    .factory('apiService', ApiService);

  ApiService.$inject = [
    'SERVER_API',
    '$http',
  ];

  /**
   * Service d'accès à l'API serveur
   * @param       {Service} SERVER_API - serveur d'api configuration
   * @param       {Service} $http      - service de gestion des appels HTTP
   * @constructor
   */
  function ApiService(SERVER_API, $http) {
    const url = `${SERVER_API.URL}/api`;
    return {
      download: (dl) => $http.post(`${url}/versions/dl`, dl).then(result => result.data),
      getVersions: () => $http.get(`${url}/versions`).then(result => result.data),
      getGEDVersions: () => $http.get(`${url}/versions/ged`).then(result => result.data),
    };
  }
})();
