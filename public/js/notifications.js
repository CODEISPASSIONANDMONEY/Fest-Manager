// Notifications page

async function loadNotifications(container) {
  try {
    const response = await api.getNotifications();
    const notifications = response.notifications;

    container.innerHTML = `
            <div style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <h3>Notifications</h3>
                ${
                  notifications.filter((n) => !n.readStatus).length > 0
                    ? `
                    <button class="btn btn-sm btn-primary" onclick="markAllNotificationsRead()">Mark All as Read</button>
                `
                    : ""
                }
            </div>

            <div class="card">
                ${
                  notifications.length === 0
                    ? '<p style="color: var(--secondary-color); text-align: center; padding: 2rem;">No notifications</p>'
                    : notifications
                        .map((notification) =>
                          createNotificationItem(notification)
                        )
                        .join("")
                }
            </div>
        `;

    setupNotificationClickHandlers();
  } catch (error) {
    console.error("Failed to load notifications:", error);
    showToast("Failed to load notifications", "error");
  }
}

function createNotificationItem(notification) {
  const typeIcons = {
    task_assigned: "📋",
    task_completed: "✅",
    task_updated: "🔄",
    deadline_reminder: "⏰",
    comment_added: "💬",
    team_update: "👥",
    system: "ℹ️",
  };

  return `
        <div class="notification-item" data-id="${notification.id}" style="
            padding: 1rem;
            border-bottom: 1px solid var(--light-color);
            background-color: ${
              notification.readStatus
                ? "transparent"
                : "rgba(0, 123, 255, 0.05)"
            };
            cursor: pointer;
            transition: var(--transition);
        " onmouseover="this.style.backgroundColor='var(--light-color)'" onmouseout="this.style.backgroundColor='${
          notification.readStatus ? "transparent" : "rgba(0, 123, 255, 0.05)"
        }'">
            <div style="display: flex; gap: 1rem;">
                <div style="font-size: 24px;">
                    ${typeIcons[notification.type] || "ℹ️"}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
                        <strong style="color: ${
                          notification.readStatus
                            ? "var(--secondary-color)"
                            : "var(--dark-color)"
                        };">
                            ${escapeHtml(notification.title)}
                        </strong>
                        ${
                          !notification.readStatus
                            ? '<div style="width: 8px; height: 8px; background-color: var(--primary-color); border-radius: 50%;"></div>'
                            : ""
                        }
                    </div>
                    <p style="margin: 0; color: var(--secondary-color); font-size: 14px;">
                        ${escapeHtml(notification.content)}
                    </p>
                    <div style="margin-top: 0.5rem; font-size: 12px; color: var(--secondary-color);">
                        ${formatDate(notification.createdAt)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupNotificationClickHandlers() {
  document.querySelectorAll(".notification-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const notificationId = parseInt(item.dataset.id);

      // Mark as read
      try {
        await api.markNotificationRead(notificationId);
        updateNotificationCount();
        loadPage("notifications");
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    });
  });
}

async function markAllNotificationsRead() {
  try {
    await api.markAllNotificationsRead();
    showToast("All notifications marked as read", "success");
    updateNotificationCount();
    loadPage("notifications");
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    showToast("Failed to mark notifications as read", "error");
  }
}

// Profile page
async function loadProfile(container) {
  try {
    const response = await api.getUserStats(currentUser.id);
    const stats = response.stats;

    container.innerHTML = `
            <div class="card">
                <div class="card-header">Profile Information</div>
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div>
                        ${getAvatarHTML(currentUser, 80)}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(
                          currentUser.name
                        )}</h3>
                        <p style="margin: 0; color: var(--secondary-color);">${escapeHtml(
                          currentUser.email
                        )}</p>
                        <p style="margin: 0.25rem 0; color: var(--secondary-color);">
                            <strong>Role:</strong> ${currentUser.role}
                        </p>
                        ${
                          currentUser.position
                            ? `
                            <p style="margin: 0.25rem 0; color: var(--secondary-color);">
                                <strong>Position:</strong> ${escapeHtml(
                                  currentUser.position
                                )}
                            </p>
                        `
                            : ""
                        }
                        ${
                          currentUser.team
                            ? `
                            <p style="margin: 0.25rem 0; color: var(--secondary-color);">
                                <strong>Team:</strong> ${escapeHtml(
                                  currentUser.team.name
                                )}
                            </p>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>

            <div class="stats-grid" style="margin-top: 1.5rem;">
                <div class="stat-card">
                    <div class="stat-icon primary">📋</div>
                    <div class="stat-info">
                        <h3>${stats.assignedTasks}</h3>
                        <p>Assigned Tasks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">✅</div>
                    <div class="stat-info">
                        <h3>${stats.completedTasks}</h3>
                        <p>Completed</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">⏳</div>
                    <div class="stat-info">
                        <h3>${stats.pendingTasks}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger">⚠️</div>
                    <div class="stat-info">
                        <h3>${stats.overdueTasks}</h3>
                        <p>Overdue</p>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header">Notification Settings</div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="emailNotifications" ${
                          currentUser.emailNotifications ? "checked" : ""
                        }>
                        Email Notifications
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="deadlineReminders" ${
                          currentUser.deadlineReminders ? "checked" : ""
                        }>
                        Deadline Reminders
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="taskUpdates" ${
                          currentUser.taskUpdates ? "checked" : ""
                        }>
                        Task Updates
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="darkMode" ${
                          currentUser.darkMode ? "checked" : ""
                        }>
                        Dark Mode
                    </label>
                </div>
                <button class="btn btn-primary" onclick="updateProfileSettings()">Save Settings</button>
            </div>
        `;
  } catch (error) {
    console.error("Failed to load profile:", error);
    showToast("Failed to load profile", "error");
  }
}

