const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const TeamHead = sequelize.define(
  "TeamHead",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "teams",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "team_heads",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["teamId", "userId"],
      },
    ],
  }
);

module.exports = TeamHead;
