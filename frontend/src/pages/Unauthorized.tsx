import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { Lock } from '@mui/icons-material';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <Lock sx={{ fontSize: 64, color: 'error.main' }} />
      <Typography variant="h4">Acceso No Autorizado</Typography>
      <Typography variant="body1" color="text.secondary">
        No tienes permisos para acceder a esta página
      </Typography>
      <Button variant="contained" onClick={() => navigate({ to: '/' })}>
        Volver al inicio
      </Button>
    </Box>
  );
};

export default Unauthorized; 