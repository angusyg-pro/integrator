/**
 * @fileoverview Service de récupération des versions
 * @module services/versions
 * @requires {@link external:path}
 * @requires {@link external:request}
 * @requires {@link external:fs-extra}
 * @requires {@link external:moment}
 * @requires config/app
 * @requires lib/errors
 * @requires lib/logger
 */

const { artifactoryUrl, earList, nexusReleasesUrl, nexusSnapshotsUrl, dlFolder } = require('../config/app');
const ProxyService = require('../lib/proxy');
const { ApiError } = require('../lib/errors');
const logger = require('../lib/logger');
const request = require('request');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

const logs = new Map();
const service = {};

/**
 * Ajoute une logs à un téléchargement en cours
 * @param {string} id - id du téléchargement
 * @param {string} log - log
 */
const addLogToDl = (type, id, log) => {
  if (!logs.has(id)) logs.set(id, []);
  logs.get(id).push(`${moment().format('DD/MM/YYYY HH:mm:ss')} - ${type} - ${log}`);
};

/**
 * Récupère une page
 * @param {string}  url   - URL à appeler
 * @param {boolean} proxy - indique si un proxy doit être utilisé
 * @returns {Promise<object>} résolue avec le body de la page, rejetée sur erreur
 */
const getUrl = (url, proxy) => {
  logger.debugFuncCall(url);
  return new Promise(async (resolve, reject) => {
    // Récupération d'une requête proxifiée si besoin
    const requester = proxy ? await ProxyService.getProxifiedRequest() : request;
    // Appel
    requester(url, async (err, res, body) => {
      if (err) return reject(new ApiError(`Erreur lors de l'appel à l'url : ${url}`));
      if (res && res.statusCode === 200) {
        // Si réponse OK, recherche des versions
        return resolve(body);
      }
      return reject(new ApiError(`Erreur lors de l'appel à l'url : ${url}`));
    });
  });
};

/**
 * Extrait les versions d'un EAR à partir du corps de la page HTML artifactory
 * @private
 * @param  {string} html - corps de la page html Artifactory
 * @return {string} liste de toutes les versions
 */
const getEarVersionsFromHtml = (html) => {
  logger.debugFuncCall();
  // Recherche dans les balises href de la page
  const versions = [];
  const version = '<a href="([0-9]+.*)/">';
  const versionRegExp = new RegExp(version, 'g');
  // Extraction des versions existantes
  let array;
  // Parcours de toutes les versions
  while ((array = versionRegExp.exec(html)) !== null) versions.push(array[1]);
  return versions;
};

/**
 * Extrait un EAR depuis la page
 * @private
 * @param  {string} ear  - nom de l'EAR
 * @param  {string} html - corps de la page html Artifactory
 * @return {string} nom de l'EAR
 */
const getEarFromHtml = (ear, html) => {
  logger.debugFuncCall(ear);
  // Recherche dans les balises href de la page
  const earPattern = `<a href="(${ear}.*.ear)">`;
  const earRegExp = new RegExp(earPattern, 'g');
  const check = earRegExp.exec(html);
  if (check !== null) return check[1];
  return null;
};

/**
 * Vérifie si un EAR existe pour la page
 * @private
 * @param  {string} ear  - nom de l'EAR
 * @param  {string} html - corps de la page html Artifactory
 * @return {boolean} true si l'EAR existe
 */
const checkEarFromHtml = (ear, html) => {
  logger.debugFuncCall(ear);
  return getEarFromHtml(ear, html) !== null;
};

/**
 * Parcourt toutes les versions de tous les EARS pour trouver celles complètes
 * @param {object[]} earsVersions - liste des EARS avec leurs versions
 * @returns {Promise<string[]>} résolue avec la liste des versions complètes, rejetée sur erreur
 */
