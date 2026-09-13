// js/pages/doctor-dashboard.js

let consultDraft = {
  complaint: "",
  diagnosis: "",
  notes: ""
};


/* =========================================================
   HELPERS
========================================================= */

function currentPatient(data) {
  return data.queue.find(
    patient => patient.status === "In Consultation"
  );
}


function getTodayLabel() {
  return new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}


/*
  Different parts of the frontend may use different names
  for the vital-signs collection.

  This lets the Doctor dashboard work even if the Nurse
  workflow stores the information as:

  data.vitalSigns
  data.vitals
  data.vital_signs
*/
function getVitalSignsCollection(data) {
  if (Array.isArray(data.vitalSigns)) {
    return data.vitalSigns;
  }

  if (Array.isArray(data.vitals)) {
    return data.vitals;
  }

  if (Array.isArray(data.vital_signs)) {
    return data.vital_signs;
  }

  return [];
}


/*
  Find the most recent vital signs recorded for the
  current patient.

  We check several common property names so that the
  Doctor page can connect to the Nurse workflow without
  breaking older mock data.
*/
function getPatientVitals(data, patient) {
  const vitalSigns = getVitalSignsCollection(data);

  const matches = vitalSigns.filter(vital => {
    const vitalPatientId =
      vital.patientId ||
      vital.patient_id ||
      vital.patientID ||
      "";

    const vitalPatientName =
      vital.patient ||
      vital.patientName ||
      vital.patient_name ||
      "";

    return (
      String(vitalPatientId) === String(patient.id) ||
      String(vitalPatientName).toLowerCase() ===
        String(patient.patient).toLowerCase()
    );
  });

  if (matches.length === 0) {
    return null;
  }

  return matches[matches.length - 1];
}


function getVitalValue(vitals, possibleKeys, fallback = "Not recorded") {
  if (!vitals) {
    return fallback;
  }

  for (const key of possibleKeys) {
    if (
      vitals[key] !== undefined &&
      vitals[key] !== null &&
      vitals[key] !== ""
    ) {
      return vitals[key];
    }
  }

  return fallback;
}


function callNext(data) {
  /*
    If a patient is already in consultation,
    we do not replace them.
  */
  const existing = currentPatient(data);

  if (existing) {
    return existing;
  }

  const nextPatient = data.queue.find(
    patient => patient.status === "Waiting"
  );

  if (!nextPatient) {
    return null;
  }

  nextPatient.status = "In Consultation";

  return nextPatient;
}


/* =========================================================
   DASHBOARD COUNTS
========================================================= */

