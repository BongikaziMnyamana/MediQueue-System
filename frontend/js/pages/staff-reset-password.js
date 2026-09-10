document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("staffResetPasswordForm");
  const emailInput = document.getElementById("staffEmail");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const message = document.getElementById("staffResetMessage");

  const toggleNewPassword =
    document.getElementById("toggleNewPassword");

  const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


  toggleNewPassword.addEventListener("click", () => {
    if (newPasswordInput.type === "password") {
      newPasswordInput.type = "text";
    } else {
      newPasswordInput.type = "password";
    }
  });


  toggleConfirmPassword.addEventListener("click", () => {
    if (confirmPasswordInput.type === "password") {
      confirmPasswordInput.type = "text";
    } else {
      confirmPasswordInput.type = "password";
    }
  });


  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    message.textContent = "";

    if (!email || !newPassword || !confirmPassword) {
      message.textContent = "Please complete all fields.";
      return;
    }

    if (newPassword.length < 6) {
      message.textContent =
        "Password must be at least 6 characters long.";
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent =
        "The passwords do not match.";
      return;
    }

    localStorage.setItem(
      "mq_staff_reset_email",
      email
    );

    window.location.href =
      "staff-password-success.html";
  });
});