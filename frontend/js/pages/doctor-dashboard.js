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
  const doctorId = currentDoctorId(data);
  if (!doctorId) {
    return null;
  }
  return data.queue.find(
    patient =>
      patient.status === "In Consultation" &&
      patient.doctorId === doctorId
  );
}

// Every patient assigned to the signed-in doctor, excluding closed entries.
// A patient who is Ready for Doctor must show even if their queue entry was
// opened on an earlier day — they are still waiting to be called.
function doctorQueue(data, doctorId) {
  return (data.queue || []).filter(
    (entry) =>
      entry.doctorId === doctorId &&
      !["Cancelled", "Completed"].includes(entry.status)
  );
}

function isNurseReady(entry) {
  return Boolean(
    entry &&
      String(entry.status || "").trim().toLowerCase() === "ready for doctor"
  );
}

function findQueueEntryForPatient(patientId, doctorId) {
  if (!patientId) {
    return null;
  }
  return (getData().queue || []).find(
    (entry) =>
      entry.patientId === patientId &&
      entry.doctorId === doctorId &&
      !["Cancelled", "Completed"].includes(entry.status)
  ) || null;
}

function waitingPatients(data, doctorId) {
  // The doctor may only call patients the nurse has assessed and marked
  // "Ready for Doctor". A patient who is still waiting for vitals must not be
  // pulled into the consultation from here.
  return doctorQueue(data, doctorId).filter(isNurseReady);
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
    If a patient is already in consultation with this doctor,
    we do not replace them.
  */
  const existing = currentPatient(data);

  if (existing) {
    return existing;
  }

  const doctorId = currentDoctorId(data);
  const nextPatient = waitingPatients(data, doctorId)[0];

  if (!nextPatient) {
    return null;
  }

  /*
    Mark the patient in the cache so the form has somebody to work on; the
    status itself is written to the database by the caller.
  */
  nextPatient.status = "In Consultation";

  return nextPatient;
}


/* =========================================================
   DASHBOARD COUNTS
========================================================= */

function getConsultationsToday(data) {
  const today = getTodayISO();
  const doctorId = currentDoctorId(data);

  return data.records.filter(record => {
    const onToday =
      record.visitDate === today ||
      record.date === today ||
      record.createdDate === today;
    return onToday && doctorId && record.doctorId === doctorId;
  }).length;
}


