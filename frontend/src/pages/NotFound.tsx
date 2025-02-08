import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';

const NotFound: React.FC = () => {
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
      <Typography variant="h1">404</Typography>
      <Typography variant="h5">Página no encontrada</Typography>
      <Button variant="contained" onClick={() => navigate({ to: '/' })}>
        Volver al inicio
      </Button>
    </Box>
  );
};

export default NotFound; 