document.addEventListener("DOMContentLoaded", () => {

  if (!requireRole("PATIENT")) return;

  const appointmentForm =
    document.getElementById("bookAppointmentForm");

  const patientTopbarName =
    document.getElementById("patientTopbarName");

  const patientIdInput =
    document.getElementById("appointmentPatientId");

  const appointmentDate =
    document.getElementById("appointmentDate");

  const appointmentTime =
    document.getElementById("appointmentTime");

  const appointmentError =
    document.getElementById("appointmentError");

  const submitButton =
    appointmentForm.querySelector(".btn-primary");

  const patientLogout =
    document.getElementById("patientLogout");


  /*
    Fill in the logged-in patient from the real session. The patient
    ID comes from the backend session and is read-only so bookings can
    never be created for someone else.
  */

  const patientId =
    localStorage.getItem("mq_patientId") || "";

  const patientName =
    localStorage.getItem("mq_name") || "";


  if (patientName) {
    patientTopbarName.textContent =
      patientName.split(" ")[0];
  }

  if (patientId) {
    patientIdInput.value = patientId;
    patientIdInput.setAttribute("readonly", "readonly");
  }


  /*
    Clinics come from the database; an empty list means the admin has not
    created any yet.
  */

  const clinicSelect =
    document.getElementById("appointmentClinic");

  const clinicOptions =
    (getData().clinics || [])
      .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
      .join("");

  clinicSelect.innerHTML =
    `<option value="" selected disabled>Select clinic</option>` +
    clinicOptions;

  if (!clinicOptions) {
    appointmentError.textContent =
      "No clinics have been set up yet. Please contact reception.";
    appointmentError.style.display = "block";
  }

  /*
    Prevent dates before today.
  */

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(today.getMonth() + 1).padStart(2, "0");

  const day =
    String(today.getDate()).padStart(2, "0");

  appointmentDate.min =
    `${year}-${month}-${day}`;

  function refreshTimeSlotAvailability() {
    const selectedDate = appointmentDate.value;
    const isToday = selectedDate === todayIso();
    const isPastDate = Boolean(selectedDate) && selectedDate < todayIso();

    Array.from(appointmentTime.options).forEach((option) => {
      if (!option.value) return;
      option.disabled =
        isPastDate ||
        (isToday && isPastDateTime(selectedDate, option.value));
    });

    const selected = appointmentTime.selectedOptions[0];
    if (selected && selected.disabled) {
      appointmentTime.value = "";
    }
  }

  appointmentDate.addEventListener("change", refreshTimeSlotAvailability);
  refreshTimeSlotAvailability();


  /*
    Handle appointment form submission. Bookings are created without a
    doctor or department; the admin assigns a doctor later, and the
    appointment inherits that doctor's department. The backend only accepts
    the booking when the caller is authenticated.
  */

  appointmentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    appointmentError.textContent = "";


    const clinicId =
      document.getElementById(
        "appointmentClinic"
      ).value;

    const clinicName =
      clinicSelect.options[clinicSelect.selectedIndex]
        ? clinicSelect.options[clinicSelect.selectedIndex].text
        : "";

    const date =
      appointmentDate.value;

    const time =
      document.getElementById(
        "appointmentTime"
      ).value;

    const reason =
      document.getElementById(
        "appointmentReason"
      ).value.trim();


    if (
      !patientId ||
      !clinicId ||
      !date ||
      !time ||
      !reason
    ) {

      appointmentError.textContent =
        "Please complete all appointment fields.";

      return;

    }


    if (date < todayIso() || isPastDateTime(date, time)) {

      appointmentError.textContent =
        "Please choose a date and time in the future.";

      return;

    }


    if (!getToken()) {
      window.location.href = "patient-login.html";
      return;
    }


    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Booking...";
    }


    const saved =
      await createAppointmentAsync({
        appointmentId: uniqueId("APP"),
        patientId,
        doctorId: null,
        clinicId,
        departmentId: null,
        reason,
        scheduledDate: date,
        scheduledTime: to24h(time),
        appointmentType: "booked",
        status: "Pending"
      });


    if (saved.status === 401) {
      clearSession();
      window.location.href = "patient-login.html";
      return;
    }

    if (!saved.ok) {

      appointmentError.textContent =
        saved.error ||
        "Could not create the booking. Please try again.";

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirm";
      }

      return;

    }


    /*
      Persist a summary for the confirmation page (the real appointment
      id + the form values). The confirmation page renders from this.
    */

    const createdId =
      (saved.created && saved.created.appointmentId) || "";

    /*
      The backend puts the booking into the live queue immediately and issues
      its number. createAppointmentAsync has already refreshed the queue cache,
      so the confirmation page can show the number straight away.
    */
    const queueEntry =
      (getData().queue || []).find(
        (q) =>
          q.patientId === patientId &&
          q.queueDate === date &&
          !["Cancelled", "Completed"].includes(q.status)
      );

    localStorage.setItem(
      "mq_appointment",
      JSON.stringify({
        appointmentId: createdId,
        patientId,
        clinic: clinicName,
        department: "Not assigned yet",
        doctor: "Not assigned yet",
        date,
        time,
        reason,
        status: "Pending",
        queueNumber: queueEntry ? queueEntry.no : "",
        queueStatus: queueEntry ? queueEntry.status : "Waiting"
      })
    );


    window.location.href =
      "appointment-confirmed.html";

  });


  /*
    Logout
  */

  if (patientLogout) {
    patientLogout.addEventListener("click", (e) => {
      e.preventDefault();
      mqLogout();
    });
  }

});

/* =========================================================
   PATIENT MOBILE MENU
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const menuButton =
    document.getElementById("patientMenuButton");

  const closeButton =
    document.getElementById("patientMenuClose");

  const sidebar =
    document.getElementById("patientSidebar");

  const overlay =
    document.getElementById("patientMenuOverlay");


  if (
    !menuButton ||
    !closeButton ||
    !sidebar ||
    !overlay
  ) {
    return;
  }


  function openPatientMenu() {

    sidebar.classList.add(
      "patient-sidebar-open"
    );

    overlay.classList.add(
      "patient-menu-overlay-open"
    );

    document.body.classList.add(
      "patient-menu-open"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  function closePatientMenu() {

    sidebar.classList.remove(
      "patient-sidebar-open"
    );

    overlay.classList.remove(
      "patient-menu-overlay-open"
    );

    document.body.classList.remove(
      "patient-menu-open"
    );

    menuButton.setAttribute(
      "aria-expanded",
      "false"
    );
  }


  menuButton.addEventListener(
    "click",
    openPatientMenu
  );


  closeButton.addEventListener(
    "click",
    closePatientMenu
  );


  overlay.addEventListener(
    "click",
    closePatientMenu
  );


  sidebar
    .querySelectorAll(".nav-item")
    .forEach(link => {

      link.addEventListener(
        "click",
        closePatientMenu
      );

    });


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closePatientMenu();
      }

    }
  );

});