async function updateProfileSettings() {
  const settings = {
    emailNotifications: document.getElementById("emailNotifications").checked,
    deadlineReminders: document.getElementById("deadlineReminders").checked,
    taskUpdates: document.getElementById("taskUpdates").checked,
    darkMode: document.getElementById("darkMode").checked,
  };

  try {
    await api.updateUser(currentUser.id, settings);

    // Update current user
    Object.assign(currentUser, settings);

    showToast("Settings updated successfully", "success");
  } catch (error) {
    console.error("Failed to update settings:", error);
    showToast("Failed to update settings", "error");
  }
}

// Analytics page (admin/core only)
async function loadAnalytics(container) {
  if (!isAdminOrCore(currentUser)) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--secondary-color); padding: 2rem;">Access denied</p>';
    return;
  }

  try {
    const response = await api.getDashboardAnalytics();

    container.innerHTML = `
            <div class="card">
                <div class="card-header">Overall Statistics</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon primary">📋</div>
                        <div class="stat-info">
                            <h3>${response.stats.totalTasks}</h3>
                            <p>Total Tasks</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon success">✅</div>
                        <div class="stat-info">
                            <h3>${response.stats.completedTasks}</h3>
                            <p>Completed</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon primary">👥</div>
                        <div class="stat-info">
                            <h3>${response.stats.totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon primary">🎯</div>
                        <div class="stat-info">
                            <h3>${response.stats.totalTeams}</h3>
                            <p>Total Teams</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                <div class="card">
                    <div class="card-header">Tasks by Priority</div>
                    ${response.tasksByPriority
                      .map(
                        (item) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--light-color);">
                            <span>${item.priority}</span>
                            <strong>${item.count}</strong>
                        </div>
                    `
                      )
                      .join("")}
                </div>

                <div class="card">
                    <div class="card-header">Tasks by Status</div>
                    ${response.tasksByStatus
                      .map(
                        (item) => `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--light-color);">
                            <span>${item.status}</span>
                            <strong>${item.count}</strong>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Failed to load analytics:", error);
    showToast("Failed to load analytics", "error");
  }
}
