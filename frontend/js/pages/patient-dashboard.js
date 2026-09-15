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


  /* Close menu after selecting a navigation item */

  sidebar
    .querySelectorAll(".nav-item")
    .forEach(link => {

      link.addEventListener(
        "click",
        closePatientMenu
      );

    });


  /* Escape key closes menu */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closePatientMenu();
      }

    }
  );

});