import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  Email,
  Security,
  Assessment,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

interface EvaluationType {
  id: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  isActive: boolean;
}

const mockEvaluationTypes: EvaluationType[] = [
  {
    id: '1',
    name: 'Evaluación 360°',
    description: 'Evaluación completa que incluye feedback de supervisores, pares y subordinados',
    frequency: 'annual',
    isActive: true,
  },
  {
    id: '2',
    name: 'Revisión de Desempeño',
    description: 'Evaluación regular del desempeño y objetivos',
    frequency: 'quarterly',
    isActive: true,
  },
  {
    id: '3',
    name: 'Evaluación de Proyecto',
    description: 'Evaluación específica para el desempeño en proyectos',
    frequency: 'monthly',
    isActive: false,
  },
];

const frequencyLabels = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semi_annual: 'Semestral',
  annual: 'Anual',
};

const Settings: React.FC = () => {
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<EvaluationType | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    navigate({ to: '/login' });
    return null;
  }

  if (user.role !== 'admin') {
    navigate({ to: '/unauthorized' });
    return null;
  }

  const handleSaveSettings = () => {
    try {
      // TODO: Implementar la lógica para guardar la configuración
      setSuccessMessage('Configuración guardada exitosamente');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Error al guardar la configuración');
      setSuccessMessage('');
    }
  };

  const handleOpenDialog = (type?: EvaluationType) => {
    if (type) {
      setSelectedType(type);
    } else {
      setSelectedType(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedType(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implementar la lógica para guardar el tipo de evaluación
    console.log('Guardando tipo de evaluación:', selectedType);
    handleCloseDialog();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Configuración
      </Typography>

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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notificaciones
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Notificaciones por Email"
                  secondary="Recibir notificaciones por correo electrónico"
                />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Notificaciones Push"
                  secondary="Recibir notificaciones en el navegador"
                />
                <ListItemSecondaryAction>
                  <Switch defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Seguridad
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Autenticación de Dos Factores"
                  secondary="Habilitar verificación adicional al iniciar sesión"
                />
                <ListItemSecondaryAction>
                  <Switch />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Tiempo de Sesión (minutos)"
                type="number"
                defaultValue={30}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Intentos Máximos de Inicio de Sesión"
                type="number"
                defaultValue={3}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Tipos de Evaluación</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Nuevo Tipo
              </Button>
            </Box>

            <List>
              {mockEvaluationTypes.map((type) => (
                <React.Fragment key={type.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment />
                    </ListItemIcon>
                    <ListItemText
                      primary={type.name}
                      secondary={
                        <>
                          {type.description}
                          <br />
                          Frecuencia: {frequencyLabels[type.frequency]}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenDialog(type)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
        >
          Guardar Configuración
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedType ? 'Editar Tipo de Evaluación' : 'Nuevo Tipo de Evaluación'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre"
                  defaultValue={selectedType?.name}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                  defaultValue={selectedType?.description}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    label="Frecuencia"
                    defaultValue={selectedType?.frequency || 'quarterly'}
                  >
                    {Object.entries(frequencyLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch defaultChecked={selectedType?.isActive ?? true} />
                  }
                  label="Activo"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Settings; 