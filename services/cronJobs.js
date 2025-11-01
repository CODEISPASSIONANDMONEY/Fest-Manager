const cron = require("node-cron");
const { Op } = require("sequelize");
const { Task, User, Notification } = require("../models");

// Helper function to create notification
const createNotification = async (
  userId,
  type,
  title,
  content,
  taskId = null
) => {
  try {
    await Notification.create({
      userId,
      type,
      title,
      content,
      relatedTaskId: taskId,
      priority: "high",
    });
  } catch (error) {
    console.error("Notification creation error:", error);
  }
};

// Check for upcoming deadlines and send reminders
const checkDeadlines = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Get tasks with deadlines in next 24 hours
    const urgentTasks = await Task.findAll({
      where: {
        status: { [Op.ne]: "Completed" },
        deadline: {
          [Op.between]: [now, tomorrow],
        },
      },
      include: [
        {
          association: "assignee",
          attributes: ["id", "deadlineReminders"],
        },
      ],
    });

    // Send notifications for urgent tasks
    for (const task of urgentTasks) {
      if (task.assignee && task.assignee.deadlineReminders) {
        await createNotification(
          task.assignedTo,
          "deadline_reminder",
          "Urgent: Deadline Tomorrow",
          `Task "${task.title}" is due tomorrow!`,
          task.id
        );
      }
    }

    // Get tasks with deadlines in next 3 days
    const upcomingTasks = await Task.findAll({
      where: {
        status: { [Op.ne]: "Completed" },
        deadline: {
          [Op.between]: [tomorrow, in3Days],
        },
      },
      include: [
        {
          association: "assignee",
          attributes: ["id", "deadlineReminders"],
        },
      ],
    });

    // Send notifications for upcoming tasks
    for (const task of upcomingTasks) {
      if (task.assignee && task.assignee.deadlineReminders) {
        const daysLeft = Math.ceil(
          (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24)
        );
        await createNotification(
          task.assignedTo,
          "deadline_reminder",
          "Upcoming Deadline",
          `Task "${task.title}" is due in ${daysLeft} days`,
          task.id
        );
      }
    }

    console.log(
      `✅ Deadline check completed: ${urgentTasks.length} urgent, ${upcomingTasks.length} upcoming`
    );
  } catch (error) {
    console.error("Deadline check error:", error);
  }
};

// Mark overdue tasks
const markOverdueTasks = async () => {
  try {
    const now = new Date();

    const result = await Task.update(
      { status: "Overdue" },
      {
        where: {
          status: { [Op.in]: ["Pending", "In Progress"] },
          deadline: { [Op.lt]: now },
        },
      }
    );

    if (result[0] > 0) {
      console.log(`✅ Marked ${result[0]} task(s) as overdue`);
    }
  } catch (error) {
    console.error("Mark overdue tasks error:", error);
  }
};

// Start all cron jobs
const startCronJobs = () => {
  console.log("📅 Starting cron jobs...");

  // Check deadlines every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running deadline check...");
    await checkDeadlines();
  });

  // Mark overdue tasks every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ Running overdue check...");
    await markOverdueTasks();
  });

  console.log("✅ Cron jobs started successfully");
};

module.exports = { startCronJobs, checkDeadlines, markOverdueTasks };
