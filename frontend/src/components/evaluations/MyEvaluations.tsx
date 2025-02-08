import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Alert,
  CardActions,
  Button,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useAuth } from '@/hooks/useAuth';
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
      id={`evaluation-tabpanel-${index}`}
      aria-labelledby={`evaluation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `evaluation-tab-${index}`,
    'aria-controls': `evaluation-tabpanel-${index}`,
  };
}

interface EvaluationCardProps {
  evaluation: Evaluation;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  startLoading: boolean;
  completeLoading: boolean;
  deleteLoading: boolean;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({
  evaluation,
  onStart,
  onComplete,
  onDelete,
  startLoading,
  completeLoading,
  deleteLoading
}) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Evaluación {evaluation.evaluationType}
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {evaluation.employee.user.firstName} {evaluation.employee.user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Departamento: {evaluation.employee.department}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cargo: {evaluation.employee.position}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Periodo: {new Date(evaluation.period.startDate).toLocaleDateString()} - {new Date(evaluation.period.endDate).toLocaleDateString()}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={evaluation.progress || 0}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Progreso: {evaluation.progress || 0}%
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Evaluadores:
        </Typography>
        <Stack direction="row" spacing={1}>
          {evaluation.evaluators.map((evaluator, index) => (
            <Chip
              key={index}
              label={`${evaluator.user.firstName} ${evaluator.user.lastName}`}
              size="small"
              color={evaluator.status === 'completed' ? 'success' : 'default'}
            />
          ))}
        </Stack>
      </Box>
    </CardContent>
    <CardActions>
      {evaluation.status === 'draft' && (
        <Button
          size="small"
          onClick={() => onStart(evaluation._id)}
          disabled={startLoading}
        >
          Iniciar
        </Button>
      )}
      {evaluation.status === 'in_progress' && (
        <Button
          size="small"
          onClick={() => onComplete(evaluation._id)}
          disabled={completeLoading}
        >
          Completar
        </Button>
      )}
      <Button
        size="small"
        color="error"
        onClick={() => onDelete(evaluation._id)}
        disabled={deleteLoading}
      >
        Eliminar
      </Button>
    </CardActions>
  </Card>
);

const getFilteredEvaluations = (evaluations: Evaluation[], status: 'draft' | 'in_progress' | 'completed'): Evaluation[] => {
  return evaluations.filter((evaluation) => evaluation.status === status);
};

export const MyEvaluations: React.FC = () => {
  const [value, setValue] = React.useState(0);
  const { user } = useAuth();
  const {
    evaluations,
    isLoading,
    error,
    startEvaluation,
    completeEvaluation,
    deleteEvaluation,
    startLoading,
    completeLoading,
    deleteLoading
  } = useEvaluations();

  const handleTabChange = React.useCallback((event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error al cargar las evaluaciones: {error instanceof Error ? error.message : 'Error desconocido'}
      </Alert>
    );
  }

  const myEvaluations = evaluations?.filter(
    (evaluation: Evaluation) =>
      evaluation.employee._id === user?._id ||
      evaluation.evaluators.some((evaluator) => evaluator.user._id === user?._id)
  );

  if (!myEvaluations?.length) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No tienes evaluaciones asignadas
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={value} onChange={handleTabChange} aria-label="evaluation tabs">
          <Tab label="Borradores" {...a11yProps(0)} />
          <Tab label="En Progreso" {...a11yProps(1)} />
          <Tab label="Completadas" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        {getFilteredEvaluations(myEvaluations, 'draft').map((evaluation) => (
          <EvaluationCard
            key={evaluation._id}
            evaluation={evaluation}
            onStart={startEvaluation}
            onComplete={completeEvaluation}
            onDelete={deleteEvaluation}
            startLoading={startLoading}
            completeLoading={completeLoading}
            deleteLoading={deleteLoading}
          />
        ))}
      </TabPanel>

      <TabPanel value={value} index={1}>
        {getFilteredEvaluations(myEvaluations, 'in_progress').map((evaluation) => (
          <EvaluationCard
            key={evaluation._id}
            evaluation={evaluation}
            onStart={startEvaluation}
            onComplete={completeEvaluation}
            onDelete={deleteEvaluation}
            startLoading={startLoading}
            completeLoading={completeLoading}
            deleteLoading={deleteLoading}
          />
        ))}
      </TabPanel>

      <TabPanel value={value} index={2}>
        {getFilteredEvaluations(myEvaluations, 'completed').map((evaluation) => (
          <EvaluationCard
            key={evaluation._id}
            evaluation={evaluation}
            onStart={startEvaluation}
            onComplete={completeEvaluation}
            onDelete={deleteEvaluation}
            startLoading={startLoading}
            completeLoading={completeLoading}
            deleteLoading={deleteLoading}
          />
        ))}
      </TabPanel>
    </Box>
  );
};

// Helper function to calculate evaluation progress
const getEvaluationProgress = (evaluation: Evaluation): number => {
  if (evaluation.status === 'draft') return 0;
  if (evaluation.status === 'completed') return 100;

  const totalEvaluators = evaluation.evaluators.length;
  if (totalEvaluators === 0) return 0;

  const completedEvaluators = evaluation.evaluators.filter(e => e.status === 'completed').length;
  return Math.round((completedEvaluators / totalEvaluators) * 100);
}; 