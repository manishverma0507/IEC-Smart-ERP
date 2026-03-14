/**
 * Library model - MyIEC ERP
 * Recommendations via issue history and subject
 */
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    isbn: { type: String, unique: true, sparse: true },
    category: { type: String },
    branch: { type: String },
    totalCopies: { type: Number, default: 1 },
    availableCopies: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const issueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'LibraryBook', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date },
    status: { type: String, enum: ['issued', 'returned', 'overdue'], default: 'issued' },
  },
  { timestamps: true }
);

bookSchema.index({ category: 1, branch: 1 });
issueSchema.index({ student: 1, status: 1 });

module.exports = {
  LibraryBook: mongoose.model('LibraryBook', bookSchema),
  LibraryIssue: mongoose.model('LibraryIssue', issueSchema),
};
