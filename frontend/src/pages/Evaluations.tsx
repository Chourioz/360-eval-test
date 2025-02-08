import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEmployees } from '@/hooks/useEmployees';
import { useEvaluations } from '@/hooks/useEvaluations';
import EvaluationForm from '@/components/evaluations/EvaluationForm';
import type { Evaluation } from '@/types';

const Evaluations: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [openForm, setOpenForm] = React.useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<Evaluation | undefined>();

  const { employees } = useEmployees();
  const {
    evaluations,
    isLoading,
    error,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    isCreating,
    isUpdating,
    isDeleting,
  } = useEvaluations();

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenCreate = () => {
    setSelectedEvaluation(undefined);
    setOpenForm(true);
  };

  const handleOpenEdit = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedEvaluation(undefined);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedEvaluation) {
        await updateEvaluation({ id: selectedEvaluation._id, data });
      } else {
        await createEvaluation(data);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta evaluación?')) {
      try {
        await deleteEvaluation(id);
      } catch (error) {
        console.error('Error deleting evaluation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Error: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={2}
        mb={4}
      >
        <Typography variant="h4" component="h1">
          Evaluaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          fullWidth={isMobile}
        >
          Nueva Evaluación
        </Button>
      </Stack>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                {!isMobile && <TableCell>Tipo</TableCell>}
                <TableCell>Estado</TableCell>
                {!isMobile && <TableCell>Progreso</TableCell>}
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(evaluations || [])
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((evaluation) => (
                  <TableRow key={evaluation._id}>
                    <TableCell>
                      <Stack>
                        <Typography variant="body1">
                          {evaluation.employee.user.firstName} {evaluation.employee.user.lastName}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="textSecondary">
                            {evaluation.evaluationType === 'self'
                              ? 'Auto-evaluación'
                              : evaluation.evaluationType === 'peer'
                              ? 'Entre pares'
                              : evaluation.evaluationType === 'manager'
                              ? 'Por supervisor'
                              : '360°'}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        {evaluation.evaluationType === 'self'
                          ? 'Auto-evaluación'
                          : evaluation.evaluationType === 'peer'
                          ? 'Entre pares'
                          : evaluation.evaluationType === 'manager'
                          ? 'Por supervisor'
                          : '360°'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={getStatusLabel(evaluation.status)}
                        color={getStatusColor(evaluation.status) as any}
                        size={isMobile ? 'small' : 'medium'}
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <CircularProgress
                            variant="determinate"
                            value={evaluation.progress || 0}
                            size={24}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2">{evaluation.progress || 0}%</Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(evaluation)}
                          disabled={isUpdating}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(evaluation._id)}
                          disabled={isDeleting}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={evaluations?.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? 'Filas:' : 'Filas por página:'}
        />
      </Paper>

      <EvaluationForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        evaluation={selectedEvaluation}
        employees={employees}
        isLoading={isCreating || isUpdating}
        mode={selectedEvaluation ? 'edit' : 'create'}
      />
    </Container>
  );
};

export default Evaluations; 