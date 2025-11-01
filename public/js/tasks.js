// Tasks page

async function loadAllTasks(container) {
  try {
    const response = await api.getTasks();
    const tasks = response.tasks;

    container.innerHTML = `
            <div class="filters">
                <input type="text" id="searchTasks" placeholder="Search tasks..." style="flex: 1; max-width: 300px;">
                <select id="filterStatus">
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                </select>
                <select id="filterPriority">
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>

            <div class="card">
                <div class="task-list" id="tasksList">
                    ${
                      tasks.length === 0
                        ? '<p style="color: var(--secondary-color); text-align: center;">No tasks found</p>'
                        : tasks
                            .map((task) => createTaskItemDetailed(task))
                            .join("")
                    }
                </div>
            </div>
        `;

    setupTaskFilters(tasks);
    setupTaskClickHandlers();
  } catch (error) {
    console.error("Failed to load tasks:", error);
    showToast("Failed to load tasks", "error");
  }
}

async function loadMyTasks(container) {
  try {
    const response = await api.getMyAssignedTasks();
    const tasks = response.tasks;

    container.innerHTML = `
            <div class="card">
                <div class="card-header">Tasks Assigned to Me</div>
                <div class="task-list" id="myTasksList">
                    ${
                      tasks.length === 0
                        ? '<p style="color: var(--secondary-color); text-align: center;">No tasks assigned to you</p>'
                        : tasks
                            .map((task) => createTaskItemDetailed(task))
                            .join("")
                    }
                </div>
            </div>
        `;

    setupTaskClickHandlers();
  } catch (error) {
    console.error("Failed to load tasks:", error);
    showToast("Failed to load your tasks", "error");
  }
}

function createTaskItemDetailed(task) {
  const deadlineInfo = getDeadlineStatus(task.deadline);
  const assignee = task.assignee ? task.assignee.name : "Unassigned";
  const creator = task.creator ? task.creator.name : "Unknown";

  return `
        <div class="task-item" data-id="${task.id}">
            <div class="task-header">
                <h4 class="task-title">${escapeHtml(task.title)}</h4>
                <div class="flex gap-1">
                    ${getStatusBadge(task.status)}
                    ${getPriorityBadge(task.priority)}
                </div>
            </div>
            ${
              task.description
                ? `<p style="color: var(--secondary-color); font-size: 14px; margin: 0.5rem 0;">${escapeHtml(
                    task.description.substring(0, 100)
                  )}${task.description.length > 100 ? "..." : ""}</p>`
                : ""
            }
            <div class="task-meta">
                <span>👤 Assigned: ${escapeHtml(assignee)}</span>
                <span>✍️ Created by: ${escapeHtml(creator)}</span>
                <span>📅 ${deadlineInfo.label}</span>
                ${task.dependency ? "<span>🔗 Has dependency</span>" : ""}
            </div>
            <div class="task-actions">
                ${
                  task.status !== "Completed" &&
                  (task.assignedTo === currentUser.id ||
                    task.createdBy === currentUser.id ||
                    isAdminOrCore(currentUser))
                    ? `<button class="btn btn-sm btn-success" onclick="completeTaskQuick(${task.id})">Complete</button>`
                    : ""
                }
                ${
                  task.createdBy === currentUser.id ||
                  isAdminOrCore(currentUser)
                    ? `<button class="btn btn-sm btn-warning" onclick="editTask(${task.id})">Edit</button>
                     <button class="btn btn-sm btn-danger" onclick="deleteTaskConfirm(${task.id})">Delete</button>`
                    : ""
                }
            </div>
        </div>
    `;
}

function setupTaskFilters(tasks) {
  const searchInput = document.getElementById("searchTasks");
  const statusFilter = document.getElementById("filterStatus");
  const priorityFilter = document.getElementById("filterPriority");

  const filterTasks = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;

    const filtered = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm));
      const matchesStatus = !status || task.status === status;
      const matchesPriority = !priority || task.priority === priority;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    const tasksList = document.getElementById("tasksList");
    tasksList.innerHTML =
      filtered.length === 0
        ? '<p style="color: var(--secondary-color); text-align: center;">No tasks found</p>'
        : filtered.map((task) => createTaskItemDetailed(task)).join("");

    setupTaskClickHandlers();
  };

  searchInput.addEventListener("input", debounce(filterTasks, 300));
  statusFilter.addEventListener("change", filterTasks);
  priorityFilter.addEventListener("change", filterTasks);
}

function setupTaskClickHandlers() {
  document.querySelectorAll(".task-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn")) {
        const taskId = item.dataset.id;
        showTaskDetail(taskId);
      }
    });
  });
}

