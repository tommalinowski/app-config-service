const express = require('express');
const configController = require('./../controllers/configController');
const { baseConfigSchema } = require('../validations/validators');
const { checkClientConfigSchema } = require('../validations/validators');

const router = express.Router();

router
  .route('/')
  .post(
    baseConfigSchema,
    checkClientConfigSchema,
    configController.createConfig
  )
  .patch(
    baseConfigSchema,
    checkClientConfigSchema,
    configController.updateConfig
  );

router.route('/:client').get(configController.getConfigForClient);

router
  .route('/:client/:version')
  .get(configController.getConfigForClientAndVersion)
  .patch(
    checkClientConfigSchema,
    configController.updateConfigForClientAndVersion
  )
  .put(
    checkClientConfigSchema,
    configController.replaceConfigForClientAndVersion
  )
  .delete(configController.deleteConfig);

module.exports = router;
