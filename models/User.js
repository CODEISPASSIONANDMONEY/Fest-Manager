const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
    },
    authMethod: {
      type: DataTypes.ENUM("local", "google"),
      defaultValue: "local",
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    profilePicture: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(
        "Admin",
        "Core Team Member",
        "Team Head",
        "Team Member"
      ),
      defaultValue: "Team Member",
      allowNull: false,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Teams",
        key: "id",
      },
    },
    position: {
      type: DataTypes.STRING(100),
      defaultValue: "",
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    deadlineReminders: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    taskUpdates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    darkMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: "en",
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
