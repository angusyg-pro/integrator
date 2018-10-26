/**
 * @fileoverview Mock API router
 * @module routes/api
 * @requires {@link external:express}
 * @requires controllers/api
 */

const express = require('express');
const controller = require('../controllers/api');

const router = express.Router({ mergeParams: true });

/**
 * Liste toutes les versions complètes
 * @path {GET} /api/versions
 * @response {json} array of versions
 * @name getVersions
 */
router.get('/versions', controller.getVersions);

/**
 * Liste toutes les versions du jar GED
 * @path {GET} /api/versions/ged
 * @response {json} array of versions
 * @name getGEDVersions
 */
router.get('/versions/ged', controller.getGEDVersions);

/**
 * Lance un téléchargement d'une version
 * @path {POST} /api/versions/dl
 * @name download
 */
router.post('/versions/dl', controller.download);

module.exports = router;
