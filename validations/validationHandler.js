const { validationResult } = require('express-validator');
const AppError = require('./../utils/appError');

module.exports = (req) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    const errors = (validationErrors.errors || []).map((err) => err.msg);
    const message = `Invalid input data. ${errors.join('. ')}`;
    throw new AppError(message, 400);
  }
};
