import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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

interface EvaluatorState {
  user: string;
  relationship: 'self' | 'peer' | 'manager' | 'subordinate';
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  open,
  onClose,
  onSubmit,
  evaluation,
  employees = [],
  isLoading,
  error,
  mode
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    evaluation ? employees.find(e => e._id === evaluation.employee._id) : null
  );
  
  const [categories, setCategories] = useState<CategoryState[]>(
    evaluation?.categories.map(cat => ({
      name: cat.name,
      weight: cat.weight,
      criteria: cat.criteria.map(crit => ({
        description: crit.description,
        weight: crit.weight
      }))
    })) || []
  );

  const [evaluators, setEvaluators] = useState<EvaluatorState[]>(
    evaluation?.evaluators.map(ev => ({
      user: ev.user._id,
      relationship: ev.relationship
    })) || []
  );

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', weight: 0, criteria: [] }]);
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

  const handleAddEvaluator = () => {
    setEvaluators([...evaluators, { user: '', relationship: 'peer' }]);
  };

  const handleRemoveEvaluator = (index: number) => {
    setEvaluators(evaluators.filter((_, i) => i !== index));
  };

  // Add effect to handle self-evaluation based on evaluation type
  useEffect(() => {
    const formElement = document.querySelector('form');
    if (!formElement) return;

    const evaluationType = formElement.querySelector('select[name="evaluationType"]') as HTMLSelectElement;
    if (!evaluationType) return;

    const handleEvaluationTypeChange = (event: Event) => {
      const type = (event.target as HTMLSelectElement).value;
      
      // Remove any existing self-evaluation
      setEvaluators(prev => prev.filter(ev => ev.relationship !== 'self'));

      // Add self-evaluation for self and 360 types
      if (type === 'self' || type === '360') {
        setEvaluators(prev => [
          { user: selectedEmployee?._id || '', relationship: 'self' },
          ...prev
        ]);
      }
    };

    evaluationType.addEventListener('change', handleEvaluationTypeChange);
    return () => evaluationType.removeEventListener('change', handleEvaluationTypeChange);
  }, [selectedEmployee]);

  // Add effect to handle initial self-evaluation setup
  useEffect(() => {
    if (selectedEmployee && mode === 'create') {
      const type = document.querySelector('select[name="evaluationType"]') as HTMLSelectElement;
      if (type && (type.value === 'self' || type.value === '360')) {
        setEvaluators(prev => {
          const hasSelf = prev.some(ev => ev.relationship === 'self');
          if (!hasSelf) {
            return [
              { user: selectedEmployee._id, relationship: 'self' },
              ...prev
            ];
          }
          return prev;
        });
      }
    }
  }, [selectedEmployee, mode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Get date values from the DatePicker inputs
    const startDateInput = document.querySelector('input[name="startDate"]') as HTMLInputElement;
    const endDateInput = document.querySelector('input[name="endDate"]') as HTMLInputElement;
    
    const data = {
      employee: selectedEmployee?._id,
      evaluationType: formData.get('evaluationType'),
      period: {
        startDate: startDateInput?.value ? new Date(startDateInput.value).toISOString() : null,
        endDate: endDateInput?.value ? new Date(endDateInput.value).toISOString() : null
      },
      categories: categories.map(cat => ({
        name: cat.name,
        weight: Number(cat.weight),
        criteria: cat.criteria.map(crit => ({
          description: crit.description,
          weight: Number(crit.weight)
        }))
      })),
      evaluators: evaluators.filter(ev => ev.user) // Filter out empty evaluators
    };

    onSubmit(data);
  };

  // Filter out the selected employee from potential evaluators
  const availableEvaluators = employees.filter(emp => emp._id !== selectedEmployee?._id);

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
            <Grid item xs={12}>
              <Autocomplete
                value={selectedEmployee}
                onChange={(_, newValue) => setSelectedEmployee(newValue)}
                options={employees}
                getOptionLabel={(option) => 
                  `${option.user.firstName} ${option.user.lastName} - ${option.position}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empleado"
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Evaluación</InputLabel>
                <Select
                  name="evaluationType"
                  label="Tipo de Evaluación"
                  defaultValue={evaluation?.evaluationType || 'peer'}
                  onChange={(event) => {
                    // Handle the change directly here
                    const type = event.target.value;
                    // Remove any existing self-evaluation
                    setEvaluators(prev => prev.filter(ev => ev.relationship !== 'self'));
                    // Add self-evaluation for self and 360 types
                    if (type === 'self' || type === '360') {
                      setEvaluators(prev => [
                        { user: selectedEmployee?._id || '', relationship: 'self' },
                        ...prev
                      ]);
                    }
                  }}
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
                  label="Fecha de Inicio"
                  defaultValue={evaluation?.period.startDate ? new Date(evaluation.period.startDate) : null}
                  slotProps={{
                    textField: {
                      name: 'startDate',
                      required: true,
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Fecha de Fin"
                  defaultValue={evaluation?.period.endDate ? new Date(evaluation.period.endDate) : null}
                  slotProps={{
                    textField: {
                      name: 'endDate',
                      required: true,
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Evaluators Section */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Evaluadores
                  <IconButton 
                    size="small" 
                    onClick={handleAddEvaluator}
                  >
                    <AddIcon />
                  </IconButton>
                </Typography>
                
                {evaluators.map((evaluator, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          value={availableEvaluators.find(e => e._id === evaluator.user) || null}
                          onChange={(_, newValue) => {
                            const newEvaluators = [...evaluators];
                            newEvaluators[index].user = newValue?._id || '';
                            setEvaluators(newEvaluators);
                          }}
                          options={availableEvaluators}
                          getOptionLabel={(option) => 
                            `${option.user.firstName} ${option.user.lastName} - ${option.position}`
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Evaluador"
                              required
                            />
                          )}
                          disabled={evaluator.relationship === 'self'} // Disable for self-evaluation
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <FormControl fullWidth required>
                          <InputLabel>Relación</InputLabel>
                          <Select
                            value={evaluator.relationship}
                            onChange={(e) => {
                              const newEvaluators = [...evaluators];
                              newEvaluators[index].relationship = e.target.value as any;
                              setEvaluators(newEvaluators);
                            }}
                            label="Relación"
                            disabled={evaluator.relationship === 'self'} // Disable for self-evaluation
                          >
                            <MenuItem value="self">Auto-evaluación</MenuItem>
                            <MenuItem value="peer">Par</MenuItem>
                            <MenuItem value="manager">Supervisor</MenuItem>
                            <MenuItem value="subordinate">Subordinado</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton 
                          onClick={() => handleRemoveEvaluator(index)}
                          disabled={evaluator.relationship === 'self'} // Disable for self-evaluation
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Categories Section */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Categorías
                  <IconButton size="small" onClick={handleAddCategory}>
                    <AddIcon />
                  </IconButton>
                </Typography>
                
                {categories.map((category, categoryIndex) => (
                  <Box key={categoryIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Nombre de la Categoría"
                          value={category.name}
                          onChange={(e) => {
                            const newCategories = [...categories];
                            newCategories[categoryIndex].name = e.target.value;
                            setCategories(newCategories);
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label="Peso (%)"
                          type="number"
                          value={category.weight}
                          onChange={(e) => {
                            const newCategories = [...categories];
                            newCategories[categoryIndex].weight = Number(e.target.value);
                            setCategories(newCategories);
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => handleRemoveCategory(categoryIndex)}>
                          <RemoveIcon />
                        </IconButton>
                      </Grid>

                      {/* Criteria Section */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Criterios
                          <IconButton size="small" onClick={() => handleAddCriteria(categoryIndex)}>
                            <AddIcon />
                          </IconButton>
                        </Typography>
                        
                        {category.criteria.map((criterion, criterionIndex) => (
                          <Box key={criterionIndex} sx={{ mb: 1, pl: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6}>
                                <TextField
                                  fullWidth
                                  label="Descripción del Criterio"
                                  value={criterion.description}
                                  onChange={(e) => {
                                    const newCategories = [...categories];
                                    newCategories[categoryIndex].criteria[criterionIndex].description = e.target.value;
                                    setCategories(newCategories);
                                  }}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <TextField
                                  fullWidth
                                  label="Peso (%)"
                                  type="number"
                                  value={criterion.weight}
                                  onChange={(e) => {
                                    const newCategories = [...categories];
                                    newCategories[categoryIndex].criteria[criterionIndex].weight = Number(e.target.value);
                                    setCategories(newCategories);
                                  }}
                                  required
                                />
                              </Grid>
                              <Grid item xs={12} sm={1}>
                                <IconButton onClick={() => handleRemoveCriteria(categoryIndex, criterionIndex)}>
                                  <RemoveIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          </Box>
                        ))}
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !selectedEmployee || evaluators.length === 0}
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