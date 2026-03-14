/**
 * Timetable model - MyIEC ERP
 * Optimization-ready (slot, room, faculty)
 */
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], required: true },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: String },
    batch: { type: String },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    session: { type: String, required: true }, // "2024-25 Odd"
    branch: { type: String },
    semester: { type: Number },
    slots: [slotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ session: 1, branch: 1, semester: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
