const { sequelize } = require("./config/database");
const {
  User,
  Team,
  TeamHead,
  TeamMember,
  Task,
  Comment,
  Notification,
  AuditLog,
  Attachment,
} = require("./models");

async function clearDatabase() {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected\n");

    // Find admin user(s)
    const adminUsers = await User.findAll({
      where: { role: "Admin" },
      attributes: ["id", "name", "email", "role"],
    });

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin users found! Cannot proceed.");
      process.exit(1);
    }

    console.log("👤 Admin users that will be kept:");
    adminUsers.forEach((admin) => {
      console.log(`   - ${admin.name} (${admin.email}) - ID: ${admin.id}`);
    });

    const adminIds = adminUsers.map((admin) => admin.id);

    console.log("\n🗑️ Starting database cleanup...\n");

    // Get counts before deletion
    const counts = {
      attachments: await Attachment.count(),
      comments: await Comment.count(),
      notifications: await Notification.count(),
      tasks: await Task.count(),
      teamMembers: await TeamMember.count(),
      teamHeads: await TeamHead.count(),
      teams: await Team.count(),
      auditLogs: await AuditLog.count(),
      users: await User.count({
        where: {
          id: {
            [require("sequelize").Op.notIn]: adminIds,
          },
        },
      }),
    };

    console.log("📊 Current database state:");
    console.log(`   - Attachments: ${counts.attachments}`);
    console.log(`   - Comments: ${counts.comments}`);
    console.log(`   - Notifications: ${counts.notifications}`);
    console.log(`   - Tasks: ${counts.tasks}`);
    console.log(`   - Team Members: ${counts.teamMembers}`);
    console.log(`   - Team Heads: ${counts.teamHeads}`);
    console.log(`   - Teams: ${counts.teams}`);
    console.log(`   - Audit Logs: ${counts.auditLogs}`);
    console.log(`   - Non-Admin Users: ${counts.users}`);

    console.log("\n🔄 Deleting data...\n");

    // Delete in order of dependencies (child tables first)

    // 1. Delete Attachments
    const deletedAttachments = await Attachment.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedAttachments} attachments`);

    // 2. Delete Comments
    const deletedComments = await Comment.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedComments} comments`);

    // 3. Delete Notifications
    const deletedNotifications = await Notification.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedNotifications} notifications`);

    // 4. Delete Tasks
    const deletedTasks = await Task.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedTasks} tasks`);

    // 5. Delete Team Members
    const deletedTeamMembers = await TeamMember.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedTeamMembers} team member associations`);

    // 6. Delete Team Heads
    const deletedTeamHeads = await TeamHead.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedTeamHeads} team head associations`);

    // 7. Delete Teams
    const deletedTeams = await Team.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedTeams} teams`);

    // 8. Delete Audit Logs
    const deletedAuditLogs = await AuditLog.destroy({ where: {} });
    console.log(`   ✓ Deleted ${deletedAuditLogs} audit logs`);

    // 9. Delete non-admin users
    const deletedUsers = await User.destroy({
      where: {
        id: {
          [require("sequelize").Op.notIn]: adminIds,
        },
      },
    });
    console.log(`   ✓ Deleted ${deletedUsers} non-admin users`);

    // 10. Reset admin user's teamId to null
    await User.update(
      { teamId: null },
      {
        where: { id: adminIds },
      }
    );
    console.log(`   ✓ Reset admin user team associations`);

    console.log("\n✅ Database cleanup completed successfully!\n");

    // Verify final state
    console.log("📊 Final database state:");
    console.log(`   - Attachments: ${await Attachment.count()}`);
    console.log(`   - Comments: ${await Comment.count()}`);
    console.log(`   - Notifications: ${await Notification.count()}`);
    console.log(`   - Tasks: ${await Task.count()}`);
    console.log(`   - Team Members: ${await TeamMember.count()}`);
    console.log(`   - Team Heads: ${await TeamHead.count()}`);
    console.log(`   - Teams: ${await Team.count()}`);
    console.log(`   - Audit Logs: ${await AuditLog.count()}`);
    console.log(`   - Total Users: ${await User.count()}`);

    console.log("\n👤 Remaining users:");
    const remainingUsers = await User.findAll({
      attributes: ["id", "name", "email", "role"],
    });

    remainingUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log("\n✓ Database is now clean and ready for use!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error clearing database:", error);
    process.exit(1);
  }
}

// Run the script
clearDatabase();
