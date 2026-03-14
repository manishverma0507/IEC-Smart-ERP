const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/chat', aiAssistantController.chat);

module.exports = router;
