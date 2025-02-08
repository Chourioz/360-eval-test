const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'El empleado es requerido'],
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
      enum: ['draft', 'in_progress', 'completed'],
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
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
        },
        feedback: [
          {
            categoryId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            criteriaId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            score: {
              type: Number,
              min: 1,
              max: 5,
              required: true,
            },
            comment: String,
          },
        ],
        submittedAt: Date,
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
        required: true,
      },
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
evaluationSchema.index({ 'metadata.createdBy': 1 });

// Virtual para calcular el progreso general
evaluationSchema.virtual('progress').get(function () {
  if (!this.evaluators || this.evaluators.length === 0) return 0;
  
  const completedEvaluators = this.evaluators.filter(
    (e) => e.status === 'completed'
  ).length;
  
  return Math.round((completedEvaluators / this.evaluators.length) * 100);
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

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation; 