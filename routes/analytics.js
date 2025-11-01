const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Task, User, Team, AuditLog, sequelize } = require("../models");
const { authenticate, isAdminOrCore } = require("../middleware/auth");

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const stats = {
      totalTasks: await Task.count(),
      completedTasks: await Task.count({ where: { status: "Completed" } }),
      pendingTasks: await Task.count({
        where: { status: ["Pending", "In Progress"] },
      }),
      overdueTasks: await Task.count({
        where: {
          status: { [Op.ne]: "Completed" },
          deadline: { [Op.lt]: new Date() },
        },
      }),
      totalUsers: await User.count(),
      totalTeams: await Team.count({ where: { isActive: true } }),
      upcomingDeadlines: await Task.count({
        where: {
          status: { [Op.ne]: "Completed" },
          deadline: {
            [Op.between]: [
              new Date(),
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ],
          },
        },
      }),
    };

    // Tasks by priority
    const tasksByPriority = await Task.findAll({
      attributes: [
        "priority",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { status: { [Op.ne]: "Completed" } },
      group: ["priority"],
    });

    // Tasks by status
    const tasksByStatus = await Task.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    // Upcoming deadlines (next 7 days)
    const upcomingTasks = await Task.findAll({
      where: {
        status: { [Op.ne]: "Completed" },
        deadline: {
          [Op.between]: [
            new Date(),
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ],
        },
      },
      include: [
        {
          association: "assignee",
          attributes: ["id", "name"],
        },
      ],
      order: [["deadline", "ASC"]],
      limit: 10,
    });

    res.json({
      stats,
      tasksByPriority: tasksByPriority.map((t) => ({
        priority: t.priority,
        count: parseInt(t.dataValues.count),
      })),
      tasksByStatus: tasksByStatus.map((t) => ({
        status: t.status,
        count: parseInt(t.dataValues.count),
      })),
      upcomingTasks,
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/analytics/team/:id
// @desc    Get team analytics
// @access  Private
router.get("/team/:id", authenticate, async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);

    // Get team members
    const teamMembers = await User.findAll({
      where: { teamId },
      attributes: ["id"],
    });

    const memberIds = teamMembers.map((m) => m.id);

    const stats = {
      totalMembers: memberIds.length,
      totalTasks: await Task.count({
        where: { assignedTo: memberIds },
      }),
      completedTasks: await Task.count({
        where: {
          assignedTo: memberIds,
          status: "Completed",
        },
      }),
      pendingTasks: await Task.count({
        where: {
          assignedTo: memberIds,
          status: ["Pending", "In Progress"],
        },
      }),
      overdueTasks: await Task.count({
        where: {
          assignedTo: memberIds,
          status: { [Op.ne]: "Completed" },
          deadline: { [Op.lt]: new Date() },
        },
      }),
    };

    // Member performance
    const memberStats = await Promise.all(
      memberIds.map(async (userId) => {
        const user = await User.findByPk(userId, {
          attributes: ["id", "name", "email"],
        });

        const assigned = await Task.count({ where: { assignedTo: userId } });
        const completed = await Task.count({
          where: { assignedTo: userId, status: "Completed" },
        });

        return {
          user,
          assignedTasks: assigned,
          completedTasks: completed,
          completionRate:
            assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      })
    );

    res.json({
      stats,
      memberStats,
    });
  } catch (error) {
    console.error("Team analytics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/analytics/user/:id
// @desc    Get user analytics
// @access  Private
router.get("/user/:id", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check permissions
    if (
      userId !== req.user.id &&
      !["Admin", "Core Team Member"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const stats = {
      assignedTasks: await Task.count({ where: { assignedTo: userId } }),
      completedTasks: await Task.count({
        where: { assignedTo: userId, status: "Completed" },
      }),
      pendingTasks: await Task.count({
        where: {
          assignedTo: userId,
          status: ["Pending", "In Progress"],
        },
      }),
      overdueTasks: await Task.count({
        where: {
          assignedTo: userId,
          status: { [Op.ne]: "Completed" },
          deadline: { [Op.lt]: new Date() },
        },
      }),
      createdTasks: await Task.count({ where: { createdBy: userId } }),
    };

    // Recent activity
    const recentTasks = await Task.findAll({
      where: { assignedTo: userId },
      order: [["updatedAt", "DESC"]],
      limit: 10,
      attributes: ["id", "title", "status", "deadline", "priority"],
    });

    // Completion trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const completionTrend = await Task.findAll({
      where: {
        assignedTo: userId,
        status: "Completed",
        completedAt: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("completedAt")), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("completedAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("completedAt")), "ASC"]],
    });

    res.json({
      stats,
      recentTasks,
      completionTrend: completionTrend.map((t) => ({
        date: t.dataValues.date,
        count: parseInt(t.dataValues.count),
      })),
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/analytics/audit-log
// @desc    Get audit log
// @access  Admin/Core
router.get("/audit-log", authenticate, isAdminOrCore, async (req, res) => {
  try {
    const { entityType, action, limit = 100 } = req.query;

    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          association: "performer",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });

    res.json({ logs });
  } catch (error) {
    console.error("Audit log error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
