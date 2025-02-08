import React from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeForm from "@/components/employees/EmployeeForm";
import type { Employee } from "@/types";

const Employees: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    employees,
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    isCreating,
    isUpdating,
    isDeleting,
    createError,
    updateError,
  } = useEmployees();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<Employee | null>(null);
  const [formError, setFormError] = React.useState<Error | null>(null);

  const handleChangePage = (_: unknown, newPage: number) => {
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
    setFormError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
    setFormError(null);
  };

  const handleSubmit = async (formData: FormData) => {
    const employeeData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      position: formData.get("position") as string,
      department: formData.get("department") as string,
      role: formData.get("role") as "admin" | "manager" | "employee",
      status: formData.get("status") as "active" | "inactive",
    };

    try {
      setFormError(null);
      if (selectedEmployee) {
        await updateEmployee({ id: selectedEmployee._id, data: employeeData });
      } else {
        await createEmployee(employeeData);
      }
      handleCloseDialog();
    } catch (err) {
      setFormError(err as Error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este empleado?")) {
      try {
        await deleteEmployee(id);
      } catch (err) {
        console.error("Error deleting employee:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error al cargar los empleados: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "stretch" : "center"}
        gap={2}
        mb={3}
      >
        <Typography variant="h4" sx={{ mb: isMobile ? 1 : 0 }}>
          Empleados
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
        >
          Nuevo Empleado
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                {!isMobile && (
                  <>
                    <TableCell>Email</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Departamento</TableCell>
                  </>
                )}
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {employee.user.firstName[0]}
                          {employee.user.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {employee.user.firstName} {employee.user.lastName}
                          </Typography>
                          {isMobile && (
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {employee.user.email}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {employee.position} • {employee.department}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell>{employee.user.email}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Chip
                        label={
                          employee.user.role === "admin"
                            ? "Admin"
                            : employee.user.role === "manager"
                              ? "Manager"
                              : "Empleado"
                        }
                        color={
                          employee.user.role === "admin"
                            ? "error"
                            : employee.user.role === "manager"
                              ? "warning"
                              : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          employee.status === "active" ? "Activo" : "Inactivo"
                        }
                        color={
                          employee.status === "active" ? "success" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(employee)}
                          disabled={isUpdating}
                          size={isMobile ? "small" : "medium"}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteEmployee(employee._id)}
                          disabled={isDeleting}
                          size={isMobile ? "small" : "medium"}
                        >
                          <DeleteIcon />
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
          count={employees?.length || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? "Filas" : "Filas por página"}
          sx={{
            ".MuiTablePagination-selectLabel": {
              display: isMobile ? "none" : "block",
            },
            ".MuiTablePagination-displayedRows": {
              margin: isMobile ? "0 auto" : 0,
            },
          }}
        />
      </Paper>

      <EmployeeForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        employee={selectedEmployee || undefined}
        isLoading={isCreating || isUpdating}
        error={formError || createError || updateError}
        mode={selectedEmployee ? "edit" : "create"}
      />
    </Box>
  );
};

export default Employees;
