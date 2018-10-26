/**
 * @fileoverview API REST controleur
 * @module controllers/api
 * @requires services/mock
 */

const service = require('../services/versions');

const controller = {};

/**
 * Liste toutes les versions complètes
 * @method getVersions
 * @param  {external:Request}  req  - requête reçue
 * @param  {external:Response} res  - réponse à envoyer
 * @param  {nextMiddleware}    next - fonction de callback vers le prochain middleware
 */
controller.getVersions = (req, res, next) => {
  service.getVersions()
    .then(versions => res.status(200).json(versions))
    .catch(err => next(err));
};

/**
 * Liste toutes les versions de la GED
 * @method getGEDVersions
 * @param  {external:Request}  req  - requête reçue
 * @param  {external:Response} res  - réponse à envoyer
 * @param  {nextMiddleware}    next - fonction de callback vers le prochain middleware
 */
controller.getGEDVersions = (req, res, next) => {
  service.getGEDVersions()
    .then(versions => res.status(200).json(versions))
    .catch(err => next(err));
};

/**
 * Lance un téléchargement
 * @method download
 * @param  {external:Request}  req  - requête reçue
 * @param  {external:Response} res  - réponse à envoyer
 * @param  {nextMiddleware}    next - fonction de callback vers le prochain middleware
 */
controller.download = (req, res, next) => {
  service.download()
    .then(() => res.status(204).end())
    .catch(err => next(err));
};

module.exports = controller;
