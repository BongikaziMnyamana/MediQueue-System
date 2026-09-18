document.addEventListener("DOMContentLoaded", () => {

  const appointmentForm =
    document.getElementById("bookAppointmentForm");

  const patientTopbarName =
    document.getElementById("patientTopbarName");

  const patientIdInput =
    document.getElementById("appointmentPatientId");

  const appointmentDate =
    document.getElementById("appointmentDate");

  const appointmentError =
    document.getElementById("appointmentError");

  const patientLogout =
    document.getElementById("patientLogout");


  /*
    Load patient information saved during registration.
  */

  const storedPatient =
    localStorage.getItem("mq_patient");


  if (storedPatient) {

    try {

      const patient =
        JSON.parse(storedPatient);


      if (patient.fullName) {

        patientTopbarName.textContent =
          patient.fullName.split(" ")[0];

      }


      if (patient.patientId) {

        patientIdInput.value =
          patient.patientId;

      }

    } catch (error) {

      console.log(
        "Could not load patient information."
      );

    }

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


  /*
    Handle appointment form submission.
  */

  appointmentForm.addEventListener("submit", (event) => {

    event.preventDefault();

    appointmentError.textContent = "";


    const patientId =
      patientIdInput.value.trim();

    const clinic =
      document.getElementById(
        "appointmentClinic"
      ).value;

    const department =
      document.getElementById(
        "appointmentDepartment"
      ).value;

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
      !clinic ||
      !department ||
      !date ||
      !time ||
      !reason
    ) {

      appointmentError.textContent =
        "Please complete all appointment fields.";

      return;

    }


    /*
      Temporary frontend appointment.

      Backend API will replace this later.
    */

    const appointment = {
      patientId,
      clinic,
      department,
      date,
      time,
      reason,
      bookingId: "APT-2026-0458",
      queueNumber: "A-023"
    };


    localStorage.setItem(
      "mq_appointment",
      JSON.stringify(appointment)
    );


    window.location.href =
      "appointment-confirmed.html";

  });


  /*
    Logout
  */

  patientLogout.addEventListener("click", () => {

    localStorage.removeItem("mq_role");

  });

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