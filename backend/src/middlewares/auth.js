const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    // 1) Getting token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

const isManager = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return next(new AppError('This action requires manager privileges', 403));
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('This action requires administrator privileges', 403));
  }
  next();
};

const isSelfOrManager = async (req, res, next) => {
  try {
    // Si es admin o manager, permitir
    if (['admin', 'manager'].includes(req.user.role)) {
      return next();
    }

    // Si es el mismo usuario
    if (req.params.userId === req.user.id) {
      return next();
    }

    // Verificar si es el manager del usuario
    const targetEmployee = await Employee.findOne({ user: req.params.userId })
      .populate('manager');

    if (targetEmployee && targetEmployee.manager && 
        targetEmployee.manager.user.toString() === req.user.id) {
      return next();
    }

    return next(new AppError('You do not have permission to perform this action', 403));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  restrictTo,
  isManager,
  isAdmin,
  isSelfOrManager
}; 