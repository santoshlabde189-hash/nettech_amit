const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private (User/Admin)
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private (User/Admin)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (department !== undefined) fieldsToUpdate.department = department;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          department: user.department,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        errors: [{ field: 'currentPassword', msg: 'Current password is incorrect' }]
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/users/profile-picture
 * @access  Private
 */
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file (JPG or PNG up to 2 MB)',
        errors: [{ field: 'avatar', msg: 'No image file uploaded' }]
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old picture if it exists and is local
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/profile/')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not remove old profile image:', e.message);
        }
      }
    }

    // Relative web URL
    const relativeUrl = `/uploads/profile/${req.file.filename}`;
    user.profilePicture = relativeUrl;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        profilePicture: relativeUrl
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    List all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};
