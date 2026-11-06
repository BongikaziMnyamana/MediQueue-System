// js/pages/patient-medical-record.js
// Everything on this page comes from the rows the API returned for the signed-in
// patient; there is no sample patient, visit or prescription baked in.

document.addEventListener("DOMContentLoaded", () => {
  const data = getData();
  const patientId = localStorage.getItem("mq_patientId") || localStorage.getItem("mq_userId") || "";
  const patient = (data.patients || []).find((p) => p.id === patientId) || {};

  const firstName = (patient.name || "").split(" ")[0];
  document.getElementById("patientTopbarName").textContent = firstName || "Patient";
  document.getElementById("medicalPatientName").textContent = patient.name || "—";
  document.getElementById("medicalPatientId").textContent = patient.id || "—";
  document.getElementById("medicalPatientGender").textContent = patient.gender || "—";
  document.getElementById("medicalAllergies").textContent = patient.allergies || "None recorded";

  if (patient.dateOfBirth) {
    document.getElementById("medicalPatientDob").textContent = new Date(`${patient.dateOfBirth}T00:00:00`)
      .toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  } else {
    document.getElementById("medicalPatientDob").textContent = "—";
  }

  renderPatientVisits(data, patientId);
  renderPatientPrescriptions(data, patientId);

  document.getElementById("patientLogout").addEventListener("click", async () => {
    await logoutAsync();
    localStorage.removeItem("mq_role");
  });
});

function formatLongDate(value) {
  if (!value) return "—";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function visitIcon() {
  return `<div class="medical-visit-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v20"></path><path d="M2 12h20"></path>
      </svg>
    </div>`;
}

function renderPatientVisits(data, patientId) {
  const list = document.getElementById("medicalVisitList");
  if (!list) return;

  // A visit row and the medical record written for it are both shown, so the
  // history matches what the clinician actually saved.
  const visits = (data.visits || [])
    .filter((v) => v.patientId === patientId)
    .sort((a, b) => String(b.visitDate || "").localeCompare(String(a.visitDate || "")));
  const records = (data.records || [])
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => String(b.visitDate || b.date || "").localeCompare(String(a.visitDate || a.date || "")));

  const rows = [];

  visits.forEach((visit) => {
    const record = records.find((r) => r.recordDate === visit.visitDate) || {};
    rows.push(`
      <div class="medical-visit-item">
        ${visitIcon()}
        <div class="medical-visit-info">
          <div class="medical-visit-title">${esc(record.diagnosis || "Clinic visit")}</div>
          <div class="medical-visit-description">${esc(record.doctor || "Doctor not recorded")}</div>
          <div class="medical-visit-date">${esc(formatLongDate(visit.visitDate))}</div>
        </div>
        <span class="medical-visit-status">${esc(visit.outcome || visit.status || "—")}</span>
      </div>`);
  });

  records
    .filter((r) => !visits.some((v) => v.visitDate === r.visitDate || v.visitDate === r.date))
    .forEach((record) => {
      rows.push(`
        <div class="medical-visit-item">
          ${visitIcon()}
          <div class="medical-visit-info">
            <div class="medical-visit-title">${esc(record.diagnosis || "Consultation")}</div>
            <div class="medical-visit-description">${esc(record.doctor || "Doctor not recorded")}</div>
            <div class="medical-visit-date">${esc(formatLongDate(record.visitDate || record.date))}</div>
          </div>
          <span class="medical-visit-status">Recorded</span>
        </div>`);
    });

  const latestNote = records.find((r) => r.notes);
  if (latestNote) {
    document.getElementById("medicalNoteBox").style.display = "block";
    document.getElementById("medicalNoteText").textContent = latestNote.notes;
  }

  list.innerHTML = rows.length
    ? rows.join("")
    : `<div class="medical-visit-item"><div class="medical-visit-info"><div class="medical-visit-title">No visits recorded yet.</div></div></div>`;
}

function renderPatientPrescriptions(data, patientId) {
  const list = document.getElementById("medicalPrescriptionList");
  if (!list) return;

  const prescriptions = (data.prescriptions || [])
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => String(b.prescribedDate || "").localeCompare(String(a.prescribedDate || "")));

  list.innerHTML = prescriptions.length
    ? prescriptions.map((p) => `
        <div class="medical-prescription-item">
          <div>
            <div class="medical-prescription-name">${esc(p.medication || "Medication")}</div>
            <div class="medical-prescription-dosage">${esc(p.dosage || "—")}${p.instructions ? ` • ${esc(p.instructions)}` : ""}</div>
          </div>
          <span class="medical-prescription-badge">${esc(p.status || "Pending")}</span>
        </div>`).join("")
    : `<div class="medical-prescription-item"><div><div class="medical-prescription-name">No prescriptions yet.</div></div></div>`;
}

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

      if (
        event.key === "Escape"
      ) {
        closePatientMenu();
      }

    }
  );

});
