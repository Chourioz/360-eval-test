import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Evaluation, Employee } from '@/types';

class ReportService {
  private createHeader(doc: jsPDF, title: string) {
    doc.setFontSize(20);
    doc.text(title, 14, 20);
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
  }

  async generateEvaluationReport(evaluation: Evaluation) {
    const doc = new jsPDF();
    
    // Encabezado
    this.createHeader(doc, 'Reporte de Evaluación');

    // Información General
    doc.setFontSize(12);
    const generalInfo = [
      ['Empleado', `${evaluation.employee.user.firstName} ${evaluation.employee.user.lastName}`],
      ['Posición', evaluation.employee.position],
      ['Departamento', evaluation.employee.department],
      ['Tipo de Evaluación', evaluation.evaluationType],
      ['Periodo', `${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()}`],
      ['Estado', evaluation.status]
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Valor']],
      body: generalInfo,
      theme: 'striped',
      headStyles: { fillColor: [42, 92, 130] }
    });

    // Resultados por Categoría
    doc.setFontSize(14);
    const finalY = (doc as any).lastAutoTable?.finalY || 35;
    doc.text('Resultados por Categoría', 14, finalY + 15);

    const categoryResults = evaluation.categories.map(category => {
      const avgScore = this.calculateCategoryAverage(evaluation, category.name);
      return [
        category.name,
        avgScore.toFixed(2),
        `${category.weight}%`
      ];
    });

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || finalY) + 20,
      head: [['Categoría', 'Puntuación Promedio', 'Peso']],
      body: categoryResults,
      theme: 'striped',
      headStyles: { fillColor: [42, 92, 130] }
    });

    // Comentarios y Feedback
    doc.setFontSize(14);
    const feedbackY = (doc as any).lastAutoTable?.finalY || finalY;
    doc.text('Comentarios y Feedback', 14, feedbackY + 15);

    const feedbackData = evaluation.evaluators
      .filter(e => e.status === 'completed')
      .flatMap(evaluator => 
        evaluator.feedback.map(f => [
          evaluator.relationship,
          f.comment || 'Sin comentarios'
        ])
      );

    if (feedbackData.length > 0) {
      autoTable(doc, {
        startY: ((doc as any).lastAutoTable?.finalY || feedbackY) + 20,
        head: [['Relación', 'Comentarios']],
        body: feedbackData,
        theme: 'striped',
        headStyles: { fillColor: [42, 92, 130] }
      });
    }

    return doc;
  }

  async generateEmployeeReport(employee: Employee, evaluations: Evaluation[]) {
    const doc = new jsPDF();
    
    // Encabezado
    this.createHeader(doc, 'Reporte de Desarrollo del Empleado');

    // Información del Empleado
    const employeeInfo = [
      ['Nombre', `${employee.user.firstName} ${employee.user.lastName}`],
      ['Posición', employee.position],
      ['Departamento', employee.department],
      ['Fecha de Inicio', new Date(employee.startDate).toLocaleDateString()],
      ['Estado', employee.status]
    ];

    autoTable(doc, {
      startY: 35,
      head: [['Campo', 'Valor']],
      body: employeeInfo,
      theme: 'striped',
      headStyles: { fillColor: [42, 92, 130] }
    });

    // Historial de Evaluaciones
    doc.setFontSize(14);
    const finalY = (doc as any).lastAutoTable?.finalY || 35;
    doc.text('Historial de Evaluaciones', 14, finalY + 15);

    const evaluationHistory = evaluations.map(evaluation => [
      new Date(evaluation.period.startDate).toLocaleDateString(),
      evaluation.evaluationType,
      this.calculateOverallScore(evaluation).toFixed(2),
      evaluation.status
    ]);

    autoTable(doc, {
      startY: ((doc as any).lastAutoTable?.finalY || finalY) + 20,
      head: [['Fecha', 'Tipo', 'Puntuación', 'Estado']],
      body: evaluationHistory,
      theme: 'striped',
      headStyles: { fillColor: [42, 92, 130] }
    });

    // Habilidades y Competencias
    if (employee.skills && employee.skills.length > 0) {
      doc.setFontSize(14);
      const skillsY = (doc as any).lastAutoTable?.finalY || finalY;
      doc.text('Habilidades y Competencias', 14, skillsY + 15);

      const skillsData = employee.skills.map(skill => [
        skill.name,
        skill.level.toString()
      ]);

      autoTable(doc, {
        startY: ((doc as any).lastAutoTable?.finalY || skillsY) + 20,
        head: [['Habilidad', 'Nivel']],
        body: skillsData,
        theme: 'striped',
        headStyles: { fillColor: [42, 92, 130] }
      });
    }

    return doc;
  }

  private calculateCategoryAverage(evaluation: Evaluation, categoryName: string): number {
    const category = evaluation.categories.find(c => c.name === categoryName);
    if (!category) return 0;

    const relevantFeedback = evaluation.evaluators
      .filter(e => e.status === 'completed')
      .flatMap(e => e.feedback)
      .filter(f => f.categoryId === category._id);

    if (relevantFeedback.length === 0) return 0;

    return relevantFeedback.reduce((sum, f) => sum + f.score, 0) / relevantFeedback.length;
  }

  private calculateOverallScore(evaluation: Evaluation): number {
    return evaluation.categories.reduce((total, category) => {
      const categoryAvg = this.calculateCategoryAverage(evaluation, category.name);
      return total + (categoryAvg * category.weight / 100);
    }, 0);
  }

  downloadPDF(doc: jsPDF, filename: string) {
    doc.save(filename);
  }
}

export const reportService = new ReportService(); 