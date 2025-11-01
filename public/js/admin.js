// Admin Panel

async function loadAdmin(container) {
  if (!isAdmin(currentUser)) {
    container.innerHTML =
      '<p style="color: var(--danger-color); text-align: center;">Access Denied. Admin only.</p>';
    return;
  }

  try {
    const [usersResponse, teamsResponse] = await Promise.all([
      api.getUsers(),
      api.getTeams(),
    ]);

    const users = usersResponse.users;
    const teams = teamsResponse.teams;
    const coreTeamMembers = users.filter((u) => u.role === "Core Team Member");

    container.innerHTML = `
      <div class="card">
        <div class="card-header">Core Team Management</div>
        
        <div style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="showAddCoreTeamMemberModal()">
            <span>➕</span> Add Core Team Member
          </button>
          <button class="btn btn-danger" onclick="clearAllMembers()" style="margin-left: auto;">
            <span>🗑️</span> Clear Members
          </button>
        </div>

        <div style="max-height: 400px; overflow-y: auto;">
          ${
            coreTeamMembers.length === 0
              ? '<p style="color: var(--gray-600); text-align: center;">No core team members</p>'
              : coreTeamMembers
                  .map(
                    (member) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--gray-100); border-radius: var(--radius-md); margin-bottom: 0.75rem; border-left: 4px solid var(--accent-teal);">
                <div style="flex: 1;">
                  <div style="font-weight: 700; font-size: 16px; color: var(--dark-color);">${escapeHtml(
                    member.name
                  )}</div>
                  <div style="font-size: 13px; color: var(--gray-600); margin-top: 0.25rem;">
                    ${escapeHtml(member.email)} • ${escapeHtml(member.username)}
                  </div>
                  <div style="font-size: 12px; color: var(--gray-600); margin-top: 0.25rem;">
                    Position: ${escapeHtml(
                      member.position || "Not specified"
                    )} • Points: ${member.points || 0}
                  </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="removeCoreTeamMember(${
                  member.id
                }, '${escapeHtml(member.name)}')">
                  <span>🗑️</span> Remove
                </button>
              </div>
            `
                  )
                  .join("")
          }
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">All Teams Overview</div>
        
        <div class="team-grid">
          ${teams
            .map(
              (team) => `
            <div class="team-card" style="border-left-color: ${
              team.color || "#2563eb"
            };">
              <h3>${escapeHtml(team.name)}</h3>
              <p>${escapeHtml(team.description || "No description")}</p>
              
              <div style="margin: 0.75rem 0; padding: 0.75rem; background: rgba(37, 99, 235, 0.05); border-radius: var(--radius-sm);">
                <div style="font-size: 13px; font-weight: 600; color: var(--gray-700);">
                  📊 Stats: ${team.memberCount || 0} members
                </div>
                <div style="font-size: 13px; color: var(--gray-600); margin-top: 0.25rem;">
                  Type: ${team.isCoreTeam ? "Core Team" : "Regular Team"}
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn btn-sm btn-primary" onclick="viewTeamDetail(${
                  team.id
                })">
                  <span>👁️</span> View
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeamConfirm(${
                  team.id
                })">
                  <span>🗑️</span> Delete
                </button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="card" style="margin-top: 2rem;">
        <div class="card-header">All Users Management</div>
        
        <div class="filters">
          <input type="text" id="searchUsers" placeholder="Search users..." oninput="filterUsersList()" style="flex: 1; max-width: 400px;">
          <select id="filterUserRole" onchange="filterUsersList()">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Core Team Member">Core Team Member</option>
            <option value="Team Head">Team Head</option>
            <option value="Team Member">Team Member</option>
          </select>
        </div>

        <div id="usersList" style="max-height: 500px; overflow-y: auto;">
          ${users.map((user) => createUserManagementItem(user)).join("")}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Failed to load admin panel:", error);
    showToast("Failed to load admin panel", "error");
    container.innerHTML =
      '<p style="color: var(--danger-color); text-align: center;">Failed to load admin panel</p>';
  }
}

function createUserManagementItem(user) {
  const roleColors = {
    Admin: "var(--danger-color)",
    "Core Team Member": "var(--accent-teal)",
    "Team Head": "var(--accent-gold)",
    "Team Member": "var(--gray-600)",
  };

  return `
    <div class="user-management-item" data-user-name="${escapeHtml(
      user.name.toLowerCase()
    )}" data-user-email="${escapeHtml(
    user.email.toLowerCase()
  )}" data-user-role="${user.role}">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--white); border: 2px solid var(--gray-200); border-radius: var(--radius-md); margin-bottom: 0.75rem; transition: var(--transition);">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <div style="font-weight: 700; font-size: 16px; color: var(--dark-color);">${escapeHtml(
              user.name
            )}</div>
            <span class="badge" style="background: ${
              roleColors[user.role]
            }; font-size: 11px;">${user.role}</span>
          </div>
          <div style="font-size: 13px; color: var(--gray-600);">
            📧 ${escapeHtml(user.email)} • 👤 ${escapeHtml(user.username)}
          </div>
          <div style="font-size: 12px; color: var(--gray-600); margin-top: 0.25rem;">
            ${
              user.position ? `Position: ${escapeHtml(user.position)} • ` : ""
            }Points: ${user.points || 0} • Joined: ${formatDate(user.createdAt)}
          </div>
        </div>
        ${
          user.id !== currentUser.id
            ? `
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-warning" onclick="showChangeUserRoleModal(${
              user.id
            }, '${escapeHtml(user.name)}', '${user.role}')">
              <span>🔄</span> Change Role
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteUserConfirm(${
              user.id
            }, '${escapeHtml(user.name)}')">
              <span>🗑️</span> Delete
            </button>
          </div>
        `
            : '<span style="color: var(--gray-500); font-size: 13px;">(You)</span>'
        }
      </div>
    </div>
  `;
}

function filterUsersList() {
  const searchTerm = document.getElementById("searchUsers").value.toLowerCase();
  const roleFilter = document.getElementById("filterUserRole").value;
  const items = document.querySelectorAll(".user-management-item");

  items.forEach((item) => {
    const name = item.getAttribute("data-user-name");
    const email = item.getAttribute("data-user-email");
    const role = item.getAttribute("data-user-role");

    const matchesSearch =
      name.includes(searchTerm) || email.includes(searchTerm);
    const matchesRole = !roleFilter || role === roleFilter;

    if (matchesSearch && matchesRole) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Add Core Team Member Modal
async function showAddCoreTeamMemberModal() {
  try {
    const usersResponse = await api.getUsers();
    const eligibleUsers = usersResponse.users.filter(
      (u) => u.role !== "Core Team Member" && u.role !== "Admin"
    );

    const content = `
      <form id="addCoreTeamMemberForm">
        <div class="form-group">
          <label for="searchCoreUser">Search User by Name or Email</label>
          <input 
            type="text" 
            id="searchCoreUser" 
            placeholder="Type to search..." 
            oninput="filterCoreUserList()"
            autocomplete="off"
          >
        </div>
        <div class="form-group">
          <label>Select User to Add to Core Team:</label>
          <div id="coreUserList" style="max-height: 350px; overflow-y: auto; border: 2px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.5rem;">
            ${
              eligibleUsers.length === 0
                ? '<p style="color: var(--gray-600); text-align: center; padding: 1rem;">No eligible users found</p>'
                : eligibleUsers
                    .map(
                      (user) => `
                <div class="user-select-item" data-user-id="${
                  user.id
                }" data-user-name="${escapeHtml(
                        user.name.toLowerCase()
                      )}" data-user-email="${escapeHtml(
                        user.email.toLowerCase()
                      )}" onclick="selectCoreUser(${user.id}, '${escapeHtml(
                        user.name
                      )}')">
                  <input type="radio" name="selectedCoreUser" value="${
                    user.id
                  }" id="core_${user.id}">
                  <label for="core_${
                    user.id
                  }" style="margin-left: 0.5rem; cursor: pointer; flex: 1;">
                    <strong>${escapeHtml(user.name)}</strong><br>
                    <small style="color: var(--gray-600);">${escapeHtml(
                      user.email
                    )} • Current: ${user.role}</small>
                  </label>
                </div>
              `
                    )
                    .join("")
            }
          </div>
        </div>
        <input type="hidden" id="selectedCoreUserId">
        <input type="hidden" id="selectedCoreUserName">
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddCoreTeamMember()">Add to Core Team</button>
    `;

    createModal("Add Core Team Member", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

function filterCoreUserList() {
  const searchTerm = document
    .getElementById("searchCoreUser")
    .value.toLowerCase();
  const items = document.querySelectorAll("#coreUserList .user-select-item");

  items.forEach((item) => {
    const name = item.getAttribute("data-user-name");
    const email = item.getAttribute("data-user-email");

    if (name.includes(searchTerm) || email.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

function selectCoreUser(userId, userName) {
  document.getElementById("selectedCoreUserId").value = userId;
  document.getElementById("selectedCoreUserName").value = userName;
  document.getElementById(`core_${userId}`).checked = true;
}

async function submitAddCoreTeamMember() {
  const userId = document.getElementById("selectedCoreUserId").value;
  const userName = document.getElementById("selectedCoreUserName").value;

  if (!userId) {
    showToast("Please select a user", "warning");
    return;
  }

  try {
    await api.updateUser(userId, { role: "Core Team Member" });

    // Create notification for the user
    await api.createNotification({
      userId: parseInt(userId),
      title: "🎉 Promoted to Core Team",
      message: `Congratulations! You have been added to the Core Team by ${currentUser.name}.`,
      type: "role_change",
    });

    showToast(`${userName} added to Core Team successfully`, "success");
    closeModal();
    loadPage("admin");
  } catch (error) {
    console.error("Failed to add core team member:", error);
    showToast(error.message || "Failed to add core team member", "error");
  }
}

async function removeCoreTeamMember(userId, userName) {
  confirmDialog(
    `Are you sure you want to remove ${userName} from the Core Team?`,
    async () => {
      try {
        await api.updateUser(userId, { role: "Team Member" });

        // Create notification
        await api.createNotification({
          userId: userId,
          title: "Role Changed",
          message: `You have been removed from the Core Team by ${currentUser.name}.`,
          type: "role_change",
        });

        showToast(`${userName} removed from Core Team`, "success");
        loadPage("admin");
      } catch (error) {
        console.error("Failed to remove core team member:", error);
        showToast(
          error.message || "Failed to remove core team member",
          "error"
        );
      }
    }
  );
}

// Change User Role Modal
function showChangeUserRoleModal(userId, userName, currentRole) {
  const content = `
    <form id="changeRoleForm">
      <p style="margin-bottom: 1.5rem; color: var(--gray-700);">
        Change role for <strong>${escapeHtml(userName)}</strong>
      </p>
      <div class="form-group">
        <label for="newUserRole">New Role *</label>
        <select id="newUserRole" required>
          <option value="Admin" ${
            currentRole === "Admin" ? "selected" : ""
          }>Admin</option>
          <option value="Core Team Member" ${
            currentRole === "Core Team Member" ? "selected" : ""
          }>Core Team Member</option>
          <option value="Team Head" ${
            currentRole === "Team Head" ? "selected" : ""
          }>Team Head</option>
          <option value="Team Member" ${
            currentRole === "Team Member" ? "selected" : ""
          }>Team Member</option>
        </select>
      </div>
      <input type="hidden" id="changeRoleUserId" value="${userId}">
      <input type="hidden" id="changeRoleUserName" value="${escapeHtml(
        userName
      )}">
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitChangeUserRole()">Change Role</button>
  `;

  createModal("Change User Role", content, footer);
}

async function submitChangeUserRole() {
  const form = document.getElementById("changeRoleForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const userId = parseInt(document.getElementById("changeRoleUserId").value);
  const userName = document.getElementById("changeRoleUserName").value;
  const newRole = document.getElementById("newUserRole").value;

  try {
    await api.updateUser(userId, { role: newRole });

    // Create notification
    await api.createNotification({
      userId: userId,
      title: "Role Updated",
      message: `Your role has been changed to "${newRole}" by ${currentUser.name}.`,
      type: "role_change",
    });

    showToast(`${userName}'s role changed to ${newRole}`, "success");
    closeModal();
    loadPage("admin");
  } catch (error) {
    console.error("Failed to change user role:", error);
    showToast(error.message || "Failed to change user role", "error");
  }
}

// Delete User
function deleteUserConfirm(userId, userName) {
  confirmDialog(
    `Are you sure you want to delete user "${userName}"? This action cannot be undone.`,
    async () => {
      try {
        await api.deleteUser(userId);
        showToast(`User ${userName} deleted successfully`, "success");
        loadPage("admin");
      } catch (error) {
        console.error("Failed to delete user:", error);
        showToast(error.message || "Failed to delete user", "error");
      }
    }
  );
}

// Clear All Members
function clearAllMembers() {
  confirmDialog(
    "⚠️ WARNING: This will delete ALL users except the Admin user from the database!\n\nThis action will:\n• Remove all non-admin users\n• Delete all their team associations\n• Remove all their tasks, comments, and notifications\n\nThis cannot be undone. Are you absolutely sure?",
    async () => {
      try {
        const response = await fetch("/api/users/admin/clear-members", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              sessionStorage.getItem("token") || localStorage.getItem("token")
            }`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to clear members");
        }

        showToast(
          `✅ Successfully removed ${data.deletedCount} user(s) from the database`,
          "success"
        );
        loadPage("admin");
      } catch (error) {
        console.error("Failed to clear members:", error);
        showToast(error.message || "Failed to clear members", "error");
      }
    }
  );
}
