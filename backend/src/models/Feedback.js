const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  evaluation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  responses: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    criteriaId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 1000
    }
  }],
  overallComment: {
    strengths: {
      type: String,
      maxlength: 2000
    },
    improvements: {
      type: String,
      maxlength: 2000
    },
    goals: {
      type: String,
      maxlength: 2000
    }
  },
  status: {
    type: String,
    enum: ['draft', 'submitted'],
    default: 'draft'
  },
  metadata: {
    relationship: {
      type: String,
      enum: ['self', 'peer', 'manager', 'subordinate'],
      required: true
    },
    submittedAt: Date,
    lastSavedAt: Date,
    timeSpent: Number // en minutos
  }
}, {
  timestamps: true
});

// Índices
feedbackSchema.index({ evaluation: 1, evaluator: 1 }, { unique: true });
feedbackSchema.index({ employee: 1 });
feedbackSchema.index({ status: 1 });

// Middleware para actualizar timestamps
feedbackSchema.pre('save', function(next) {
  this.metadata.lastSavedAt = new Date();
  if (this.status === 'submitted' && !this.metadata.submittedAt) {
    this.metadata.submittedAt = new Date();
  }
  next();
});

// Método para calcular promedios por categoría
feedbackSchema.methods.calculateAverages = function() {
  const averages = {};
  
  this.responses.forEach(response => {
    if (!averages[response.categoryId]) {
      averages[response.categoryId] = {
        total: 0,
        count: 0,
        ratings: []
      };
    }
    
    averages[response.categoryId].total += response.rating;
    averages[response.categoryId].count += 1;
    averages[response.categoryId].ratings.push(response.rating);
  });

  Object.keys(averages).forEach(categoryId => {
    const category = averages[categoryId];
    category.average = category.total / category.count;
    category.min = Math.min(...category.ratings);
    category.max = Math.max(...category.ratings);
  });

  return averages;
};

// Validación de que el evaluador no sea el mismo que el evaluado en caso de no ser autoevaluación
feedbackSchema.pre('save', function(next) {
  if (
    this.metadata.relationship !== 'self' &&
    this.evaluator.toString() === this.employee.user.toString()
  ) {
    next(new Error('Evaluator cannot be the same as evaluated employee for non-self evaluations'));
  }
  next();
});

// Middleware para poblar referencias automáticamente
feedbackSchema.pre(/^find/, function(next) {
  this.populate('evaluator', 'firstName lastName email')
      .populate('employee', 'position department')
      .populate('evaluation', 'evaluationType period status');
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback; 