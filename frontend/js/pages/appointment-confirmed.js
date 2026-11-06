document.addEventListener("DOMContentLoaded", async () => {

  const appointment =
    JSON.parse(localStorage.getItem("mq_appointment") || "null");


  /*
    Guard against visiting this page without a real booking.
  */

  if (!appointment || !appointment.patientId) {
    window.location.href = "patient-login.html";
    return;
  }


  /*
    The booking is in the live queue as soon as it is created. Refresh the
    queue cache so the confirmation always shows the number the server issued,
    even if the cache was written by an older page load.
  */
  if (typeof refreshQueueFromApiAsync === "function") {
    await refreshQueueFromApiAsync();
  }

  const queueEntry =
    (typeof getData === "function" ? getData().queue || [] : []).find(
      (q) =>
        q.patientId === appointment.patientId &&
        (!appointment.date || q.queueDate === appointment.date) &&
        !["Cancelled", "Completed"].includes(q.status)
    );

  const queueNumber =
    appointment.queueNumber || (queueEntry && queueEntry.no) || "-";


  const patientName =
    localStorage.getItem("mq_name") || "Patient";


  /*
    The booking is only confirmed once a doctor has been assigned. A request
    without a doctor is still a valid request, but the heading must not tell
    the patient it is already confirmed.
  */

  const status =
    String(appointment.status || "Pending");

  const isConfirmed =
    status.toLowerCase() === "confirmed";

  document.title = isConfirmed
    ? "MediQueue - Appointment Confirmed"
    : "MediQueue - Appointment Requested";


  const titleEl =
    document.querySelector(
      ".appointment-confirmed-title"
    );

  if (titleEl) {
    titleEl.textContent =
      isConfirmed
        ? "Appointment Confirmed!"
        : "Appointment Requested";
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
    appointment.appointmentId || "Not available";


  document.getElementById(
    "confirmedQueueNumber"
  ).textContent =
    queueNumber;


  document.getElementById(
    "confirmedPatientName"
  ).textContent =
    patientName;


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


  const doctorEl =
    document.getElementById("confirmedDoctor");
  if (doctorEl) {
    doctorEl.textContent =
      appointment.doctor || "Not assigned yet";
  }


  const statusEl =
    document.getElementById("confirmedStatus");
  if (statusEl) {
    statusEl.textContent = status;
  }


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
    `${isConfirmed ? "Booking confirmed on" : "Booking requested on"} ${confirmedAt.toLocaleDateString(
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
    Delete appointment — removes it from the backend too, but only if
    confirmation is given.
  */

  document.getElementById(
    "deleteAppointmentBtn"
  ).addEventListener("click", async () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this appointment?"
      );


    if (!confirmed) {
      return;
    }


    if (appointment.appointmentId) {

      const deleteBtn =
        document.getElementById("deleteAppointmentBtn");

      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";

      const res =
        await deleteAppointmentAsync(appointment.appointmentId);


      if (res.status === 401) {
        clearSession();
        window.location.href = "patient-login.html";
        return;
      }

    }


    localStorage.removeItem(
      "mq_appointment"
    );


    window.location.href =
      "patient-dashboard.html";

  });

});