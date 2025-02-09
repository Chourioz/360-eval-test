const Employee = require('../models/Employee');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');
const Evaluation = require('../models/Evaluation');
const Feedback = require('../models/Feedback');

// Get current employee
exports.getCurrentEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id })
      .populate({
        path: 'user',
        select: '-password'
      })
      .populate({
        path: 'manager',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });

    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error fetching current employee:', error);
    next(error);
  }
};

// Get all employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const cacheKey = 'employees:all';
    let employees = null;
    
    if (cacheService.isConnected) {
      employees = await cacheService.get(cacheKey);
      if (employees) {
        return res.status(200).json({
          status: 'success',
          data: employees,
          source: 'cache'
        });
      }
    }

    employees = await Employee.find()
      .populate({
        path: 'user',
        select: '-password'
      })
      .populate({
        path: 'manager',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .lean();

    if (cacheService.isConnected) {
      await cacheService.set(cacheKey, employees, 300);
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
};

// Get single employee
exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate({
        path: 'user',
        select: '-password'
      })
      .populate({
        path: 'manager',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
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
};

// Create employee
exports.createEmployee = async (req, res, next) => {
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    const tempPassword = Math.random().toString(36).slice(-8);

    const user = await User.create({
      email,
      password: tempPassword,
      firstName,
      lastName,
      role,
      isActive: status === 'active'
    });

    const employee = await Employee.create({
      user: user._id,
      position,
      department,
      status,
      startDate: new Date()
    });

    await employee.populate({
      path: 'user',
      select: '-password'
    });

    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(201).json({
      status: 'success',
      data: {
        employee,
        tempPassword
      }
    });
  } catch (error) {
    logger.error('Error creating employee:', error);
    next(error);
  }
};

// Update employee
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      email,
      firstName,
      lastName,
      position,
      department,
      role,
      status,
      managerId
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    const user = await User.findById(employee.user);
    if (!user) {
      return next(new AppError('Associated user not found', 404));
    }

    // Update user data
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new AppError('Email already in use', 400));
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (status) user.isActive = status === 'active';
    await user.save();

    // Update employee data
    if (position) employee.position = position;
    if (department) employee.department = department;
    if (status) employee.status = status;

    // Handle manager assignment
    if (managerId) {
      if (managerId === 'remove') {
        employee.manager = undefined;
      } else {
        const manager = await Employee.findById(managerId).populate('user');
        if (!manager) {
          return next(new AppError('Manager not found', 404));
        }
        if (manager.user.role !== 'manager' && manager.user.role !== 'admin') {
          return next(new AppError('Selected employee is not a manager', 400));
        }
        employee.manager = managerId;
      }
    }

    await employee.save();

    // Populate employee data with manager information
    await employee.populate([
      {
        path: 'user',
        select: '-password'
      },
      {
        path: 'manager',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      }
    ]);

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
};

// Delete employee
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);

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
};

// Assign manager
exports.assignManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    const manager = await Employee.findById(managerId);
    if (!manager) {
      return next(new AppError('Manager not found', 404));
    }

    if (manager.user.role !== 'manager' && manager.user.role !== 'admin') {
      return next(new AppError('Selected employee is not a manager', 400));
    }

    employee.manager = managerId;
    await employee.save();

    await employee.populate({
      path: 'user',
      select: '-password'
    }).populate({
      path: 'manager',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    });

    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error assigning manager:', error);
    next(error);
  }
};

