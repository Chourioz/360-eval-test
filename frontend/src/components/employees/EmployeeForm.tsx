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
  Alert,
  Box,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import type { Employee } from '@/types';

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  employee?: Employee;
  isLoading?: boolean;
  error?: Error | null;
  mode: 'create' | 'edit';
  managers: Employee[];
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  onSubmit,
  employee,
  isLoading,
  error,
  mode,
  managers
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              name="firstName"
              label="Nombre"
              defaultValue={employee?.user.firstName || ''}
              required
              fullWidth
            />
            <TextField
              name="lastName"
              label="Apellido"
              defaultValue={employee?.user.lastName || ''}
              required
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              defaultValue={employee?.user.email || ''}
              required={mode === 'create'}
              fullWidth
              disabled={mode === 'edit'}
            />
            <TextField
              name="position"
              label="Cargo"
              defaultValue={employee?.position || ''}
              required
              fullWidth
            />
            <TextField
              name="department"
              label="Departamento"
              defaultValue={employee?.department || ''}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                name="role"
                defaultValue={employee?.user.role || 'employee'}
                label="Rol"
                required
              >
                <MenuItem value="employee">Empleado</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="status"
                defaultValue={employee?.status || 'active'}
                label="Estado"
                required
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Manager</InputLabel>
              <Select
                name="managerId"
                defaultValue={employee?.manager?._id || 'remove'}
                label="Manager"
              >
                <MenuItem value="remove">Sin manager</MenuItem>
                {managers.map((manager) => (
                  <MenuItem key={manager._id} value={manager._id}>
                    {manager.user.firstName} {manager.user.lastName} - {manager.position}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Seleccione un manager para el empleado o "Sin manager" para remover la asignación
              </FormHelperText>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {mode === 'create' ? 'Crear' : 'Actualizar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployeeForm; 