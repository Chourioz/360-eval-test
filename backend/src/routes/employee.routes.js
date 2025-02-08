const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

// Protect all routes
router.use(verifyToken);

// Get all employees
router.get('/', restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    // Check cache first
    const cacheKey = 'employees:all';
    logger.debug('Checking cache for key:', cacheKey);
    
    let employees = null;
    
    if (cacheService.isConnected) {
      employees = await cacheService.get(cacheKey);
      if (employees) {
        logger.debug('Cache hit for employees list');
        return res.status(200).json({
          status: 'success',
          data: employees,
          source: 'cache'
        });
      }
      logger.debug('Cache miss for employees list');
    } else {
      logger.debug('Redis is not connected, skipping cache check');
    }

    // If not in cache or cache is not available, get from DB
    employees = await Employee.find()
      .populate({
        path: 'user',
        select: '-password'
      })
      .lean();

    // Store in cache if available
    if (cacheService.isConnected) {
      await cacheService.set(cacheKey, employees, 300); // Cache for 5 minutes
      logger.debug('Stored employees list in cache');
    }

    res.status(200).json({
      status: 'success',
      data: employees,
      source: 'db'
    });
  } catch (error) {
    logger.error('Error fetching employees:', error);
    next(error);
  }
});

// Get single employee
router.get('/:id', restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate({
        path: 'user',
        select: '-password'
      });

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error fetching employee:', error);
    next(error);
  }
});

// Create new employee
router.post('/', restrictTo('admin'), async (req, res, next) => {
  try {
    const {
      email,
      firstName,
      lastName,
      position,
      department,
      role = 'employee',
      status = 'active'
    } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create user first
    const user = await User.create({
      email,
      password: tempPassword,
      firstName,
      lastName,
      role,
      isActive: status === 'active'
    });

    // Create employee
    const employee = await Employee.create({
      user: user._id,
      position,
      department,
      status,
      startDate: new Date()
    });

    // Populate user data (excluding password)
    await employee.populate({
      path: 'user',
      select: '-password'
    });

    // Clear employees cache
    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(201).json({
      status: 'success',
      data: {
        employee,
        tempPassword // Include temporary password in response
      }
    });
  } catch (error) {
    logger.error('Error creating employee:', error);
    next(error);
  }
});

// Update employee
router.patch('/:id', restrictTo('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      email,
      firstName,
      lastName,
      position,
      department,
      role,
      status
    } = req.body;

    // Find employee and associated user
    const employee = await Employee.findById(id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    const user = await User.findById(employee.user);
    if (!user) {
      return next(new AppError('Associated user not found', 404));
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Update user data
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (status) user.isActive = status === 'active';
    await user.save();

    // Update employee data
    if (position) employee.position = position;
    if (department) employee.department = department;
    if (status) employee.status = status;
    await employee.save();

    // Populate updated employee data
    await employee.populate({
      path: 'user',
      select: '-password'
    });

    // Clear cache
    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error updating employee:', error);
    next(error);
  }
});

// Delete employee
router.delete('/:id', restrictTo('admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Delete associated user
    await User.findByIdAndDelete(employee.user);

    // Delete employee
    await Employee.findByIdAndDelete(req.params.id);

    // Clear cache
    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error deleting employee:', error);
    next(error);
  }
});

module.exports = router; 