import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Employee, Evaluation, EvaluationCategory, EvaluationCriteria } from '@/types';

interface EvaluationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  evaluation?: Evaluation;
  employees?: Employee[];
  isLoading?: boolean;
  error?: Error | null;
  mode: 'create' | 'edit';
}

interface CategoryState {
  name: string;
  weight: number;
  criteria: Array<{ description: string; weight: number }>;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  open,
  onClose,
  onSubmit,
  evaluation,
  employees,
  isLoading,
  error,
  mode
}) => {
  const initialCategories: CategoryState[] = evaluation?.categories 
    ? evaluation.categories.map(cat => ({
        name: cat.name || '',
        weight: cat.weight || 0,
        criteria: cat.criteria.map(crit => ({
          description: crit.description || '',
          weight: crit.weight || 0
        }))
      }))
    : [{ name: '', weight: 0, criteria: [{ description: '', weight: 0 }] }];

  const [categories, setCategories] = React.useState<CategoryState[]>(initialCategories);

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', weight: 0, criteria: [{ description: '', weight: 0 }] }]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleAddCriteria = (categoryIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].criteria.push({ description: '', weight: 0 });
    setCategories(newCategories);
  };

  const handleRemoveCriteria = (categoryIndex: number, criteriaIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].criteria = newCategories[categoryIndex].criteria.filter(
      (_, i) => i !== criteriaIndex
    );
    setCategories(newCategories);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    const data = {
      employee: formData.get('employee'),
      evaluationType: formData.get('evaluationType'),
      period: {
        startDate: startDate ? new Date(startDate as string).toISOString() : null,
        endDate: endDate ? new Date(endDate as string).toISOString() : null
      },
      categories: categories.map(category => ({
        name: category.name,
        weight: Number(category.weight),
        criteria: category.criteria.map(criterion => ({
          description: criterion.description,
          weight: Number(criterion.weight)
        }))
      })),
      evaluators: [] // TODO: Add evaluators selection
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Crear Nueva Evaluación' : 'Editar Evaluación'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Empleado</InputLabel>
                <Select
                  name="employee"
                  label="Empleado"
                  defaultValue={evaluation?.employee._id || ''}
                >
                  {employees?.map(employee => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.user.firstName} {employee.user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Evaluación</InputLabel>
                <Select
                  name="evaluationType"
                  label="Tipo de Evaluación"
                  defaultValue={evaluation?.evaluationType || 'self'}
                >
                  <MenuItem value="self">Auto-evaluación</MenuItem>
                  <MenuItem value="peer">Entre pares</MenuItem>
                  <MenuItem value="manager">Por supervisor</MenuItem>
                  <MenuItem value="360">360°</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Fecha de inicio"
                  defaultValue={evaluation?.period.startDate ? new Date(evaluation.period.startDate) : null}
                  name="startDate"
                  onChange={(date) => {
                    const input = document.querySelector('input[name="startDate"]') as HTMLInputElement;
                    if (input && date) {
                      input.value = date.toISOString();
                    }
                  }}
                  slotProps={{
                    textField: {
                      name: 'startDate',
                      required: true
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Fecha de fin"
                  defaultValue={evaluation?.period.endDate ? new Date(evaluation.period.endDate) : null}
                  name="endDate"
                  onChange={(date) => {
                    const input = document.querySelector('input[name="endDate"]') as HTMLInputElement;
                    if (input && date) {
                      input.value = date.toISOString();
                    }
                  }}
                  slotProps={{
                    textField: {
                      name: 'endDate',
                      required: true
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Categorías</Typography>
                  <Button startIcon={<AddIcon />} onClick={handleAddCategory}>
                    Agregar Categoría
                  </Button>
                </Stack>
              </Box>

              {categories.map((category, categoryIndex) => (
                <Box key={categoryIndex} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                      label="Nombre de Categoría"
                      value={category.name}
                      onChange={(e) => {
                        const newCategories = [...categories];
                        newCategories[categoryIndex].name = e.target.value;
                        setCategories(newCategories);
                      }}
                      fullWidth
                      required
                    />
                    <TextField
                      label="Peso (%)"
                      type="number"
                      value={category.weight}
                      onChange={(e) => {
                        const newCategories = [...categories];
                        newCategories[categoryIndex].weight = Number(e.target.value);
                        setCategories(newCategories);
                      }}
                      sx={{ width: 100 }}
                      required
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveCategory(categoryIndex)}
                      disabled={categories.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Criterios
                    </Typography>
                    {category.criteria.map((criterion, criteriaIndex) => (
                      <Stack key={criteriaIndex} direction="row" spacing={2} sx={{ mt: 1 }}>
                        <TextField
                          label="Descripción"
                          value={criterion.description}
                          onChange={(e) => {
                            const newCategories = [...categories];
                            newCategories[categoryIndex].criteria[criteriaIndex].description = e.target.value;
                            setCategories(newCategories);
                          }}
                          fullWidth
                          required
                        />
                        <TextField
                          label="Peso (%)"
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => {
                            const newCategories = [...categories];
                            newCategories[categoryIndex].criteria[criteriaIndex].weight = Number(e.target.value);
                            setCategories(newCategories);
                          }}
                          sx={{ width: 100 }}
                          required
                        />
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCriteria(categoryIndex, criteriaIndex)}
                          disabled={category.criteria.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddCriteria(categoryIndex)}
                      sx={{ mt: 1 }}
                    >
                      Agregar Criterio
                    </Button>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EvaluationForm; 