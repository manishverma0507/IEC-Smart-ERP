/**
 * Library controller - MyIEC ERP
 * Books, issue, return, recommendations
 */
const { LibraryBook, LibraryIssue, User } = require('../models');

const listBooks = async (req, res) => {
  try {
    const { category, branch, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (branch) filter.branch = branch;
    if (search) filter.$or = [{ title: new RegExp(search, 'i') }, { author: new RegExp(search, 'i') }, { isbn: search }];
    const skip = (Number(page) - 1) * Number(limit);
    const [books, total] = await Promise.all([
      LibraryBook.find(filter).skip(skip).limit(Number(limit)),
      LibraryBook.countDocuments(filter),
    ]);
    res.json({ success: true, data: books, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const issue = async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const book = await LibraryBook.findById(bookId);
    if (!book || book.availableCopies < 1) {
      return res.status(400).json({ success: false, message: 'Book not available' });
    }
    const issueRecord = await LibraryIssue.create({ book: bookId, student: studentId, dueDate });
    book.availableCopies -= 1;
    await book.save();
    res.status(201).json({ success: true, data: issueRecord });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const returnBook = async (req, res) => {
  try {
    const issueRecord = await LibraryIssue.findById(req.params.id);
    if (!issueRecord || issueRecord.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Invalid or already returned' });
    }
    issueRecord.status = 'returned';
    issueRecord.returnedAt = new Date();
    await issueRecord.save();
    const book = await LibraryBook.findById(issueRecord.book);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }
    res.json({ success: true, data: issueRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const myIssues = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.user.id;
    const issues = await LibraryIssue.find({ student: studentId })
      .populate('book', 'title author category')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const recommendations = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.user.id;
    const myIssues = await LibraryIssue.find({ student: studentId }).populate('book');
    const categories = [...new Set(myIssues.map((i) => i.book?.category).filter(Boolean))];
    const branch = req.user?.branch;
    const filter = { availableCopies: { $gt: 0 } };
    if (categories.length) filter.category = { $in: categories };
    if (branch) filter.$or = [{ branch }, { branch: { $exists: false } }];
    const recommended = await LibraryBook.find(filter).limit(10);
    res.json({ success: true, data: recommended });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listBooks, issue, returnBook, myIssues, recommendations };
