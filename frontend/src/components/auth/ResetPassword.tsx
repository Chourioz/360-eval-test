import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Container, Alert } from '@mui/material';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const { token } = useParams({ from: '/reset-password/$token' });
  const { authService } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token no válido');
        return;
      }

      try {
        await authService.verifyResetToken(token);
        setIsValidToken(true);
      } catch (err: any) {
        setError('El enlace ha expirado o no es válido');
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [token, authService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess('Tu contraseña ha sido actualizada exitosamente');
      setTimeout(() => {
        navigate({ to: '/login' });
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ha ocurrido un error. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate({ to: '/forgot-password' })}
          >
            Solicitar Nuevo Enlace
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Restablecer Contraseña
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Nueva Contraseña"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Nueva Contraseña"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate({ to: '/login' })}
            disabled={loading}
          >
            Volver al Inicio de Sesión
          </Button>
        </Box>
      </Box>
    </Container>
  );
}; 