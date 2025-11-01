// Authentication page logic

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const showRegisterLink = document.getElementById("showRegister");
  const showLoginLink = document.getElementById("showLogin");
  const messageDiv = document.getElementById("authMessage");
  const adminQuickLoginBtn = document.getElementById("adminQuickLogin");

  // Check if already logged in
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    window.location.href = "/";
  }

  // Admin Quick Login
  adminQuickLoginBtn.addEventListener("click", async () => {
    // Prompt for admin credentials
    const username = prompt("Enter Admin Username or Email:");
    if (!username) return;

    const password = prompt("Enter Admin Password:");
    if (!password) return;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier: username, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user is actually an admin
        if (data.user.role !== "Admin") {
          showMessage(
            "❌ Access denied! Only Admins can use this login.",
            "error"
          );
          return;
        }

        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Show success and redirect
        showMessage("✅ Admin login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        showMessage(data.error || "Admin login failed", "error");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      showMessage("An error occurred during admin login", "error");
    }
  });

  // Toggle forms
  showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    messageDiv.style.display = "none";
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    messageDiv.style.display = "none";
  });

  // Handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = document.getElementById("loginIdentifier").value;
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Choose storage based on "Remember Me" checkbox
        const storage = rememberMe ? localStorage : sessionStorage;

        // Store token and user data
        storage.setItem("token", data.token);
        storage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = "/";
      } else {
        showMessage(data.error || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showMessage("An error occurred during login", "error");
    }
  });

  // Handle registration
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const role = document.getElementById("registerRole").value;
    const position = document.getElementById("registerPosition").value;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          username,
          password,
          role,
          position,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data (registration always uses sessionStorage for security)
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = "/";
      } else {
        showMessage(data.error || "Registration failed", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showMessage("An error occurred during registration", "error");
    }
  });

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";
  }
});
