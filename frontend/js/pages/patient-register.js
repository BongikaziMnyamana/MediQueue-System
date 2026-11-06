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

  const submitButton =
    document.querySelector(".patient-register-submit");

  const idNumberInput =
    document.getElementById("idNumber");

  const dateOfBirthInput =
    document.getElementById("dateOfBirth");


  /*
    South African ID numbers start with YYMMDD, so the date of birth can be
    filled in automatically once all 13 digits have been entered.
  */

  function dateOfBirthFromId(idNumber) {

    if (!/^[0-9]{13}$/.test(idNumber)) {
      return "";
    }

    const shortYear =
      Number(idNumber.slice(0, 2));

    const month =
      Number(idNumber.slice(2, 4));

    const day =
      Number(idNumber.slice(4, 6));

    const currentYear =
      new Date().getFullYear();

    let year =
      Math.floor(currentYear / 100) * 100 + shortYear;

    if (year > currentYear) {
      year -= 100;
    }

    const date =
      new Date(year, month - 1, day);

    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!isValid) {
      return "";
    }

    return [
      String(year).padStart(4, "0"),
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

  }


  function fillDateOfBirthFromId() {

    const value =
      dateOfBirthFromId(idNumberInput.value.trim());

    if (value) {
      dateOfBirthInput.value = value;
    }

  }


  idNumberInput.addEventListener(
    "input",
    fillDateOfBirthFromId
  );


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


  registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    errorMessage.textContent = "";


    const fullName =
      document.getElementById("fullName").value.trim();

    const idNumber =
      document.getElementById("idNumber").value.trim();

    const phoneNumber =
      document.getElementById("phoneNumber").value.trim().replace(/\s+/g, "");

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


    if (!/^[0-9]{13}$/.test(idNumber)) {
      errorMessage.textContent =
        "Please enter a valid 13-digit South African ID number.";
      return;
    }

    if (!email) {
      errorMessage.textContent =
        "Please enter your email address.";
      return;
    }

    if (!allergies) {
      errorMessage.textContent =
        "Please enter your allergies, or write None.";
      return;
    }

    if (password !== confirmPassword) {
      errorMessage.textContent =
        "Passwords do not match.";
      return;
    }

    if (password.length < 6) {
      errorMessage.textContent =
        "Password must be at least 6 characters long.";
      return;
    }

    const [firstName, lastName] = splitName(fullName);

    /*
      Register with the backend. The account is only created when the
      server accepted it - no fake success. The patient is then shown a
      success page and must sign in from the login page.
    */

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";
    }

    const res =
      await registerPatientAsync({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        idNumber,
        dateOfBirth,
        gender,
        address,
        allergies
      });

    if (!res.ok || !res.data || !res.data.token) {

      errorMessage.textContent =
        authError(res);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
      }

      return;

    }


    // Do not keep the registration token: the patient must sign in through
    // the login page after the success screen.
    clearSession();


    window.location.href =
      "patient-register-success.html";

  });

});