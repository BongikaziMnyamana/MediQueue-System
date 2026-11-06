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

  const activeEntries = Array.isArray(data.queue)
    ? data.queue.filter(
        (item) =>
          item.id === selectedPatientId &&
          !["Cancelled", "Completed"].includes(item.status)
      )
    : [];

  const patient =
    activeEntries.sort((a, b) =>
      String(b.queueDate || "").localeCompare(String(a.queueDate || ""))
    )[0] || null;

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
  setText("patientDepartment", patient.dept || "General Medicine");
  setText("patientQueueNumber", patient.no || "No number");
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

  form.addEventListener("submit", async (event) => {
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


    const required = [
      ["bloodPressure", bloodPressure],
      ["temperature", temperature],
      ["heartRate", heartRate],
      ["weight", weight],
      ["symptoms", symptoms]
    ];
    const missing = required.filter(([, value]) => !value);
    if (missing.length) {
      showAssessmentError(
        "Please complete all required assessment fields."
      );
      return;
    }

    if (!patient.entryId) {
      showAssessmentError(
        "This patient is not stored in the server queue yet. Reload the queue and try again."
      );
      return;
    }

    setAssessmentBusy(true);

    // 1. Reuse the visit the patient already has open today, otherwise open one.
    const openVisit = findOpenVisit(patient.id);
    let visitId = openVisit ? openVisit.id : null;
    if (!visitId) {
      const visit = await createVisitAsync({
        visitId: uniqueId("V"),
        patientId: patient.id,
        visitDate: todayIso(),
        checkInTime: new Date().toTimeString().slice(0, 5),
        status: "In Progress"
      });
      if (!visit.ok) {
        setAssessmentBusy(false);
        showAssessmentError(visit.error || "Could not open a visit for this patient.");
        return;
      }
      visitId = (visit.created || {}).visitId || visitId;
    }

    // 2. Store the vitals against that visit.
    const vitals = await createVitalSignsAsync({
      visitId,
      temperature,
      bloodPressure,
      heartRate,
      weight,
      oxygenSaturation,
      respiratoryRate,
      symptoms,
      nurseNotes
    });
    if (!vitals.ok) {
      setAssessmentBusy(false);
      showAssessmentError(vitals.error || "Could not save the vital signs.");
      return;
    }

    // 3. Run the symptom analysis server-side so the result is in the database
    //    and the patient can read it back.
    const analysis = await analyzeSymptomsAsync(patient.id, symptoms);
    if (!analysis.ok) {
      setAssessmentBusy(false);
      showAssessmentError(analysis.error || "Could not save the symptom analysis.");
      return;
    }

    // 4. Tie the visit to the queue entry and hand the patient to the doctor.
    await attachVisitToQueueEntryAsync(patient.entryId, visitId);
    const queued = await setQueueEntryStatusAsync(patient.entryId, "Ready for Doctor");
    if (!queued.ok) {
      setAssessmentBusy(false);
      showAssessmentError(queued.error || "Could not update the queue status.");
      return;
    }

    setAssessmentBusy(false);
    localStorage.removeItem(SELECTED_PATIENT_KEY);
    window.location.href = "nurse-queue.html";
  });
}


// --------------------------------------
// CURRENT VISIT
// --------------------------------------
// Reuses the visit already stored for this patient today, so a nurse does not
// open a second one for the same attendance.
function findOpenVisit(patientId) {
  const data = getData();
  const today = todayIso();
  return (data.visits || []).find(
    (v) => v.patientId === patientId && v.visitDate === today && v.outcome !== "Completed"
  ) || null;
}


// --------------------------------------
// SUBMIT BUTTON STATE
// --------------------------------------
function setAssessmentBusy(busy) {
  const button = document.querySelector(
    "#nurseAssessmentForm button[type='submit']"
  );
  const error = document.getElementById("assessmentError");
  if (error && !busy) error.style.display = "none";
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? "Saving..." : "Complete Assessment";
}


// --------------------------------------
// CURRENT NURSE
// --------------------------------------
function getCurrentNurseName() {
  const data = getData();
  const role = localStorage.getItem("mq_role") || "";
  const profile = (data.profiles && data.profiles.NURSE) || (data.profiles && data.profiles[role]);
  if (profile && profile.name) {
    return profile.name;
  }
  return localStorage.getItem("mq_name") || "Nurse";
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