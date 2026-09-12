const ROLE_HOME = {
  ADMIN: "admin-dashboard.html",
  RECEPTIONIST: "receptionist-dashboard.html",
  DOCTOR: "doctor-dashboard.html",
  NURSE: "nurse-dashboard.html",
  PHARMACIST: "pharmacist-dashboard.html"
};

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("roleSelect");
const loginError = document.getElementById("loginError");
const loginButton = document.getElementById("loginButton");
const togglePwBtn = document.getElementById("togglePwBtn");

togglePwBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
  } else {
    passwordInput.type = "password";
  }
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const role = roleSelect.value;

  loginError.style.display = "none";
  loginError.textContent = "";

  if (!username) {
    showLoginError("Please enter your username.");
    usernameInput.focus();
    return;
  }

  if (!password) {
    showLoginError("Please enter your password.");
    passwordInput.focus();
    return;
  }

  if (!role) {
    showLoginError("Please select your user role.");
    roleSelect.focus();
    return;
  }

  if (!ROLE_HOME[role]) {
    showLoginError("Invalid user role selected.");
    return;
  }

  localStorage.setItem("mq_username", username);
  localStorage.setItem("mq_role", role);
  localStorage.setItem("mq_logged_in", "true");

  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";

  window.location.href = ROLE_HOME[role];
});

function showLoginError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}