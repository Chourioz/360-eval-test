import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon
} from '@mui/icons-material';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useAuth } from '@/hooks/useAuth';
import type { Evaluation } from '@/types';

const statusColors = {
  draft: 'default',
  in_progress: 'primary',
  pending_review: 'warning',
  completed: 'success'
} as const;

const statusLabels = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  pending_review: 'Pendiente de Revisión',
  completed: 'Completado'
} as const;

const evaluationTypeLabels = {
  self: 'Auto-evaluación',
  peer: 'Entre pares',
  manager: 'Por supervisor',
  '360': '360°'
} as const;

export const MyEvaluations: React.FC = () => {
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

  const handleStartEvaluation = (evaluationId: string) => {
    startEvaluation(evaluationId);
  };

  const handleCompleteEvaluation = (evaluationId: string) => {
    completeEvaluation(evaluationId);
  };

  const handleDeleteEvaluation = (evaluationId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta evaluación?')) {
      deleteEvaluation(evaluationId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error.message || 'Error al cargar las evaluaciones'}
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
    <Grid container spacing={2}>
      {myEvaluations.map((evaluation: Evaluation) => (
        <Grid item xs={12} sm={6} md={4} key={evaluation._id}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Empleado
                  </Typography>
                  <Typography variant="body1">
                    {evaluation.employee.user.firstName} {evaluation.employee.user.lastName}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Chip
                    label={evaluationTypeLabels[evaluation.evaluationType]}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={statusLabels[evaluation.status]}
                    color={statusColors[evaluation.status]}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Progreso
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getEvaluationProgress(evaluation)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" align="right" display="block">
                    {getEvaluationProgress(evaluation)}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Período
                  </Typography>
                  <Typography variant="body2">
                    {new Date(evaluation.period.startDate).toLocaleDateString()} -{' '}
                    {new Date(evaluation.period.endDate).toLocaleDateString()}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {evaluation.status === 'draft' && (
                    <>
                      <Tooltip title="Iniciar">
                        <IconButton
                          size="small"
                          onClick={() => handleStartEvaluation(evaluation._id)}
                          disabled={startLoading}
                        >
                          <StartIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteEvaluation(evaluation._id)}
                          disabled={deleteLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {evaluation.status === 'in_progress' && (
                    <Tooltip title="Completar">
                      <IconButton
                        size="small"
                        onClick={() => handleCompleteEvaluation(evaluation._id)}
                        disabled={completeLoading}
                      >
                        <CompleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
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