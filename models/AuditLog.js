const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    entityType: {
      type: DataTypes.ENUM(
        "user",
        "team",
        "task",
        "comment",
        "team_member",
        "team_head"
      ),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM(
        "create",
        "update",
        "delete",
        "assign",
        "complete",
        "cancel"
      ),
      allowNull: false,
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "JSON object containing change details",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = AuditLog;
