// Teams page

async function loadTeams(container) {
  try {
    const response = await api.getTeams();
    const teams = response.teams;

    container.innerHTML = `
            ${
              isAdminOrCore(currentUser)
                ? `
                <div style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem;">
                    <button class="btn btn-primary" onclick="showCreateTeamModal()">+ Create Team</button>
                    <button class="btn btn-danger" onclick="clearAllTeams()">🗑️ Clear Teams</button>
                </div>
            `
                : ""
            }

            <div class="team-grid">
                ${
                  teams.length === 0
                    ? '<p style="color: var(--secondary-color);">No teams found</p>'
                    : teams.map((team) => createTeamCard(team)).join("")
                }
            </div>
        `;
  } catch (error) {
    console.error("Failed to load teams:", error);
    showToast("Failed to load teams", "error");
  }
}

function createTeamCard(team) {
  return `
        <div class="team-card" style="border-left-color: ${team.color};">
            <h3>${escapeHtml(team.name)}</h3>
            <p>${escapeHtml(team.description || "No description")}</p>
            
            <div style="margin-bottom: 0.5rem;">
                <strong>Team Heads:</strong><br>
                ${
                  team.heads && team.heads.length > 0
                    ? team.heads.map((h) => escapeHtml(h.name)).join(", ")
                    : "No heads assigned"
                }
            </div>
            
            <div>
                <strong>Members:</strong> ${team.memberCount || 0}
            </div>

            <div class="team-members">
                ${
                  team.teamMembers &&
                  team.teamMembers
                    .slice(0, 5)
                    .map(
                      (member) => `
                    <div class="member-avatar" title="${escapeHtml(
                      member.name
                    )}">
                        ${
                          member.profilePicture
                            ? `<img src="${
                                member.profilePicture
                              }" alt="${escapeHtml(
                                member.name
                              )}" class="member-avatar">`
                            : `<div class="member-avatar" style="background-color: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;">${getUserInitials(
                                member.name
                              )}</div>`
                        }
                    </div>
                `
                    )
                    .join("")
                }
                ${
                  team.memberCount > 5
                    ? `<span style="font-size: 12px;">+${
                        team.memberCount - 5
                      } more</span>`
                    : ""
                }
            </div>
        </div>
    `;
}

