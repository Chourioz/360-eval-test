import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  Assessment,
  Feedback,
  TrendingUp,
  Group,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';

// Datos de ejemplo para los gráficos
const performanceData = [
  { month: 'Ene', score: 3.5 },
  { month: 'Feb', score: 3.8 },
  { month: 'Mar', score: 3.6 },
  { month: 'Abr', score: 4.0 },
  { month: 'May', score: 4.2 },
  { month: 'Jun', score: 4.1 },
];

const feedbackDistribution = [
  { name: 'Excelente', value: 30 },
  { name: 'Bueno', value: 45 },
  { name: 'Regular', value: 20 },
  { name: 'Necesita Mejorar', value: 5 },
];

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#F44336'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Box sx={{ color: 'primary.main', display: 'flex', p: 1 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.firstName} {user?.lastName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Tarjetas de estadísticas */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Evaluaciones"
            value="4"
            icon={<Assessment fontSize="large" />}
            description="Evaluaciones pendientes"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Feedback"
            value="12"
            icon={<Feedback fontSize="large" />}
            description="Feedback recibido este mes"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Promedio"
            value="4.2"
            icon={<TrendingUp fontSize="large" />}
            description="Puntuación promedio"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Equipo"
            value="8"
            icon={<Group fontSize="large" />}
            description="Miembros en tu equipo"
          />
        </Grid>

        {/* Gráficos */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Evolución del Desempeño
            </Typography>
            <Box sx={{ height: { xs: 300, md: 400 }, width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={theme.palette.primary.main}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Feedback
            </Typography>
            <Box sx={{ height: { xs: 300, md: 400 }, width: '100%' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={feedbackDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {feedbackDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 