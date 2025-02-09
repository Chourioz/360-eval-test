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
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import type { LoginCredentials } from "@/types";
import { Link } from "@tanstack/react-router";

const schema = z.object({
  email: z
    .string()
    .email("Ingrese un email válido")
    .min(1, "El email es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const LoginFormComponent: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const LoginForm = useForm<LoginCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        await login(value);
        // After successful login, navigate to the dashboard
        navigate({ to: "/" });
      } catch (err) {
        // Error is handled by the mutation
      }
    },
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: 400,
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
          Iniciar Sesión
        </Typography>

        {error && (
          <Alert severity="error">
            {error instanceof Error ? error.message : "An error occurred"}
          </Alert>
        )}

        <form onSubmit={LoginForm.handleSubmit} noValidate>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <LoginForm.Field
              name="email"
              children={(field) => (
                <TextField
                  fullWidth
                  id="email"
                  name={field.name}
                  label="Email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched && field.state.meta.errors?.[0] !== undefined
                  }
                  helperText={field.state.meta.isTouched && field.state.meta.errors?.[0]}
                  disabled={isLoading}
                />
              )}
            />

            <LoginForm.Field
              name="password"
              children={(field) => (
                <TextField
                  fullWidth
                  id="password"
                  name={field.name}
                  label="Contraseña"
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched && field.state.meta.errors?.[0] !== undefined
                  }
                  helperText={field.state.meta.isTouched && field.state.meta.errors?.[0]}
                  disabled={isLoading}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || !LoginForm.state.isValid}
              sx={{ mt: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            ¿No tienes una cuenta?{" "}
            <Button
              color="primary"
              onClick={() => navigate({ to: "/register" })}
              disabled={isLoading}
            >
              Regístrate
            </Button>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Button variant="text">Registrarse</Button>
          </Link>
          <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
            <Button variant="text">¿Olvidaste tu contraseña?</Button>
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginFormComponent;
