// ─────────────────────────────────────────────
//  routes/submissions.js
//  GET    /api/submissions/my              — student's own submissions
//  GET    /api/submissions/assignment/:id  — all submissions for assignment (instructor)
//  GET    /api/submissions                 — all submissions (instructor/admin)
//  POST   /api/submissions                 — submit an assignment
//  PUT    /api/submissions/:id/grade       — grade a submission (instructor/admin)
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const { protect, instructorOrAdmin } = require('../middleware/auth');

router.use(protect);

// GET my submissions
router.get('/my', async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title points dueDate course')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET submissions for a specific assignment (instructor)
router.get('/assignment/:assignmentId', instructorOrAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email')
      .populate('assignment', 'title points');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all submissions (instructor/admin)
router.get('/', instructorOrAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('student', 'name email')
      .populate({ path: 'assignment', select: 'title points course', populate: { path: 'course', select: 'title emoji' } })
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST submit an assignment
router.post('/', async (req, res) => {
  try {
    const { assignmentId, text } = req.body;
    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already submitted this assignment' });

    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      text,
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT grade a submission
router.put('/:id/grade', instructorOrAdmin, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback },
      { new: true }
    ).populate('student', 'name email');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
