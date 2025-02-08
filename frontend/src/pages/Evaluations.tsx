import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PictureAsPdf,
} from '@mui/icons-material';
import ReportGenerator from '@/components/reports/ReportGenerator';
import type { Evaluation as EvaluationType } from '@/types';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

interface Evaluation extends EvaluationType {}

type StatusType = 'draft' | 'in_progress' | 'pending_review' | 'completed';
type ColorType = 'warning' | 'info' | 'success';

const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    evaluationType: '360',
    employee: {
      id: '1',
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'employee',
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      position: 'Developer',
      department: 'Engineering',
      startDate: '2024-01-01',
      status: 'active',
      directReports: [],
      skills: [],
      metadata: {
        yearsOfExperience: 5,
        previousPositions: [],
        certifications: []
      }
    },
    period: {
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    },
    status: 'in_progress',
    categories: [],
    evaluators: [],
    metadata: {
      createdBy: {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'manager',
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    }
  }
];

const typeLabels: Record<Evaluation['evaluationType'], string> = {
  '360': 'Evaluación 360°',
  self: 'Autoevaluación',
  peer: 'Evaluación de Pares',
  manager: 'Evaluación de Gerente'
};

const statusLabels: Record<StatusType, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  pending_review: 'Pendiente de Revisión',
  completed: 'Completado'
};

const statusColors: Record<StatusType, ColorType> = {
  draft: 'warning',
  in_progress: 'info',
  pending_review: 'warning',
  completed: 'success'
};

const Evaluations: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState<Evaluation | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
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

  if (!['admin', 'manager'].includes(user.role)) {
    navigate({ to: '/unauthorized' });
    return null;
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (evaluation?: Evaluation) => {
    if (evaluation) {
      setSelectedEvaluation(evaluation);
    } else {
      setSelectedEvaluation(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvaluation(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implementar la lógica para guardar la evaluación
    console.log('Guardando evaluación:', selectedEvaluation);
    handleCloseDialog();
  };

  const handleGenerateReport = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsReportDialogOpen(true);
  };

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Evaluaciones</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Evaluación
          </Button>
        </Box>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Límite</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>{evaluation.employee.user.firstName} {evaluation.employee.user.lastName}</TableCell>
                    <TableCell>{typeLabels[evaluation.evaluationType]}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[evaluation.status]}
                        color={statusColors[evaluation.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(evaluation.period.endDate).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(evaluation)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleGenerateReport(evaluation)}
                      >
                        <PictureAsPdf />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mockEvaluations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Empleado"
                  defaultValue={selectedEvaluation?.employee.user.firstName + ' ' + selectedEvaluation?.employee.user.lastName}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tipo de Evaluación"
                  select
                  defaultValue={selectedEvaluation?.evaluationType || '360'}
                  required
                >
                  <MenuItem value="360">Evaluación 360°</MenuItem>
                  <MenuItem value="self">Autoevaluación</MenuItem>
                  <MenuItem value="peer">Evaluación de Pares</MenuItem>
                  <MenuItem value="manager">Evaluación de Gerente</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Inicio"
                  defaultValue={selectedEvaluation?.period.startDate}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Fin"
                  defaultValue={selectedEvaluation?.period.endDate}
                  InputLabelProps={{ shrink: true }}
                  required
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

      <ReportGenerator
        open={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        evaluation={selectedEvaluation}
      />
    </>
  );
};

export default Evaluations; 