async function viewTeamDetail(teamId) {
  try {
    const response = await api.getTeam(teamId);
    const team = response.team;

    // Get all users for admin/core team member management
    let allUsers = [];
    if (isAdminOrCore(currentUser)) {
      const usersResponse = await api.getUsers();
      allUsers = usersResponse.users;
    }

    const content = `
            <div>
                <h3>${escapeHtml(team.name)}</h3>
                <p style="color: var(--secondary-color);">${escapeHtml(
                  team.description || "No description"
                )}</p>

                <div style="margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong>Team Heads:</strong>
                        ${
                          isAdmin(currentUser)
                            ? `<button class="btn btn-sm btn-primary" onclick="showAddTeamHeadModal(${team.id})">
                                <span>➕</span> Add Head
                               </button>`
                            : ""
                        }
                    </div>
                    <div style="margin-top: 0.5rem;">
                        ${
                          team.heads && team.heads.length > 0
                            ? team.heads
                                .map(
                                  (head) => `
                                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background-color: var(--light-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                    ${getAvatarHTML(head, 36)}
                                    <div style="flex: 1;">
                                        <div><strong>${escapeHtml(
                                          head.name
                                        )}</strong></div>
                                        <div style="font-size: 12px; color: var(--secondary-color);">${escapeHtml(
                                          head.email
                                        )}</div>
                                    </div>
                                    ${
                                      isAdmin(currentUser)
                                        ? `<button class="btn btn-sm btn-danger" onclick="removeTeamHead(${
                                            team.id
                                          }, ${head.id}, '${escapeHtml(
                                            head.name
                                          )}')">
                                            <span>🗑️</span> Remove
                                           </button>`
                                        : ""
                                    }
                                </div>
                            `
                                )
                                .join("")
                            : '<p style="color: var(--secondary-color);">No team heads assigned</p>'
                        }
                    </div>
                </div>

                <div style="margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong>Team Members (${
                          team.memberCount || 0
                        }):</strong>
                        ${
                          isAdmin(currentUser) ||
                          (isTeamHead(currentUser) &&
                            team.heads?.some((h) => h.id === currentUser.id))
                            ? `<button class="btn btn-sm btn-primary" onclick="showAddTeamMemberModal(${team.id})">
                                <span>➕</span> Add Member
                               </button>`
                            : ""
                        }
                    </div>
                    <div style="margin-top: 0.5rem; max-height: 400px; overflow-y: auto;">
                        ${
                          team.teamMembers && team.teamMembers.length > 0
                            ? team.teamMembers
                                .map(
                                  (member) => `
                                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background-color: var(--light-color); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                                    ${getAvatarHTML(member, 36)}
                                    <div style="flex: 1;">
                                        <div><strong>${escapeHtml(
                                          member.name
                                        )}</strong></div>
                                        <div style="font-size: 12px; color: var(--secondary-color);">${escapeHtml(
                                          member.position || "No position"
                                        )} • ${escapeHtml(member.email)}</div>
                                    </div>
                                    ${
                                      isAdmin(currentUser) ||
                                      (isTeamHead(currentUser) &&
                                        team.heads?.some(
                                          (h) => h.id === currentUser.id
                                        ))
                                        ? `<button class="btn btn-sm btn-danger" onclick="removeTeamMember(${
                                            team.id
                                          }, ${member.id}, '${escapeHtml(
                                            member.name
                                          )}')">
                                            <span>🗑️</span> Remove
                                           </button>`
                                        : ""
                                    }
                                </div>
                            `
                                )
                                .join("")
                            : '<p style="color: var(--secondary-color);">No team members</p>'
                        }
                    </div>
                </div>
            </div>
        `;

    const isTeamHeadOfThisTeam =
      isTeamHead(currentUser) &&
      team.heads?.some((h) => h.id === currentUser.id);
    const canEdit = isAdminOrCore(currentUser) || isTeamHeadOfThisTeam;

    const footer = `
            ${
              canEdit
                ? `
                <button class="btn btn-warning" onclick="editTeam(${
                  team.id
                }); closeModal();">Edit Team</button>
                ${
                  isAdmin(currentUser)
                    ? `<button class="btn btn-danger" onclick="deleteTeamConfirm(${team.id}); closeModal();">Delete Team</button>`
                    : ""
                }
            `
                : ""
            }
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        `;

    createModal("Team Details", content, footer);
  } catch (error) {
    console.error("Failed to load team details:", error);
    showToast("Failed to load team details", "error");
  }
}

