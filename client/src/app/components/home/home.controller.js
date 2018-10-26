(function() {
  'use strict';

  angular
    .module('frontend.home')
    .filter('snapshotFilter', SnapshotFilter)
    .controller('HomeController', HomeController);

  function SnapshotFilter() {
    return (array, snapshot) => {
      if (!snapshot) snapshot = false;
      return array.filter(item => item.snapshot === snapshot);
    }
  }

  HomeController.$inject = [
    'versions',
    'gedVersions',
    'apiService',
    'toastService',
  ];

  function HomeController(versions, gedVersions, apiService, toastService) {
    const vm = this;

    vm.versions = versions;
    vm.gedVersions = gedVersions;
    vm.dl = {
      versionFrom: null,
      versionTo: null,
      emails: '',
      gedReplace: false,
      gedSnapshot: false,
      gedVersion: null,
    };

    vm.download = download;

    /**
     * Lance un téléchargement
     */
    function download() {
      // Appel au service avec les paramètres
      apiService.download(vm.dl)
        .then(() => toastService.success('Téléchargement lancé'))
        .catch(err => errorHandlerService.handleServerError(err, 'Une erreur est survenue lors du lancement du téléchargement'));
    }
  }
})();
