const { Sequelize } = require("sequelize");
require("dotenv").config();

// Create Sequelize instance with MySQL configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || "fest_manager",
  process.env.DB_USER || "festmanager",
  process.env.DB_PASSWORD || "festmanager123",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL database connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to MySQL database:", error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
