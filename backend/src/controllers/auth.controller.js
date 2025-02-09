const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('../middlewares/errorHandler');
const User = require('../models/User');
const Employee = require('../models/Employee');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user.toPublicJSON()
    }
  });
};

exports.register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'employee',
      position,
      department
    } = req.body;

    // 1) Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // 2) Crear el usuario
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role
    });

    // 3) Si es un empleado, crear el perfil de empleado
    if (role === 'employee') {
      await Employee.create({
        user: user._id,
        position,
        department,
        startDate: new Date()
      });
    }

    // 4) Generar token y enviar respuesta
    createSendToken(user, 201, res);
  } catch (error) {
    logger.error('Error in register:', error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if user is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // 4) Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // 5) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Error in login:', error);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    // El usuario ya está disponible en req.user gracias al middleware verifyToken
    const user = req.user;

    // Si es un empleado, obtener información adicional
    let employeeData = null;
    if (user.role === 'employee') {
      employeeData = await Employee.findOne({ user: user._id })
        .populate('manager', 'firstName lastName position');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: user.toPublicJSON(),
        employee: employeeData
      }
    });
  } catch (error) {
    logger.error('Error in getMe:', error);
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user.id);

    // 2) Check if POSTed current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Your current password is wrong', 401));
    }

    // 3) If so, update password
    user.password = newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Error in updatePassword:', error);
    next(error);
  }
};

// Generate reset token
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  return { resetToken, hashedToken };
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('No user found with that email address', 404));
    }

    // Generate reset token
    const { resetToken, hashedToken } = generateResetToken();

    // Save hashed token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset token
    // For now, we'll just return the token in the response
    // In production, you should send this via email
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      resetToken // Remove this in production
    });
  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token: resetToken, password } = req.body;

    // Hash token from request
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log user in
    const authToken = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token: authToken,
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    logger.error('Error in resetPassword:', error);
    next(error);
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token: resetToken } = req.body;

    // Hash token from request
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    res.status(200).json({
      status: 'success',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    logger.error('Error in verifyResetToken:', error);
    next(error);
  }
}; 