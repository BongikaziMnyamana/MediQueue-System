// js/pages/nurse-assessment.js

const SELECTED_PATIENT_KEY = "mq_selected_patient_id";

function loadNurseAssessmentPage() {
  const data = getData();

  const selectedPatientId =
    localStorage.getItem(SELECTED_PATIENT_KEY);

  if (!selectedPatientId) {
    window.location.href = "nurse-queue.html";
    return;
  }

  const patient =
    Array.isArray(data.queue)
      ? data.queue.find(
          (item) => item.id === selectedPatientId
        )
      : null;

  if (!patient) {
    localStorage.removeItem(SELECTED_PATIENT_KEY);
    window.location.href = "nurse-queue.html";
    return;
  }

  populatePatientDetails(patient);
  setupAssessmentForm(patient);
}


// --------------------------------------
// PATIENT DETAILS
// --------------------------------------
function populatePatientDetails(patient) {
  setText("patientName", patient.patient || "-");
  setText("patientId", patient.id || "-");
  setText("patientDepartment", patient.dept || "-");
  setText("patientQueueNumber", patient.no || "-");
  setText("patientAge", patient.age ?? "-");
  setText("patientGender", patient.gender || "-");
  setText("patientPhone", patient.phone || "-");
}


// --------------------------------------
// FORM SUBMISSION
// --------------------------------------
function setupAssessmentForm(patient) {
  const form =
    document.getElementById("nurseAssessmentForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const bloodPressure =
      document.getElementById("bloodPressure").value.trim();

    const temperature =
      document.getElementById("temperature").value.trim();

    const heartRate =
      document.getElementById("heartRate").value.trim();

    const weight =
      document.getElementById("weight").value.trim();

    const oxygenSaturation =
      document.getElementById("oxygenSaturation").value.trim();

    const respiratoryRate =
      document.getElementById("respiratoryRate").value.trim();

    const symptoms =
      document.getElementById("symptoms").value.trim();

    const nurseNotes =
      document.getElementById("nurseNotes").value.trim();


    if (
      !bloodPressure ||
      !temperature ||
      !heartRate ||
      !weight ||
      !symptoms
    ) {
      showAssessmentError(
        "Please complete all required assessment fields."
      );
      return;
    }


    const assessment = {
      patientId: patient.id,
      patientName: patient.patient,
      queueNumber: patient.no,
      department: patient.dept,

      bloodPressure: bloodPressure,
      temperature: Number(temperature),
      heartRate: Number(heartRate),
      weight: Number(weight),

      oxygenSaturation:
        oxygenSaturation
          ? Number(oxygenSaturation)
          : null,

      respiratoryRate:
        respiratoryRate
          ? Number(respiratoryRate)
          : null,

      symptoms: symptoms,

      nurseNotes: nurseNotes,

      assessedBy: getCurrentNurseName(),

      assessedAt: new Date().toISOString(),

      status: "Completed"
    };


    saveAssessment(assessment);

    updatePatientQueueStatus(
      patient.id,
      "Ready for Doctor"
    );

    localStorage.removeItem(
      SELECTED_PATIENT_KEY
    );

    window.location.href =
      "nurse-queue.html";
  });
}


// --------------------------------------
// SAVE VITAL SIGNS / ASSESSMENT
// --------------------------------------
function saveAssessment(assessment) {
  const data = getData();

  /*
    data.js does not currently contain a vitalSigns
    collection, so create it the first time a nurse
    completes an assessment.
  */

  if (!Array.isArray(data.vitalSigns)) {
    data.vitalSigns = [];
  }


  /*
    Remove any existing frontend assessment for the
    same patient and queue number so duplicate clicks
    do not create multiple identical assessments.
  */

  data.vitalSigns =
    data.vitalSigns.filter(
      (item) =>
        !(
          item.patientId === assessment.patientId &&
          item.queueNumber === assessment.queueNumber
        )
    );


  data.vitalSigns.push(assessment);

  setData(data);
}


// --------------------------------------
// UPDATE QUEUE STATUS
// --------------------------------------
function updatePatientQueueStatus(
  patientId,
  newStatus
) {
  const data = getData();

  if (!Array.isArray(data.queue)) {
    return;
  }

  const patient =
    data.queue.find(
      (item) => item.id === patientId
    );

  if (!patient) {
    return;
  }

  patient.status = newStatus;

  setData(data);
}


// --------------------------------------
// CURRENT NURSE
// --------------------------------------
function getCurrentNurseName() {
  const data = getData();

  const profile =
    data.profiles &&
    data.profiles.NURSE;

  if (profile && profile.name) {
    return profile.name;
  }

  return "Nurse";
}


// --------------------------------------
// SAFE TEXT HELPER
// --------------------------------------
function setText(elementId, value) {
  const element =
    document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}


// --------------------------------------
// ERROR MESSAGE
// --------------------------------------
function showAssessmentError(message) {
  const errorElement =
    document.getElementById("assessmentError");

  if (!errorElement) {
    return;
  }

  errorElement.textContent = message;
  errorElement.style.display = "block";
}


// --------------------------------------
// START PAGE
// --------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  loadNurseAssessmentPage
);