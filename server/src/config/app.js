/**
 * @fileoverview Configuration de base de l'application
 * @module config/app
 * @requires {@link external:path}
 */

const path = require('path');
const fs = require('fs');

const dlFolder = path.join(__dirname, '../../../data/dl');
if (!fs.existsSync(dlFolder)) fs.mkdirSync(dlFolder);

/**
 * Configuration
 * @namespace
 */
const app = {
  /**
   * Port du serveur
   * @type {number}
   * @default 3000
   */
  port: process.env.PORT || 3005,

  /**
   * Path du fichier de log du serveur
   * @type {string}
   */
  logFile: path.join(__dirname, '../../../logs/combined.log'),

  /**
   * Type de sortie de log (JSON ou NORMAL)
   * @type {string}
   */
  logType: '',

  /**
   * Liste de proxys pour rebond vers PFD
   * @type {object[]}
   */
  proxies: [{
      address: 'M57355',
      port: '8888',
    },
    {
      address: 'M57341',
      port: '8888',
    },
    {
      address: 'M57244',
      port: '8888',
    },
    {
      address: 'M54683',
      port: '8888',
    },
  ],

  /**
   * URL du repository Artifactory
   * @type {string}
   */
  artifactoryUrl: 'http://solar-repo.retraite.lan/artifactory/webrc/fr/dsirc/webrc',

  /**
   * Liste des EARS d'une version
   * @type {string[]}
   */
  // earList: [
  //   'webrc-attachment-batch-ear',
  //   'webrc-attachmentgdc-batch-ear',
  //   'webrc-authent-ws-ear',
  //   'webrc-back-front-ihm-ear',
  //   'webrc-back-ihm-ear',
  //   'webrc-back-front-ws-ear',
  //   'webrc-back-ws-ear',
  //   'webrc-carriere-batch-ear',
  //   'webrc-courrier-batch-ear',
  //   'webrc-dlrpcc-batch-ear',
  //   'webrc-doc-compo-ws-ear',
  //   'webrc-dossier-batch-ear',
  //   'webrc-front-cas-ear',
  //   'webrc-front-ihm-ear',
  //   'webrc-front-token-ear',
  //   'webrc-front-ws-ear',
  //   'webrc-gps-ws-ear',
  //   'webrc-individu-batch-ear',
  //   'webrc-loadprecreation-batch-ear',
  //   'webrc-precreation-batch-ear',
  //   'webrc-rectification-batch-ear',
  //   'webrc-rnet-batch-ear',
  //   'webrc-rni-batch-ear',
  // ],

  earList: [
    'webrc-attachment-batch-ear',
    'webrc-attachmentgdc-batch-ear',
  ],

  /**
   * URL du repo ged en version snapshot
   * @type {string}
   */
  nexusSnapshotsUrl: 'https://nexus.probtp/content/repositories/snapshots/com/probtp/ged/ged-web-front/',

  /**
   * URL du repo ged en version release
   * @type {string}
   */
  nexusReleasesUrl: 'https://nexus.probtp/content/repositories/releases/com/probtp/ged/ged-web-front/',

  /**
   * Dossier de téléchargement par défaut
   * @type {string}
   */
  dlFolder,
};

module.exports = app;
