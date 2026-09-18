document.addEventListener("DOMContentLoaded", () => {

  const storedAppointment =
    localStorage.getItem("mq_appointment");

  const storedPatient =
    localStorage.getItem("mq_patient");


  /*
    Default values used if no saved data exists.
  */

  let appointment = {
    patientId: "Not provided",
    clinic: "District Six Clinic",
    department: "General Medicine",
    date: "2026-05-13",
    time: "10:00 AM",
    reason: "General checkup",
    bookingId: "APT-2026-0458",
    queueNumber: "A-023"
  };


  let patient = {
    fullName: "Charmaine Dlamini"
  };


  /*
    Load saved appointment.
  */

  if (storedAppointment) {

    try {

      appointment =
        JSON.parse(storedAppointment);

    } catch (error) {

      console.log(
        "Could not load appointment information."
      );

    }

  }


  /*
    Load saved patient.
  */

  if (storedPatient) {

    try {

      patient =
        JSON.parse(storedPatient);

    } catch (error) {

      console.log(
        "Could not load patient information."
      );

    }

  }


  /*
    Format appointment date.
  */

  let formattedDate =
    appointment.date;


  if (appointment.date) {

    const date =
      new Date(`${appointment.date}T00:00:00`);

    formattedDate =
      date.toLocaleDateString(
        "en-ZA",
        {
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );

  }


  /*
    Display appointment information.
  */

  document.getElementById(
    "confirmedClinic"
  ).textContent =
    appointment.clinic;


  document.getElementById(
    "confirmedBookingId"
  ).textContent =
    appointment.bookingId;


  document.getElementById(
    "confirmedQueueNumber"
  ).textContent =
    appointment.queueNumber;


  document.getElementById(
    "confirmedPatientName"
  ).textContent =
    patient.fullName || "Patient";


  document.getElementById(
    "confirmedPatientId"
  ).textContent =
    appointment.patientId;


  document.getElementById(
    "confirmedDate"
  ).textContent =
    formattedDate;


  document.getElementById(
    "confirmedTime"
  ).textContent =
    appointment.time;


  document.getElementById(
    "confirmedLocation"
  ).textContent =
    appointment.clinic;


  document.getElementById(
    "confirmedDepartment"
  ).textContent =
    appointment.department;


  document.getElementById(
    "confirmedReason"
  ).textContent =
    appointment.reason;


  /*
    Booking confirmation time.
  */

  const confirmedAt =
    new Date();


  document.getElementById(
    "confirmedTimestamp"
  ).textContent =
    `Booking confirmed on ${confirmedAt.toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    )} at ${confirmedAt.toLocaleTimeString(
      "en-ZA",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )}`;


  /*
    Delete appointment.
  */

  document.getElementById(
    "deleteAppointmentBtn"
  ).addEventListener("click", () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this appointment?"
      );


    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      "mq_appointment"
    );


    window.location.href =
      "patient-dashboard.html";

  });

});