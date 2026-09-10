document.addEventListener("DOMContentLoaded", () => {

  const registerForm =
    document.getElementById("patientRegisterForm");

  const passwordInput =
    document.getElementById("registerPassword");

  const confirmPasswordInput =
    document.getElementById("confirmPassword");

  const togglePasswordButton =
    document.getElementById("toggleRegisterPassword");

  const toggleConfirmButton =
    document.getElementById("toggleConfirmPassword");

  const errorMessage =
    document.getElementById("registrationError");


  togglePasswordButton.addEventListener("click", () => {

    passwordInput.type =
      passwordInput.type === "password"
        ? "text"
        : "password";

  });


  toggleConfirmButton.addEventListener("click", () => {

    confirmPasswordInput.type =
      confirmPasswordInput.type === "password"
        ? "text"
        : "password";

  });


  registerForm.addEventListener("submit", (event) => {

    event.preventDefault();

    errorMessage.textContent = "";


    const fullName =
      document.getElementById("fullName").value.trim();

    const patientId =
      document.getElementById("patientId").value.trim();

    const phoneNumber =
      document.getElementById("phoneNumber").value.trim();

    const dateOfBirth =
      document.getElementById("dateOfBirth").value;

    const gender =
      document.getElementById("gender").value;

    const address =
      document.getElementById("address").value.trim();

    const allergies =
      document.getElementById("allergies").value.trim();

    const email =
      document.getElementById("emailAddress").value.trim();

    const password =
      passwordInput.value;

    const confirmPassword =
      confirmPasswordInput.value;


    if (password !== confirmPassword) {

      errorMessage.textContent =
        "Passwords do not match.";

      return;
    }


    /*
      Temporary frontend patient data.

      This will later be replaced with a POST request
      to the backend patient registration API.
    */

    const patient = {
      fullName,
      patientId,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      allergies,
      email
    };


    localStorage.setItem(
      "mq_patient",
      JSON.stringify(patient)
    );


    window.location.href =
      "patient-register-success.html";

  });

});