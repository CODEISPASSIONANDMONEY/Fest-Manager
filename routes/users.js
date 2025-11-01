const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User, Task, Team } = require("../models");
const { authenticate, isAdminOrCore } = require("../middleware/auth");
const { validateId } = require("../middleware/validation");

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const { role, teamId } = req.query;

    const where = {};
    if (role) where.role = role;
    if (teamId) where.teamId = parseInt(teamId);

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        {
          association: "team",
          attributes: ["id", "name", "color"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get("/:id", authenticate, validateId, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          association: "team",
          attributes: ["id", "name", "color", "description"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Self or Admin/Core)
router.put("/:id", authenticate, validateId, async (req, res) => {
  try {
    // Check permissions
    const isSelf = parseInt(req.params.id) === req.user.id;
    const isAuthorized = ["Admin", "Core Team Member"].includes(req.user.role);

    if (!isSelf && !isAuthorized) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      name,
      email,
      position,
      role,
      teamId,
      profilePicture,
      emailNotifications,
      pushNotifications,
      deadlineReminders,
      taskUpdates,
      darkMode,
      language,
    } = req.body;

    // Only admin/core can change role
    if (role && !isAuthorized) {
      return res
        .status(403)
        .json({ error: "Only admins can change user roles" });
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      position: position !== undefined ? position : user.position,
      role: isAuthorized && role ? role : user.role,
      teamId: teamId !== undefined ? teamId : user.teamId,
      profilePicture:
        profilePicture !== undefined ? profilePicture : user.profilePicture,
      emailNotifications:
        emailNotifications !== undefined
          ? emailNotifications
          : user.emailNotifications,
      pushNotifications:
        pushNotifications !== undefined
          ? pushNotifications
          : user.pushNotifications,
      deadlineReminders:
        deadlineReminders !== undefined
          ? deadlineReminders
          : user.deadlineReminders,
      taskUpdates: taskUpdates !== undefined ? taskUpdates : user.taskUpdates,
      darkMode: darkMode !== undefined ? darkMode : user.darkMode,
      language: language || user.language,
    });

    res.json({
      message: "User updated successfully",
      user: {
        ...user.toJSON(),
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Change user password
// @access  Private (Self)
router.put("/:id/password", authenticate, validateId, async (req, res) => {
  try {
    if (parseInt(req.params.id) !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Can only change your own password" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findByPk(req.params.id);

    if (user.authMethod !== "local" || !user.password) {
      return res.status(400).json({
        error: "Cannot change password for Google authenticated accounts",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Admin/Core
router.delete(
  "/:id",
  authenticate,
  isAdminOrCore,
  validateId,
  async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has active tasks
      const activeTasks = await Task.count({
        where: {
          assignedTo: user.id,
          status: ["Pending", "In Progress"],
        },
      });

      if (activeTasks > 0) {
        return res.status(400).json({
          error: `Cannot delete user. User has ${activeTasks} active task(s).`,
        });
      }

      await user.destroy();

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private
router.get("/:id/stats", authenticate, validateId, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const stats = {
      assignedTasks: await Task.count({ where: { assignedTo: userId } }),
      completedTasks: await Task.count({
        where: { assignedTo: userId, status: "Completed" },
      }),
      pendingTasks: await Task.count({
        where: { assignedTo: userId, status: ["Pending", "In Progress"] },
      }),
      overdueTasks: await Task.count({
        where: {
          assignedTo: userId,
          status: { [require("sequelize").Op.ne]: "Completed" },
          deadline: { [require("sequelize").Op.lt]: new Date() },
        },
      }),
      createdTasks: await Task.count({ where: { createdBy: userId } }),
    };

    res.json({ stats });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/admin/clear-members
// @desc    Delete all users except Admin
// @access  Admin only
router.delete("/admin/clear-members", authenticate, async (req, res) => {
  try {
    // Only allow Admin role
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { sequelize } = require("../models");
    const {
      Comment,
      Notification,
      AuditLog,
      TeamMember,
      TeamHead,
    } = require("../models");

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get all non-admin users
      const nonAdminUsers = await User.findAll({
        where: {
          role: {
            [require("sequelize").Op.ne]: "Admin",
          },
        },
        transaction,
      });

      const userIds = nonAdminUsers.map((u) => u.id);
      const deletedCount = userIds.length;

      if (deletedCount === 0) {
        await transaction.commit();
        return res.json({ message: "No users to delete", deletedCount: 0 });
      }

      // Delete all related data for non-admin users
      await Promise.all([
        // Delete team associations
        TeamMember.destroy({ where: { userId: userIds }, transaction }),
        TeamHead.destroy({ where: { userId: userIds }, transaction }),

        // Delete tasks assigned to or created by these users
        Task.destroy({ where: { assignedTo: userIds }, transaction }),
        Task.destroy({ where: { createdBy: userIds }, transaction }),

        // Delete comments
        Comment.destroy({ where: { userId: userIds }, transaction }),

        // Delete notifications
        Notification.destroy({ where: { userId: userIds }, transaction }),

        // Delete audit logs
        AuditLog.destroy({ where: { userId: userIds }, transaction }),
      ]);

      // Finally, delete the users
      await User.destroy({
        where: {
          role: {
            [require("sequelize").Op.ne]: "Admin",
          },
        },
        transaction,
      });

      await transaction.commit();

      res.json({
        message: `Successfully deleted ${deletedCount} user(s)`,
        deletedCount,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Clear members error:", error);
    res.status(500).json({ error: "Failed to clear members" });
  }
});

module.exports = router;
