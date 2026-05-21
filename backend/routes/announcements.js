// ─────────────────────────────────────────────
//  routes/announcements.js
//  GET    /api/announcements       — all announcements
//  POST   /api/announcements       — create (instructor/admin)
//  PUT    /api/announcements/:id   — update
//  DELETE /api/announcements/:id   — delete
// ─────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, instructorOrAdmin } = require('../middleware/auth');

// GET all announcements (any logged-in user)
router.get('/', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'name role')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create announcement
router.post('/', protect, instructorOrAdmin, async (req, res) => {
  try {
    const { title, body, course } = req.body;
    const announcement = await Announcement.create({
      title,
      body,
      author: req.user._id,
      course: course || null,
    });
    await announcement.populate('author', 'name role');
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update announcement
router.put('/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('author', 'name role');
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE announcement
router.delete('/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
