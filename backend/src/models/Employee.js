const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      autopopulate: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    directReports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    skills: [
      {
        name: {
          type: String,
          required: true,
        },
        level: {
          type: Number,
          min: 1,
          max: 5,
          default: 1,
        },
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
    },
    metadata: {
      yearsOfExperience: Number,
      previousPositions: [String],
      certifications: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices
employeeSchema.index({ department: 1 });
employeeSchema.index({ manager: 1 });
employeeSchema.index({ "skills.name": 1 });

// Virtual para nombre completo
employeeSchema.virtual("fullName").get(function () {
  if (!this.user) return "";
  console.log(this.user);
  return `${this.user.firstName} ${this.user.lastName}`;
});

// Método para obtener la estructura jerárquica
employeeSchema.methods.getHierarchy = async function (depth = 1) {
  const hierarchy = {
    _id: this._id,
    fullName: this.fullName,
    position: this.position,
    department: this.department,
  };

  if (depth > 0 && this.directReports.length > 0) {
    hierarchy.reports = await Employee.find({
      _id: { $in: this.directReports },
    }).populate("user", "-password");

    for (const report of hierarchy.reports) {
      Object.assign(report, await report.getHierarchy(depth - 1));
    }
  }

  return hierarchy;
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
