document.addEventListener("DOMContentLoaded", () => {

  const loginForm =
    document.getElementById("patientLoginForm");

  const passwordInput =
    document.getElementById("patientPassword");

  const togglePassword =
    document.getElementById("togglePatientPassword");


  togglePassword.addEventListener("click", () => {

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
    } else {
      passwordInput.type = "password";
    }

  });


  loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    const email =
      document
        .getElementById("patientEmail")
        .value
        .trim();

    const password =
      passwordInput
        .value
        .trim();


    if (!email || !password) {
      return;
    }


    /*
      Temporary frontend login.

      Backend authentication will replace this later.
    */

    localStorage.setItem("mq_role", "PATIENT");

    window.location.href =
      "patient-dashboard.html";

  });

});