// How many distinct patients this doctor has actually seen today, counted from
// the records, visits and appointments that belong to them.
function countSeenTodayForDoctor() {
  const data = getData();
  const today = getTodayISO();
  const doctorId = currentDoctorId(data);
  if (!doctorId) return 0;
  const seen = new Set();

  (data.records || []).forEach(record => {
    const onToday = record.visitDate === today || record.date === today || record.createdDate === today;
    if (onToday && record.doctorId === doctorId && record.patientId) seen.add(record.patientId);
  });

  (data.visits || []).forEach(visit => {
    if (visit.visitDate === today && visit.doctorId === doctorId && visit.patientId) {
      seen.add(visit.patientId);
    }
  });

  (data.appointments || []).forEach(appointment => {
    if (
      appointment.date === today &&
      appointment.doctorId === doctorId &&
      appointment.patientId &&
      (appointment.status === "Completed" || appointment.status === "Checked In")
    ) {
      seen.add(appointment.patientId);
    }
  });

  return seen.size;
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDoctorDashboard() {
  const data = getData();

  const inConsult = currentPatient(data);

  const profile = (data.profiles || {})[String(localStorage.getItem("mq_role") || "").toUpperCase()] || {};
  const sub = document.getElementById("doctorPageSub");
  if (sub) {
    sub.textContent = [profile.name, profile.department].filter(Boolean).join(" — ") || "Doctor dashboard";
  }

  const doctorId = currentDoctorId(data);
  const waitingCount = waitingPatients(data, doctorId).length;


  /* ---------- Summary cards ---------- */

  document.getElementById("waitingCount").textContent =
    waitingCount;

  document.getElementById("seenTodayVal").textContent =
    countSeenTodayForDoctor();

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
              inConsult.dept
                ? ` · ${esc(inConsult.dept)}`
                : ""
            }

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

// The signed-in doctor, taken from the session the backend issued. There is
// deliberately no "first doctor" fallback: a doctor must never see another
// doctor's patients just because their own staff row failed to load.
function currentDoctor(data) {
  const staffId = localStorage.getItem("mq_staffId");
  if (!staffId) {
    return null;
  }
  return (data.users || []).find(u => u.id === staffId) || null;
}

function currentDoctorId(data) {
  const doctor = currentDoctor(data);
  return doctor ? doctor.id : (localStorage.getItem("mq_staffId") || null);
}

function currentDoctorName(data) {
  const doctor = currentDoctor(data);
  return doctor ? doctor.name : "";
}

// Writes the consultation to the database. A record for the same patient on the
// same day is updated instead of duplicated, so pressing save twice is safe.
async function saveConsultationRecord(patient) {
  const data = getData();
  const doctorId = currentDoctorId(data);
  if (!doctorId) {
    return { ok: false, error: "Your staff record could not be found on the server." };
  }

  const recordDate = getTodayISO();
  const consultationRef = `CONS-${patient.no || patient.entryId || patient.id}`;
  // The cache reference is lost on a full re-sync, so an existing record for
  // this patient on this date counts as the same consultation.
  const existing = (data.records || []).find(
    (record) =>
      record.doctorId === doctorId &&
      (record.consultationRef === consultationRef ||
        (record.patientId === patient.id &&
          (record.visitDate === recordDate || record.date === recordDate)))
  );
  const complaint = consultDraft.complaint.trim();
  const notes = complaint
    ? `${complaint}\n${consultDraft.notes.trim()}`.trim()
    : consultDraft.notes.trim();

  if (existing) {
    const updated = await apiRequest("PUT", "/medical-record/update", {
      recordId: existing.recordId,
      patient: { type: "patient", userId: patient.id },
      createdBy: { type: "staff", userId: doctorId },
      complaint,
      diagnosis: consultDraft.diagnosis.trim(),
      notes,
      recordDate,
    });
    if (!updated.ok) {
      return { ok: false, status: updated.status, error: "Could not update the consultation record on the server." };
    }
    return { ok: true };
  }

  const created = await createMedicalRecordAsync({
    recordId: uniqueId("REC"),
    patientId: patient.id,
    doctorId,
    complaint,
    diagnosis: consultDraft.diagnosis.trim(),
    notes,
    recordDate,
  });
  if (!created.ok) {
    return { ok: false, status: created.status, error: created.error };
  }

  // Keep the queue reference the records list uses for display.
  const fresh = getData();
  const saved = (fresh.records || []).find(r => r.recordId === (created.created || {}).recordId);
  if (saved) {
    saved.consultationRef = consultationRef;
    saved.complaint = complaint;
    saved.department = patient.dept || "";
    saved.queueNo = patient.no || "";
    saved.status = "Completed";
    saved.doctor = currentDoctorName(fresh);
    setData(fresh);
  }
  return { ok: true };
}


/* =========================================================
   SAVE RECORD
   ========================================================= */

async function saveRecord() {
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


  const saved = await saveConsultationRecord(patient);

  if (!saved.ok) {
    alert(saved.error || "Consultation record could not be saved to the server.");
    return;
  }


  alert(
    "Consultation record saved successfully."
  );


  renderDoctorDashboard();
}


/* =========================================================
   COMPLETE CONSULTATION
   ========================================================= */

async function completeConsultation() {
  if (!validateConsultation()) {
    return;
  }


  const data = getData();

  const patient = currentPatient(data);


  if (!patient) {
    return;
  }


  // Save the consultation first: if that fails nothing else is changed.
  const saved = await saveConsultationRecord(patient);

  if (!saved.ok) {
    alert(saved.error || "Consultation record could not be saved to the server.");
    return;
  }


  // Then close the queue entry on the server.
  if (patient.entryId) {
    const queued = await setQueueEntryStatusAsync(patient.entryId, "Completed");

    if (!queued.ok) {
      alert(queued.error || "Could not update the queue on the server.");
      return;
    }
  } else {
    alert("This patient has no stored queue entry, so the queue was not updated.");
    return;
  }


  // Keep the appointment list in step with the consultation: the booking this
  // doctor saw today is marked Completed rather than left "Confirmed".
  const doctorId = currentDoctorId(data);
  const appointment = (getData().appointments || []).find(
    (a) =>
      a.patientId === patient.id &&
      a.doctorId === doctorId &&
      a.date === getTodayISO() &&
      !["Completed", "Cancelled"].includes(a.status)
  );
  if (appointment) {
    const apptUpdated = await updateAppointmentStatusAsync(appointment.id, "Completed");
    if (!apptUpdated.ok) {
      alert(apptUpdated.error || "The queue was updated but the appointment could not be completed.");
      return;
    }
  }


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
  loadDoctorAppointments();
}


/* =========================================================
   CALL NEXT PATIENT
   ========================================================= */

async function callNextPatient() {
  const data = getData();

  const patient = callNext(data);


  if (!patient) {
    alert(
      "There are no patients waiting in the queue."
    );

    return;
  }


  if (!patient.entryId) {
    alert("This patient is not stored in the server queue. Reload the page to sync from the database.");
    renderDoctorDashboard();
    return;
  }


  /*
    Persist the "In Consultation" status on the backend.
  */
  const updated = await setQueueEntryStatusAsync(patient.entryId, "In Consultation");

  if (!updated.ok) {
    alert(updated.error || "Could not update the queue on the server.");
    renderDoctorDashboard();
    return;
  }


  consultDraft = {
    complaint: "",
    diagnosis: "",
    notes: ""
  };


  renderDoctorDashboard();
  loadDoctorAppointments();
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
   MY APPOINTMENTS
========================================================= */

function getAppointmentPatientName(appointment) {
  const patient = appointment.patient;
  if (!patient) {
    return "Unknown patient";
  }
  const name = patient.name || patient.patientName || patient.patient || "";
  const id = patient.patientId || patient.userId || "";
  return name ? `${name}${id ? " · " + id : ""}` : (id || "Unknown patient");
}

function getAppointmentLabel(appointment) {
  const clinic = appointment.clinic && appointment.clinic.clinicName;
  const dept = appointment.department && appointment.department.departmentName;
  return [clinic, dept].filter(Boolean).join(" · ") || "Clinic visit";
}

async function loadDoctorAppointments() {
  const listEl = document.getElementById("doctorAppointmentsList");
  if (!listEl) {
    return;
  }

  const doctorId = localStorage.getItem("mq_staffId");

  if (!doctorId) {
    listEl.innerHTML =
      '<div class="admin-appointments-empty" style="font-size:13px;color:var(--slate);padding:12px 0;">Log in again to display your appointments.</div>';
    return;
  }

  const res = await apiRequest("GET", "/appointment/doctor/" + encodeURIComponent(doctorId));

  if (!res.ok) {
    listEl.innerHTML =
      '<div style="font-size:13px;color:var(--slate);padding:12px 0;">Could not load appointments.</div>';
    return;
  }

  const appointments = Array.isArray(res.data) ? res.data : [];
  const inConsultation = currentPatient(getData());
  const today = todayIso();

  const statusOrder = {
    Confirmed: 0,
    Scheduled: 1,
    Pending: 2,
    Completed: 3,
    Cancelled: 4
  };

  const sorted = [...appointments].sort((a, b) => {
    const byStatus = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (byStatus !== 0) {
      return byStatus;
    }
    return String(a.scheduledDate).localeCompare(String(b.scheduledDate));
  });

  if (sorted.length === 0) {
    listEl.innerHTML =
      '<div style="font-size:13px;color:var(--slate);padding:12px 0;">No appointments have been assigned to you yet.</div>';
    return;
  }

  const doctorIdForQueue = currentDoctorId(getData());

  listEl.innerHTML = sorted.map(appointment => {
    const patientId = appointment.patient && appointment.patient.userId;
    const queueEntry = findQueueEntryForPatient(patientId, doctorIdForQueue);
    const readyForDoctor = isNurseReady(queueEntry);

    return `
    <div style="
      display:flex;
      align-items:center;
      gap:14px;
      padding:14px 0;
      border-bottom:1px solid var(--line, #e9ebf0);
    ">
      <div style="
        min-width:44px;
        text-align:center;
      ">
        <div style="
          font-size:20px;
          font-weight:800;
          color:var(--ink, #132238);
          line-height:1;
        ">
          ${esc(formatDay(appointment.scheduledDate))}
        </div>
        <div style="
          font-size:10px;
          color:var(--slate, #6b7280);
          margin-top:3px;
          text-transform:uppercase;
        ">
          ${esc(formatMonth(appointment.scheduledDate))}
        </div>
      </div>

      <div style="flex:1;min-width:0;">
        <div style="
          font-size:14px;
          font-weight:700;
          color:var(--ink, #132238);
        ">
          ${esc(getAppointmentPatientName(appointment))}
        </div>
        <div style="
          font-size:12px;
          color:var(--slate, #6b7280);
          margin-top:2px;
        ">
          ${esc(appointment.reason || "General consultation")}
        </div>
        <div style="
          font-size:12px;
          color:var(--teal, #0d9488);
          margin-top:2px;
        ">
          ${esc(getAppointmentLabel(appointment))} ·
          ${esc(appointment.scheduledTime || "TBC")}
        </div>
      </div>

      <div style="
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:7px;
      ">
        <span class="badge" style="
          background:${appointment.status === "Confirmed" ? "var(--teal-tint, #e0f2f1)" : "var(--gold-tint, #fff4d6)"};
          color:${appointment.status === "Confirmed" ? "var(--teal, #0d9488)" : "var(--gold, #b8860b)"};
          white-space:nowrap;
        ">
          ${esc(appointment.status || "Scheduled")}
        </span>

        ${
          inConsultation && patientId && inConsultation.id === patientId
            ? `
              <span class="badge" style="
                background:var(--teal-tint, #e0f2f1);
                color:var(--teal, #0d9488);
                white-space:nowrap;
              ">
                In consultation
              </span>
            `
            : appointment.status !== "Completed" &&
              appointment.status !== "Cancelled" &&
              appointment.scheduledDate === today
              ? readyForDoctor
                ? `
                  <button
                    class="btn btn-primary btn-sm"
                    type="button"
                    data-start-appointment="${esc(appointment.appointmentId || "")}"
                    data-patient-id="${esc(patientId || "")}"
                  >
                    Start consultation
                  </button>
                `
                : `
                  <span class="badge" style="
                    background:var(--gold-tint, #fff4d6);
                    color:var(--gold, #b8860b);
                    white-space:nowrap;
                  ">
                    Awaiting nurse assessment
                  </span>
                `
              : ""
        }
      </div>
    </div>
  `;
  }).join("");
}

// A doctor can start a consultation straight from their appointment list,
// which is the missing link between an assigned booking and the queue.
async function startAppointmentConsultation(appointmentId, patientId) {
  if (!patientId) {
    alert("This appointment has no patient record.");
    return;
  }

  const data = getData();
  const doctorId = currentDoctorId(data);

  const appointment = (data.appointments || []).find((a) => a.id === appointmentId);
  if (appointment && appointment.date && appointment.date !== todayIso()) {
    alert("This appointment is booked for another day, so it cannot be started today.");
    return;
  }

  let entry = (data.queue || []).find(
    (q) =>
      q.patientId === patientId &&
      q.doctorId === doctorId &&
      !["Cancelled", "Completed"].includes(q.status)
  );

  if (!entry) {
    // The cache may predate a booking made in another tab/session, so ask the
    // server before creating a second queue entry for the same patient.
    await refreshQueueFromApiAsync();
    const refreshed = getData();
    entry = (refreshed.queue || []).find(
      (q) =>
        q.patientId === patientId &&
        q.doctorId === doctorId &&
        !["Cancelled", "Completed"].includes(q.status)
    );
  }

  if (!entry) {
    const created = await createQueueEntryAsync({
      patientId,
      doctorId,
      status: "Waiting",
    });
    if (!created.ok) {
      alert(created.error || "Could not add this patient to the queue.");
      return;
    }
    const fresh = getData();
    entry = (fresh.queue || []).find(
      (q) => q.entryId === ((created.created || {}).queueEntryId)
    );
  }

  if (!entry || !entry.entryId) {
    alert("This patient is not in the server queue yet. Reload the page and try again.");
    return;
  }

  if (entry.status !== "In Consultation" && !isNurseReady(entry)) {
    alert("This patient must be assessed by a nurse before the consultation can start.");
    renderDoctorDashboard();
    loadDoctorAppointments();
    return;
  }

  const inProgress = currentPatient(getData());
  if (inProgress && inProgress.entryId !== entry.entryId) {
    alert("Please complete the current consultation before starting another patient.");
    return;
  }

  if (entry.status !== "In Consultation") {
    const updated = await setQueueEntryStatusAsync(entry.entryId, "In Consultation");
    if (!updated.ok) {
      alert(updated.error || "Could not start the consultation on the server.");
      return;
    }
  }

  consultDraft = { complaint: "", diagnosis: "", notes: "" };
  renderDoctorDashboard();
  loadDoctorAppointments();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-start-appointment]");
  if (!button) {
    return;
  }
  button.disabled = true;
  button.textContent = "Starting...";
  await startAppointmentConsultation(
    button.getAttribute("data-start-appointment"),
    button.getAttribute("data-patient-id")
  );
  // A successful start re-renders the list, so only a failed start still has
  // this button in the document and needs its label restored.
  if (document.body.contains(button)) {
    button.disabled = false;
    button.textContent = "Start consultation";
  }
});

function formatDay(dateValue) {
  if (!dateValue) {
    return "--";
  }
  return String(dateValue).slice(8, 10).replace(/^0/, "");
}

function formatMonth(dateValue) {
  if (!dateValue) {
    return "";
  }
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = parseInt(String(dateValue).slice(5, 7), 10);
  return months[month - 1] || "";
}


/* =========================================================
   START
========================================================= */

async function refreshDoctorQueue() {
  if (typeof refreshQueueFromApiAsync !== "function") {
    return false;
  }
  return refreshQueueFromApiAsync();
}

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await refreshDoctorQueue();
    renderDoctorDashboard();
    loadDoctorAppointments();
  }
);

// The nurse may complete an assessment in another tab. Re-read the queue when
// the doctor returns to this page so the "Start consultation" button appears
// as soon as the patient is Ready for Doctor.
window.addEventListener("focus", async () => {
  if (await refreshDoctorQueue()) {
    renderDoctorDashboard();
    loadDoctorAppointments();
  }
});