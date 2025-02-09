const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { validateEmployee, validateEmployeeUpdate } = require('../middlewares/validators');

// Protect all routes
router.use(verifyToken);

// Public routes (for authenticated users)
router.get('/me', employeeController.getCurrentEmployee);
router.get('/me/dashboard', employeeController.getDashboardStats);

// Routes restricted to admin and manager
router.use(restrictTo('admin', 'manager'));

// Employee CRUD operations
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', validateEmployee, employeeController.createEmployee);
router.patch('/:id', validateEmployeeUpdate, employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Manager assignment routes
router.post('/:id/manager', employeeController.assignManager);
router.delete('/:id/manager', employeeController.removeManager);

module.exports = router; 