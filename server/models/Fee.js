/**
 * Fee model - MyIEC ERP
 * Supports risk prediction via due dates and amount
 */
const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['tuition', 'exam', 'library', 'hostel', 'other'], default: 'tuition' },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' },
    paidAmount: { type: Number, default: 0 },
    transactionId: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
