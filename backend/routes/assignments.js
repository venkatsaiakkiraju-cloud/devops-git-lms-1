// ─────────────────────────────────────────────
//  routes/assignments.js
//  GET    /api/assignments              — all assignments
//  GET    /api/assignments/course/:id   — by course
//  GET    /api/assignments/:id          — single
//  POST   /api/assignments              — create (instructor/admin)
//  PUT    /api/assignments/:id          — update
//  DELETE /api/assignments/:id          — delete
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { protect, instructorOrAdmin } = require('../middleware/auth');

// GET all assignments (protected)
router.get('/', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('course', 'title emoji')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET assignments by course
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('course', 'title emoji')
      .sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single assignment
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title emoji');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create assignment
router.post('/', protect, instructorOrAdmin, async (req, res) => {
  try {
    const { title, description, course, dueDate, points } = req.body;
    const assignment = await Assignment.create({ title, description, course, dueDate, points });
    await assignment.populate('course', 'title emoji');
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update assignment
router.put('/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('course', 'title emoji');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE assignment
router.delete('/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
