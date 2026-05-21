// ─────────────────────────────────────────────
//  routes/enrollments.js
//  GET    /api/enrollments/my          — my enrollments (student)
//  POST   /api/enrollments             — enroll in a course
//  PUT    /api/enrollments/:id         — update progress
//  DELETE /api/enrollments/:id         — unenroll
//  GET    /api/enrollments/course/:id  — all students in a course (instructor)
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const { protect, instructorOrAdmin } = require('../middleware/auth');

router.use(protect);

// GET my enrollments
router.get('/my', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title description emoji category level duration instructor status');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all enrollments for a course (instructor/admin)
router.get('/course/:courseId', instructorOrAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all enrollments (admin)
router.get('/', instructorOrAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title emoji');
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST enroll in a course
router.post('/', async (req, res) => {
  try {
    const { courseId } = req.body;
    const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(400).json({ message: 'Already enrolled in this course' });

    const enrollment = await Enrollment.create({ student: req.user._id, course: courseId });
    await enrollment.populate('course', 'title emoji');
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update progress
router.put('/:id', async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress: req.body.progress },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE unenroll
router.delete('/:id', async (req, res) => {
  try {
    await Enrollment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
