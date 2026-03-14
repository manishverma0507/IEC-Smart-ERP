const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/books', libraryController.listBooks);
router.get('/issues', libraryController.myIssues);
router.get('/recommendations', libraryController.recommendations);
router.post('/issue', authorize('admin', 'faculty'), libraryController.issue);
router.put('/return/:id', authorize('admin', 'faculty'), libraryController.returnBook);

module.exports = router;
