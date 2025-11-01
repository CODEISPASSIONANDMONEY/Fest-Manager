// Utility Functions

// Show toast notification with enhanced styling
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Icon mapping
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const typeLabels = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
  };

  toast.innerHTML = `
    <strong>${icons[type] || "ℹ️"} ${
    typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }</strong>
    <p>${message}</p>
  `;

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 5000);

  // Click to dismiss
  toast.addEventListener("click", () => {
    toast.style.animation = "slideOutRight 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  });
}

// Add slideOutRight animation to style.css if not present
const slideOutRightStyle = document.createElement("style");
slideOutRightStyle.textContent = `
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(500px);
      opacity: 0;
    }
  }
  .toast {
    cursor: pointer;
  }
  .toast:hover {
    transform: scale(1.02);
  }
`;
if (!document.querySelector("style[data-toast-animation]")) {
  slideOutRightStyle.setAttribute("data-toast-animation", "true");
  document.head.appendChild(slideOutRightStyle);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) {
    return "Just now";
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }

  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Less than 1 week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Format as date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format datetime for input
function formatDateTimeForInput(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Get deadline status
function getDeadlineStatus(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate - now;

  if (diff < 0) {
    return { status: "overdue", label: "Overdue", class: "danger" };
  }

  if (diff < 86400000) {
    // Less than 1 day
    return { status: "urgent", label: "Due Today", class: "danger" };
  }

  if (diff < 259200000) {
    // Less than 3 days
    return { status: "soon", label: "Due Soon", class: "warning" };
  }

  return { status: "normal", label: formatDate(deadline), class: "secondary" };
}

// Create modal
function createModal(title, content, footer = "") {
  const modalHTML = `
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" id="modalClose">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
            </div>
        </div>
    `;

  const container = document.getElementById("modalContainer");
  container.innerHTML = modalHTML;

  // Close handlers
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") {
      closeModal();
    }
  });
}

// Close modal
function closeModal() {
  const container = document.getElementById("modalContainer");
  container.innerHTML = "";
}

// Confirm dialog
function confirmDialog(message, onConfirm) {
  const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirmBtn">Confirm</button>
    `;

  createModal("Confirm Action", `<p>${message}</p>`, footer);

  document.getElementById("confirmBtn").addEventListener("click", () => {
    onConfirm();
    closeModal();
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Get status badge HTML
function getStatusBadge(status) {
  const statusMap = {
    Pending: "status-pending",
    "In Progress": "status-in-progress",
    Completed: "status-completed",
    Overdue: "status-overdue",
    Cancelled: "badge-secondary",
  };

  return `<span class="badge ${
    statusMap[status] || "badge-secondary"
  }">${status}</span>`;
}

// Get priority badge HTML
function getPriorityBadge(priority) {
  const priorityMap = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
    Critical: "priority-critical",
  };

  return `<span class="badge ${
    priorityMap[priority] || "badge-secondary"
  }">${priority}</span>`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Check if user is admin or core
function isAdminOrCore(user) {
  return user && ["Admin", "Core Team Member"].includes(user.role);
}

// Check if user is core team member
function isCore(user) {
  return user && user.role === "Core Team Member";
}

// Check if user is team head
function isTeamHead(user) {
  return user && user.role === "Team Head";
}

// Get user initials
function getUserInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// Create avatar HTML
function getAvatarHTML(user, size = 32) {
  if (user.profilePicture) {
    return `<img src="${user.profilePicture}" alt="${user.name}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
  }

  const initials = getUserInitials(user.name);
  return `
        <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background-color: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: ${
    size / 2
  }px;">
            ${initials}
        </div>
    `;
}
