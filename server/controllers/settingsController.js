/**
 * Settings - attendance rules, fee structure (admin)
 */
const mongoose = require('mongoose');

const SETTINGS_COLLECTION = 'settings';

async function getSettings(req, res) {
  try {
    const col = mongoose.connection.collection(SETTINGS_COLLECTION);
    const att = await col.findOne({ _id: 'attendance' });
    const fee = await col.findOne({ _id: 'fee' });
    res.json({
      success: true,
      data: {
        minAttendancePercent: att?.minAttendancePercent ?? 75,
        lateFeePercent: fee?.lateFeePercent ?? 5,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateSettings(req, res) {
  try {
    const { minAttendancePercent, lateFeePercent } = req.body;
    const col = mongoose.connection.collection(SETTINGS_COLLECTION);
    if (minAttendancePercent != null) {
      await col.updateOne(
        { _id: 'attendance' },
        { $set: { minAttendancePercent: Number(minAttendancePercent), updatedAt: new Date() } },
        { upsert: true }
      );
    }
    if (lateFeePercent != null) {
      await col.updateOne(
        { _id: 'fee' },
        { $set: { lateFeePercent: Number(lateFeePercent), updatedAt: new Date() } },
        { upsert: true }
      );
    }
    const att = await col.findOne({ _id: 'attendance' });
    const fee = await col.findOne({ _id: 'fee' });
    res.json({
      success: true,
      data: {
        minAttendancePercent: att?.minAttendancePercent ?? 75,
        lateFeePercent: fee?.lateFeePercent ?? 5,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getSettings, updateSettings };
