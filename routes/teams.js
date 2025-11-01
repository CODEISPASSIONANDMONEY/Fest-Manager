const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Team, User, TeamHead, TeamMember, AuditLog } = require("../models");
const { authenticate, isAdminOrCore } = require("../middleware/auth");
const { validateTeam, validateId } = require("../middleware/validation");

// Helper function to log audit
const logAudit = async (
  entityType,
  entityId,
  action,
  performedBy,
  details,
  ipAddress
) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      performedBy,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};

// @route   GET /api/teams
// @desc    Get all teams
// @access  Private
router.get("/", authenticate, async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      include: [
        {
          association: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          association: "heads",
          attributes: ["id", "name", "email", "position"],
          through: { attributes: [] },
        },
        {
          association: "teamMembers",
          attributes: ["id", "name", "email", "position"],
          through: { attributes: [] },
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get("/:id", authenticate, validateId, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        {
          association: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          association: "heads",
          attributes: ["id", "name", "email", "position", "profilePicture"],
          through: { attributes: ["assignedAt"] },
        },
        {
          association: "teamMembers",
          attributes: ["id", "name", "email", "position", "profilePicture"],
          through: { attributes: ["joinedAt"] },
        },
      ],
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/teams
// @desc    Create a new team
// @access  Admin/Core Team Member
router.post(
  "/",
  authenticate,
  isAdminOrCore,
  validateTeam,
  async (req, res) => {
    try {
      const {
        name,
        description,
        memberCount,
        color,
        isCoreTeam,
        headIds,
        memberIds,
      } = req.body;

      // Check if team name already exists
      const existingTeam = await Team.findOne({ where: { name } });
      if (existingTeam) {
        return res
          .status(400)
          .json({ error: "Team with this name already exists" });
      }

      // Create team
      const team = await Team.create({
        name,
        description,
        memberCount: memberCount || 0,
        color: color || "#007bff",
        isCoreTeam: isCoreTeam || false,
        createdBy: req.user.id,
      });

      // Add team heads if provided
      if (headIds && Array.isArray(headIds) && headIds.length > 0) {
        const headPromises = headIds.map((userId) =>
          TeamHead.create({ teamId: team.id, userId })
        );
        await Promise.all(headPromises);

        // Update user roles to Team Head
        await User.update(
          { role: "Team Head", teamId: team.id },
          { where: { id: headIds } }
        );
      }

      // Add team members if provided
      if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
        const memberPromises = memberIds.map((userId) =>
          TeamMember.create({ teamId: team.id, userId })
        );
        await Promise.all(memberPromises);

        // Update user teamId
        await User.update({ teamId: team.id }, { where: { id: memberIds } });
      }

      // Update member count based on actual team members
      const actualMemberCount = await TeamMember.count({
        where: { teamId: team.id },
      });
      await team.update({ memberCount: actualMemberCount });

      // Log audit
      await logAudit(
        "team",
        team.id,
        "create",
        req.user.id,
        {
          name,
          headIds,
          memberIds,
        },
        req.ip
      );

      // Fetch complete team data
      const createdTeam = await Team.findByPk(team.id, {
        include: [
          { association: "heads", attributes: ["id", "name", "email"] },
          { association: "teamMembers", attributes: ["id", "name", "email"] },
        ],
      });

      res.status(201).json({
        message: "Team created successfully",
        team: createdTeam,
      });
    } catch (error) {
      console.error("Create team error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Admin/Core Team Member
router.put(
  "/:id",
  authenticate,
  isAdminOrCore,
  validateId,
  async (req, res) => {
    try {
      const { name, description, memberCount, color, isActive } = req.body;

      const team = await Team.findByPk(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Update team
      await team.update({
        name: name || team.name,
        description: description !== undefined ? description : team.description,
        memberCount: memberCount !== undefined ? memberCount : team.memberCount,
        color: color || team.color,
        isActive: isActive !== undefined ? isActive : team.isActive,
      });

      // Log audit
      await logAudit(
        "team",
        team.id,
        "update",
        req.user.id,
        {
          changes: req.body,
        },
        req.ip
      );

      res.json({
        message: "Team updated successfully",
        team,
      });
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/teams/:id
// @desc    Delete (deactivate) team
// @access  Admin/Core Team Member
router.delete(
  "/:id",
  authenticate,
  isAdminOrCore,
  validateId,
  async (req, res) => {
    try {
      const team = await Team.findByPk(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Soft delete - deactivate team
      await team.update({ isActive: false });

      // Log audit
      await logAudit(
        "team",
        team.id,
        "delete",
        req.user.id,
        {
          name: team.name,
        },
        req.ip
      );

      res.json({ message: "Team deactivated successfully" });
    } catch (error) {
      console.error("Delete team error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/teams/:id/heads
// @desc    Add team head(s)
// @access  Admin/Core Team Member
router.post(
  "/:id/heads",
  authenticate,
  isAdminOrCore,
  validateId,
  async (req, res) => {
    try {
      const { userIds, usernames, emails } = req.body;

      // Build array of user IDs from various inputs
      let resolvedUserIds = [];

      // Add direct user IDs
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        resolvedUserIds = [...userIds];
      }

      // Resolve usernames to user IDs
      if (usernames && Array.isArray(usernames) && usernames.length > 0) {
        const usersByUsername = await User.findAll({
          where: { username: usernames },
          attributes: ["id"],
        });
        resolvedUserIds.push(...usersByUsername.map((u) => u.id));
      }

      // Resolve emails to user IDs
      if (emails && Array.isArray(emails) && emails.length > 0) {
        const usersByEmail = await User.findAll({
          where: { email: emails },
          attributes: ["id"],
        });
        resolvedUserIds.push(...usersByEmail.map((u) => u.id));
      }

      // Remove duplicates
      resolvedUserIds = [...new Set(resolvedUserIds)];

      if (resolvedUserIds.length === 0) {
        return res.status(400).json({
          error:
            "No valid users found. Provide userIds, usernames, or emails array",
        });
      }

      const team = await Team.findByPk(req.params.id);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      // Add team heads
      const headPromises = resolvedUserIds.map(async (userId) => {
        // Check if already a head
        const existing = await TeamHead.findOne({
          where: { teamId: team.id, userId },
        });

        if (!existing) {
          await TeamHead.create({ teamId: team.id, userId });
          await User.update(
            { role: "Team Head", teamId: team.id },
            { where: { id: userId } }
          );
        }
      });

      await Promise.all(headPromises);

      // Log audit
      await logAudit(
        "team_head",
        team.id,
        "assign",
        req.user.id,
        {
          teamId: team.id,
          userIds: resolvedUserIds,
        },
        req.ip
      );

      res.json({ message: "Team heads added successfully" });
    } catch (error) {
      console.error("Add team heads error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/teams/:id/heads/:userId
// @desc    Remove team head
// @access  Admin/Core Team Member
router.delete(
  "/:id/heads/:userId",
  authenticate,
  isAdminOrCore,
  validateId,
  async (req, res) => {
    try {
      const { id, userId } = req.params;

      const teamHead = await TeamHead.findOne({
        where: { teamId: id, userId },
      });

      if (!teamHead) {
        return res.status(404).json({ error: "Team head not found" });
      }

      await teamHead.destroy();

      // Update user role back to Team Member
      await User.update({ role: "Team Member" }, { where: { id: userId } });

      // Log audit
      await logAudit(
        "team_head",
        id,
        "delete",
        req.user.id,
        {
          teamId: id,
          userId,
        },
        req.ip
      );

      res.json({ message: "Team head removed successfully" });
    } catch (error) {
      console.error("Remove team head error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/teams/:id/members
// @desc    Add team member(s)
// @access  Admin/Core Team Member/Team Head
router.post("/:id/members", authenticate, validateId, async (req, res) => {
  try {
    const { userIds, usernames, emails } = req.body;
    const teamId = req.params.id;

    // Build array of user IDs from various inputs
    let resolvedUserIds = [];

    // Add direct user IDs
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      resolvedUserIds = [...userIds];
    }

    // Resolve usernames to user IDs
    if (usernames && Array.isArray(usernames) && usernames.length > 0) {
      const usersByUsername = await User.findAll({
        where: { username: usernames },
        attributes: ["id"],
      });
      resolvedUserIds.push(...usersByUsername.map((u) => u.id));
    }

    // Resolve emails to user IDs
    if (emails && Array.isArray(emails) && emails.length > 0) {
      const usersByEmail = await User.findAll({
        where: { email: emails },
        attributes: ["id"],
      });
      resolvedUserIds.push(...usersByEmail.map((u) => u.id));
    }

    // Remove duplicates
    resolvedUserIds = [...new Set(resolvedUserIds)];

    if (resolvedUserIds.length === 0) {
      return res.status(400).json({
        error:
          "No valid users found. Provide userIds, usernames, or emails array",
      });
    }

    // Check permissions
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Check if user has permission (Admin, Core, or Team Head of this team)
    const isHead = await TeamHead.findOne({
      where: { teamId, userId: req.user.id },
    });

    if (!["Admin", "Core Team Member"].includes(req.user.role) && !isHead) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Add team members
    const memberPromises = resolvedUserIds.map(async (userId) => {
      const existing = await TeamMember.findOne({
        where: { teamId, userId },
      });

      if (!existing) {
        await TeamMember.create({ teamId, userId });
        await User.update({ teamId }, { where: { id: userId } });
      }
    });

    await Promise.all(memberPromises);

    // Update member count
    const count = await TeamMember.count({ where: { teamId } });
    await team.update({ memberCount: count });

    // Log audit
    await logAudit(
      "team_member",
      teamId,
      "assign",
      req.user.id,
      {
        teamId,
        userIds: resolvedUserIds,
      },
      req.ip
    );

    res.json({ message: "Team members added successfully" });
  } catch (error) {
    console.error("Add team members error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove team member
// @access  Admin/Core Team Member/Team Head
router.delete(
  "/:id/members/:userId",
  authenticate,
  validateId,
  async (req, res) => {
    try {
      const { id: teamId, userId } = req.params;

      // Check permissions
      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const isHead = await TeamHead.findOne({
        where: { teamId, userId: req.user.id },
      });

      if (!["Admin", "Core Team Member"].includes(req.user.role) && !isHead) {
        return res.status(403).json({ error: "Access denied" });
      }

      const teamMember = await TeamMember.findOne({
        where: { teamId, userId },
      });

      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await teamMember.destroy();
      await User.update({ teamId: null }, { where: { id: userId } });

      // Update member count
      const count = await TeamMember.count({ where: { teamId } });
      await team.update({ memberCount: count });

      // Log audit
      await logAudit(
        "team_member",
        teamId,
        "delete",
        req.user.id,
        {
          teamId,
          userId,
        },
        req.ip
      );

      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Remove team member error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/teams/clear-all
// @desc    Clear all teams and their associations
// @access  Admin/Core Team Member
router.delete("/clear-all", authenticate, isAdminOrCore, async (req, res) => {
  const { sequelize } = require("../models");
  const transaction = await sequelize.transaction();

  try {
    // Get count before deletion
    const teamCount = await Team.count({ transaction });
    const headCount = await TeamHead.count({ transaction });
    const memberCount = await TeamMember.count({ transaction });

    // Delete all team heads
    await TeamHead.destroy({ where: {}, transaction, force: true });

    // Delete all team members
    await TeamMember.destroy({ where: {}, transaction, force: true });

    // Reset all users' teamId to null
    await User.update(
      { teamId: null },
      { where: { teamId: { [Op.ne]: null } }, transaction }
    );

    // Delete all teams
    await Team.destroy({ where: {}, transaction, force: true });

    // Commit transaction
    await transaction.commit();

    // Log audit (after commit)
    await logAudit(
      "team",
      null,
      "clear_all",
      req.user.id,
      {
        teamsDeleted: teamCount,
        headsRemoved: headCount,
        membersRemoved: memberCount,
      },
      req.ip
    );

    res.json({
      message: `Successfully cleared ${teamCount} teams, ${headCount} team heads, and ${memberCount} team members`,
      deleted: {
        teams: teamCount,
        heads: headCount,
        members: memberCount,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Clear all teams error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