// Remove manager
exports.removeManager = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return next(new AppError('Employee not found', 404));
    }

    employee.manager = undefined;
    await employee.save();

    await employee.populate({
      path: 'user',
      select: '-password'
    });

    if (cacheService.isConnected) {
      await cacheService.delete('employees:all');
    }

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    logger.error('Error removing manager:', error);
    next(error);
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cacheKey = `dashboard-stats-${userId}`;

    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        status: 'success',
        data: cachedStats
      });
    }

    const employee = await Employee.findOne({ user: userId });

    // Get team members count based on role and hierarchy
    let teamCount = 0;
    if (req.user.role === 'admin') {
      // For admin, count all active employees except themselves
      teamCount = await Employee.countDocuments({
        'user': { $ne: userId },
        'status': 'active'
      });
    } else if (employee && req.user.role === 'manager') {
      // For managers, count all active employees that have them as manager
      teamCount = await Employee.countDocuments({
        'manager': employee.id,
        'status': 'active'
      });
    }

    // Get pending evaluations
    const pendingEvaluations = await Evaluation.countDocuments({
      'evaluators.user': userId,
      'evaluators.status': 'pending'
    });

    // Get monthly feedback count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyFeedback = await Feedback.countDocuments({
      evaluator: userId,
      createdAt: { $gte: startOfMonth }
    });

    // Get average score from received feedback
    let averageScore = 0;
    let performanceData = [];
    let feedbackDistribution = [];

    if (employee) {
      // Only fetch feedback-related stats if there's an employee record
      const feedbacks = await Feedback.find({
        employee: employee._id,
        status: 'submitted'
      });

      averageScore = feedbacks.length > 0
        ? feedbacks.reduce((acc, curr) => {
            const feedbackAvg = curr.responses.reduce((sum, r) => sum + r.rating, 0) / curr.responses.length;
            return acc + feedbackAvg;
          }, 0) / feedbacks.length
        : 0;

      // Get performance evolution (last 6 months)
      performanceData = await getPerformanceEvolution(employee._id);

      // Get feedback distribution
      feedbackDistribution = await getFeedbackDistribution(employee._id);
    } else if (req.user.role === 'admin') {
      // For admins without employee records, provide organization-wide stats
      performanceData = await getOrganizationPerformance();
      feedbackDistribution = await getOrganizationFeedbackDistribution();
    }

    await cacheService.set(cacheKey, {
      pendingEvaluations,
      monthlyFeedback,
      averageScore: averageScore.toFixed(1),
      teamCount,
      performanceData,
      feedbackDistribution
    }, 300);

    res.status(200).json({
      status: 'success',
      data: {
        pendingEvaluations,
        monthlyFeedback,
        averageScore: averageScore.toFixed(1),
        teamCount,
        performanceData,
        feedbackDistribution
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    next(error);
  }
};

// Helper function to get performance evolution
const getPerformanceEvolution = async (employeeId) => {
  const months = [];
  const scores = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthFeedbacks = await Feedback.find({
      employee: employeeId,
      status: 'submitted',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthAvg = monthFeedbacks.length > 0
      ? monthFeedbacks.reduce((acc, curr) => {
          const feedbackAvg = curr.responses.reduce((sum, r) => sum + r.rating, 0) / curr.responses.length;
          return acc + feedbackAvg;
        }, 0) / monthFeedbacks.length
      : 0;

    months.push(date.toLocaleString('default', { month: 'short' }));
    scores.push(Number(monthAvg.toFixed(1)));
  }

  return months.map((month, index) => ({
    month,
    score: scores[index]
  }));
};

// Helper function to get feedback distribution
const getFeedbackDistribution = async (employeeId) => {
  const feedbacks = await Feedback.find({
    employee: employeeId,
    status: 'submitted'
  });

  const distribution = {
    'Excelente': 0,
    'Bueno': 0,
    'Regular': 0,
    'Necesita Mejorar': 0
  };

  feedbacks.forEach(feedback => {
    feedback.responses.forEach(response => {
      if (response.rating >= 4.5) distribution['Excelente']++;
      else if (response.rating >= 3.5) distribution['Bueno']++;
      else if (response.rating >= 2.5) distribution['Regular']++;
      else distribution['Necesita Mejorar']++;
    });
  });

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }));
};

// Helper function to get organization-wide performance
const getOrganizationPerformance = async () => {
  const months = [];
  const scores = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthFeedbacks = await Feedback.find({
      status: 'submitted',
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthAvg = monthFeedbacks.length > 0
      ? monthFeedbacks.reduce((acc, curr) => {
          const feedbackAvg = curr.responses.reduce((sum, r) => sum + r.rating, 0) / curr.responses.length;
          return acc + feedbackAvg;
        }, 0) / monthFeedbacks.length
      : 0;

    months.push(date.toLocaleString('default', { month: 'short' }));
    scores.push(Number(monthAvg.toFixed(1)));
  }

  return months.map((month, index) => ({
    month,
    score: scores[index]
  }));
};

// Helper function to get organization-wide feedback distribution
const getOrganizationFeedbackDistribution = async () => {
  const feedbacks = await Feedback.find({
    status: 'submitted'
  });

  const distribution = {
    'Excelente': 0,
    'Bueno': 0,
    'Regular': 0,
    'Necesita Mejorar': 0
  };

  feedbacks.forEach(feedback => {
    feedback.responses.forEach(response => {
      if (response.rating >= 4.5) distribution['Excelente']++;
      else if (response.rating >= 3.5) distribution['Bueno']++;
      else if (response.rating >= 2.5) distribution['Regular']++;
      else distribution['Necesita Mejorar']++;
    });
  });

  return Object.entries(distribution).map(([name, value]) => ({
    name,
    value
  }));
}; 