import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Rating,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  LinearProgress,
  Container,
} from "@mui/material";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { evaluationService } from "@/services/evaluation.service";
import { evaluationFormRoute } from "@/router";
import { useAuth } from "@/hooks/useAuth";
import type { Evaluation } from "@/types";

interface FeedbackResponse {
  categoryId: string;
  criteriaId: string;
  rating: number;
  comment?: string;
}

export default function EvaluationForm() {
  const { id } = useParams({ from: evaluationFormRoute.id });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: evaluationData, isLoading } = useQuery({
    queryKey: ["evaluation", id],
    queryFn: () => evaluationService.getEvaluation(id),
  });

  const submitMutation = useMutation({
    mutationFn: (responses: FeedbackResponse[]) =>
      evaluationService.submitFeedback(id, responses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", id] });
      navigate({ to: "/my-evaluations" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => evaluationService.completeEvaluation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation", id] });
      navigate({ to: "/my-evaluations" });
    },
  });

  const evaluation = evaluationData?.data;
  const currentEvaluator = evaluation?.evaluators.find(
    (e) => e.user._id === user?.id
  );

  const totalEvaluators = evaluation?.evaluators.length || 0;
  const completedEvaluators =
    evaluation?.evaluators.filter((e) => e.status === "completed").length || 0;
  const progress = Math.round((completedEvaluators / totalEvaluators) * 100);

  const canComplete = evaluation?.status === "in_progress" && progress === 100;

  useEffect(() => {
    if (currentEvaluator?.feedback && currentEvaluator.feedback.length > 0) {
      setResponses(currentEvaluator.feedback);
    }
  }, [currentEvaluator]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleRatingChange = (
    categoryId: string,
    criteriaId: string,
    value: number | null
  ) => {
    if (value === null) return;

    setResponses((prev) => {
      const existingResponse = prev.find(
        (r) => r.categoryId === categoryId && r.criteriaId === criteriaId
      );

      if (existingResponse) {
        return prev.map((r) =>
          r.categoryId === categoryId && r.criteriaId === criteriaId
            ? { ...r, rating: value }
            : r
        );
      }

      return [...prev, { categoryId, criteriaId, rating: value }];
    });
  };

  const handleCommentChange = (
    categoryId: string,
    criteriaId: string,
    comment: string
  ) => {
    setResponses((prev) => {
      const existingResponse = prev.find(
        (r) => r.categoryId === categoryId && r.criteriaId === criteriaId
      );

      if (existingResponse) {
        return prev.map((r) =>
          r.categoryId === categoryId && r.criteriaId === criteriaId
            ? { ...r, comment }
            : r
        );
      }

      return [...prev, { categoryId, criteriaId, rating: 0, comment }];
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync(responses);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepComplete = (stepIndex: number) => {
    const category = evaluation?.categories[stepIndex];
    if (!category) return false;

    // Check if there are existing responses in the current session
    const hasCurrentResponses = category.criteria.every((criterion) => {
      const response = responses.find(
        (r) => r.categoryId === category._id && r.criteriaId === criterion._id
      );
      return response && response.rating > 0;
    });

    // Check if there are saved responses from previous sessions
    const hasSavedFeedback = currentEvaluator?.feedback?.some(
      (f) => f.categoryId === category._id
    );

    return hasCurrentResponses || hasSavedFeedback;
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!evaluation) {
    return (
      <Alert severity="error">No se encontró la evaluación solicitada.</Alert>
    );
  }

  // If the evaluation is not in progress, show appropriate message
  if (evaluation.status === "draft") {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="info">
            Esta evaluación aún no ha comenzado. Espera a que sea iniciada para
            poder proporcionar tu feedback.
          </Alert>
        </Paper>
      </Box>
    );
  }

  // If the user has already submitted all feedback, show completion message
  if (currentEvaluator?.status === "completed") {
    return (
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Has completado tu evaluación para{" "}
            {evaluation.employee.user.firstName}{" "}
            {evaluation.employee.user.lastName}.
          </Alert>
          <Box sx={{ width: "100%", mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progreso general de la evaluación
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {completedEvaluators} de {totalEvaluators} evaluadores han
              completado su feedback
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => navigate({ to: "/my-evaluations" })}
            >
              Volver a Mis Evaluaciones
            </Button>
            {canComplete && (
              <Button
                variant="contained"
                onClick={() => completeMutation.mutate()}
              >
                Completar Evaluación
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : !evaluation ? (
          <Alert severity="error">
            No se encontró la evaluación solicitada.
          </Alert>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Typography variant="h4" component="h1">
                Evaluación: {evaluation.employee.user.firstName}{" "}
                {evaluation.employee.user.lastName}
              </Typography>
              {canComplete && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending
                    ? "Completando..."
                    : "Completar Evaluación"}
                </Button>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Progreso General: {progress}% ({completedEvaluators} de{" "}
                {totalEvaluators} evaluadores)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <Stepper activeStep={activeStep} sx={{ my: 4 }}>
              {evaluation.categories.map((category, index) => {
                const isCompleted = isStepComplete(index);
                const hasSavedFeedback = currentEvaluator?.feedback?.some(
                  (f) => f.categoryId === category._id
                );

                return (
                  <Step key={category._id} completed={isCompleted}>
                    <StepLabel>
                      {category.name}
                      {hasSavedFeedback && " (Ya respondido)"}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                {activeStep < evaluation.categories.length && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      {evaluation.categories[activeStep].name}
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    {currentEvaluator?.feedback?.some(
                      (f) =>
                        f.categoryId === evaluation.categories[activeStep]._id
                    ) ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Ya has proporcionado feedback para esta categoría.
                      </Alert>
                    ) : (
                      evaluation.categories[activeStep].criteria.map(
                        (criterion) => {
                          console.log("CRITERION ===> ", criterion);
                          console.log(
                            "CURRENT EVALUATOR ===> ",
                            currentEvaluator
                          );
                          const existingFeedback =
                            currentEvaluator?.feedback?.find(
                              (f) => f.criteriaId === criterion._id
                            );
                          console.log(
                            "EXISTING FEEDBACK ===> ",
                            existingFeedback
                          );
                          const currentResponse = responses.find(
                            (r) =>
                              r.categoryId ===
                                evaluation.categories[activeStep]._id &&
                              r.criteriaId === criterion._id
                          );
                          console.log(
                            "CURRENT RESPONSE ===> ",
                            currentResponse
                          );
                          return (
                            <Box key={criterion._id} sx={{ mb: 4 }}>
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12}>
                                  <Typography variant="subtitle1">
                                    {criterion.description}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Rating
                                    value={
                                      existingFeedback?.rating ||
                                      currentResponse?.rating ||
                                      0
                                    }
                                    onChange={(_, value) =>
                                      handleRatingChange(
                                        evaluation.categories[activeStep]._id,
                                        criterion._id,
                                        value
                                      )
                                    }
                                    disabled={!!existingFeedback}
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Comentario (opcional)"
                                    value={
                                      existingFeedback?.comment ||
                                      currentResponse?.comment ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleCommentChange(
                                        evaluation.categories[activeStep]._id,
                                        criterion._id,
                                        e.target.value
                                      )
                                    }
                                    disabled={!!existingFeedback}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          );
                        }
                      )
                    )}
                  </>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0 || isSubmitting}
                  >
                    Anterior
                  </Button>
                  <Box>
                    {activeStep === evaluation.categories.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!isStepComplete(activeStep) || isSubmitting}
                      >
                        {isSubmitting ? (
                          <CircularProgress size={24} />
                        ) : (
                          "Enviar Evaluación"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={!isStepComplete(activeStep)}
                      >
                        Siguiente
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Container>
  );
}
