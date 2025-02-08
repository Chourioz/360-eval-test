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
    
    // Store in cache if Redis is connected
    if (cacheService.isConnected) {
      logger.debug('Storing employees list in cache');
      await cacheService.set(cacheKey, employees, 300); // Cache for 5 minutes
    }

    res.status(200).json({
      status: 'success',
      data: employees,
      source: 'database'
    });
  } catch (error) {
    logger.error('Error fetching employees:', error);
    next(new AppError('Error fetching employees', 500));
  }
});

// Get employee by ID
router.get('/:id', restrictTo('admin', 'manager'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', '-password')
      .populate('manager', 'position department')
      .populate('directReports', 'position department');

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error fetching employee:', error);
    next(new AppError('Error fetching employee', 500));
  }
});

// Create new employee
router.post('/', restrictTo('admin'), async (req, res, next) => {
  try {
    const { firstName, lastName, email, position, department, role = 'employee', status = 'active' } = req.body;

    // 1. Create the user first
    const user = new User({
      email,
      firstName,
      lastName,
      role,
      isActive: status === 'active',
      // Generate a temporary password that will need to be changed on first login
      password: Math.random().toString(36).slice(-8)
    });

    await user.save();

    // 2. Create the employee with the new user's ID
    const employee = new Employee({
      user: user._id,
      position,
      department,
      startDate: new Date(),
      status: status || 'active'
    });
    
    await employee.save();
    
    // 3. Get the populated employee data
    const populatedEmployee = await Employee.findById(employee._id)
      .populate({
        path: 'user',
        select: '-password'
      });

    // 4. Clear the cache if it exists
    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(201).json({
      status: 'success',
      data: populatedEmployee,
      message: `Employee created successfully. Temporary password: ${user.password}`
    });
  } catch (error) {
    logger.error('Error creating employee:', error);
    // If user was created but employee creation failed, delete the user
    if (error.user) {
      await User.findByIdAndDelete(error.user._id);
    }
    next(new AppError(error.message || 'Error creating employee', 400));
  }
});

// Update employee
router.patch('/:id', restrictTo('admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('user', '-password')
      .populate('manager', 'position department');
    
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error updating employee:', error);
    next(new AppError('Error updating employee', 400));
  }
});

// Delete employee
router.delete('/:id', restrictTo('admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    // Check if employee has direct reports
    if (employee.directReports && employee.directReports.length > 0) {
      return next(new AppError('Cannot delete employee with direct reports', 400));
    }

    await Employee.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting employee:', error);
    next(new AppError('Error deleting employee', 500));
  }
});

module.exports = router; 