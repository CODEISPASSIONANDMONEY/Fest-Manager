const { sequelize } = require("../config/database");
const User = require("./User");
const Team = require("./Team");
const TeamHead = require("./TeamHead");
const TeamMember = require("./TeamMember");
const Task = require("./Task");
const Comment = require("./Comment");
const Notification = require("./Notification");
const AuditLog = require("./AuditLog");
const Attachment = require("./Attachment");

// Define associations

// User <-> Team (User belongs to a Team)
User.belongsTo(Team, { foreignKey: "teamId", as: "team" });
Team.hasMany(User, { foreignKey: "teamId", as: "members" });

// Team <-> User (Team creator)
Team.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// TeamHead associations (Many-to-Many: Team <-> User through TeamHead)
Team.belongsToMany(User, {
  through: TeamHead,
  foreignKey: "teamId",
  as: "heads",
});
User.belongsToMany(Team, {
  through: TeamHead,
  foreignKey: "userId",
  as: "headOfTeams",
});

TeamHead.belongsTo(Team, { foreignKey: "teamId", as: "team" });
TeamHead.belongsTo(User, { foreignKey: "userId", as: "user" });

// TeamMember associations (Many-to-Many: Team <-> User through TeamMember)
Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: "teamId",
  as: "teamMembers",
});
User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: "userId",
  as: "memberOfTeams",
});

TeamMember.belongsTo(Team, { foreignKey: "teamId", as: "team" });
TeamMember.belongsTo(User, { foreignKey: "userId", as: "user" });

// Task associations
Task.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });
Task.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Task.belongsTo(Task, { foreignKey: "dependsOn", as: "dependency" });
Task.hasMany(Task, { foreignKey: "dependsOn", as: "dependentTasks" });

User.hasMany(Task, { foreignKey: "assignedTo", as: "assignedTasks" });
User.hasMany(Task, { foreignKey: "createdBy", as: "createdTasks" });

// Comment associations
Comment.belongsTo(Task, { foreignKey: "taskId", as: "task" });
Comment.belongsTo(User, { foreignKey: "userId", as: "author" });
Comment.belongsTo(Comment, { foreignKey: "parentId", as: "parent" });
Comment.hasMany(Comment, { foreignKey: "parentId", as: "replies" });

Task.hasMany(Comment, { foreignKey: "taskId", as: "comments" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });

// Notification associations
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
Notification.belongsTo(Task, {
  foreignKey: "relatedTaskId",
  as: "relatedTask",
});
Notification.belongsTo(Team, {
  foreignKey: "relatedTeamId",
  as: "relatedTeam",
});

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Task.hasMany(Notification, {
  foreignKey: "relatedTaskId",
  as: "notifications",
});
Team.hasMany(Notification, {
  foreignKey: "relatedTeamId",
  as: "notifications",
});

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: "performedBy", as: "performer" });
User.hasMany(AuditLog, { foreignKey: "performedBy", as: "auditLogs" });

// Attachment associations
Attachment.belongsTo(Task, { foreignKey: "taskId", as: "task" });
Attachment.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

Task.hasMany(Attachment, { foreignKey: "taskId", as: "attachments" });
User.hasMany(Attachment, {
  foreignKey: "uploadedBy",
  as: "uploadedAttachments",
});

module.exports = {
  sequelize,
  User,
  Team,
  TeamHead,
  TeamMember,
  Task,
  Comment,
  Notification,
  AuditLog,
  Attachment,
};