async function showTaskDetail(taskId) {
  try {
    const response = await api.getTask(taskId);
    const task = response.task;

    const content = `
            <div style="margin-bottom: 1rem;">
                <div class="flex-between" style="margin-bottom: 1rem;">
                    <h2 style="margin: 0;">${escapeHtml(task.title)}</h2>
                    <div class="flex gap-1">
                        ${getStatusBadge(task.status)}
                        ${getPriorityBadge(task.priority)}
                    </div>
                </div>
                
                ${
                  task.description
                    ? `<p style="color: var(--secondary-color);">${escapeHtml(
                        task.description
                      )}</p>`
                    : ""
                }
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div>
                        <strong>Assigned To:</strong><br>
                        ${
                          task.assignee
                            ? escapeHtml(task.assignee.name)
                            : "Unassigned"
                        }
                    </div>
                    <div>
                        <strong>Created By:</strong><br>
                        ${
                          task.creator
                            ? escapeHtml(task.creator.name)
                            : "Unknown"
                        }
                    </div>
                    <div>
                        <strong>Deadline:</strong><br>
                        ${formatDate(task.deadline)}
                    </div>
                    <div>
                        <strong>Priority:</strong><br>
                        ${task.priority}
                    </div>
                </div>

                ${
                  task.dependency
                    ? `
                    <div style="margin-top: 1rem; padding: 0.75rem; background-color: var(--light-color); border-radius: 4px;">
                        <strong>Depends on:</strong> ${escapeHtml(
                          task.dependency.title
                        )} (${task.dependency.status})
                    </div>
                `
                    : ""
                }

                ${
                  task.comments && task.comments.length > 0
                    ? `
                    <div style="margin-top: 1.5rem;">
                        <strong>Comments (${task.comments.length}):</strong>
                        <div style="margin-top: 0.5rem; max-height: 300px; overflow-y: auto;">
                            ${task.comments
                              .map(
                                (comment) => `
                                <div style="padding: 0.75rem; background-color: var(--light-color); border-radius: 4px; margin-bottom: 0.5rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <strong>${escapeHtml(
                                          comment.author.name
                                        )}</strong>
                                        <span style="color: var(--secondary-color); font-size: 12px;">${formatDate(
                                          comment.createdAt
                                        )}</span>
                                    </div>
                                    <p style="margin: 0;">${escapeHtml(
                                      comment.commentText
                                    )}</p>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    const footer = `
            ${
              task.status !== "Completed"
                ? `<button class="btn btn-success" onclick="completeTaskQuick(${task.id}); closeModal();">Complete Task</button>`
                : ""
            }
            ${
              task.createdBy === currentUser.id || isAdminOrCore(currentUser)
                ? `<button class="btn btn-warning" onclick="editTask(${task.id}); closeModal();">Edit</button>
                 <button class="btn btn-danger" onclick="deleteTaskConfirm(${task.id}); closeModal();">Delete</button>`
                : ""
            }
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        `;

    createModal("Task Details", content, footer);

    // Join task room for real-time updates
    if (socket) {
      socket.emit("join_task", taskId);
    }
  } catch (error) {
    console.error("Failed to load task details:", error);
    showToast("Failed to load task details", "error");
  }
}

function showCreateTaskModal() {
  // Load teams and users for dropdowns
  Promise.all([api.getTeams(), api.getUsers()])
    .then(([teamsResponse, usersResponse]) => {
      const teams = teamsResponse.teams;
      const users = usersResponse.users;

      const content = `
        <form id="createTaskForm">
            <div class="form-group">
                <label for="taskTitle">Title *</label>
                <input type="text" id="taskTitle" required>
            </div>
            <div class="form-group">
                <label for="taskDescription">Description</label>
                <textarea id="taskDescription" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="taskDeadline">Deadline *</label>
                <input type="datetime-local" id="taskDeadline" required>
            </div>
            <div class="form-group">
                <label for="taskPriority">Priority</label>
                <select id="taskPriority">
                    <option value="Low">Low</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label for="taskAssignedTo">Assign To (Optional)</label>
                <select id="taskAssignedTo">
                    <option value="">None - Unassigned</option>
                    ${users
                      .map(
                        (user) => `
                        <option value="${user.id}">${escapeHtml(
                          user.name
                        )} (${escapeHtml(user.email)}) - ${escapeHtml(
                          user.role
                        )}</option>
                    `
                      )
                      .join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="taskVisibility">Visibility</label>
                <select id="taskVisibility" onchange="handleVisibilityChange()">
                    <option value="public">Public (All Users)</option>
                    <option value="team">Specific Team</option>
                    <option value="core">Core Team Only</option>
                    <option value="private">Private (Only Me)</option>
                </select>
            </div>
            <div class="form-group" id="teamSelectGroup" style="display:none;">
                <label for="taskTargetTeam">Select Team *</label>
                <select id="taskTargetTeam">
                    <option value="">Choose a team...</option>
                    ${teams
                      .map(
                        (team) => `
                        <option value="${team.id}">${escapeHtml(
                          team.name
                        )}</option>
                    `
                      )
                      .join("")}
                </select>
            </div>
        </form>
    `;

      const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateTask()">Create Task</button>
    `;

      createModal("Create New Task", content, footer);
    })
    .catch((error) => {
      console.error("Failed to load teams:", error);
      showToast("Failed to load teams", "error");
    });
}

function handleVisibilityChange() {
  const visibility = document.getElementById("taskVisibility").value;
  const teamSelectGroup = document.getElementById("teamSelectGroup");

  if (visibility === "team") {
    teamSelectGroup.style.display = "block";
    document.getElementById("taskTargetTeam").required = true;
  } else {
    teamSelectGroup.style.display = "none";
    document.getElementById("taskTargetTeam").required = false;
  }
}

async function submitCreateTask() {
  const form = document.getElementById("createTaskForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const visibility = document.getElementById("taskVisibility").value;
  const taskData = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    deadline: document.getElementById("taskDeadline").value,
    priority: document.getElementById("taskPriority").value,
    visibility: visibility,
  };

  // Add assignedTo if a user is selected
  const assignedTo = document.getElementById("taskAssignedTo").value;
  if (assignedTo) {
    taskData.assignedTo = parseInt(assignedTo);
  }

  // Add targetGroup if team visibility is selected
  if (visibility === "team") {
    const targetTeam = document.getElementById("taskTargetTeam").value;
    if (!targetTeam) {
      showToast("Please select a team", "warning");
      return;
    }
    taskData.targetGroup = `team_${targetTeam}`;
  }

  try {
    await api.createTask(taskData);
    showToast("Task created successfully", "success");
    closeModal();

    // Reload current page
    const currentPage = document.querySelector(".nav-item.active").dataset.page;
    loadPage(currentPage);
  } catch (error) {
    console.error("Failed to create task:", error);
    showToast(error.message || "Failed to create task", "error");
  }
}

async function completeTaskQuick(taskId) {
  try {
    await api.completeTask(taskId);
    showToast("Task marked as completed", "success");

    // Reload current page
    const currentPage = document.querySelector(".nav-item.active").dataset.page;
    loadPage(currentPage);
  } catch (error) {
    console.error("Failed to complete task:", error);
    showToast(error.message || "Failed to complete task", "error");
  }
}

async function editTask(taskId) {
  try {
    // Fetch the task details
    const response = await api.getTask(taskId);
    const task = response.task;

    // Load teams and users for dropdowns
    const [teamsResponse, usersResponse] = await Promise.all([
      api.getTeams(),
      api.getUsers(),
    ]);
    const teams = teamsResponse.teams;
    const users = usersResponse.users;

    const content = `
        <form id="editTaskForm">
            <div class="form-group">
                <label for="editTaskTitle">Title *</label>
                <input type="text" id="editTaskTitle" value="${escapeHtml(
                  task.title
                )}" required>
            </div>
            <div class="form-group">
                <label for="editTaskDescription">Description</label>
                <textarea id="editTaskDescription" rows="4">${
                  task.description || ""
                }</textarea>
            </div>
            <div class="form-group">
                <label for="editTaskDeadline">Deadline *</label>
                <input type="datetime-local" id="editTaskDeadline" value="${new Date(
                  task.deadline
                )
                  .toISOString()
                  .slice(0, 16)}" required>
            </div>
            <div class="form-group">
                <label for="editTaskPriority">Priority</label>
                <select id="editTaskPriority">
                    <option value="Low" ${
                      task.priority === "Low" ? "selected" : ""
                    }>Low</option>
                    <option value="Medium" ${
                      task.priority === "Medium" ? "selected" : ""
                    }>Medium</option>
                    <option value="High" ${
                      task.priority === "High" ? "selected" : ""
                    }>High</option>
                    <option value="Critical" ${
                      task.priority === "Critical" ? "selected" : ""
                    }>Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editTaskAssignedTo">Assign To (Optional)</label>
                <select id="editTaskAssignedTo">
                    <option value="">None - Unassigned</option>
                    ${users
                      .map(
                        (user) => `
                        <option value="${user.id}" ${
                          task.assignedTo === user.id ? "selected" : ""
                        }>${escapeHtml(user.name)} (${escapeHtml(
                          user.email
                        )}) - ${escapeHtml(user.role)}</option>
                    `
                      )
                      .join("")}
                </select>
            </div>
            <div class="form-group">
                <label for="editTaskStatus">Status</label>
                <select id="editTaskStatus">
                    <option value="Pending" ${
                      task.status === "Pending" ? "selected" : ""
                    }>Pending</option>
                    <option value="In Progress" ${
                      task.status === "In Progress" ? "selected" : ""
                    }>In Progress</option>
                    <option value="Completed" ${
                      task.status === "Completed" ? "selected" : ""
                    }>Completed</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editTaskVisibility">Visibility</label>
                <select id="editTaskVisibility" onchange="handleEditVisibilityChange()">
                    <option value="public" ${
                      task.visibility === "public" ? "selected" : ""
                    }>Public (All Users)</option>
                    <option value="team" ${
                      task.visibility === "team" ? "selected" : ""
                    }>Specific Team</option>
                    <option value="core" ${
                      task.visibility === "core" ? "selected" : ""
                    }>Core Team Only</option>
                    <option value="private" ${
                      task.visibility === "private" ? "selected" : ""
                    }>Private (Only Me)</option>
                </select>
            </div>
            <div class="form-group" id="editTeamSelectGroup" style="display:${
              task.visibility === "team" ? "block" : "none"
            };">
                <label for="editTaskTargetTeam">Select Team *</label>
                <select id="editTaskTargetTeam">
                    <option value="">Choose a team...</option>
                    ${teams
                      .map((team) => {
                        const teamIdFromTarget = task.targetGroup
                          ? task.targetGroup.replace("team_", "")
                          : "";
                        return `<option value="${team.id}" ${
                          teamIdFromTarget == team.id ? "selected" : ""
                        }>${escapeHtml(team.name)}</option>`;
                      })
                      .join("")}
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitEditTask(${taskId})">Update Task</button>
    `;

    createModal("Edit Task", content, footer);
  } catch (error) {
    console.error("Failed to load task for editing:", error);
    showToast("Failed to load task details", "error");
  }
}

function handleEditVisibilityChange() {
  const visibility = document.getElementById("editTaskVisibility").value;
  const teamSelectGroup = document.getElementById("editTeamSelectGroup");

  if (visibility === "team") {
    teamSelectGroup.style.display = "block";
    document.getElementById("editTaskTargetTeam").required = true;
  } else {
    teamSelectGroup.style.display = "none";
    document.getElementById("editTaskTargetTeam").required = false;
  }
}

async function submitEditTask(taskId) {
  const form = document.getElementById("editTaskForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const visibility = document.getElementById("editTaskVisibility").value;
  const taskData = {
    title: document.getElementById("editTaskTitle").value,
    description: document.getElementById("editTaskDescription").value,
    deadline: document.getElementById("editTaskDeadline").value,
    priority: document.getElementById("editTaskPriority").value,
    status: document.getElementById("editTaskStatus").value,
    visibility: visibility,
  };

  // Add assignedTo if a user is selected
  const assignedTo = document.getElementById("editTaskAssignedTo").value;
  if (assignedTo) {
    taskData.assignedTo = parseInt(assignedTo);
  } else {
    taskData.assignedTo = null;
  }

  // Add targetGroup if team visibility is selected
  if (visibility === "team") {
    const targetTeam = document.getElementById("editTaskTargetTeam").value;
    if (!targetTeam) {
      showToast("Please select a team", "warning");
      return;
    }
    taskData.targetGroup = `team_${targetTeam}`;
  } else {
    taskData.targetGroup = null;
  }

  try {
    await api.updateTask(taskId, taskData);
    showToast("Task updated successfully", "success");
    closeModal();

    // Reload current page
    const currentPage = document.querySelector(".nav-item.active").dataset.page;
    loadPage(currentPage);
  } catch (error) {
    console.error("Failed to update task:", error);
    showToast(error.message || "Failed to update task", "error");
  }
}

function deleteTaskConfirm(taskId) {
  confirmDialog("Are you sure you want to delete this task?", async () => {
    try {
      await api.deleteTask(taskId);
      showToast("Task deleted successfully", "success");

      // Reload current page
      const currentPage =
        document.querySelector(".nav-item.active").dataset.page;
      loadPage(currentPage);
    } catch (error) {
      console.error("Failed to delete task:", error);
      showToast(error.message || "Failed to delete task", "error");
    }
  });
}
