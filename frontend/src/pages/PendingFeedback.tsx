import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card as MuiCard,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Assessment,
  Schedule,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { usePendingEvaluations } from '@/hooks/useEvaluations';
import type { PendingEvaluation } from '@/services/evaluation.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggeredListVariants, 
  listItemVariants, 
  cardVariants, 
  progressVariants,
  FadeIn 
} from '@/components/animations';

const statusColors = {
  draft: 'warning',
  in_progress: 'info',
  pending_review: 'success',
} as const;

const statusLabels = {
  draft: 'Por Comenzar',
  in_progress: 'En Progreso',
  pending_review: 'En Revisión',
} as const;

const Card = motion(MuiCard);

const PendingFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { evaluations, isLoading, error } = usePendingEvaluations();

  const handleProvideFeedback = (id: string) => {
    navigate({
      to: '/evaluations/$id',
      params: { id }
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Error al cargar las evaluaciones pendientes. Por favor, intente nuevamente.
        </Alert>
      </Box>
    );
  }

  const FeedbackCard: React.FC<{ feedback: PendingEvaluation }> = ({ feedback }) => (
    <Card
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
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
          <motion.div
            initial="initial"
            animate="animate"
            variants={progressVariants}
            custom={feedback.progress}
          >
            <LinearProgress
              variant="determinate"
              value={feedback.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </motion.div>
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
          {feedback.status === 'draft'
            ? 'Proporcionar Feedback'
            : 'Continuar Feedback'}
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <FadeIn>
        <Typography variant="h4" gutterBottom>
          Feedback Pendiente
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Tienes {evaluations?.length || 0} evaluaciones pendientes de retroalimentación.
        </Typography>
      </FadeIn>

      <motion.div
        variants={staggeredListVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <AnimatePresence>
            {evaluations?.map((feedback) => (
              <Grid item xs={12} md={6} key={feedback.id}
                component={motion.div}
                variants={listItemVariants}
              >
                <FeedbackCard feedback={feedback} />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default PendingFeedback; 