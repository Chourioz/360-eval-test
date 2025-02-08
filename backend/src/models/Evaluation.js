const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    evaluationType: {
      type: String,
      enum: ['self', 'peer', 'manager', '360'],
      required: true
    },
    period: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      }
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'pending_review', 'completed'],
      default: 'draft'
    },
    categories: [
      {
        name: {
          type: String,
          required: true
        },
        weight: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        },
        criteria: [
          {
            description: {
              type: String,
              required: true
            },
            weight: {
              type: Number,
              required: true,
              min: 0,
              max: 100
            }
          }
        ]
      }
    ],
    evaluators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        relationship: {
          type: String,
          enum: ['self', 'peer', 'manager', 'subordinate'],
          required: true
        },
        status: {
          type: String,
          enum: ['pending', 'completed'],
          default: 'pending'
        },
        completedAt: Date
      }
    ],
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      template: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices compuestos
evaluationSchema.index({ employee: 1, status: 1 });
evaluationSchema.index({ 'evaluators.user': 1, status: 1 });
evaluationSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

// Virtual para calcular el progreso
evaluationSchema.virtual('progress').get(function() {
  if (!this.evaluators || this.evaluators.length === 0) return 0;
  
  const completedEvaluators = this.evaluators.filter(e => e.status === 'completed').length;
  return Math.round((completedEvaluators / this.evaluators.length) * 100);
});

// Virtual para calcular el puntaje promedio
evaluationSchema.virtual('averageScore').get(function () {
  // Si no hay evaluadores, retornar 0
  if (!this.evaluators || this.evaluators.length === 0) return 0;

  // Contar evaluadores completados
  const completedEvaluators = this.evaluators.filter(e => e.status === 'completed');
  if (completedEvaluators.length === 0) return 0;

  // Por ahora retornamos 0 ya que el cálculo real del score
  // se debe hacer cuando obtengamos el feedback de la colección Feedback
  return 0;
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
  this.populate({
    path: 'employee',
    populate: {
      path: 'user',
      select: 'firstName lastName email'
    }
  })
  .populate('evaluators.user', 'firstName lastName email')
  .populate('metadata.createdBy', 'firstName lastName email');
  
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

// Método estático para buscar evaluaciones por usuario
evaluationSchema.statics.findByUser = async function(userId) {
  return this.find({
    $or: [
      // Evaluaciones donde el usuario es el empleado evaluado
      {
        employee: {
          $in: await mongoose.model('Employee').find({ user: userId }).select('_id')
        }
      },
      // Evaluaciones donde el usuario es evaluador
      {
        'evaluators.user': userId
      },
      // Evaluaciones creadas por el usuario
      {
        'metadata.createdBy': userId
      }
    ]
  })
  .populate({
    path: 'employee',
    populate: {
      path: 'user',
      select: 'firstName lastName email'
    }
  })
  .populate('evaluators.user', 'firstName lastName email')
  .populate('metadata.createdBy', 'firstName lastName email');
};

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation; 