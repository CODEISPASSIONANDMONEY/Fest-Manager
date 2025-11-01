const { sequelize, User, Team } = require("../models");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log("✅ Database tables synchronized");

    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { role: "Admin" },
    });

    if (!adminExists) {
      console.log("📝 Creating default admin user...");

      const hashedPassword = await bcrypt.hash("admin123", 10);

      await User.create({
        name: "Admin User",
        email: "admin@festmanager.com",
        username: "admin",
        password: hashedPassword,
        authMethod: "local",
        role: "Admin",
        position: "System Administrator",
      });

      console.log("✅ Default admin user created");
      console.log("   Email: admin@festmanager.com");
      console.log("   Username: admin");
      console.log("   Password: admin123");
      console.log("   ⚠️  Please change the password after first login!");
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    // Check if demo team exists
    const demoTeamExists = await Team.findOne({
      where: { name: "Core Team" },
    });

    if (!demoTeamExists) {
      console.log("📝 Creating demo Core Team...");

      await Team.create({
        name: "Core Team",
        description: "Core organizational team",
        isCoreTeam: true,
        color: "#007bff",
        memberCount: 0,
      });

      console.log("✅ Demo Core Team created");
    }

    console.log("\n✅ Database initialization completed successfully!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

initializeDatabase();
