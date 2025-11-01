// Dashboard page

async function loadDashboard(container) {
  try {
    const analytics = await api.getDashboardAnalytics();

    container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">📋</div>
                    <div class="stat-info">
                        <h3>${analytics.stats.totalTasks}</h3>
                        <p>Total Tasks</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon success">✅</div>
                    <div class="stat-info">
                        <h3>${analytics.stats.completedTasks}</h3>
                        <p>Completed</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">⏳</div>
                    <div class="stat-info">
                        <h3>${analytics.stats.pendingTasks}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger">⚠️</div>
                    <div class="stat-info">
                        <h3>${analytics.stats.overdueTasks}</h3>
                        <p>Overdue</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">Upcoming Deadlines</div>
                <div class="task-list" id="upcomingTasksList">
                    ${
                      analytics.upcomingTasks.length === 0
                        ? '<p style="color: var(--secondary-color); text-align: center;">No upcoming deadlines</p>'
                        : analytics.upcomingTasks
                            .map((task) => createTaskItem(task))
                            .join("")
                    }
                </div>
            </div>
        `;

    // Add click listeners to tasks
    document.querySelectorAll(".task-item").forEach((item) => {
      item.addEventListener("click", () => {
        const taskId = item.dataset.id;
        showTaskDetail(taskId);
      });
    });
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    showToast("Failed to load dashboard", "error");
  }
}

function createTaskItem(task) {
  const deadlineInfo = getDeadlineStatus(task.deadline);
  const assignee = task.assignee ? task.assignee.name : "Unassigned";

  return `
        <div class="task-item" data-id="${task.id}">
            <div class="task-header">
                <h4 class="task-title">${escapeHtml(task.title)}</h4>
                <div class="flex gap-1">
                    ${getStatusBadge(task.status)}
                    ${getPriorityBadge(task.priority)}
                </div>
            </div>
            <div class="task-meta">
                <span>👤 ${escapeHtml(assignee)}</span>
                <span>📅 ${deadlineInfo.label}</span>
            </div>
        </div>
    `;
}
