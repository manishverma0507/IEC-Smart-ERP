const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    branch: { type: String },
    semester: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
