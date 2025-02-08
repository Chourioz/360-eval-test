import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  Schedule,
  Person,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluations-tabpanel-${index}`}
      aria-labelledby={`evaluations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface Evaluation {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  evaluator: string;
}

const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    title: 'Evaluación de Desempeño Q1 2024',
    type: 'Evaluación 360°',
    dueDate: '2024-03-31',
    status: 'in_progress',
    progress: 60,
    evaluator: 'María García',
  },
  {
    id: '2',
    title: 'Autoevaluación Semestral',
    type: 'Autoevaluación',
    dueDate: '2024-06-30',
    status: 'pending',
    progress: 0,
    evaluator: 'Auto',
  },
  {
    id: '3',
    title: 'Evaluación de Proyecto X',
    type: 'Evaluación de Pares',
    dueDate: '2024-02-28',
    status: 'completed',
    progress: 100,
    evaluator: 'Carlos Rodríguez',
  },
];

const statusColors = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
} as const;

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completada',
} as const;

const MyEvaluations: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
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

  if (user.role !== 'employee') {
    navigate({ to: '/unauthorized' });
    return null;
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredEvaluations = (status: 'pending' | 'in_progress' | 'completed') => {
    return mockEvaluations.filter((evaluation) => evaluation.status === status);
  };

  const EvaluationCard: React.FC<{ evaluation: Evaluation }> = ({ evaluation }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div">
            {evaluation.title}
          </Typography>
          <Chip
            label={statusLabels[evaluation.status]}
            color={statusColors[evaluation.status]}
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="body2">{evaluation.type}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              <Typography variant="body2">
                Fecha límite: {new Date(evaluation.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              <Typography variant="body2">
                Evaluador: {evaluation.evaluator}
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
              {evaluation.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={evaluation.progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          size="small"
          color="primary"
          startIcon={<Assessment />}
          disabled={evaluation.status === 'completed'}
        >
          {evaluation.status === 'pending'
            ? 'Comenzar Evaluación'
            : evaluation.status === 'in_progress'
            ? 'Continuar Evaluación'
            : 'Ver Resultados'}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mis Evaluaciones
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.firstName}. Aquí puedes ver y gestionar tus evaluaciones.
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<Schedule />}
            label="Pendientes"
            iconPosition="start"
          />
          <Tab
            icon={<Assessment />}
            label="En Progreso"
            iconPosition="start"
          />
          <Tab
            icon={<CheckCircle />}
            label="Completadas"
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {getFilteredEvaluations('pending').map((evaluation) => (
              <Grid item xs={12} md={6} key={evaluation.id}>
                <EvaluationCard evaluation={evaluation} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {getFilteredEvaluations('in_progress').map((evaluation) => (
              <Grid item xs={12} md={6} key={evaluation.id}>
                <EvaluationCard evaluation={evaluation} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {getFilteredEvaluations('completed').map((evaluation) => (
              <Grid item xs={12} md={6} key={evaluation.id}>
                <EvaluationCard evaluation={evaluation} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MyEvaluations; 