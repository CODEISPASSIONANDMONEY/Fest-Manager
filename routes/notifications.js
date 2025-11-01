const express = require("express");
const router = express.Router();
const { Notification, Task, Team } = require("../models");
const { authenticate } = require("../middleware/auth");
const { validateId } = require("../middleware/validation");

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === "true") {
      where.readStatus = false;
    }

    const notifications = await Notification.findAll({
      where,
      include: [
        {
          association: "relatedTask",
          attributes: ["id", "title", "status"],
        },
        {
          association: "relatedTeam",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/notifications/unread/count
// @desc    Get unread notification count
// @access  Private
router.get("/unread/count", authenticate, async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        readStatus: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", authenticate, validateId, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.update({ readStatus: true });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification (Admin/System)
// @access  Private (Admin/Core Team)
router.post("/", authenticate, async (req, res) => {
  try {
    const { userId, title, message, type, taskId, teamId } = req.body;

    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({
        error: "userId, title, and message are required",
      });
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || "info",
      taskId: taskId || null,
      teamId: teamId || null,
      readStatus: false,
    });

    // Emit socket event if available
    if (req.app.get("io")) {
      req.app
        .get("io")
        .to(`user_${userId}`)
        .emit("new_notification", notification);
    }

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await Notification.update(
      { readStatus: true },
      { where: { userId: req.user.id, readStatus: false } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", authenticate, validateId, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await notification.destroy();

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
