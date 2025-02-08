const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    return next(new AppError('Validation Error', 400, errorMessages));
  }
  next();
}; 