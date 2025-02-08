import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import { PhotoCamera, PictureAsPdf } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import ReportGenerator from '@/components/reports/ReportGenerator';

const validationSchema = Yup.object({
  firstName: Yup.string().required('El nombre es requerido'),
  lastName: Yup.string().required('El apellido es requerido'),
  email: Yup.string().email('Email inválido').required('El email es requerido'),
  currentPassword: Yup.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  newPassword: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .when('currentPassword', {
      is: (val: string) => val?.length > 0,
      then: (schema) => schema.required('La nueva contraseña es requerida'),
    }),
  confirmPassword: Yup.string().when('newPassword', {
    is: (val: string) => val?.length > 0,
    then: (schema) =>
      schema
        .required('Confirma tu nueva contraseña')
        .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden'),
  }),
});

const Profile: React.FC = () => {
  const { user, employee, updatePassword } = useAuth();
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (values.currentPassword && values.newPassword) {
          await updatePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          });
          setSuccessMessage('Contraseña actualizada exitosamente');
        }
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Error al actualizar el perfil');
        setSuccessMessage('');
      }
    },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Mi Perfil</Typography>
        <Button
          variant="contained"
          startIcon={<PictureAsPdf />}
          onClick={() => setIsReportDialogOpen(true)}
        >
          Generar Reporte
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '3rem',
                  mb: 2,
                  bgcolor: 'primary.main',
                }}
              >
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 0,
                  bgcolor: 'background.paper',
                }}
                aria-label="cambiar foto"
                component="label"
              >
                <input hidden accept="image/*" type="file" />
                <PhotoCamera />
              </IconButton>
            </Box>
            <Typography variant="h6">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography color="textSecondary">{user?.role}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Información Personal
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="firstName"
                    name="firstName"
                    label="Nombre"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="lastName"
                    name="lastName"
                    label="Apellido"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Cambiar Contraseña
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="currentPassword"
                    name="currentPassword"
                    label="Contraseña Actual"
                    type="password"
                    value={formik.values.currentPassword}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.currentPassword && Boolean(formik.errors.currentPassword)
                    }
                    helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="Nueva Contraseña"
                    type="password"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                    helperText={formik.touched.newPassword && formik.errors.newPassword}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirmar Nueva Contraseña"
                    type="password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)
                    }
                    helperText={
                      formik.touched.confirmPassword && formik.errors.confirmPassword
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                    >
                      Guardar Cambios
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

      <ReportGenerator
        open={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        employee={employee}
        evaluations={[]}
      />
    </Box>
  );
};

export default Profile; 