async function showCreateTeamModal() {
  try {
    // Load all users for selection
    const usersResponse = await api.getUsers();
    const users = usersResponse.users;

    // Preserve existing form values if modal is being reopened
    const existingName = document.getElementById("teamName")?.value || "";
    const existingDescription =
      document.getElementById("teamDescription")?.value || "";
    const existingColor =
      document.getElementById("teamColor")?.value || "#007bff";
    const existingIsCoreTeam =
      document.getElementById("teamIsCoreTeam")?.checked || false;

    // Get selected IDs from temp variables or existing hidden fields
    const existingHeadIds =
      window.tempSelectedHeadIds ||
      document.getElementById("selectedHeadIds")?.value ||
      "";
    const existingMemberIds =
      window.tempSelectedMemberIds ||
      document.getElementById("selectedMemberIds")?.value ||
      "";

    // Store in temp variables for later use
    window.tempSelectedHeadIds = existingHeadIds;
    window.tempSelectedMemberIds = existingMemberIds;

    // Build selected heads display
    let headsDisplayHTML =
      '<small style="color: var(--secondary-color);">No team heads selected</small>';
    if (existingHeadIds) {
      const headIdArray = existingHeadIds.split(",").filter((id) => id);
      if (headIdArray.length > 0) {
        const selectedHeads = users.filter((u) =>
          headIdArray.includes(u.id.toString())
        );
        headsDisplayHTML = selectedHeads
          .map(
            (user) => `
          <div style="display: inline-block; padding: 0.25rem 0.5rem; margin: 0.25rem; background-color: var(--primary-color); color: white; border-radius: 4px; font-size: 12px;">
            ${escapeHtml(user.name)}
            <span style="cursor: pointer; margin-left: 0.25rem;" onclick="removeCreateHead(${
              user.id
            })">&times;</span>
          </div>
        `
          )
          .join("");
      }
    }

    // Build selected members display
    let membersDisplayHTML =
      '<small style="color: var(--secondary-color);">No team members selected</small>';
    if (existingMemberIds) {
      const memberIdArray = existingMemberIds.split(",").filter((id) => id);
      if (memberIdArray.length > 0) {
        const selectedMembers = users.filter((u) =>
          memberIdArray.includes(u.id.toString())
        );
        membersDisplayHTML = selectedMembers
          .map(
            (user) => `
          <div style="display: inline-block; padding: 0.25rem 0.5rem; margin: 0.25rem; background-color: var(--accent-teal); color: white; border-radius: 4px; font-size: 12px;">
            ${escapeHtml(user.name)}
            <span style="cursor: pointer; margin-left: 0.25rem;" onclick="removeCreateMember(${
              user.id
            })">&times;</span>
          </div>
        `
          )
          .join("");
      }
    }

    const content = `
        <form id="createTeamForm">
            <div class="form-group">
                <label for="teamName">Team Name *</label>
                <input type="text" id="teamName" value="${escapeHtml(
                  existingName
                )}" required>
            </div>
            <div class="form-group">
                <label for="teamDescription">Description</label>
                <textarea id="teamDescription" rows="3">${escapeHtml(
                  existingDescription
                )}</textarea>
            </div>
            <div class="form-group">
                <label for="teamColor">Color</label>
                <input type="color" id="teamColor" value="${existingColor}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="teamIsCoreTeam" ${
                      existingIsCoreTeam ? "checked" : ""
                    }>
                    Is Core Team
                </label>
            </div>
            
            <div class="form-group">
                <label>Selected Team Heads:</label>
                <div id="selectedHeadsList" style="margin-bottom: 0.5rem; min-height: 20px;">
                    ${headsDisplayHTML}
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="showSelectTeamHeadsModal()">
                    ➕ Add Team Heads
                </button>
            </div>

            <div class="form-group">
                <label>Selected Team Members:</label>
                <div id="selectedMembersList" style="margin-bottom: 0.5rem; min-height: 20px;">
                    ${membersDisplayHTML}
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="showSelectTeamMembersModal()">
                    ➕ Add Team Members
                </button>
            </div>

            <input type="hidden" id="selectedHeadIds" value="${existingHeadIds}">
            <input type="hidden" id="selectedMemberIds" value="${existingMemberIds}">
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="cancelCreateTeam()">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateTeam()">Create Team</button>
    `;

    createModal("Create New Team", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

// Cancel team creation and clear temp variables
function cancelCreateTeam() {
  window.tempSelectedHeadIds = "";
  window.tempSelectedMemberIds = "";
  closeModal();
}

// Show modal to select team heads during team creation
async function showSelectTeamHeadsModal() {
  try {
    const usersResponse = await api.getUsers();
    const users = usersResponse.users;

    // Get currently selected head IDs
    const selectedIds = document
      .getElementById("selectedHeadIds")
      .value.split(",")
      .filter((id) => id)
      .map((id) => parseInt(id));

    const content = `
      <div class="form-group">
        <label for="searchCreateHeads">Search User by Name or Email</label>
        <input 
          type="text" 
          id="searchCreateHeads" 
          placeholder="Type to search..." 
          oninput="filterCreateHeadsList()"
          autocomplete="off"
        >
      </div>
      <div class="form-group">
        <label>Select Users as Team Heads (Multiple Selection):</label>
        <div id="createHeadsList" style="max-height: 400px; overflow-y: auto; border: 2px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.5rem;">
          ${users
            .map(
              (user) => `
            <div class="user-select-item" data-user-name="${escapeHtml(
              user.name.toLowerCase()
            )}" data-user-email="${escapeHtml(
                user.email.toLowerCase()
              )}" style="display: flex; align-items: center; padding: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; background-color: ${
                selectedIds.includes(user.id)
                  ? "var(--primary-color-light)"
                  : "transparent"
              };" onclick="toggleCreateHeadSelection(${user.id}, '${escapeHtml(
                user.name
              )}', this)">
              <input type="checkbox" id="createHead_${user.id}" ${
                selectedIds.includes(user.id) ? "checked" : ""
              } style="margin-right: 0.5rem;">
              <label for="createHead_${
                user.id
              }" style="cursor: pointer; flex: 1; margin: 0;">
                <strong>${escapeHtml(user.name)}</strong><br>
                <small style="color: var(--gray-600);">${escapeHtml(
                  user.email
                )} • ${user.role}</small>
              </label>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal(); showCreateTeamModal();">Cancel</button>
      <button class="btn btn-primary" onclick="confirmCreateHeadsSelection()">Confirm Selection</button>
    `;

    createModal("Select Team Heads", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

function filterCreateHeadsList() {
  const searchTerm = document
    .getElementById("searchCreateHeads")
    .value.toLowerCase();
  const items = document.querySelectorAll("#createHeadsList .user-select-item");

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

function toggleCreateHeadSelection(userId, userName, element) {
  const checkbox = document.getElementById(`createHead_${userId}`);
  checkbox.checked = !checkbox.checked;

  if (checkbox.checked) {
    element.style.backgroundColor = "var(--primary-color-light)";
  } else {
    element.style.backgroundColor = "transparent";
  }
}

function confirmCreateHeadsSelection() {
  const checkboxes = document.querySelectorAll(
    "#createHeadsList input[type='checkbox']:checked"
  );
  const selectedIds = Array.from(checkboxes).map((cb) =>
    cb.id.replace("createHead_", "")
  );

  // Store selected IDs in a temporary variable
  window.tempSelectedHeadIds = selectedIds.join(",");

  // Transfer to the hidden field if it exists, otherwise it will be set when modal reopens
  const hiddenField = document.getElementById("selectedHeadIds");
  if (hiddenField) {
    hiddenField.value = window.tempSelectedHeadIds;
  }

  closeModal();
  showCreateTeamModal();
}

function removeCreateHead(userId) {
  const selectedIds = document
    .getElementById("selectedHeadIds")
    .value.split(",")
    .filter((id) => id && parseInt(id) !== userId);

  document.getElementById("selectedHeadIds").value = selectedIds.join(",");

  // Also update temp variable
  window.tempSelectedHeadIds = selectedIds.join(",");

  // Refresh the modal to show updated selection
  showCreateTeamModal();
}

// Show modal to select team members during team creation
async function showSelectTeamMembersModal() {
  try {
    const usersResponse = await api.getUsers();
    const users = usersResponse.users;

    // Get currently selected member IDs
    const selectedIds = document
      .getElementById("selectedMemberIds")
      .value.split(",")
      .filter((id) => id)
      .map((id) => parseInt(id));

    // Get selected head IDs to exclude
    const headIds = document
      .getElementById("selectedHeadIds")
      .value.split(",")
      .filter((id) => id)
      .map((id) => parseInt(id));

    const content = `
      <div class="form-group">
        <label for="searchCreateMembers">Search User by Name or Email</label>
        <input 
          type="text" 
          id="searchCreateMembers" 
          placeholder="Type to search..." 
          oninput="filterCreateMembersList()"
          autocomplete="off"
        >
      </div>
      <div class="form-group">
        <label>Select Users as Team Members (Multiple Selection):</label>
        <div id="createMembersList" style="max-height: 400px; overflow-y: auto; border: 2px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.5rem;">
          ${users
            .filter((user) => !headIds.includes(user.id))
            .map(
              (user) => `
            <div class="user-select-item" data-user-name="${escapeHtml(
              user.name.toLowerCase()
            )}" data-user-email="${escapeHtml(
                user.email.toLowerCase()
              )}" style="display: flex; align-items: center; padding: 0.5rem; margin-bottom: 0.25rem; cursor: pointer; border-radius: 4px; background-color: ${
                selectedIds.includes(user.id)
                  ? "var(--primary-color-light)"
                  : "transparent"
              };" onclick="toggleCreateMemberSelection(${
                user.id
              }, '${escapeHtml(user.name)}', this)">
              <input type="checkbox" id="createMember_${user.id}" ${
                selectedIds.includes(user.id) ? "checked" : ""
              } style="margin-right: 0.5rem;">
              <label for="createMember_${
                user.id
              }" style="cursor: pointer; flex: 1; margin: 0;">
                <strong>${escapeHtml(user.name)}</strong><br>
                <small style="color: var(--gray-600);">${escapeHtml(
                  user.email
                )} • ${user.role}</small>
              </label>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal(); showCreateTeamModal();">Cancel</button>
      <button class="btn btn-primary" onclick="confirmCreateMembersSelection()">Confirm Selection</button>
    `;

    createModal("Select Team Members", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

function filterCreateMembersList() {
  const searchTerm = document
    .getElementById("searchCreateMembers")
    .value.toLowerCase();
  const items = document.querySelectorAll(
    "#createMembersList .user-select-item"
  );

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

function toggleCreateMemberSelection(userId, userName, element) {
  const checkbox = document.getElementById(`createMember_${userId}`);
  checkbox.checked = !checkbox.checked;

  if (checkbox.checked) {
    element.style.backgroundColor = "var(--primary-color-light)";
  } else {
    element.style.backgroundColor = "transparent";
  }
}

function confirmCreateMembersSelection() {
  const checkboxes = document.querySelectorAll(
    "#createMembersList input[type='checkbox']:checked"
  );
  const selectedIds = Array.from(checkboxes).map((cb) =>
    cb.id.replace("createMember_", "")
  );

  // Store selected IDs in a temporary variable
  window.tempSelectedMemberIds = selectedIds.join(",");

  // Transfer to the hidden field if it exists, otherwise it will be set when modal reopens
  const hiddenField = document.getElementById("selectedMemberIds");
  if (hiddenField) {
    hiddenField.value = window.tempSelectedMemberIds;
  }

  closeModal();
  showCreateTeamModal();
}

function removeCreateMember(userId) {
  const selectedIds = document
    .getElementById("selectedMemberIds")
    .value.split(",")
    .filter((id) => id && parseInt(id) !== userId);

  document.getElementById("selectedMemberIds").value = selectedIds.join(",");

  // Also update temp variable
  window.tempSelectedMemberIds = selectedIds.join(",");

  // Refresh the modal to show updated selection
  showCreateTeamModal();
}

async function submitCreateTeam() {
  const form = document.getElementById("createTeamForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const teamData = {
    name: document.getElementById("teamName").value,
    description: document.getElementById("teamDescription").value,
    color: document.getElementById("teamColor").value,
    isCoreTeam: document.getElementById("teamIsCoreTeam").checked,
  };

  // Add selected team heads
  const headIds = document
    .getElementById("selectedHeadIds")
    .value.split(",")
    .filter((id) => id)
    .map((id) => parseInt(id));

  if (headIds.length > 0) {
    teamData.headIds = headIds;
  }

  // Add selected team members
  const memberIds = document
    .getElementById("selectedMemberIds")
    .value.split(",")
    .filter((id) => id)
    .map((id) => parseInt(id));

  if (memberIds.length > 0) {
    teamData.memberIds = memberIds;
  }

  try {
    await api.createTeam(teamData);
    showToast("Team created successfully", "success");

    // Clear temp variables
    window.tempSelectedHeadIds = "";
    window.tempSelectedMemberIds = "";

    closeModal();
    loadPage("teams");
  } catch (error) {
    console.error("Failed to create team:", error);
    showToast(error.message || "Failed to create team", "error");
  }
}

async function editTeam(teamId) {
  try {
    const response = await api.getTeam(teamId);
    const team = response.team;

    // Check if user is team head of this team
    const isTeamHeadOfThisTeam =
      isTeamHead(currentUser) &&
      team.heads?.some((h) => h.id === currentUser.id);
    const canManageMembers =
      isAdmin(currentUser) || isCore(currentUser) || isTeamHeadOfThisTeam;

    const content = `
      <form id="editTeamForm">
        <div class="form-group">
          <label for="editTeamName">Team Name *</label>
          <input type="text" id="editTeamName" value="${escapeHtml(
            team.name
          )}" required>
        </div>
        <div class="form-group">
          <label for="editTeamDescription">Description</label>
          <textarea id="editTeamDescription" rows="4">${escapeHtml(
            team.description || ""
          )}</textarea>
        </div>
        <div class="form-group">
          <label for="editTeamColor">Team Color</label>
          <input type="color" id="editTeamColor" value="${
            team.color || "#007bff"
          }">
        </div>
        ${
          isAdmin(currentUser)
            ? `
        <div class="form-group">
          <label for="editTeamCoreTeam">
            <input type="checkbox" id="editTeamCoreTeam" ${
              team.isCoreTeam ? "checked" : ""
            }>
            Core Team
          </label>
        </div>
        <div class="form-group">
          <label for="editTeamActive">
            <input type="checkbox" id="editTeamActive" ${
              team.isActive ? "checked" : ""
            }>
            Active
          </label>
        </div>
        `
            : ""
        }

        ${
          canManageMembers
            ? `
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid var(--gray-200);">
          <h4 style="margin-bottom: 1rem;">Manage Team Members</h4>
          
          ${
            isAdmin(currentUser) && team.heads && team.heads.length > 0
              ? `
          <div class="form-group">
            <label><strong>Team Heads - Select to Remove:</strong></label>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: 4px; padding: 0.5rem;">
              ${team.heads
                .map(
                  (head) => `
                <div style="padding: 0.5rem; margin-bottom: 0.25rem; background-color: var(--light-color); border-radius: 4px; display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="removeHead_${head.id}" value="${
                    head.id
                  }" style="cursor: pointer;">
                  <label for="removeHead_${
                    head.id
                  }" style="cursor: pointer; flex: 1; margin: 0;">
                    <strong>${escapeHtml(
                      head.name
                    )}</strong> <small style="color: var(--gray-600);">(${escapeHtml(
                    head.email
                  )})</small>
                  </label>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          ${
            team.teamMembers && team.teamMembers.length > 0
              ? `
          <div class="form-group">
            <label><strong>Team Members - Select to Remove:</strong></label>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: 4px; padding: 0.5rem;">
              ${team.teamMembers
                .map(
                  (member) => `
                <div style="padding: 0.5rem; margin-bottom: 0.25rem; background-color: var(--light-color); border-radius: 4px; display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="removeMember_${
                    member.id
                  }" value="${member.id}" style="cursor: pointer;">
                  <label for="removeMember_${
                    member.id
                  }" style="cursor: pointer; flex: 1; margin: 0;">
                    <strong>${escapeHtml(
                      member.name
                    )}</strong> <small style="color: var(--gray-600);">(${escapeHtml(
                    member.email
                  )})</small>
                  </label>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          `
              : '<p style="color: var(--secondary-color); font-size: 14px;">No team members to manage</p>'
          }
        </div>
        `
            : ""
        }
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitEditTeam(${teamId})">Update Team</button>
    `;

    createModal("Edit Team", content, footer);
  } catch (error) {
    console.error("Failed to load team for editing:", error);
    showToast("Failed to load team details", "error");
  }
}

async function submitEditTeam(teamId) {
  const form = document.getElementById("editTeamForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const teamData = {
    name: document.getElementById("editTeamName").value,
    description: document.getElementById("editTeamDescription").value,
    color: document.getElementById("editTeamColor").value,
  };

  if (isAdmin(currentUser)) {
    teamData.isCoreTeam = document.getElementById("editTeamCoreTeam")?.checked;
    teamData.isActive = document.getElementById("editTeamActive")?.checked;
  }

  try {
    // First, update the team details
    await api.updateTeam(teamId, teamData);

    // Then handle member/head removals
    const headsToRemove = [];
    const membersToRemove = [];

    // Get all checked head removal checkboxes (only admin can remove heads)
    if (isAdmin(currentUser)) {
      document
        .querySelectorAll('input[id^="removeHead_"]:checked')
        .forEach((checkbox) => {
          headsToRemove.push(parseInt(checkbox.value));
        });
    }

    // Get all checked member removal checkboxes
    document
      .querySelectorAll('input[id^="removeMember_"]:checked')
      .forEach((checkbox) => {
        membersToRemove.push(parseInt(checkbox.value));
      });

    // Remove heads
    for (const userId of headsToRemove) {
      try {
        await api.removeTeamHead(teamId, userId);
      } catch (error) {
        console.error(`Failed to remove head ${userId}:`, error);
      }
    }

    // Remove members
    for (const userId of membersToRemove) {
      try {
        await api.removeTeamMember(teamId, userId);
      } catch (error) {
        console.error(`Failed to remove member ${userId}:`, error);
      }
    }

    const removalCount = headsToRemove.length + membersToRemove.length;
    if (removalCount > 0) {
      showToast(
        `Team updated and ${removalCount} member(s) removed successfully`,
        "success"
      );
    } else {
      showToast("Team updated successfully", "success");
    }

    closeModal();
    loadPage("teams");
  } catch (error) {
    console.error("Failed to update team:", error);
    showToast(error.message || "Failed to update team", "error");
  }
}

// Add Team Head Modal
async function showAddTeamHeadModal(teamId) {
  try {
    const usersResponse = await api.getUsers();
    const users = usersResponse.users.filter((u) => u.role !== "Team Member");

    closeModal(); // Close current modal

    const content = `
      <form id="addTeamHeadForm">
        <div class="form-group">
          <label for="searchTeamHead">Search User by Name or Email</label>
          <input 
            type="text" 
            id="searchTeamHead" 
            placeholder="Type to search..." 
            oninput="filterTeamHeadList()"
            autocomplete="off"
          >
        </div>
        <div class="form-group">
          <label>Select User to Add as Team Head:</label>
          <div id="teamHeadList" style="max-height: 300px; overflow-y: auto; border: 2px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.5rem;">
            ${users
              .map(
                (user) => `
              <div class="user-select-item" data-user-id="${
                user.id
              }" data-user-name="${escapeHtml(
                  user.name.toLowerCase()
                )}" data-user-email="${escapeHtml(
                  user.email.toLowerCase()
                )}" onclick="selectTeamHeadUser(${user.id}, '${escapeHtml(
                  user.name
                )}')">
                <input type="radio" name="selectedHead" value="${
                  user.id
                }" id="head_${user.id}">
                <label for="head_${
                  user.id
                }" style="margin-left: 0.5rem; cursor: pointer; flex: 1;">
                  <strong>${escapeHtml(user.name)}</strong><br>
                  <small style="color: var(--gray-600);">${escapeHtml(
                    user.email
                  )} • ${user.role}</small>
                </label>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <input type="hidden" id="selectedHeadId">
        <input type="hidden" id="selectedHeadName">
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal(); viewTeamDetail(${teamId});">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddTeamHead(${teamId})">Add Team Head</button>
    `;

    createModal("Add Team Head", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

function filterTeamHeadList() {
  const searchTerm = document
    .getElementById("searchTeamHead")
    .value.toLowerCase();
  const items = document.querySelectorAll(".user-select-item");

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

function selectTeamHeadUser(userId, userName) {
  document.getElementById("selectedHeadId").value = userId;
  document.getElementById("selectedHeadName").value = userName;
  document.getElementById(`head_${userId}`).checked = true;
}

async function submitAddTeamHead(teamId) {
  const userId = document.getElementById("selectedHeadId").value;
  const userName = document.getElementById("selectedHeadName").value;

  if (!userId) {
    showToast("Please select a user", "warning");
    return;
  }

  try {
    await api.addTeamHead(teamId, parseInt(userId));
    showToast(`${userName} added as Team Head successfully`, "success");
    closeModal();
    viewTeamDetail(teamId);
  } catch (error) {
    console.error("Failed to add team head:", error);
    showToast(error.message || "Failed to add team head", "error");
  }
}

// Remove Team Head
async function removeTeamHead(teamId, userId, userName) {
  confirmDialog(
    `Are you sure you want to remove ${userName} as Team Head?`,
    async () => {
      try {
        await api.removeTeamHead(teamId, userId);
        showToast(`${userName} removed as Team Head`, "success");
        closeModal();
        viewTeamDetail(teamId);
      } catch (error) {
        console.error("Failed to remove team head:", error);
        showToast(error.message || "Failed to remove team head", "error");
      }
    }
  );
}

// Add Team Member Modal
async function showAddTeamMemberModal(teamId) {
  try {
    const usersResponse = await api.getUsers();
    const users = usersResponse.users;

    closeModal(); // Close current modal

    const content = `
      <form id="addTeamMemberForm">
        <div class="form-group">
          <label for="searchTeamMember">Search User by Name or Email</label>
          <input 
            type="text" 
            id="searchTeamMember" 
            placeholder="Type to search..." 
            oninput="filterTeamMemberList()"
            autocomplete="off"
          >
        </div>
        <div class="form-group">
          <label>Select User to Add as Team Member:</label>
          <div id="teamMemberList" style="max-height: 300px; overflow-y: auto; border: 2px solid var(--gray-200); border-radius: var(--radius-md); padding: 0.5rem;">
            ${users
              .map(
                (user) => `
              <div class="user-select-item" data-user-id="${
                user.id
              }" data-user-name="${escapeHtml(
                  user.name.toLowerCase()
                )}" data-user-email="${escapeHtml(
                  user.email.toLowerCase()
                )}" onclick="selectTeamMemberUser(${user.id}, '${escapeHtml(
                  user.name
                )}')">
                <input type="radio" name="selectedMember" value="${
                  user.id
                }" id="member_${user.id}">
                <label for="member_${
                  user.id
                }" style="margin-left: 0.5rem; cursor: pointer; flex: 1;">
                  <strong>${escapeHtml(user.name)}</strong><br>
                  <small style="color: var(--gray-600);">${escapeHtml(
                    user.email
                  )} • ${user.role}</small>
                </label>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <input type="hidden" id="selectedMemberId">
        <input type="hidden" id="selectedMemberName">
      </form>
    `;

    const footer = `
      <button class="btn btn-secondary" onclick="closeModal(); viewTeamDetail(${teamId});">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddTeamMember(${teamId})">Add Team Member</button>
    `;

    createModal("Add Team Member", content, footer);
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  }
}

function filterTeamMemberList() {
  const searchTerm = document
    .getElementById("searchTeamMember")
    .value.toLowerCase();
  const items = document.querySelectorAll(".user-select-item");

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

function selectTeamMemberUser(userId, userName) {
  document.getElementById("selectedMemberId").value = userId;
  document.getElementById("selectedMemberName").value = userName;
  document.getElementById(`member_${userId}`).checked = true;
}

async function submitAddTeamMember(teamId) {
  const userId = document.getElementById("selectedMemberId").value;
  const userName = document.getElementById("selectedMemberName").value;

  if (!userId) {
    showToast("Please select a user", "warning");
    return;
  }

  try {
    await api.addTeamMember(teamId, parseInt(userId));
    showToast(`${userName} added to team successfully`, "success");
    closeModal();
    viewTeamDetail(teamId);
  } catch (error) {
    console.error("Failed to add team member:", error);
    showToast(error.message || "Failed to add team member", "error");
  }
}

// Remove Team Member
async function removeTeamMember(teamId, userId, userName) {
  confirmDialog(
    `Are you sure you want to remove ${userName} from this team?`,
    async () => {
      try {
        await api.removeTeamMember(teamId, userId);
        showToast(`${userName} removed from team`, "success");
        closeModal();
        viewTeamDetail(teamId);
      } catch (error) {
        console.error("Failed to remove team member:", error);
        showToast(error.message || "Failed to remove team member", "error");
      }
    }
  );
}

// Delete Team
function deleteTeamConfirm(teamId) {
  confirmDialog(
    "Are you sure you want to delete this team? This action cannot be undone.",
    async () => {
      try {
        await api.deleteTeam(teamId);
        showToast("Team deleted successfully", "success");
        loadPage("teams");
      } catch (error) {
        console.error("Failed to delete team:", error);
        showToast(error.message || "Failed to delete team", "error");
      }
    }
  );
}

// Clear All Teams
function clearAllTeams() {
  confirmDialog(
    "⚠️ WARNING: This will delete ALL teams and their associations (team heads, team members). This action cannot be undone. Are you absolutely sure?",
    async () => {
      try {
        const response = await fetch("/api/teams/clear-all", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              sessionStorage.getItem("token") || localStorage.getItem("token")
            }`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          showToast(
            data.message || "All teams cleared successfully",
            "success"
          );
          loadPage("teams");
        } else {
          showToast(data.error || "Failed to clear teams", "error");
        }
      } catch (error) {
        console.error("Failed to clear teams:", error);
        showToast("An error occurred while clearing teams", "error");
      }
    }
  );
}
