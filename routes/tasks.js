const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const {
  Task,
  User,
  Comment,
  Attachment,
  AuditLog,
  Notification,
} = require("../models");
const { authenticate } = require("../middleware/auth");
const { validateTask, validateId } = require("../middleware/validation");

// Helper function to check task visibility
const canViewTask = async (task, user) => {
  if (task.visibility === "public") return true;
  if (
    task.visibility === "core" &&
    ["Admin", "Core Team Member"].includes(user.role)
  )
    return true;
  if (task.visibility === "team" && task.targetGroup) {
    const teamIds = task.targetGroup.split(",").map((id) => parseInt(id));
    if (teamIds.includes(user.teamId)) return true;
  }
  if (task.visibility === "private" && task.targetGroup) {
    const userIds = task.targetGroup.split(",").map((id) => parseInt(id));
    if (userIds.includes(user.id)) return true;
  }
  if (task.assignedTo === user.id || task.createdBy === user.id) return true;
  if (["Admin", "Core Team Member"].includes(user.role)) return true;

  return false;
};

// Helper function to log audit
const logAudit = async (
  entityType,
  entityId,
  action,
  performedBy,
  details,
  ipAddress
) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      performedBy,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// Helper function to create notification
const createNotification = async (
  userId,
  type,
  title,
  content,
  taskId = null,
  teamId = null
) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      content,
      relatedTaskId: taskId,
      relatedTeamId: teamId,
      priority: type === "deadline_reminder" ? "high" : "medium",
    });
  } catch (error) {
    console.error("Notification creation error:", error);
  }
};

