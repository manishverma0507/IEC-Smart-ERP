/**
 * AI Assistant API - MyIEC ERP
 */
const aiAssistant = require('../services/aiAssistant');

async function chat(req, res) {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const result = await aiAssistant.chat(req.user.id, req.user.role, message.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { chat };
