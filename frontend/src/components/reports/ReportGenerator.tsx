import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Assessment,
  Person,
  Download,
} from '@mui/icons-material';
import { reportService } from '@/services/reportService';
import type { Evaluation, Employee } from '@/types';

interface ReportGeneratorProps {
  open: boolean;
  onClose: () => void;
  evaluation?: Evaluation | null;
  employee?: Employee | null;
  evaluations?: Evaluation[] | null;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  open,
  onClose,
  evaluation,
  employee,
  evaluations,
}) => {
  const handleGenerateEvaluationReport = async () => {
    if (!evaluation) return;
    
    const doc = await reportService.generateEvaluationReport(evaluation);
    reportService.downloadPDF(
      doc,
      `evaluacion_${evaluation.employee.user.firstName}_${evaluation.employee.user.lastName}_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleGenerateEmployeeReport = async () => {
    if (!employee || !evaluations) return;
    
    const doc = await reportService.generateEmployeeReport(employee, evaluations);
    reportService.downloadPDF(
      doc,
      `desarrollo_${employee.user.firstName}_${employee.user.lastName}_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generar Reporte</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          Seleccione el tipo de reporte que desea generar:
        </Typography>
        <List>
          {evaluation && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleGenerateEvaluationReport}>
                <ListItemIcon>
                  <Assessment />
                </ListItemIcon>
                <ListItemText
                  primary="Reporte de Evaluación"
                  secondary="Genera un reporte detallado de la evaluación actual"
                />
                <Download />
              </ListItemButton>
            </ListItem>
          )}
          {employee && evaluations && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleGenerateEmployeeReport}>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText
                  primary="Reporte de Desarrollo"
                  secondary="Genera un reporte histórico del desarrollo del empleado"
                />
                <Download />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportGenerator; 