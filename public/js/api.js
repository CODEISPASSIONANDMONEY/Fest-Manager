// API Base URL
const API_URL = window.location.origin + "/api";

// API Client
class API {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("token");
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth
  async login(identifier, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  }

  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request("/auth/me");
  }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users${query ? "?" + query : ""}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getUserStats(id) {
    return this.request(`/users/${id}/stats`);
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Teams
  async getTeams() {
    return this.request("/teams");
  }

  async getTeam(id) {
    return this.request(`/teams/${id}`);
  }

  async createTeam(data) {
    return this.request("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTeam(id, data) {
    return this.request(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id) {
    return this.request(`/teams/${id}`, {
      method: "DELETE",
    });
  }

  async addTeamHeads(teamId, userIds) {
    return this.request(`/teams/${teamId}/heads`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  }

  async addTeamHead(teamId, userId) {
    return this.addTeamHeads(teamId, [userId]);
  }

  async removeTeamHead(teamId, userId) {
    return this.request(`/teams/${teamId}/heads/${userId}`, {
      method: "DELETE",
    });
  }

  async addTeamMembers(teamId, userIds) {
    return this.request(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  }

  async addTeamMember(teamId, userId) {
    return this.addTeamMembers(teamId, [userId]);
  }

  async removeTeamMember(teamId, userId) {
    return this.request(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tasks${query ? "?" + query : ""}`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTask(id, data) {
    return this.request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: "DELETE",
    });
  }

  async completeTask(id) {
    return this.request(`/tasks/${id}/complete`, {
      method: "POST",
    });
  }

  async getMyAssignedTasks() {
    return this.request("/tasks/my/assigned");
  }

  async getMyCreatedTasks() {
    return this.request("/tasks/my/created");
  }

  // Comments
  async getTaskComments(taskId) {
    return this.request(`/comments/task/${taskId}`);
  }

  async addComment(taskId, commentText, parentId = null) {
    return this.request(`/comments/task/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ commentText, parentId }),
    });
  }

  async deleteComment(id) {
    return this.request(`/comments/${id}`, {
      method: "DELETE",
    });
  }

  // Notifications
  async getNotifications(unreadOnly = false) {
    return this.request(
      `/notifications${unreadOnly ? "?unreadOnly=true" : ""}`
    );
  }

  async getUnreadCount() {
    return this.request("/notifications/unread/count");
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsRead() {
    return this.request("/notifications/read-all", {
      method: "PUT",
    });
  }

  async createNotification(data) {
    return this.request("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, {
      method: "DELETE",
    });
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request("/analytics/dashboard");
  }

  async getTeamAnalytics(teamId) {
    return this.request(`/analytics/team/${teamId}`);
  }

  async getUserAnalytics(userId) {
    return this.request(`/analytics/user/${userId}`);
  }

  async getAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/audit-log${query ? "?" + query : ""}`);
  }
}

// Export singleton instance
const api = new API();