// @route   GET /api/tasks
// @desc    Get all tasks (filtered by visibility)
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo, createdBy, teamId, search } =
      req.query;

    // Build where clause
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = parseInt(assignedTo);
    if (createdBy) where.createdBy = parseInt(createdBy);

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          association: "assignee",
          attributes: ["id", "name", "email", "profilePicture"],
        },
        {
          association: "creator",
          attributes: ["id", "name", "email", "profilePicture"],
        },
        {
          association: "dependency",
          attributes: ["id", "title", "status"],
        },
        {
          association: "attachments",
          attributes: ["id", "fileName", "fileUrl", "fileSize"],
        },
      ],
      order: [["deadline", "ASC"]],
    });

    // Filter by visibility
    const visibleTasks = [];
    for (const task of tasks) {
      if (await canViewTask(task, req.user)) {
        visibleTasks.push(task);
      }
    }

    res.json({ tasks: visibleTasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get("/:id", authenticate, validateId, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          association: "assignee",
          attributes: ["id", "name", "email", "profilePicture", "position"],
        },
        {
          association: "creator",
          attributes: ["id", "name", "email", "profilePicture"],
        },
        {
          association: "dependency",
          attributes: ["id", "title", "status", "deadline"],
        },
        {
          association: "dependentTasks",
          attributes: ["id", "title", "status"],
        },
        {
          association: "attachments",
          include: [
            {
              association: "uploader",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          association: "comments",
          include: [
            {
              association: "author",
              attributes: ["id", "name", "profilePicture"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check visibility
    if (!(await canViewTask(task, req.user))) {
      return res.status(403).json({ error: "Access denied to this task" });
    }

    res.json({ task });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Admin/Core/Team Head
router.post("/", authenticate, validateTask, async (req, res) => {
  try {
    // Check permissions
    if (!["Admin", "Core Team Member", "Team Head"].includes(req.user.role)) {
      return res
        .status(403)
        .json({
          error:
            "Only Admin, Core Team Members, and Team Heads can create tasks",
        });
    }

    const {
      title,
      description,
      deadline,
      priority,
      assignedTo,
      visibility,
      targetGroup,
      dependsOn,
      tags,
      isRecurring,
      recurrencePattern,
    } = req.body;

    // Validate dependency
    if (dependsOn) {
      const dependencyTask = await Task.findByPk(dependsOn);
      if (!dependencyTask) {
        return res.status(400).json({ error: "Dependency task not found" });
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      deadline,
      priority: priority || "Medium",
      assignedTo,
      createdBy: req.user.id,
      visibility: visibility || "public",
      targetGroup,
      dependsOn,
      tags,
      isRecurring: isRecurring || false,
      recurrencePattern,
      status: "Pending",
    });

    // Create notification for assigned user
    if (assignedTo) {
      await createNotification(
        assignedTo,
        "task_assigned",
        "New Task Assigned",
        `You have been assigned a new task: "${title}"`,
        task.id
      );
    }

    // Log audit
    await logAudit(
      "task",
      task.id,
      "create",
      req.user.id,
      {
        title,
        assignedTo,
        deadline,
      },
      req.ip
    );

    // Fetch complete task data
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { association: "assignee", attributes: ["id", "name", "email"] },
        { association: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    res.status(201).json({
      message: "Task created successfully",
      task: createdTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Creator/Assignee/Admin/Core
router.put("/:id", authenticate, validateId, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check permissions
    const canEdit =
      task.createdBy === req.user.id ||
      task.assignedTo === req.user.id ||
      ["Admin", "Core Team Member"].includes(req.user.role);

    if (!canEdit) {
      return res.status(403).json({ error: "Access denied" });
    }

    const {
      title,
      description,
      deadline,
      priority,
      assignedTo,
      visibility,
      targetGroup,
      dependsOn,
      status,
      tags,
    } = req.body;

    const oldValues = { ...task.dataValues };

    // Update task
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      deadline: deadline || task.deadline,
      priority: priority || task.priority,
      assignedTo: assignedTo !== undefined ? assignedTo : task.assignedTo,
      visibility: visibility || task.visibility,
      targetGroup: targetGroup !== undefined ? targetGroup : task.targetGroup,
      dependsOn: dependsOn !== undefined ? dependsOn : task.dependsOn,
      status: status || task.status,
      tags: tags !== undefined ? tags : task.tags,
      completedAt: status === "Completed" ? new Date() : task.completedAt,
    });

    // Create notification if assignee changed
    if (assignedTo && assignedTo !== oldValues.assignedTo) {
      await createNotification(
        assignedTo,
        "task_assigned",
        "Task Reassigned",
        `You have been assigned task: "${task.title}"`,
        task.id
      );
    }

    // Notify creator if task completed
    if (status === "Completed" && oldValues.status !== "Completed") {
      await createNotification(
        task.createdBy,
        "task_completed",
        "Task Completed",
        `Task "${task.title}" has been marked as completed`,
        task.id
      );
    }

    // Log audit
    await logAudit(
      "task",
      task.id,
      "update",
      req.user.id,
      {
        changes: req.body,
        oldValues,
      },
      req.ip
    );

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Creator/Admin/Core
router.delete("/:id", authenticate, validateId, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check permissions
    const canDelete =
      task.createdBy === req.user.id ||
      ["Admin", "Core Team Member"].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if other tasks depend on this task
    const dependentTasks = await Task.count({
      where: { dependsOn: task.id, status: { [Op.ne]: "Completed" } },
    });

    if (dependentTasks > 0) {
      return res.status(400).json({
        error: "Cannot delete task. Other tasks depend on this task.",
      });
    }

    await task.destroy();

    // Log audit
    await logAudit(
      "task",
      task.id,
      "delete",
      req.user.id,
      {
        title: task.title,
      },
      req.ip
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/tasks/:id/complete
// @desc    Mark task as complete
// @access  Assignee/Creator/Admin/Core
router.post("/:id/complete", authenticate, validateId, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check permissions
    const canComplete =
      task.assignedTo === req.user.id ||
      task.createdBy === req.user.id ||
      ["Admin", "Core Team Member"].includes(req.user.role);

    if (!canComplete) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check dependency
    if (task.dependsOn) {
      const dependency = await Task.findByPk(task.dependsOn);
      if (dependency && dependency.status !== "Completed") {
        return res.status(400).json({
          error: "Cannot complete task. Dependency task is not completed yet.",
        });
      }
    }

    await task.update({
      status: "Completed",
      completedAt: new Date(),
    });

    // Notify creator
    if (task.createdBy !== req.user.id) {
      await createNotification(
        task.createdBy,
        "task_completed",
        "Task Completed",
        `Task "${task.title}" has been completed by ${req.user.name}`,
        task.id
      );
    }

    // Log audit
    await logAudit(
      "task",
      task.id,
      "complete",
      req.user.id,
      {
        title: task.title,
      },
      req.ip
    );

    res.json({
      message: "Task marked as completed",
      task,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/tasks/my/assigned
// @desc    Get tasks assigned to current user
// @access  Private
router.get("/my/assigned", authenticate, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.user.id },
      include: [
        { association: "creator", attributes: ["id", "name", "email"] },
        { association: "dependency", attributes: ["id", "title", "status"] },
      ],
      order: [["deadline", "ASC"]],
    });

    res.json({ tasks });
  } catch (error) {
    console.error("Get assigned tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/tasks/my/created
// @desc    Get tasks created by current user
// @access  Private
router.get("/my/created", authenticate, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { createdBy: req.user.id },
      include: [
        { association: "assignee", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ tasks });
  } catch (error) {
    console.error("Get created tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