function getConsultationsToday(data) {
  const today = getTodayISO();

  return data.records.filter(record => {
    return (
      record.visitDate === today ||
      record.date === today ||
      record.createdDate === today
    );
  }).length;
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDoctorDashboard() {
  const data = getData();

  const inConsult = currentPatient(data);

  const waitingCount = data.queue.filter(
    patient => patient.status === "Waiting"
  ).length;


  /* ---------- Summary cards ---------- */

  document.getElementById("waitingCount").textContent =
    waitingCount;

  document.getElementById("seenTodayVal").textContent =
    data.seenToday || 0;

  document.getElementById("consultCount").textContent =
    getConsultationsToday(data);


  /* ---------- Queue label ---------- */

  document.getElementById("queueNoLabel").textContent =
    inConsult
      ? `Queue ${inConsult.no}`
      : "";


  const area = document.getElementById("consultArea");


  /* =====================================================
     NO CURRENT PATIENT
  ===================================================== */

  if (!inConsult) {
    area.innerHTML = `
      <div class="empty-state">
        <div style="margin-bottom:12px;">
          No patient is currently in consultation.
        </div>

        ${
          waitingCount > 0
            ? `
              <button
                class="btn btn-gold"
                type="button"
                id="callNextPatientBtn"
              >
                Call next patient →
              </button>
            `
            : `
              <div style="
                font-size:12px;
                color:var(--slate);
              ">
                There are currently no patients waiting.
              </div>
            `
        }
      </div>
    `;

    const callButton =
      document.getElementById("callNextPatientBtn");

    if (callButton) {
      callButton.addEventListener(
        "click",
        callNextPatient
      );
    }

    return;
  }


  /* =====================================================
     CURRENT PATIENT
  ===================================================== */

  const vitals = getPatientVitals(data, inConsult);


  const temperature = getVitalValue(
    vitals,
    ["temperature", "temp"]
  );

  const systolic = getVitalValue(
    vitals,
    ["systolic", "bpSystolic", "bloodPressureSystolic"],
    ""
  );

  const diastolic = getVitalValue(
    vitals,
    ["diastolic", "bpDiastolic", "bloodPressureDiastolic"],
    ""
  );

  const directBP = getVitalValue(
    vitals,
    ["bp", "bloodPressure"],
    ""
  );

  const bloodPressure =
    directBP ||
    (
      systolic && diastolic
        ? `${systolic}/${diastolic}`
        : "Not recorded"
    );

  const pulse = getVitalValue(
    vitals,
    ["heartRate", "heart_rate", "pulse"]
  );

  const weight = getVitalValue(
    vitals,
    ["weight"]
  );


  area.innerHTML = `

    <div style="padding:20px;">

      <!-- ================= PATIENT DETAILS ================= -->

      <div class="consult-header">

        <div class="consult-avatar">

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 21v-2a6 6 0 0 1 12 0v2"/>
          </svg>

        </div>

        <div>

          <div class="consult-name">
            ${esc(inConsult.patient)}
          </div>

          <div class="consult-meta">

            ${esc(inConsult.id || "")}

            ${
              inConsult.gender
                ? ` · ${esc(inConsult.gender)}`
                : ""
            }

            ${
              inConsult.age
                ? `, ${esc(String(inConsult.age))} yrs`
                : ""
            }

            ${
              inConsult.phone
                ? ` · ${esc(inConsult.phone)}`
                : ""
            }

          </div>

        </div>

      </div>


      <!-- ================= VITAL SIGNS ================= -->

      <div style="
        margin-top:22px;
        margin-bottom:22px;
        padding:18px;
        border:1px solid var(--line);
        border-radius:10px;
        background:var(--bg);
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:15px;
        ">

          <div>

            <div style="
              font-size:13px;
              font-weight:700;
              color:var(--ink);
            ">
              Latest Vital Signs
            </div>

            <div style="
              font-size:11px;
              color:var(--slate);
              margin-top:3px;
            ">
              Recorded by the nursing team
            </div>

          </div>

          ${
            vitals
              ? `
                <span
                  class="badge"
                  style="
                    background:var(--teal-tint);
                    color:var(--teal);
                  "
                >
                  Recorded
                </span>
              `
              : `
                <span
                  style="
                    font-size:11px;
                    color:var(--slate);
                  "
                >
                  No vitals found
                </span>
              `
          }

        </div>


        <div class="consult-grid4">

          <!-- Temperature -->

          <div>

            <div style="
              font-size:11px;
              color:var(--slate);
              margin-bottom:4px;
            ">
              Temperature
            </div>

            <div style="
              font-size:16px;
              font-weight:700;
              color:var(--ink);
            ">
              ${
                temperature !== "Not recorded"
                  ? `${esc(String(temperature))} °C`
                  : "Not recorded"
              }
            </div>

          </div>


          <!-- Blood Pressure -->

          <div>

            <div style="
              font-size:11px;
              color:var(--slate);
              margin-bottom:4px;
            ">
              Blood Pressure
            </div>

            <div style="
              font-size:16px;
              font-weight:700;
              color:var(--ink);
            ">
              ${
                bloodPressure !== "Not recorded"
                  ? `${esc(String(bloodPressure))} mmHg`
                  : "Not recorded"
              }
            </div>

          </div>


          <!-- Heart Rate -->

          <div>

            <div style="
              font-size:11px;
              color:var(--slate);
              margin-bottom:4px;
            ">
              Heart Rate
            </div>

            <div style="
              font-size:16px;
              font-weight:700;
              color:var(--ink);
            ">
              ${
                pulse !== "Not recorded"
                  ? `${esc(String(pulse))} bpm`
                  : "Not recorded"
              }
            </div>

          </div>


          <!-- Weight -->

          <div>

            <div style="
              font-size:11px;
              color:var(--slate);
              margin-bottom:4px;
            ">
              Weight
            </div>

            <div style="
              font-size:16px;
              font-weight:700;
              color:var(--ink);
            ">
              ${
                weight !== "Not recorded"
                  ? `${esc(String(weight))} kg`
                  : "Not recorded"
              }
            </div>

          </div>

        </div>

      </div>


      <!-- ================= CONSULTATION FORM ================= -->

      <div class="field">

        <label>
          Chief complaint
        </label>

        <input
          class="input"
          id="cComplaint"
          type="text"
          placeholder="Reason for today's consultation"
          value="${esc(consultDraft.complaint)}"
        />

      </div>


      <div class="field">

        <label>
          Diagnosis
        </label>

        <input
          class="input"
          id="cDiagnosis"
          type="text"
          placeholder="Enter diagnosis"
          value="${esc(consultDraft.diagnosis)}"
        />

      </div>


      <div class="field">

        <label>
          Consultation notes
        </label>

        <textarea
          class="input"
          id="cNotes"
          rows="4"
          placeholder="Add examination findings, treatment plan or other clinical notes"
        >${esc(consultDraft.notes)}</textarea>

      </div>


      <!-- ================= ACTIONS ================= -->

      <div class="consult-actions">

        <button
          class="btn btn-ghost"
          type="button"
          id="viewHistoryBtn"
        >
          View history
        </button>


        <button
          class="btn btn-primary"
          type="button"
          id="saveRecordBtn"
        >
          Save record
        </button>


        <button
          class="btn btn-gold"
          type="button"
          id="completeConsultBtn"
        >
          Complete & Next Patient →
        </button>

      </div>

    </div>
  `;


  /* =====================================================
     CONSULTATION FORM EVENTS
  ===================================================== */

  document
    .getElementById("cComplaint")
    .addEventListener("input", event => {
      consultDraft.complaint =
        event.target.value;
    });


  document
    .getElementById("cDiagnosis")
    .addEventListener("input", event => {
      consultDraft.diagnosis =
        event.target.value;
    });


  document
    .getElementById("cNotes")
    .addEventListener("input", event => {
      consultDraft.notes =
        event.target.value;
    });


  document
    .getElementById("viewHistoryBtn")
    .addEventListener(
      "click",
      viewPatientHistory
    );


  document
    .getElementById("saveRecordBtn")
    .addEventListener(
      "click",
      saveRecord
    );


  document
    .getElementById("completeConsultBtn")
    .addEventListener(
      "click",
      completeConsultation
    );
}


/* =========================================================
   VALIDATION
========================================================= */

function validateConsultation() {
  if (!consultDraft.complaint.trim()) {
    alert(
      "Please enter the patient's chief complaint."
    );

    document
      .getElementById("cComplaint")
      ?.focus();

    return false;
  }


  if (!consultDraft.diagnosis.trim()) {
    alert(
      "Please enter a diagnosis before saving the consultation."
    );

    document
      .getElementById("cDiagnosis")
      ?.focus();

    return false;
  }


  return true;
}


/* =========================================================
   CREATE / UPDATE PATIENT RECORD
========================================================= */

function saveConsultationRecord(data, patient) {
  const todayISO = getTodayISO();

  /*
    We give the consultation a stable reference linked
    to the current queue entry.

    This allows "Save record" to update the same
    consultation rather than adding duplicates every
    time the Doctor presses Save.
  */
  const consultationRef =
    `CONS-${patient.no}`;


  const existingIndex =
    data.records.findIndex(record =>
      record.consultationRef === consultationRef
    );


  const record = {
    consultationRef: consultationRef,

    patient: patient.patient,

    patientId: patient.id,

    complaint:
      consultDraft.complaint.trim(),

    diagnosis:
      consultDraft.diagnosis.trim(),

    notes:
      consultDraft.notes.trim(),

    /*
      Keep condition and lastVisit because the existing
      doctor-records.js currently expects those fields.
    */
    condition:
      consultDraft.diagnosis.trim(),

    lastVisit:
      getTodayLabel(),

    visitDate:
      todayISO,

    doctor:
      "Dr. N. Zulu",

    department:
      patient.dept || "General Medicine",

    queueNo:
      patient.no,

    status:
      "Completed"
  };


  if (existingIndex !== -1) {
    data.records[existingIndex] = {
      ...data.records[existingIndex],
      ...record
    };
  } else {
    data.records.unshift(record);
  }
}


/* =========================================================
   SAVE RECORD
========================================================= */

function saveRecord() {
  if (!validateConsultation()) {
    return;
  }


  const data = getData();

  const patient = currentPatient(data);


  if (!patient) {
    alert(
      "There is no patient currently in consultation."
    );

    return;
  }


  saveConsultationRecord(
    data,
    patient
  );


  setData(data);


  alert(
    "Consultation record saved successfully."
  );


  renderDoctorDashboard();
}


/* =========================================================
   COMPLETE CONSULTATION
========================================================= */

function completeConsultation() {
  if (!validateConsultation()) {
    return;
  }


  const data = getData();

  const patient = currentPatient(data);


  if (!patient) {
    return;
  }


  /*
    Save the consultation before removing the patient.
  */
  saveConsultationRecord(
    data,
    patient
  );


  /*
    Remove the completed patient from the active queue.
  */
  data.queue = data.queue.filter(
    item => item.no !== patient.no
  );


  /*
    Count patient as seen today.
  */
  data.seenToday =
    (data.seenToday || 0) + 1;


  /*
    Automatically call the next waiting patient.
  */
  callNext(data);


  setData(data);


  /*
    Clear the Doctor's form for the next patient.
  */
  consultDraft = {
    complaint: "",
    diagnosis: "",
    notes: ""
  };


  alert(
    `${patient.patient}'s consultation has been completed.`
  );


  renderDoctorDashboard();
}


/* =========================================================
   CALL NEXT PATIENT
========================================================= */

function callNextPatient() {
  const data = getData();

  const patient = callNext(data);


  if (!patient) {
    alert(
      "There are no patients waiting in the queue."
    );

    return;
  }


  setData(data);


  consultDraft = {
    complaint: "",
    diagnosis: "",
    notes: ""
  };


  renderDoctorDashboard();
}


/* =========================================================
   VIEW PATIENT HISTORY
========================================================= */

function viewPatientHistory() {
  const data = getData();

  const patient = currentPatient(data);


  if (!patient) {
    return;
  }


  /*
    Store the selected patient so the Patient Records
    page can use it when we upgrade that page next.
  */
  localStorage.setItem(
    "mq_selected_patient_id",
    patient.id || ""
  );

  localStorage.setItem(
    "mq_selected_patient_name",
    patient.patient || ""
  );


  window.location.href =
    "doctor-records.html";
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  renderDoctorDashboard
);