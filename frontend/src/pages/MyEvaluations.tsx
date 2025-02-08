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
import { useEvaluations } from '@/hooks/useEvaluations';
import type { Evaluation } from '@/types';
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

const statusColors = {
  draft: 'warning',
  in_progress: 'info',
  pending_review: 'warning',
  completed: 'success',
} as const;

const statusLabels = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  pending_review: 'Pendiente de Revisión',
  completed: 'Completada',
} as const;

const MyEvaluations: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const { evaluations, isLoading: evaluationsLoading, error: evaluationsError } = useEvaluations();
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
    return evaluations?.filter((evaluation) => evaluation.status === status) || [];
  };

  const EvaluationCard: React.FC<{ evaluation: Evaluation }> = ({ evaluation }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
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
              <Typography variant="body2">{evaluation.evaluationType}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              <Typography variant="body2">
                Fecha límite: {new Date(evaluation.period.endDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              <Typography variant="body2">
                Evaluador: {evaluation.evaluators.map(evaluator => evaluator.user.firstName).join(', ')}
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
          {evaluation.status === 'draft'
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
              <Grid item xs={12} md={6} key={evaluation._id}>
                <EvaluationCard evaluation={evaluation} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {getFilteredEvaluations('in_progress').map((evaluation) => (
              <Grid item xs={12} md={6} key={evaluation._id}>
                <EvaluationCard evaluation={evaluation} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {getFilteredEvaluations('completed').map((evaluation) => (
              <Grid item xs={12} md={6} key={evaluation._id}>
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