document.addEventListener("DOMContentLoaded", () => {

  /*
    Temporary Patient Dashboard data.

    Later this information will come from
    the MediQueue backend/database.
  */

  const defaultPatient = {
    fullName: "Charmaine Dlamini"
  };


  const storedPatient =
    localStorage.getItem("mq_patient");


  let patient = defaultPatient;


  if (storedPatient) {

    try {

      patient = JSON.parse(storedPatient);

    } catch (error) {

      patient = defaultPatient;

    }

  }


  const fullName =
    patient.fullName || defaultPatient.fullName;


  const firstName =
    fullName.split(" ")[0];


  document.getElementById(
    "patientTopbarName"
  ).textContent = firstName;


  document.getElementById(
    "patientWelcome"
  ).textContent =
    `Welcome back, ${firstName}!`;


  /*
    Temporary dashboard values.
  */

  document.getElementById(
    "queueNumber"
  ).textContent = "A-023";


  document.getElementById(
    "totalVisits"
  ).textContent = "8";


  /*
    Logout
  */

  document.getElementById(
    "patientLogout"
  ).addEventListener("click", () => {

    localStorage.removeItem("mq_role");

  });

});