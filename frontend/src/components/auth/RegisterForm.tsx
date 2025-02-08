import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Grid,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

const schema = z
  .object({
    email: z
      .string()
      .email("Ingrese un email válido")
      .min(1, "El email es requerido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    role: z.enum(["admin", "manager", "employee"]),
    position: z.string().optional(),
    department: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "employee") {
        return data.position && data.department;
      }
      return true;
    },
    {
      message: "El cargo y departamento son requeridos para empleados",
      path: ["position", "department"],
    }
  );

const RegisterFormComponent: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "employee" as const,
      position: "",
      department: "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        await register(value);
        // After successful registration, navigate to the dashboard
        navigate({ to: "/" });
      } catch (err) {
        // Error is handled by the mutation
      }
    },
  });

  const isEmployee = form.getFieldValue("role") === "employee";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: 600,
        mx: "auto",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Registro
        </Typography>

        {error && (
          <Alert severity="error">
            {error instanceof Error ? error.message : "An error occurred"}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {form.Field({
                name: "firstName",
                children: (field) => (
                  <TextField
                    fullWidth
                    id="firstName"
                    name={field.name}
                    label="Nombre"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors?.length}
                    helperText={field.state.meta.errors?.[0]}
                    disabled={isLoading}
                  />
                ),
              })}
            </Grid>

            <Grid item xs={12} sm={6}>
              {form.Field({
                name: "lastName",
                children: (field) => (
                  <TextField
                    fullWidth
                    id="lastName"
                    name={field.name}
                    label="Apellido"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors?.length}
                    helperText={field.state.meta.errors?.[0]}
                    disabled={isLoading}
                  />
                ),
              })}
            </Grid>

            <Grid item xs={12}>
              {form.Field({
                name: "email",
                children: (field) => (
                  <TextField
                    fullWidth
                    id="email"
                    name={field.name}
                    label="Email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors?.length}
                    helperText={field.state.meta.errors?.[0]}
                    disabled={isLoading}
                  />
                ),
              })}
            </Grid>

            <Grid item xs={12}>
              {form.Field({
                name: "password",
                children: (field) => (
                  <TextField
                    fullWidth
                    id="password"
                    name={field.name}
                    label="Contraseña"
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors?.length}
                    helperText={field.state.meta.errors?.[0]}
                    disabled={isLoading}
                  />
                ),
              })}
            </Grid>

            <Grid item xs={12}>
              {form.Field({
                name: "role",
                children: (field) => (
                  <TextField
                    fullWidth
                    select
                    id="role"
                    name={field.name}
                    label="Rol"
                    value={field.state.value}
                    onChange={({ target }) => field.handleChange(target.value as "admin" | "manager" | "employee")}
                    onBlur={field.handleBlur}
                    error={!!field.state.meta.errors?.length}
                    helperText={field.state.meta.errors?.[0]}
                    disabled={isLoading}
                  >
                    <MenuItem value="employee">Empleado</MenuItem>
                    <MenuItem value="manager">Gerente</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                  </TextField>
                ),
              })}
            </Grid>

            {isEmployee && (
              <>
                <Grid item xs={12} sm={6}>
                  {form.Field({
                    name: "position",
                    children: (field) => (
                      <TextField
                        fullWidth
                        id="position"
                        name={field.name}
                        label="Cargo"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        error={!!field.state.meta.errors?.length}
                        helperText={field.state.meta.errors?.[0]}
                        disabled={isLoading}
                      />
                    ),
                  })}
                </Grid>

                <Grid item xs={12} sm={6}>
                  {form.Field({
                    name: "department",
                    children: (field) => (
                      <TextField
                        fullWidth
                        id="department"
                        name={field.name}
                        label="Departamento"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        error={!!field.state.meta.errors?.length}
                        helperText={field.state.meta.errors?.[0]}
                        disabled={isLoading}
                      />
                    ),
                  })}
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !form.state.isValid}
                sx={{ mt: 2 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Registrarse"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            ¿Ya tienes una cuenta?{" "}
            <Button
              color="primary"
              onClick={() => navigate({ to: "/login" })}
              disabled={isLoading}
            >
              Iniciar Sesión
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterFormComponent;
