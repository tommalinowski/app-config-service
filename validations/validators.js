const { body } = require('express-validator');

exports.baseConfigSchema = [
  body('client')
    .isString()
    .withMessage('Client name has to be provided - type: string'),
  body('version')
    .custom((val) => val && typeof val === 'number')
    .withMessage('Proper version has to be provided - type: number'),
];

exports.checkClientConfigSchema = [
  body('key')
    .custom((val) => val && typeof val === 'string' && val !== 'version')
    .withMessage(
      'Proper key parameter for config change has to be provided - type: string'
    ),
  body('value')
    .isString()
    .withMessage(
      'Proper value parameter for config change has to be provided - type: string'
    ),
];
