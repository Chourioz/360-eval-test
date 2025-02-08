const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'El empleado es requerido'],
      autopopulate: true
    },
    evaluationType: {
      type: String,
      enum: ['360', 'self', 'peer', 'manager'],
      required: [true, 'El tipo de evaluación es requerido'],
    },
    period: {
      startDate: {
        type: Date,
        required: [true, 'La fecha de inicio es requerida'],
      },
      endDate: {
        type: Date,
        required: [true, 'La fecha de fin es requerida'],
      },
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'pending_review', 'completed'],
      default: 'draft',
    },
    categories: [
      {
        name: {
          type: String,
          required: [true, 'El nombre de la categoría es requerido'],
        },
        description: String,
        weight: {
          type: Number,
          required: [true, 'El peso de la categoría es requerido'],
          min: 0,
          max: 100,
        },
        criteria: [
          {
            description: {
              type: String,
              required: [true, 'La descripción del criterio es requerida'],
            },
            weight: {
              type: Number,
              required: [true, 'El peso del criterio es requerido'],
              min: 0,
              max: 100,
            },
          },
        ],
      },
    ],
    evaluators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        relationship: {
          type: String,
          enum: ['self', 'peer', 'manager', 'subordinate'],
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'completed'],
          default: 'pending',
        },
        completedAt: Date,
      },
    ],
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      template: String
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices
evaluationSchema.index({ employee: 1, status: 1 });
evaluationSchema.index({ 'evaluators.user': 1, status: 1 });
evaluationSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
evaluationSchema.index({ 'metadata.createdBy': 1 });

// Virtual para calcular el progreso general
evaluationSchema.virtual('progress').get(function () {
  if (this.status === 'draft') return 0;
  if (this.status === 'completed') return 100;

  const totalEvaluators = this.evaluators.length;
  if (totalEvaluators === 0) return 0;

  const completedEvaluators = this.evaluators.filter(
    (e) => e.status === 'completed'
  ).length;
  
  return Math.round((completedEvaluators / totalEvaluators) * 100);
});

// Virtual para calcular el puntaje promedio
evaluationSchema.virtual('averageScore').get(function () {
  if (!this.evaluators || this.evaluators.length === 0) return 0;

  const completedEvaluators = this.evaluators.filter(
    (e) => e.status === 'completed'
  );

  if (completedEvaluators.length === 0) return 0;

  const totalScore = completedEvaluators.reduce((acc, evaluator) => {
    const evaluatorScore = evaluator.feedback.reduce((sum, f) => {
      const category = this.categories.find(
        (c) => c._id.toString() === f.categoryId.toString()
      );
      if (!category) return sum;

      const criteria = category.criteria.find(
        (cr) => cr._id.toString() === f.criteriaId.toString()
      );
      if (!criteria) return sum;

      const weightedScore =
        (f.score * criteria.weight * category.weight) / 10000;
      return sum + weightedScore;
    }, 0);

    return acc + evaluatorScore;
  }, 0);

  return Number((totalScore / completedEvaluators.length).toFixed(2));
});

// Middleware pre-save para validar fechas
evaluationSchema.pre('save', function (next) {
  if (this.period.startDate >= this.period.endDate) {
    next(new Error('La fecha de inicio debe ser anterior a la fecha de fin'));
  }
  next();
});

// Middleware para poblar referencias automáticamente
evaluationSchema.pre(/^find/, function(next) {
  this.populate('employee')
      .populate('evaluators.user', 'firstName lastName email')
      .populate('metadata.createdBy', 'firstName lastName')
      .populate('metadata.lastModifiedBy', 'firstName lastName');
  next();
});

// Método para iniciar la evaluación
evaluationSchema.methods.start = function() {
  if (this.status !== 'draft') {
    throw new Error('Solo se pueden iniciar evaluaciones en estado draft');
  }
  this.status = 'in_progress';
  return this.save();
};

// Método para completar la evaluación
evaluationSchema.methods.complete = function() {
  if (this.status !== 'in_progress' && this.status !== 'pending_review') {
    throw new Error('Solo se pueden completar evaluaciones en progreso o pendientes de revisión');
  }
  this.status = 'completed';
  return this.save();
};

// Método para marcar un evaluador como completado
evaluationSchema.methods.markEvaluatorAsCompleted = function(userId) {
  const evaluator = this.evaluators.find(e => e.user.toString() === userId.toString());
  if (!evaluator) {
    throw new Error('Evaluador no encontrado');
  }
  evaluator.status = 'completed';
  evaluator.completedAt = new Date();
  return this.save();
};

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation; 