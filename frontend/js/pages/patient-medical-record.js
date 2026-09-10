document.addEventListener("DOMContentLoaded", () => {

  /*
    Default patient information.

    This mock data is used only until
    the backend Medical Record API is connected.
  */

  const defaultPatient = {
    fullName: "Charmaine Dlamini",
    patientId: "PT-2026-001",
    dateOfBirth: "2002-02-14",
    gender: "Female",
    allergies: "None recorded"
  };


  const storedPatient =
    localStorage.getItem("mq_patient");


  let patient = defaultPatient;


  /*
    Load registered patient information
    if available.
  */

  if (storedPatient) {

    try {

      const savedPatient =
        JSON.parse(storedPatient);


      patient = {
        ...defaultPatient,
        ...savedPatient
      };

    } catch (error) {

      console.log(
        "Could not load patient information."
      );

    }

  }


  /*
    Patient name
  */

  const fullName =
    patient.fullName ||
    defaultPatient.fullName;


  const firstName =
    fullName.split(" ")[0];


  document.getElementById(
    "patientTopbarName"
  ).textContent =
    firstName;


  document.getElementById(
    "medicalPatientName"
  ).textContent =
    fullName;


  /*
    Patient ID
  */

  document.getElementById(
    "medicalPatientId"
  ).textContent =
    patient.patientId ||
    defaultPatient.patientId;


  /*
    Gender
  */

  document.getElementById(
    "medicalPatientGender"
  ).textContent =
    patient.gender ||
    defaultPatient.gender;


  /*
    Allergies
  */

  document.getElementById(
    "medicalAllergies"
  ).textContent =
    patient.allergies ||
    "None recorded";


  /*
    Date of Birth
  */

  const dateOfBirth =
    patient.dateOfBirth;


  if (dateOfBirth) {

    const date =
      new Date(`${dateOfBirth}T00:00:00`);


    const formattedDate =
      date.toLocaleDateString(
        "en-ZA",
        {
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );


    document.getElementById(
      "medicalPatientDob"
    ).textContent =
      formattedDate;

  }


  /*
    Logout
  */

  document.getElementById(
    "patientLogout"
  ).addEventListener("click", () => {

    localStorage.removeItem("mq_role");

  });

});