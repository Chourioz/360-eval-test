const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');

// Proteger todas las rutas y restringir acceso
router.use(verifyToken);
router.use(restrictTo('admin', 'manager'));

// Rutas para reportes
router.get('/evaluation/:id', async (req, res) => {
  // TODO: Implementar generación de reporte de evaluación
  res.status(501).json({
    status: 'error',
    message: 'Report generation not implemented yet'
  });
});

router.get('/employee/:id', async (req, res) => {
  // TODO: Implementar generación de reporte de empleado
  res.status(501).json({
    status: 'error',
    message: 'Report generation not implemented yet'
  });
});

router.get('/department/:id', async (req, res) => {
  // TODO: Implementar generación de reporte de departamento
  res.status(501).json({
    status: 'error',
    message: 'Report generation not implemented yet'
  });
});

module.exports = router; 