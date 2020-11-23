const AppError = require('./../utils/appError');

const handleDuplicateFieldsDB = (err) => {
  const duplicateFields = Object.keys(err.keyValue);
  const message = `Duplicate value for fields: ${duplicateFields.join(
    ', '
  )}. Please use another value!`;
  return new AppError(message, 400);
};

const sendError = (err, res) => {
  // Expected errors
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Unexpected errors
  } else {
    console.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  if (err.code === 11000) {
    err = handleDuplicateFieldsDB(err);
  }
  sendError(err, res);
};
