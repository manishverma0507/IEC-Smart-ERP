/**
 * Notice & Communication model - MyIEC ERP
 * AI summarization support
 */
const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    summary: { type: String }, // AI-generated
    category: { type: String, enum: ['academic', 'fee', 'exam', 'event', 'general'], default: 'general' },
    targetRoles: [{ type: String }], // admin, student, faculty, management
    targetBranches: [{ type: String }],
    targetSemesters: [{ type: Number }],
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ url: String, name: String }],
  },
  { timestamps: true }
);

noticeSchema.index({ publishedAt: -1 });
noticeSchema.index({ category: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
