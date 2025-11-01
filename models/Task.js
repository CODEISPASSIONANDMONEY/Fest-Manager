const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
      defaultValue: "Medium",
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "User ID of the task doer",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      comment: "User ID of the task creator",
    },
    visibility: {
      type: DataTypes.ENUM("private", "public", "team", "core"),
      defaultValue: "public",
      comment:
        "private: visible only to chosen users, public: all, team: specific teams, core: core members",
    },
    targetGroup: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Comma-separated team IDs or user IDs for private tasks",
    },
    dependsOn: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tasks",
        key: "id",
      },
      comment: "Task ID this task depends on",
    },
    status: {
      type: DataTypes.ENUM(
        "Pending",
        "In Progress",
        "Completed",
        "Overdue",
        "Cancelled"
      ),
      defaultValue: "Pending",
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurrencePattern: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g., daily, weekly, monthly",
    },
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Comma-separated tags",
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
  }
);

module.exports = Task;
