document.addEventListener("DOMContentLoaded", () => {

  const resetForm =
    document.getElementById("patientResetForm");

  const newPassword =
    document.getElementById("newPassword");

  const confirmNewPassword =
    document.getElementById("confirmNewPassword");

  const toggleNewPassword =
    document.getElementById("toggleNewPassword");

  const toggleConfirmNewPassword =
    document.getElementById("toggleConfirmNewPassword");

  const errorMessage =
    document.getElementById("resetPasswordError");


  toggleNewPassword.addEventListener("click", () => {

    newPassword.type =
      newPassword.type === "password"
        ? "text"
        : "password";

  });


  toggleConfirmNewPassword.addEventListener("click", () => {

    confirmNewPassword.type =
      confirmNewPassword.type === "password"
        ? "text"
        : "password";

  });


  resetForm.addEventListener("submit", (event) => {

    event.preventDefault();

    errorMessage.textContent = "";


    const email =
      document
        .getElementById("resetEmail")
        .value
        .trim();

    const password =
      newPassword.value;

    const confirmPassword =
      confirmNewPassword.value;


    if (password !== confirmPassword) {

      errorMessage.textContent =
        "Passwords do not match.";

      return;
    }


    /*
      Temporary frontend reset.

      Backend password reset functionality
      will replace this later.
    */

    localStorage.setItem(
      "mq_reset_email",
      email
    );


    window.location.href =
      "patient-password-success.html";

  });

});