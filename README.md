# Sistema de Evaluación 360°

Sistema completo para la gestión de evaluaciones de desempeño 360° en organizaciones.

## Características Principales

- 🔐 Autenticación y autorización basada en roles (Admin, Manager, Employee)
- 📊 Dashboard personalizado por rol
- 📝 Creación y gestión de evaluaciones
- 💬 Sistema de feedback con validación de relaciones laborales
- 📈 Visualización de datos con gráficos interactivos
- 📱 Diseño responsive y accesible

## Stack Tecnológico

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Testing con Jest

### Frontend
- React + TypeScript
- Redux Toolkit
- Formik + Yup
- Testing con React Testing Library

## Requisitos Previos

- Node.js >= 18
- MongoDB >= 5.0
- npm >= 8.0

## Configuración del Entorno

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/360-evaluation-system.git
cd 360-evaluation-system
```

2. Instalar dependencias:
```bash
npm run install:all
```

3. Configurar variables de entorno:

Backend (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eval360
JWT_SECRET=your-secret-key
NODE_ENV=development
```

Frontend (.env):
```
VITE_API_URL=http://localhost:5000/api
```

4. Iniciar en modo desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
└── package.json
```

## Scripts Disponibles

- `npm run dev`: Inicia backend y frontend en modo desarrollo
- `npm test`: Ejecuta tests en backend y frontend
- `npm run build`: Construye backend y frontend para producción

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles. 