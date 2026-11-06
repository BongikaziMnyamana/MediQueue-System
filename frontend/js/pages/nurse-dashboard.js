// js/pages/nurse-dashboard.js

function renderNurseDashboard() {
  const data = getData();

  const profile =
    data.profiles && data.profiles.NURSE
      ? data.profiles.NURSE
      : { name: "Nurse" };

  // -----------------------------
  // WELCOME / PROFILE
  // -----------------------------
  const welcomeMsg = document.getElementById("welcomeMsg");
  if (welcomeMsg) {
    welcomeMsg.textContent = `Welcome, ${profile.name}`;
  }

  const userName = document.querySelector(".user-name");
  if (userName) {
    userName.textContent = profile.name;
  }

  const dateLabel = document.getElementById("dateLabel");
  if (dateLabel) {
    dateLabel.textContent = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }


  // -----------------------------
  // DASHBOARD COUNTS
  // -----------------------------
  const waitingPatients =
    Array.isArray(data.queue)
      ? data.queue.filter((patient) => isAwaitingNurseStatus(patient.status))
      : [];

  const patientsSeenToday =
    typeof data.seenToday === "number"
      ? data.seenToday
      : 0;

  /*
    Assessments are the vital-signs rows recorded by the nursing team. A
    waiting patient only needs vitals while they have no assessment yet.
  */

  const assessments =
    Array.isArray(data.vitalSigns)
      ? data.vitalSigns
      : [];

  const assessedPatientIds = new Set(
    assessments.map((assessment) => assessment.patientId).filter(Boolean)
  );

  const pendingVitals =
    waitingPatients.filter(
      (patient) => !assessedPatientIds.has(patient.id)
    );

  const completedAssessments =
    assessments;


  setText(
    "patientsWaitingCount",
    waitingPatients.length
  );

  setText(
    "patientsSeenCount",
    patientsSeenToday
  );

  setText(
    "pendingVitalsCount",
    pendingVitals.length
  );

  setText(
    "completedAssessmentsCount",
    completedAssessments.length
  );


  // -----------------------------
  // CURRENT PATIENT QUEUE
  // -----------------------------
  renderNurseQueue(waitingPatients);


  // -----------------------------
  // RECENT ACTIVITY
  // -----------------------------
  renderRecentActivity(data);
}


// --------------------------------------
// HELPER: SET TEXT SAFELY
// --------------------------------------
function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}


// --------------------------------------
// CURRENT QUEUE
// --------------------------------------
function renderNurseQueue(waitingPatients) {
  const queueContainer =
    document.getElementById("nurseQueueList");

  if (!queueContainer) {
    return;
  }

  if (!waitingPatients.length) {
    queueContainer.innerHTML = `
      <div
        style="
          padding:24px 0;
          text-align:center;
          color:var(--slate);
          font-size:13px;
        "
      >
        No patients are currently waiting for nurse assessment.
      </div>
    `;

    return;
  }


  // Only show the first 4 patients on the dashboard.
  const dashboardPatients =
    waitingPatients.slice(0, 4);


  queueContainer.innerHTML =
    dashboardPatients
      .map((patient) => {

        return `
          <div
            style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              gap:18px;
              padding:15px 0;
              border-bottom:1px solid var(--line);
            "
          >

            <div
              style="
                display:flex;
                align-items:center;
                gap:12px;
                min-width:0;
              "
            >

              <div
                style="
                  width:38px;
                  height:38px;
                  border-radius:50%;
                  background:var(--teal-tint);
                  color:var(--teal);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:13px;
                  font-weight:800;
                  flex-shrink:0;
                "
              >
                ${getInitials(patient.patient)}
              </div>


              <div>

                <div
                  style="
                    font-size:13px;
                    font-weight:700;
                    color:var(--ink);
                  "
                >
                  ${escapeHtml(patient.patient)}
                </div>

                <div
                  style="
                    font-size:11px;
                    color:var(--slate);
                    margin-top:3px;
                  "
                >
                  ${escapeHtml(queueNoLabel(patient))}
                  &nbsp;•&nbsp;
                  ${escapeHtml(patient.dept)}
                </div>

              </div>

            </div>


            <div
              style="
                display:flex;
                align-items:center;
                gap:14px;
              "
            >

              <div
                style="
                  text-align:right;
                "
              >

                <div
                  style="
                    font-size:11px;
                    font-weight:700;
                    color:var(--gold-dark);
                  "
                >
                  ${escapeHtml(patient.wait)}
                </div>

                <div
                  style="
                    font-size:10px;
                    color:var(--slate);
                    margin-top:2px;
                  "
                >
                  ${
                    patient.status === "In Assessment"
                      ? "Being assessed"
                      : "Waiting"
                  }
                </div>

              </div>


              ${
                patient.status !== "In Assessment"
                  ? `
                    <a
                      href="nurse-queue.html"
                      class="btn btn-primary btn-sm"
                      style="
                        text-decoration:none;
                        white-space:nowrap;
                      "
                    >
                      Assess
                    </a>
                  `
                  : `
                    <button
                      class="btn btn-primary btn-sm"
                      disabled
                      style="
                        white-space:nowrap;
                      "
                    >
                      Being assessed
                    </button>
                  `
              }

            </div>

          </div>
        `;
      })
      .join("");
}


function formatActivityTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit"
  });
}


// --------------------------------------
// RECENT ACTIVITY
// --------------------------------------
function renderRecentActivity(data) {
  const activityContainer =
    document.getElementById("nurseRecentActivity");

  if (!activityContainer) {
    return;
  }

  // Derived from the real vital-signs and queue rows, never from a
  // hardcoded prototype list.
  const activities = [];

  const assessments = Array.isArray(data.vitalSigns)
    ? [...data.vitalSigns]
    : [];

  assessments
    .sort(
      (a, b) =>
        new Date(b.recordedAt || 0) - new Date(a.recordedAt || 0)
    )
    .slice(0, 2)
    .forEach((assessment) => {
      activities.push({
        title: "Vital signs recorded",
        description:
          `${assessment.patient || "Patient"}` +
          `${assessment.recordedBy ? " by " + assessment.recordedBy : ""}.`,
        time: formatActivityTime(assessment.recordedAt)
      });
    });

  const waiting = (data.queue || []).filter(
    (patient) =>
      isTodayQueueEntry(patient) &&
      (isAwaitingNurseStatus(patient.status) ||
        patient.status === "Ready for Doctor")
  );

  waiting.slice(0, 2).forEach((patient) => {
    activities.push({
      title: "Patient waiting",
      description: `${patient.patient} is waiting for nurse assessment.`,
      time: patient.wait || ""
    });
  });

  if (activities.length === 0) {
    activities.push({
      title: "No activity yet",
      description:
        "Vital signs you record and patients waiting for assessment will appear here.",
      time: ""
    });
  }

  activityContainer.innerHTML =
    activities
      .map((activity) => {

        return `
          <div class="activity-item">

            <div class="activity-dot"></div>

            <div class="activity-content">

              <div class="activity-title">
                ${escapeHtml(activity.title)}
              </div>

              <div class="activity-description">
                ${escapeHtml(activity.description)}
              </div>

            </div>

            <div class="activity-date">
              ${escapeHtml(activity.time)}
            </div>

          </div>
        `;
      })
      .join("");
}


// --------------------------------------
// INITIALS
// --------------------------------------
function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}


// --------------------------------------
// BASIC HTML ESCAPING
// --------------------------------------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// --------------------------------------
// START DASHBOARD
// --------------------------------------
document.addEventListener(
  "DOMContentLoaded",
  renderNurseDashboard
);