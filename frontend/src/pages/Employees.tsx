import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { employeeService } from '@/services/employee.service';
import type { Employee } from '@/types';

const departments = [
  'Todos',
  'Tecnología',
  'Producto',
  'Diseño',
  'Marketing',
  'Ventas',
  'Recursos Humanos',
];

const positions = [
  'Todos',
  'Desarrollador Senior',
  'Desarrollador Junior',
  'Product Manager',
  'Diseñador UX',
  'Diseñador UI',
  'Marketing Manager',
  'Sales Executive',
  'HR Manager',
];

const roleLabels = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
};

const Employees: React.FC = () => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDepartment, setSelectedDepartment] = React.useState('Todos');
  const [selectedPosition, setSelectedPosition] = React.useState('Todos');
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await employeeService.getEmployees();
      setEmployees(response.data);
    } catch (err) {
      setError('Error al cargar los empleados');
      console.error('Error fetching employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
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

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
    } else {
      setSelectedEmployee(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const employeeData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      position: formData.get('position') as string,
      department: formData.get('department') as string,
      role: formData.get('role') as 'admin' | 'manager' | 'employee',
      status: formData.get('status') as 'active' | 'inactive',
    };

    try {
      setError(null);
      if (selectedEmployee) {
        await employeeService.updateEmployee(selectedEmployee._id, employeeData);
      } else {
        await employeeService.createEmployee(employeeData);
      }
      await fetchEmployees();
      handleCloseDialog();
    } catch (err) {
      setError('Error al guardar el empleado');
      console.error('Error saving employee:', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este empleado?')) {
      try {
        setError(null);
        await employeeService.deleteEmployee(id);
        await fetchEmployees();
      } catch (err) {
        setError('Error al eliminar el empleado');
        console.error('Error deleting employee:', err);
      }
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      searchTerm === '' ||
      `${employee.user.firstName} ${employee.user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === 'Todos' ||
      employee.department === selectedDepartment;

    const matchesPosition =
      selectedPosition === 'Todos' || employee.position === selectedPosition;

    return matchesSearch && matchesDepartment && matchesPosition;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Empleados</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Empleado
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Departamento</InputLabel>
              <Select
                value={selectedDepartment}
                label="Departamento"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Cargo</InputLabel>
              <Select
                value={selectedPosition}
                label="Cargo"
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                {positions.map((pos) => (
                  <MenuItem key={pos} value={pos}>
                    {pos}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Empleado</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cargo</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron empleados
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => ({ ...employee, id: employee["_id"] }))
                .map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {employee.user.firstName[0]}
                          {employee.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {employee.user.firstName} {employee.user.lastName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.user.email}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleLabels[employee.user.role]}
                        color={
                          employee.user.role === 'admin'
                            ? 'error'
                            : employee.user.role === 'manager'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.user.isActive ? 'Activo' : 'Inactivo'}
                        color={employee.user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(employee)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="Nombre"
                  defaultValue={selectedEmployee?.user.firstName}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label="Apellido"
                  defaultValue={selectedEmployee?.user.lastName}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  defaultValue={selectedEmployee?.user.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Cargo</InputLabel>
                  <Select
                    name="position"
                    label="Cargo"
                    defaultValue={selectedEmployee?.position || ''}
                  >
                    {positions
                      .filter((pos) => pos !== 'Todos')
                      .map((pos) => (
                        <MenuItem key={pos} value={pos}>
                          {pos}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="department"
                    label="Departamento"
                    defaultValue={selectedEmployee?.department || ''}
                  >
                    {departments
                      .filter((dept) => dept !== 'Todos')
                      .map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="role"
                    label="Rol"
                    defaultValue={selectedEmployee?.user.role || 'employee'}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="status"
                    label="Estado"
                    defaultValue={selectedEmployee?.status || 'active'}
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
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
    </Box>
  );
};

export default Employees; 