const findCompleteVersions = (earsVersions) => {
  logger.debugFuncCall(earsVersions);
  return new Promise(async (resolve, reject) => {
    try {
      const map = new Map();
      // Pour chaque EAR
      earsVersions.forEach((ear) => {
        // Pour chaque version
        ear.versions.forEach((version) => {
          // Ajout de l'EAR à la version
          if (!map.has(version)) map.set(version, []);
          map.get(version).push(ear.ear);
        });
      });
      const completeVersions = [];
      // Vérification de la complétude des versions
      map.forEach((value, key) => {
        // Si le nombre d'EAR est égal au nombre total d'une version
        if (value.length === earList.length) {
          // Différence de liste entre liste trouvée pour la version et la liste des EARS
          const filtered = earList.filter(ear => !value.includes(ear));
          // Si aucun EARS ne manque, ajout à la liste des versions complètes
          if (filtered.length === 0) completeVersions.push(key);
        }
      });
      return resolve(completeVersions);
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

/**
 * Vérifie sur la page de version, si l'EAR existe bien
 * @param {string} ear     - nom de l'EAR
 * @param {string} version - nom de la version
 * @returns {Promise<boolean>} résolue avec la présence de l'EAR, rejetée sur erreur
 */
const checkIfEARExists = (ear, version) => {
  logger.debugFuncCall(ear, version);
  return new Promise(async (resolve, reject) => {
    const url = `${artifactoryUrl}/${ear}/${version}`;
    try {
      // Appel pour récupération de la page de la version
      const body = await getUrl(url, true);
      // Vérification de la présence d'un EAR
      return resolve({
        ear,
        version,
        available: checkEarFromHtml(ear, body),
      });
    } catch (err) {
      return reject(new ApiError(`Erreur lors de l'appel à l'url : ${url}`));
    }
  });
};

/**
 * Fait appel à Artifactory pour récupérer les versions d'un EAR
 * @param {string} ear - ear à lister
 * @returns {Promise<object>} résolue avec l'EAR et ses versions, rejetée sur erreur
 */
const getEarVersions = (ear) => {
  logger.debugFuncCall(ear);
  return new Promise(async (resolve, reject) => {
    // URL de la page de l'EAR
    const url = `${artifactoryUrl}/${ear}`;
    try {
      // Appel
      const body = await getUrl(url, true);
      // Extraction des versions
      return resolve(getEarVersionsFromHtml(body));
    } catch (err) {
      return reject(new ApiError(`Erreur lors de l'appel à l'url : ${url}`));
    }
  });
};

const getAllEARVersions = (ear, earsVersions) => {
  logger.debugFuncCall(ear, earsVersions);
  return new Promise(async (resolve, reject) => {
    try {
      const e = {
        ear,
        versions: [],
      };
      earsVersions.push(e);
      // Récupération des versions de l'EAR
      const versions = await getEarVersions(ear);
      // Vérification de la présence d'un EAR
      const waiting = [];
      versions.forEach(version => waiting.push(checkIfEARExists(ear, version)));
      // Attente de toutes les vérifications
      Promise.all(waiting)
        .then((results) => {
          // Filtre sur les versions existantes
          results.forEach((result) => {
            if (result.exists) e.versions.push(result.version);
          });
          resolve();
        })
        .catch(err => reject(new ApiError(err)));
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};










/**
 * Extrait les versions disponibles sur Artifactory
 * @private
 * @param  {string} html - corps de la page html Artifactory
 * @return {string} liste de toutes les versions
 */
const getAvailableVersionsFromHtml = (html) => {
  logger.debugFuncCall();
  // Recherche dans les balises href de la page
  const versions = [];
  const version = '<a href="([0-9]+.*)/">';
  const versionRegExp = new RegExp(version, 'g');
  // Extraction des versions existantes
  let array;
  // Parcours de toutes les versions
  while ((array = versionRegExp.exec(html)) !== null) versions.push(array[1]);
  return versions;
};

/**
 * Récupère toutes les versions disponibles sur Artifactory
 * @returns {Promise<object>} résolue avec les versions disponibles, rejetée sur erreur
 */
service.getVersions = () => {
  logger.debugFuncCall();
  return new Promise(async (resolve, reject) => {
    try {
      // Recherche sur Artifactory pour chaque EAR
      const body = await getUrl(`${artifactoryUrl}/webrc`, true)
      return resolve(getAvailableVersionsFromHtml(body));
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

/**
 * Extrait les versions d'un EAR à partir du corps de la page HTML artifactory
 * @private
 * @param  {string} html - corps de la page html Artifactory
 * @return {string} liste de toutes les versions
 */
const getGEDJarFromHtml = (html) => {
  logger.debugFuncCall(html);
  // Recherche dans les balises href de la page
  const version = '<a href="(.*.jar)">';
  const versionRegExp = new RegExp(version, 'g');
  return versionRegExp.exec(html)[1];
};

/**
 * Extrait les versions d'un EAR à partir du corps de la page HTML artifactory
 * @private
 * @param  {string} html - corps de la page html Artifactory
 * @return {string} liste de toutes les versions
 */
const getGEDJarVersionsFromHtml = (url, html) => {
  logger.debugFuncCall(url, html);
  // Recherche dans les balises href de la page
  const versions = [];
  const version = `<a href="(${url}[0-9]+.*)/">`;
  const versionRegExp = new RegExp(version, 'g');
  // Extraction des versions existantes
  let array;
  // Parcours de toutes les versions
  while ((array = versionRegExp.exec(html)) !== null) versions.push(array[1]);
  return versions;
};

/**
 * Fait appel à Artifactory pour récupérer les versions d'un EAR
 * @param {boolean} snapshot - version snapshot
 * @returns {Promise<object>} résolue avec l'EAR et ses versions, rejetée sur erreur
 */
const getGEDJarVersions = (snapshot) => {
  logger.debugFuncCall(snapshot);
  return new Promise(async (resolve, reject) => {
    try {
      const url = snapshot ? nexusSnapshotsUrl : nexusReleasesUrl;
      // Appel au nexus
      const body = await getUrl(url);
      // Extraction des versions de la page du projet
      const versions = getGEDJarVersionsFromHtml(url, body);
      const jarsVersions = [];
      // Récupération des pages de chaque version
      versions.forEach(versionUrl => jarsVersions.push(getUrl(versionUrl)));
      // Attente de la fin de la récupération
      Promise.all(jarsVersions)
        .then((result) => {
          const jars = [];
          // Pour chaque page de jar, extraction du lien vers le jar
          result.forEach((version) => {
            const jarUrl = getGEDJarFromHtml(version);
            jars.push({
              url: jarUrl,
              snapshot: jarUrl.indexOf('snapshots') > -1,
              jar: jarUrl.substring(jarUrl.lastIndexOf('/') + 1),
            });
          });
          resolve(jars);
        })
        .catch(err => reject(new ApiError(err)));
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

/**
 * Récupère toutes les versions de la GED sur le nexus
 * @returns {Promise<object>} résolue avec les versions complètes, rejetée sur erreur
 */
service.getGEDVersions = () => {
  logger.debugFuncCall();
  return new Promise(async (resolve, reject) => {
    try {
      // Recherche sur le nexus des versions releases
      // Recherche sur le nexus des versions snapshot
      // Attente de la fin des récupérations
      Promise.all([getGEDJarVersions(), getGEDJarVersions(true)])
        .then((result) => {
          let versions = [];
          result.forEach((res) => { versions = versions.concat(res); });
          return resolve(versions);
        })
        .catch(err => reject(new ApiError(err)));
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

/**
 * Téléchargement d'un EAR dans le dossier de déploiement
 * @private
 * @param  {string} url    - URL de l'EAR à télécharger
 * @param  {string} folder - dossier de déploiement
 * @param  {Server} server - serveur associé au téléchargement
 * @return {Promise<string>} résolue avec le chemin vers l'EAR téléchargé, rejettée si erreur
 */
const downloadEAR = (id, ear, versionFrom, versionTo) => {
  logger.debugFuncCall(id, ear, versionFrom, versionTo);
  return new Promise(async (resolve, reject) => {
    try {
      // Création du dossier de téléchargement
      const folder = path.join(dlFolder, id);
      addLogToDl('INFO', id, `Création du dossier de téléchargement ${folder}`);
      fs.mkdirSync(folder);
      // Récupération d'un proxy
      const proxifiedRequest = await ProxyService.getProxifiedRequest();
      // Récupération du nom final de l'EAR sur artifactory
      const url = `${artifactoryUrl}/${ear}/${versionFrom}`;
      const body = await getUrl(url);
      // Extraction du nom
      const earName = getEarFromHtml(ear, body);
      if (earName === null) {
        addLogToDl('ERROR', id, `Impossible de récupérer le nom de l'EAR ${ear}`);
        return reject(new ApiError('EAR_NOT_FOUND', `Impossible de récupérer le nom de l'EAR ${ear}`));
      }
      // Téléchargement de l'EAR dans le dossier de déploiement
      const localName = `${ear}-${versionTo}.ear`;
      proxifiedRequest(url)
        .pipe(fs.createWriteStream(path.join(folder, localName)))
        .on('finish', () => {
          addLogToDl('INFO', id, `Téléchargement terminé de '${earName}'`);
          return resolve();
        })
        .on('error', err => reject(new ApiError(err)));
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

/**
 * Télécharge une version
 * @param {string} id - id du déploiement
 * @param {object} parameters - infos du dl
 */
const download = (id, parameters) => {
  logger.debugFuncCall(parameters);
  return new Promise(async (resolve, reject) => {
    try {
      addLogToDl('INFO', id, 'Lancement du téléchargement');
      // Mise en téléchargement de tous les EARs
      const ears = [];
      earList.forEach(ear => ears.push(downloadEAR(ear, parameters.versionFrom, parameters.versionTo)));
      // Attente de la fin de tous les téléchargements
      Promise.all(ears)
        .then(() => resolve())
        .catch((err) => {
          addLogToDl('ERROR', id, `Erreur: ${JSON.stringify(err)}`);
          reject(new ApiError(err));
        });
    } catch (err) {
      addLogToDl('ERROR', id, `Erreur: ${JSON.stringify(err)}`);
      return reject(new ApiError(err));
    }
  });
};


/**
 * Vérifie que tous les EARs sont disponibles
 * @param {string} version - version à vérifier
 * @return {Promise<string>} résolue avec l'id du téléchargement si tout est ok, rejetée sur erreur
 */
const checkDownload = (version) => {
  logger.debugFuncCall(version);
  return new Promise(async (resolve, reject) => {
    const id = Date.now();
    try {
      // Vérification de la disponibilité de tous les EARs
      const availables = [];
      earList.forEach((ear) => {
        addLogToDl('INFO', id, `Vérification de la disponibilité de l'EAR ${ear}`);
        checkIfEARExists(ear, version);
      });
      // Attente de la vérification
      Promise.all(availables)
        .then((result) => {
          // Check de la dispo
          const unavailables = [];
          result.forEach((res) => {
            if (!res.available) {
              unavailables.push(res.ear);
              addLogToDl('ERROR', id, `${res.ear} non disponible`);
            }
          });
          // Si un EAR manque, rejet
          if (unavailables.length > 0) return reject(new ApiError(`Certains EARs sont manquants: ${unavailables.join()}`));
          addLogToDl('INFO', id, 'Tous les EARs sont disponibles');
          return resolve(id);
        })
        .catch(err => reject(new ApiError(err)));
    } catch (err) {
      addLogToDl('ERROR', id, `Erreur: ${JSON.stringify(err)}`);
      return reject(new ApiError(err));
    }
  });
};


/**
 * Lance un téléchargement
 * @returns {Promise<object>} résolue avec l'id du téléchargement, rejetée sur erreur
 */
service.download = (parameters) => {
  logger.debugFuncCall();
  return new Promise(async (resolve, reject) => {
    let id = null;
    try {
      // Lancement
      id = await checkDownload(parameters.versionFrom);
      // On informe le client que tout est OK
      resolve(id);
      // Lancement du téléchargement
      download(id, parameters);
    } catch (err) {
      return reject(new ApiError(err));
    }
  });
};

module.exports = service;
