const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { generateToken } = require("../config/jwt");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { name, email, username, password, position, teamId, role } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      authMethod: "local",
      position: position || "",
      teamId: teamId || null,
      role: role || "Team Member", // Use provided role or default to Team Member
    });

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      position: user.position,
      teamId: user.teamId,
    };

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user uses local authentication
    if (user.authMethod !== "local" || !user.password) {
      return res.status(401).json({
        error:
          "This account uses Google authentication. Please login with Google.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last active
    await user.update({ lastActive: new Date() });

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Return user data without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      position: user.position,
      teamId: user.teamId,
      profilePicture: user.profilePicture,
      darkMode: user.darkMode,
      language: user.language,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  "/me",
  require("../middleware/auth").authenticate,
  async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            association: "team",
            attributes: ["id", "name", "color"],
          },
        ],
      });

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
