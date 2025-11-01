const express = require("express");
const router = express.Router();
const { Comment, Task, User } = require("../models");
const { authenticate } = require("../middleware/auth");
const { validateComment, validateId } = require("../middleware/validation");

// @route   GET /api/comments/task/:taskId
// @desc    Get all comments for a task
// @access  Private
router.get("/task/:taskId", authenticate, validateId, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { taskId: req.params.taskId, parentId: null },
      include: [
        {
          association: "author",
          attributes: ["id", "name", "email", "profilePicture"],
        },
        {
          association: "replies",
          include: [
            {
              association: "author",
              attributes: ["id", "name", "profilePicture"],
            },
          ],
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: Comment, as: "replies" }, "createdAt", "ASC"],
      ],
    });

    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/comments/task/:taskId
// @desc    Add comment to task
// @access  Private
router.post(
  "/task/:taskId",
  authenticate,
  validateId,
  validateComment,
  async (req, res) => {
    try {
      const { commentText, parentId } = req.body;

      // Verify task exists
      const task = await Task.findByPk(req.params.taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Create comment
      const comment = await Comment.create({
        taskId: req.params.taskId,
        userId: req.user.id,
        commentText,
        parentId: parentId || null,
      });

      // Fetch complete comment data
      const createdComment = await Comment.findByPk(comment.id, {
        include: [
          {
            association: "author",
            attributes: ["id", "name", "profilePicture"],
          },
        ],
      });

      // Emit real-time event (handled by Socket.IO in server.js)
      req.app
        .get("io")
        .to(`task_${req.params.taskId}`)
        .emit("comment_added", createdComment);

      res.status(201).json({
        message: "Comment added successfully",
        comment: createdComment,
      });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (Author/Admin/Core)
router.delete("/:id", authenticate, validateId, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check permissions
    const canDelete =
      comment.userId === req.user.id ||
      ["Admin", "Core Team Member"].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({ error: "Access denied" });
    }

    await comment.destroy();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
