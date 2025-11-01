// Main application logic

let currentUser = null;
let socket = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication - try sessionStorage first (tab-specific), then localStorage (persistent)
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  // Set API token
  api.setToken(token);

  // Initialize dark mode from localStorage
  initializeDarkMode();

  // Load current user
  try {
    const response = await api.getMe();
    currentUser = response.user;
    updateUserInfo();

    // Show/hide admin-only elements
    if (isAdminOrCore(currentUser)) {
      document.querySelectorAll(".admin-only").forEach((el) => {
        el.style.display = "";
      });
    }

    // Initialize Socket.IO
    initializeSocket();

    // Load initial page
    loadPage("dashboard");

    // Set up event listeners
    setupEventListeners();

    // Load notification count
    updateNotificationCount();
  } catch (error) {
    console.error("Failed to load user:", error);
    logout();
  }
});

function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      loadPage(page);

      // Update active state
      document.querySelectorAll(".nav-item").forEach((nav) => {
        nav.classList.remove("active");
      });
      item.classList.add("active");
    });
  });

  // Sidebar toggle
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Dark mode toggle
  document
    .getElementById("darkModeToggle")
    .addEventListener("click", toggleDarkMode);

  // Create task button
  document.getElementById("createTaskBtn").addEventListener("click", () => {
    if (isTeamHead(currentUser)) {
      showCreateTaskModal();
    } else {
      showToast(
        "Only Admin, Core Team Members, and Team Heads can create tasks",
        "warning"
      );
    }
  });
}

function updateUserInfo() {
  document.getElementById("userName").textContent = currentUser.name;
}

function loadPage(page) {
  const container = document.getElementById("contentContainer");
  const pageTitle = document.getElementById("pageTitle");

  // Update title
  const titles = {
    dashboard: "Dashboard",
    tasks: "All Tasks",
    "my-tasks": "My Tasks",
    teams: "Teams",
    notifications: "Notifications",
    analytics: "Analytics",
    admin: "Admin Panel",
    profile: "Profile",
  };
  pageTitle.textContent = titles[page] || "Dashboard";

  // Load page content
  switch (page) {
    case "dashboard":
      loadDashboard(container);
      break;
    case "tasks":
      loadAllTasks(container);
      break;
    case "my-tasks":
      loadMyTasks(container);
      break;
    case "teams":
      loadTeams(container);
      break;
    case "notifications":
      loadNotifications(container);
      break;
    case "analytics":
      loadAnalytics(container);
      break;
    case "admin":
      loadAdmin(container);
      break;
    case "profile":
      loadProfile(container);
      break;
    default:
      loadDashboard(container);
  }
}

function initializeSocket() {
  socket = io();

  socket.on("connect", () => {
    console.log("Socket.IO connected");
    socket.emit("join_user", currentUser.id);

    if (currentUser.teamId) {
      socket.emit("join_team", currentUser.teamId);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO disconnected");
  });

  // Listen for task updates
  socket.on("task_updated", (task) => {
    showToast(`Task "${task.title}" was updated`, "info");
    // Reload current page if showing tasks
    const currentPage = document.querySelector(".nav-item.active").dataset.page;
    if (["dashboard", "tasks", "my-tasks"].includes(currentPage)) {
      loadPage(currentPage);
    }
  });

  // Listen for comment additions
  socket.on("comment_added", (comment) => {
    updateNotificationCount();
  });

  // Listen for new notifications
  socket.on("new_notification", (notification) => {
    showToast(notification.title, "info");
    updateNotificationCount();
  });
}

async function updateNotificationCount() {
  try {
    const response = await api.getUnreadCount();
    const badge = document.getElementById("notificationBadge");
    badge.textContent = response.count;
    badge.style.display = response.count > 0 ? "inline-block" : "none";
  } catch (error) {
    console.error("Failed to load notification count:", error);
  }
}

function logout() {
  // Clear both storage locations
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  if (socket) {
    socket.disconnect();
  }
  window.location.href = "/login.html";
}

// Dark Mode Functions
function initializeDarkMode() {
  const darkMode = localStorage.getItem("darkMode") === "true";
  if (darkMode) {
    document.body.classList.add("dark-mode");
    updateDarkModeIcon(true);
  }
}

function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", isDarkMode);
  updateDarkModeIcon(isDarkMode);

  // Show toast notification
  showToast(
    isDarkMode ? "🌙 Dark mode enabled" : "☀️ Light mode enabled",
    "info"
  );
}

function updateDarkModeIcon(isDarkMode) {
  const icon = document.getElementById("darkModeIcon");
  const button = document.getElementById("darkModeToggle");
  if (isDarkMode) {
    icon.textContent = "☀️";
    button.innerHTML = '<span id="darkModeIcon">☀️</span> Light Mode';
  } else {
    icon.textContent = "🌙";
    button.innerHTML = '<span id="darkModeIcon">🌙</span> Dark Mode';
  }
}
