const Config = require('./../models/configModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const validationHandler = require('../validations/validationHandler');

exports.createConfig = catchAsync(async (req, res, next) => {
  validationHandler(req);
  const newConfig = await Config.create({
    client: req.body.client,
    version: req.body.version,
    clientConfigs: new Map().set(req.body.key, req.body.value),
  });

  res.status(201).json(getConfigObjectResponse(newConfig));
});

exports.updateConfig = catchAsync(async (req, res, next) => {
  validationHandler(req);
  const config = await findConfigByClientAndId(
    req.body.client,
    req.body.version
  );

  if (!config) {
    return next(
      new AppError('No configs found for requested client and version', 404)
    );
  }

  config.clientConfigs.set(req.body.key, req.body.value);
  await config.save();
  res.status(200).json(getConfigObjectResponse(config));
});

exports.getConfigForClient = catchAsync(async (req, res, next) => {
  const config = await Config.findOne({ client: req.params.client }).sort(
    '-version'
  );

  if (!config) {
    return next(new AppError('No configs found for requested client', 404));
  }

  res.status(200).json(getConfigObjectResponse(config));
});

exports.getConfigForClientAndVersion = catchAsync(async (req, res, next) => {
  const config = await findConfigByClientAndId(
    req.params.client,
    req.params.version
  );

  if (!config) {
    return next(
      new AppError('No configs found for requested client and version', 404)
    );
  }

  res.status(200).json(getConfigObjectResponse(config));
});

exports.updateConfigForClientAndVersion = catchAsync(async (req, res, next) => {
  validationHandler(req);
  const config = await findConfigByClientAndId(
    req.params.client,
    req.params.version
  );

  if (!config) {
    return next(
      new AppError('No configs found for requested client and version', 404)
    );
  }

  config.clientConfigs.set(req.body.key, req.body.value);
  await config.save();

  res.status(200).json(getConfigObjectResponse(config));
});

exports.replaceConfigForClientAndVersion = catchAsync(
  async (req, res, next) => {
    validationHandler(req);
    const config = await findConfigByClientAndId(
      req.params.client,
      req.params.version
    );

    if (!config) {
      return next(
        new AppError('No configs found for requested client and version', 404)
      );
    }

    // clear existing client configs
    config.clientConfigs.clear();
    // save only those provided in request
    config.clientConfigs.set(req.body.key, req.body.value);
    await config.save();

    res.status(200).json(getConfigObjectResponse(config));
  }
);

exports.deleteConfig = catchAsync(async (req, res, next) => {
  const config = await Config.findOneAndDelete({
    client: req.params.client,
    version: req.params.version,
  });

  if (!config) {
    return next(
      new AppError('No configs found for requested client and version', 404)
    );
  }

  res.sendStatus(204);
});

const findConfigByClientAndId = (client, version) => {
  return Config.findOne({
    client,
    version,
  });
};

const getConfigObjectResponse = (configObject) => {
  return (configResponse = {
    client: configObject.client,
    version: configObject.version,
    ...getClientConfigsProperties(configObject),
  });
};

const getClientConfigsProperties = (configObject) => {
  const resultObject = {};
  configObject.clientConfigs.forEach((value, key) => {
    resultObject[key] = value;
  });
  return resultObject;
};
