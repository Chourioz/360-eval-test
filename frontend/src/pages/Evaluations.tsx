import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper as MuiPaper,
  Stack,
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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggeredListVariants,
  cardVariants,
  FadeIn,
  AnimatedTable,
} from '@/components/animations';

const Paper = motion(MuiPaper);


const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

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
    deleteLoading: isDeleting
  } = useEvaluations();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (evaluation?: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedEvaluation(undefined);
    setOpenForm(false);
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
      <Box p={3}>
        <Typography color="error">Error: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <FadeIn>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Evaluaciones</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              disabled={isCreating}
            >
              Nueva Evaluación
            </Button>
          </Stack>
        </Box>
      </FadeIn>

      <Paper
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        <TableContainer>
          <AnimatedTable
            variants={staggeredListVariants}
            initial="hidden"
            animate="visible"
          >
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Progreso</TableCell>
                {!isMobile && <TableCell>Fecha Inicio</TableCell>}
                {!isMobile && <TableCell>Fecha Fin</TableCell>}
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {evaluations
                  ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((evaluation) => (
                    <motion.tr
                      key={evaluation._id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <TableCell>
                        {evaluation.employee?.user?.firstName} {evaluation.employee?.user?.lastName}
                      </TableCell>
                      <TableCell>{evaluation.evaluationType}</TableCell>
                      <TableCell>
                        <Chip
                          label={evaluation.status}
                          color={
                            evaluation.status === 'completed'
                              ? 'success'
                              : evaluation.status === 'in_progress'
                              ? 'warning'
                              : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{evaluation.progress}%</TableCell>
                      {!isMobile && (
                        <TableCell>
                          {new Date(evaluation.period.startDate).toLocaleDateString()}
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>
                          {new Date(evaluation.period.endDate).toLocaleDateString()}
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenForm(evaluation)}
                            disabled={isUpdating}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => deleteEvaluation(evaluation._id)}
                            disabled={isDeleting}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </motion.tr>
                  ))}
              </AnimatePresence>
            </TableBody>
          </AnimatedTable>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={evaluations?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <EvaluationForm
        open={openForm}
        onClose={handleCloseForm}
        evaluation={selectedEvaluation}
        employees={employees || []}
        onSubmit={selectedEvaluation ? updateEvaluation : createEvaluation}
        isLoading={isCreating || isUpdating}
        mode={selectedEvaluation ? 'edit' : 'create'}
      />
    </Container>
  );
};

export default Evaluations;
