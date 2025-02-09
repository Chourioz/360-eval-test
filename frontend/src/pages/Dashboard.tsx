import React from 'react';
import {
  Box,
  Grid,
  Paper as MuiPaper,
  Typography,
  Card as MuiCard,
  CardContent,
  useTheme,
  CircularProgress,
  Alert,
  SvgIconProps,
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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  staggeredListVariants, 
  listItemVariants, 
  cardVariants,
  FadeIn 
} from '@/components/animations';
import { useDashboard } from '@/hooks/useDashboard';

const Card = motion(MuiCard);
const Paper = motion(MuiPaper);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<SvgIconProps>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <Card
    variants={cardVariants}
    initial="initial"
    animate="animate"
    whileHover="hover"
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Icon sx={{ fontSize: 40, color }} />
      </Box>
    </CardContent>
  </Card>
);

interface FeedbackDistributionItem {
  name: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { stats, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">
          Error al cargar las estadísticas del dashboard. Por favor, intente nuevamente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <FadeIn>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
      </FadeIn>

      <motion.div
        variants={staggeredListVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}
            component={motion.div}
            variants={listItemVariants}
          >
            <StatCard
              title="Evaluaciones Pendientes"
              value={stats?.pendingEvaluations || 0}
              icon={Assessment}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}
            component={motion.div}
            variants={listItemVariants}
          >
            <StatCard
              title="Feedback Mensual"
              value={stats?.monthlyFeedback || 0}
              icon={Feedback}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}
            component={motion.div}
            variants={listItemVariants}
          >
            <StatCard
              title="Promedio de Desempeño"
              value={stats?.averageScore || '0.0'}
              icon={TrendingUp}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}
            component={motion.div}
            variants={listItemVariants}
          >
            <StatCard
              title="Miembros del Equipo"
              value={stats?.teamCount || 0}
              icon={Group}
              color={theme.palette.warning.main}
            />
          </Grid>
        </Grid>
      </motion.div>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            sx={{ p: 2 }}
          >
            <Typography variant="h6" gutterBottom>
              Tendencia de Desempeño
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.performanceData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
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
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            sx={{ p: 2 }}
          >
            <Typography variant="h6" gutterBottom>
              Distribución de Feedback
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.feedbackDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(stats?.feedbackDistribution || []).map((entry: FeedbackDistributionItem, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[
                        theme.palette.primary.main,
                        theme.palette.secondary.main,
                        theme.palette.success.main,
                        theme.palette.error.main,
                      ][index % 4]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 