import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Assessment,
    Schedule,
  Edit as EditIcon,
} from '@mui/icons-material';

interface PendingFeedback {
  id: string;
  evaluationType: string;
  evaluee: {
    name: string;
    position: string;
    department: string;
  };
  dueDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

const mockPendingFeedback: PendingFeedback[] = [
  {
    id: '1',
    evaluationType: 'Evaluación 360°',
    evaluee: {
      name: 'Juan Pérez',
      position: 'Desarrollador Senior',
      department: 'Tecnología',
    },
    dueDate: '2024-03-31',
    progress: 0,
    status: 'not_started',
  },
  {
    id: '2',
    evaluationType: 'Evaluación de Pares',
    evaluee: {
      name: 'Ana López',
      position: 'Diseñadora UX',
      department: 'Diseño',
    },
    dueDate: '2024-03-15',
    progress: 30,
    status: 'in_progress',
  },
  {
    id: '3',
    evaluationType: 'Evaluación de Equipo',
    evaluee: {
      name: 'Carlos Rodríguez',
      position: 'Product Manager',
      department: 'Producto',
    },
    dueDate: '2024-03-20',
    progress: 0,
    status: 'not_started',
  },
];

const statusColors = {
  not_started: 'warning',
  in_progress: 'info',
  completed: 'success',
} as const;

const statusLabels = {
  not_started: 'Por Comenzar',
  in_progress: 'En Progreso',
  completed: 'Completado',
} as const;

const PendingFeedback: React.FC = () => {
  const handleProvideFeedback = (id: string) => {
    // TODO: Implementar la navegación a la página de feedback
    console.log('Navegando a la página de feedback:', id);
  };

  const FeedbackCard: React.FC<{ feedback: PendingFeedback }> = ({ feedback }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {feedback.evaluee.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {feedback.evaluee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feedback.evaluee.position} - {feedback.evaluee.department}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={statusLabels[feedback.status]}
            color={statusColors[feedback.status]}
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="body2">{feedback.evaluationType}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              <Typography variant="body2">
                Fecha límite: {new Date(feedback.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progreso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feedback.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={feedback.progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          color="primary"
          startIcon={<EditIcon />}
          onClick={() => handleProvideFeedback(feedback.id)}
        >
          {feedback.status === 'not_started'
            ? 'Proporcionar Feedback'
            : 'Continuar Feedback'}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feedback Pendiente
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Tienes {mockPendingFeedback.length} evaluaciones pendientes de retroalimentación.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {mockPendingFeedback.map((feedback) => (
          <Grid item xs={12} md={6} key={feedback.id}>
            <FeedbackCard feedback={feedback} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PendingFeedback; 