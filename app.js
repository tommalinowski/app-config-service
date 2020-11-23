const express = require('express');

const AppError = require('./utils/appError');
const errorHandler = require('./middlewares/errorHandler');
const configRouter = require('./routes/configRoutes');

const app = express();

app.use(express.json());

// TODO: consider introducing versioning and using plural resource name
app.use('/config', configRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server for given request type!`,
      404
    )
  );
});

app.use(errorHandler);

module.exports = app;
