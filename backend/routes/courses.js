// ─────────────────────────────────────────────
//  routes/courses.js
//  GET    /api/courses         — all published courses (public)
//  GET    /api/courses/:id     — single course
//  POST   /api/courses         — create (instructor/admin)
//  PUT    /api/courses/:id     — update (instructor/admin)
//  DELETE /api/courses/:id     — delete (admin)
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, adminOnly, instructorOrAdmin } = require('../middleware/auth');

// GET all courses — public
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { status: 'published' };
    const courses = await Course.find(filter)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create course
router.post('/', protect, instructorOrAdmin, async (req, res) => {
  try {
    const { title, description, category, emoji, level, duration, status } = req.body;
    const course = await Course.create({
      title, description, category, emoji, level, duration, status,
      instructor: req.user._id,
    });
    await course.populate('instructor', 'name email');
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update course
router.put('/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('instructor', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE course
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
