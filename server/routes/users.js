// routes/users.js

const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } }
      ],
      _id: { $ne: req.user.id }
    })
    .select("name username profile_picture")
    .limit(10);

    res.json(users);

  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    const user = await User.findOne({ username }).select(
      'name username bio profile_picture createdAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { bio, profile_picture } = req.body;

    
    if (bio !== undefined && bio.length > 200) {
      return res.status(400).json({ message: 'Bio cannot exceed 200 characters' });
    }


    const updates = {};
    if (bio !== undefined) updates.bio = bio.trim();
    if (profile_picture !== undefined) updates.profile_picture = profile_picture;

   
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('name username bio profile_picture');

    // 5️⃣ Safety check
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;