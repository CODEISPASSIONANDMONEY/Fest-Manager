const { sequelize } = require("./config/database");
const {
  User,
  TeamHead,
  TeamMember,
  Task,
  Comment,
  Notification,
} = require("./models");

async function removeNonAdminUsers() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("✓ Database connected");

    // Find admin user(s)
    const adminUsers = await User.findAll({
      where: { role: "Admin" },
      attributes: ["id", "name", "email", "role"],
    });

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin users found! Cannot proceed.");
      process.exit(1);
    }

    console.log("\n📋 Admin users that will be kept:");
    adminUsers.forEach((admin) => {
      console.log(`   - ${admin.name} (${admin.email}) - ID: ${admin.id}`);
    });

    const adminIds = adminUsers.map((admin) => admin.id);

    // Get count of non-admin users
    const nonAdminCount = await User.count({
      where: {
        id: {
          [require("sequelize").Op.notIn]: adminIds,
        },
      },
    });

    console.log(`\n📊 Found ${nonAdminCount} non-admin users to remove`);

    if (nonAdminCount === 0) {
      console.log("✓ No non-admin users to remove");
      process.exit(0);
    }

    // Get non-admin user IDs
    const nonAdminUsers = await User.findAll({
      where: {
        id: {
          [require("sequelize").Op.notIn]: adminIds,
        },
      },
      attributes: ["id", "name", "email"],
    });

    console.log("\n🗑️ Users to be removed:");
    nonAdminUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    const nonAdminUserIds = nonAdminUsers.map((user) => user.id);

    console.log("\n🔄 Starting cleanup process...");

    // Delete related records first (to maintain referential integrity)

    // 1. Delete TeamHead associations
    const deletedTeamHeads = await TeamHead.destroy({
      where: { userId: nonAdminUserIds },
    });
    console.log(`   ✓ Removed ${deletedTeamHeads} team head assignments`);

    // 2. Delete TeamMember associations
    const deletedTeamMembers = await TeamMember.destroy({
      where: { userId: nonAdminUserIds },
    });
    console.log(`   ✓ Removed ${deletedTeamMembers} team member assignments`);

    // 3. Update tasks - remove assignedTo and createdBy references
    const updatedAssignedTasks = await Task.update(
      { assignedTo: null },
      {
        where: { assignedTo: nonAdminUserIds },
      }
    );
    console.log(
      `   ✓ Updated ${updatedAssignedTasks[0]} tasks (removed assignedTo)`
    );

    const deletedCreatedTasks = await Task.destroy({
      where: { createdBy: nonAdminUserIds },
    });
    console.log(
      `   ✓ Deleted ${deletedCreatedTasks} tasks created by removed users`
    );

    // 4. Delete comments
    const deletedComments = await Comment.destroy({
      where: { userId: nonAdminUserIds },
    });
    console.log(`   ✓ Deleted ${deletedComments} comments`);

    // 5. Delete notifications
    const deletedNotifications = await Notification.destroy({
      where: { userId: nonAdminUserIds },
    });
    console.log(`   ✓ Deleted ${deletedNotifications} notifications`);

    // 6. Delete or update audit logs
    const { AuditLog } = require("./models");
    const deletedAuditLogs = await AuditLog.destroy({
      where: { performedBy: nonAdminUserIds },
    });
    console.log(`   ✓ Deleted ${deletedAuditLogs} audit logs`);

    // 7. Finally, delete the users
    const deletedUsers = await User.destroy({
      where: {
        id: {
          [require("sequelize").Op.notIn]: adminIds,
        },
      },
    });

    console.log(`\n✅ Successfully removed ${deletedUsers} non-admin users`);
    console.log("\n📊 Remaining users:");

    const remainingUsers = await User.findAll({
      attributes: ["id", "name", "email", "role"],
    });

    remainingUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log("\n✓ Cleanup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error removing users:", error);
    process.exit(1);
  }
}

// Run the script
removeNonAdminUsers();
